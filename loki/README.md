## Reference
https://artifacthub.io/packages/helm/grafana/loki

### 1. 설치
helm install svl-sample-loki grafana/loki \
  --version 6.30.1 \
  --set loki.commonConfig.storage.backend=s3 \
  --set loki.storage.type=s3 \
  --set loki.storage.bucketNames.chunks=svl-loki-test-chunks \
  --set loki.storage.bucketNames.ruler=svl-loki-test-ruler \
  --set loki.storage.bucketNames.admin=svl-loki-test-admin \
  --set loki.storage.s3.endpoint="endpoint" \
  --set loki.storage.s3.region="ap-northeast-2" \
  --set loki.storage.s3.accessKeyId="access_key" \
  --set loki.storage.s3.secretAccessKey="secret_key" \
  --set loki.auth_enabled=false


### 2. 