#!/bin/bash


#!/bin/bash
set -e

# Install yq if not already installed
if ! command -v yq &> /dev/null; then
    echo "yq not found, installing..."
    wget https://github.com/mikefarah/yq/releases/download/v4.34.1/yq_linux_amd64 -O /usr/local/bin/yq
    chmod +x /usr/local/bin/yq
fi

# Read values from service_conf.yaml and export them as environment variables
export RAGFLOW_HOST=$(yq e '.ragflow.host' /ragflow/conf/service_conf.yaml)
export RAGFLOW_HTTP_PORT=$(yq e '.ragflow.http_port' /ragflow/conf/service_conf.yaml)
export MYSQL_NAME=$(yq e '.mysql.name' /ragflow/conf/service_conf.yaml)
export MYSQL_USER=$(yq e '.mysql.user' /ragflow/conf/service_conf.yaml)
export MYSQL_PASSWORD=$(yq e '.mysql.password' /ragflow/conf/service_conf.yaml)
export MYSQL_HOST=$(yq e '.mysql.host' /ragflow/conf/service_conf.yaml)
export MYSQL_PORT=$(yq e '.mysql.port' /ragflow/conf/service_conf.yaml)
export MYSQL_MAX_CONNECTIONS=$(yq e '.mysql.max_connections' /ragflow/conf/service_conf.yaml)
export MYSQL_STALE_TIMEOUT=$(yq e '.mysql.stale_timeout' /ragflow/conf/service_conf.yaml)
export MINIO_USER=$(yq e '.minio.user' /ragflow/conf/service_conf.yaml)
export MINIO_PASSWORD=$(yq e '.minio.password' /ragflow/conf/service_conf.yaml)
export MINIO_HOST=$(yq e '.minio.host' /ragflow/conf/service_conf.yaml)
export ES_HOSTS=$(yq e '.es.hosts' /ragflow/conf/service_conf.yaml)
export ES_USERNAME=$(yq e '.es.username' /ragflow/conf/service_conf.yaml)
export ES_PASSWORD=$(yq e '.es.password' /ragflow/conf/service_conf.yaml)
export INFINITY_URI=$(yq e '.infinity.uri' /ragflow/conf/service_conf.yaml)
export INFINITY_DB_NAME=$(yq e '.infinity.db_name' /ragflow/conf/service_conf.yaml)
export REDIS_DB=$(yq e '.redis.db' /ragflow/conf/service_conf.yaml)
export REDIS_PASSWORD=$(yq e '.redis.password' /ragflow/conf/service_conf.yaml)
export REDIS_HOST=$(yq e '.redis.host' /ragflow/conf/service_conf.yaml)

# Start the application
exec "$@"

# replace env variables in the service_conf.yaml file
rm -rf /ragflow/conf/service_conf.yaml
while IFS= read -r line || [[ -n "$line" ]]; do
    # Use eval to interpret the variable with default values
    eval "echo \"$line\"" >> /ragflow/conf/service_conf.yaml
done < /ragflow/conf/service_conf.yaml.template

/usr/sbin/nginx

export LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu/

PY=python3
if [[ -z "$WS" || $WS -lt 1 ]]; then
  WS=1
fi

function task_exe(){
    while [ 1 -eq 1 ];do
      $PY rag/svr/task_executor.py $1;
    done
}

for ((i=0;i<WS;i++))
do
  task_exe  $i &
done

while [ 1 -eq 1 ];do
    $PY api/ragflow_server.py
done

wait;


