# base stage
FROM ubuntu:22.04 AS base
USER root
SHELL ["/bin/bash", "-c"]

ARG NEED_MIRROR=0
ARG LIGHTEN=0
ENV LIGHTEN=${LIGHTEN}

WORKDIR /ragflow

# Create necessary directories
RUN mkdir -p /ragflow/rag/res/deepdoc /root/.ragflow

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive 

# Install system dependencies
RUN --mount=type=cache,id=ragflow_apt,target=/var/cache/apt,sharing=locked \
    if [ "$NEED_MIRROR" == "1" ]; then \
        sed -i 's|http://archive.ubuntu.com|https://mirrors.tuna.tsinghua.edu.cn|g' /etc/apt/sources.list; \
    fi; \
    rm -f /etc/apt/apt.conf.d/docker-clean && \
    echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-cache && \
    chmod 1777 /tmp && \
    apt update && \
    apt --no-install-recommends install -y ca-certificates && \
    apt update && \
    apt install -y libglib2.0-0 libglx-mesa0 libgl1 && \
    apt install -y pkg-config libicu-dev libgdiplus && \
    apt install -y default-jdk && \
    apt install -y libatk-bridge2.0-0 && \
    apt install -y libpython3-dev libgtk-4-1 libnss3 xdg-utils libgbm-dev && \
    apt install -y python3-pip pipx nginx unzip curl wget git vim less

# Configure pip and install uv
RUN if [ "$NEED_MIRROR" == "1" ]; then \
        pip3 config set global.index-url https://mirrors.aliyun.com/pypi/simple && \
        pip3 config set global.trusted-host mirrors.aliyun.com; \
        mkdir -p /etc/uv && \
        echo "[[index]]" > /etc/uv/uv.toml && \
        echo 'url = "https://mirrors.aliyun.com/pypi/simple"' >> /etc/uv/uv.toml && \
        echo "default = true" >> /etc/uv/uv.toml; \
    fi; \
    pipx install uv

ENV PYTHONDONTWRITEBYTECODE=1 DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1
ENV PATH=/root/.local/bin:$PATH

# Install Node.js
RUN --mount=type=cache,id=ragflow_apt,target=/var/cache/apt,sharing=locked \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt purge -y nodejs npm cargo && \
    apt autoremove -y && \
    apt update && \
    apt install -y nodejs

# Install Rust
RUN apt update && apt install -y curl build-essential \
    && if [ "$NEED_MIRROR" == "1" ]; then \
         export RUSTUP_DIST_SERVER="https://mirrors.tuna.tsinghua.edu.cn/rustup"; \
         export RUSTUP_UPDATE_ROOT="https://mirrors.tuna.tsinghua.edu.cn/rustup/rustup"; \
         echo "Using TUNA mirrors for Rustup."; \
       fi; \
    curl --proto '=https' --tlsv1.2 --http1.1 -sSf https://sh.rustup.rs | bash -s -- -y --profile minimal \
    && echo 'export PATH="/root/.cargo/bin:${PATH}"' >> /root/.bashrc

ENV PATH="/root/.cargo/bin:${PATH}"

RUN cargo --version && rustc --version

# builder stage
FROM base AS builder
USER root

WORKDIR /ragflow

# install dependencies from uv.lock file
COPY pyproject.toml uv.lock ./

# Sync Python dependencies
RUN --mount=type=cache,id=ragflow_uv,target=/root/.cache/uv,sharing=locked \
    if [ "$NEED_MIRROR" == "1" ]; then \
        sed -i 's|pypi.org|mirrors.aliyun.com/pypi|g' uv.lock; \
    else \
        sed -i 's|mirrors.aliyun.com/pypi|pypi.org|g' uv.lock; \
    fi; \
    if [ "$LIGHTEN" == "1" ]; then \
        uv sync --python 3.10 --frozen; \
    else \
        uv sync --python 3.10 --frozen --all-extras; \
    fi

COPY web web
COPY docs docs
RUN --mount=type=cache,id=ragflow_npm,target=/root/.npm,sharing=locked \
    cd web && npm install && npm run build

RUN version_info=$(git describe --tags --match=v* --first-parent --always); \
    version_info="$version_info slim"; \
    echo "RAGFlow version: $version_info"; \
    echo $version_info > /ragflow/VERSION

# production stage
FROM base AS production
USER root

WORKDIR /ragflow

# Copy Python environment and packages
ENV VIRTUAL_ENV=/ragflow/.venv
COPY --from=builder ${VIRTUAL_ENV} ${VIRTUAL_ENV}
ENV PATH="${VIRTUAL_ENV}/bin:${PATH}"

ENV RAGFLOW_HOST=0.0.0.0 \
    RAGFLOW_HTTP_PORT=9380 \
    MYSQL_NAME=rag_flow \
    MYSQL_USER=root \
    MYSQL_PASSWORD=infini_rag_flow \
    MYSQL_HOST=44.212.5.246 \
    MYSQL_PORT=5455 \
    MYSQL_MAX_CONNECTIONS=100 \
    MYSQL_STALE_TIMEOUT=30 \
    MINIO_USER=rag_flow \
    MINIO_PASSWORD=infini_rag_flow \
    MINIO_HOST=44.212.5.246:9000 \
    ES_HOSTS=http://44.212.5.246:1200 \
    ES_USERNAME=elastic \
    ES_PASSWORD=infini_rag_flow \
    INFINITY_URI=infinity:23817 \
    INFINITY_DB_NAME=default_db \
    REDIS_DB=1 \
    REDIS_PASSWORD=infini_rag_flow \
    REDIS_HOST=44.212.5.246:6379 \
    STACK_VERSION=8.11.3 \
    ES_HOST=44.212.5.246 \
    ES_PORT=1200 \
    ELASTIC_PASSWORD=infini_rag_flow \
    KIBANA_PORT=6601 \
    KIBANA_USER=rag_flow \
    KIBANA_PASSWORD=infini_rag_flow \
    MEM_LIMIT=8073741824 \
    INFINITY_HOST=44.212.5.246 \
    INFINITY_THRIFT_PORT=23817 \
    INFINITY_HTTP_PORT=23820 \
    INFINITY_PSQL_PORT=5432 \
    MINIO_CONSOLE_PORT=9001 \
    MINIO_PORT=9000 \
    REDIS_PORT=6379 \
    SVR_HTTP_PORT=9380 \
    TIMEZONE=Asia/Kolkata

ENV PYTHONPATH=/ragflow/

COPY web web
COPY api api
COPY conf conf
COPY deepdoc deepdoc
COPY rag rag
COPY agent agent
COPY graphrag graphrag
COPY pyproject.toml uv.lock ./
COPY conf/service_conf.yaml /ragflow/conf/service_conf.yaml
COPY docker/service_conf.yaml.template ./conf/service_conf.yaml.template
COPY docker/entrypoint.sh docker/entrypoint-parser.sh ./
RUN chmod +x ./entrypoint*.sh

# Copy compiled web pages
COPY --from=builder /ragflow/web/dist /ragflow/web/dist

COPY --from=builder /ragflow/VERSION /ragflow/VERSION
#RUN python3 -m nltk.downloader -d /usr/local/share/nltk_data punkt


ENTRYPOINT ["./entrypoint.sh"]