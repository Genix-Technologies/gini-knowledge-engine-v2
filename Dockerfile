# Base stage
FROM ubuntu:22.04 AS base
USER root
SHELL ["/bin/bash", "-c"]

# Set constants
ENV LIGHTEN=1
ENV NEED_MIRROR=false
WORKDIR /ragflow

# Copy models downloaded via download_deps.py
RUN mkdir -p /ragflow/rag/res/deepdoc /root/.ragflow
RUN --mount=type=bind,from=infiniflow/ragflow_deps:latest,source=/huggingface.co,target=/huggingface.co \
    cp /huggingface.co/InfiniFlow/huqie/huqie.txt.trie /ragflow/rag/res/ && \
    tar --exclude='.*' -cf - \
        /huggingface.co/InfiniFlow/text_concat_xgb_v1.0 \
        /huggingface.co/InfiniFlow/deepdoc \
        | tar -xf - --strip-components=3 -C /ragflow/rag/res/deepdoc 

# Python-tika dependency setup
RUN --mount=type=bind,from=infiniflow/ragflow_deps:latest,source=/,target=/deps \
    cp -r /deps/nltk_data /root/ && \
    cp /deps/tika-server-standard-3.0.0.jar /deps/tika-server-standard-3.0.0.jar.md5 /ragflow/ && \
    cp /deps/cl100k_base.tiktoken /ragflow/9b5ad71b2ce5302211f9c61530b329a4922fc6a4

ENV TIKA_SERVER_JAR="file:///ragflow/tika-server-standard-3.0.0.jar"
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN --mount=type=cache,id=ragflow_apt,target=/var/cache/apt,sharing=locked \
    rm -f /etc/apt/apt.conf.d/docker-clean && \
    echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-cache && \
    chmod 1777 /tmp && \
    apt update && \
    apt --no-install-recommends install -y ca-certificates && \
    apt install -y libglib2.0-0 libglx-mesa0 libgl1 pkg-config libicu-dev libgdiplus \
                   default-jdk libatk-bridge2.0-0 libpython3-dev libgtk-4-1 libnss3 xdg-utils \
                   libgbm-dev libjemalloc-dev python3-pip pipx nginx unzip curl wget git vim less

RUN pipx install uv

ENV PYTHONDONTWRITEBYTECODE=1 DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1
ENV PATH=/root/.local/bin:$PATH

# Install Node.js 20
RUN --mount=type=cache,id=ragflow_apt,target=/var/cache/apt,sharing=locked \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt purge -y nodejs npm cargo && \
    apt autoremove -y && \
    apt update && \
    apt install -y nodejs

# Install Rust
RUN apt update && apt install -y curl build-essential && \
    curl --proto '=https' --tlsv1.2 --http1.1 -sSf https://sh.rustup.rs | bash -s -- -y --profile minimal && \
    echo 'export PATH="/root/.cargo/bin:${PATH}"' >> /root/.bashrc

ENV PATH="/root/.cargo/bin:${PATH}"

# Verify installations
RUN cargo --version && rustc --version

# Add Microsoft SQL Server ODBC driver
RUN --mount=type=cache,id=ragflow_apt,target=/var/cache/apt,sharing=locked \
    curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add - && \
    curl https://packages.microsoft.com/config/ubuntu/22.04/prod.list > /etc/apt/sources.list.d/mssql-release.list && \
    apt update && \
    arch="$(uname -m)"; \
    if [ "$arch" = "arm64" ] || [ "$arch" = "aarch64" ]; then \
        ACCEPT_EULA=Y apt install -y unixodbc-dev msodbcsql18; \
    else \
        ACCEPT_EULA=Y apt install -y unixodbc-dev msodbcsql17; \
    fi || \
    { echo "Failed to install ODBC driver"; exit 1; }

# Install Chrome and Chromedriver for Selenium
RUN --mount=type=bind,from=infiniflow/ragflow_deps:latest,source=/chrome-linux64-121-0-6167-85,target=/chrome-linux64.zip \
    unzip /chrome-linux64.zip && \
    mv chrome-linux64 /opt/chrome && \
    ln -s /opt/chrome/chrome /usr/local/bin/
RUN --mount=type=bind,from=infiniflow/ragflow_deps:latest,source=/chromedriver-linux64-121-0-6167-85,target=/chromedriver-linux64.zip \
    unzip -j /chromedriver-linux64.zip chromedriver-linux64/chromedriver && \
    mv chromedriver /usr/local/bin/ && \
    rm -f /usr/bin/google-chrome

# Install SSL libraries
RUN --mount=type=bind,from=infiniflow/ragflow_deps:latest,source=/,target=/deps \
    if [ "$(uname -m)" = "x86_64" ]; then \
        dpkg -i /deps/libssl1.1_1.1.1f-1ubuntu2_amd64.deb; \
    elif [ "$(uname -m)" = "aarch64" ]; then \
        dpkg -i /deps/libssl1.1_1.1.1f-1ubuntu2_arm64.deb; \
    fi

# Builder stage
FROM base AS builder
USER root

WORKDIR /ragflow

# Install dependencies from uv.lock file
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,id=ragflow_uv,target=/root/.cache/uv,sharing=locked \
    uv sync --python 3.10 --frozen

COPY .git /ragflow/.git
RUN version_info=$(git describe --tags --match=v* --first-parent --always); \
    echo "RAGFlow version: $version_info"; \
    echo $version_info > /ragflow/VERSION

# Production stage
FROM base AS production
USER root

WORKDIR /ragflow

# Copy Python environment and packages
ENV VIRTUAL_ENV=/ragflow/.venv
COPY --from=builder ${VIRTUAL_ENV} ${VIRTUAL_ENV}
ENV PATH="${VIRTUAL_ENV}/bin:${PATH}"

ENV PYTHONPATH=/ragflow/

COPY api api
COPY conf conf
COPY deepdoc deepdoc
COPY rag rag
COPY agent agent
COPY graphrag graphrag
COPY pyproject.toml uv.lock ./

COPY docker/service_conf.yaml.template ./conf/service_conf.yaml.template
COPY docker/entrypoint.sh docker/entrypoint-parser.sh ./
RUN chmod +x ./entrypoint*.sh

COPY --from=builder /ragflow/VERSION /ragflow/VERSION

ENTRYPOINT ["./entrypoint.sh"]
