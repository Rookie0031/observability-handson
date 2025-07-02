# Loki 설치 가이드

Helm을 사용하여 Loki를 설치하고 Grafana와 연동하는 방법입니다.

## 사전 준비

### 1. Helm Repository 추가
```bash
# Grafana Helm Repository 추가 (이미 추가되어 있다면 생략)
helm repo add grafana https://grafana.github.io/helm-charts

# Repository 업데이트
helm repo update
```

## Loki 설치

### 1. Loki 설치
```bash
# Loki 기본 설치 (monitoring 네임스페이스에)
helm install loki grafana/loki \
  --namespace monitoring
```

### 2. Promtail 설치 (로그 수집기)
```bash
# Promtail 설치
helm install promtail grafana/promtail \
  --namespace monitoring \
  --set "loki.serviceName=loki"
```

### 3. 설치 확인
```bash
# Helm 릴리스 확인
helm list -n monitoring

# Pod 상태 확인
kubectl get pods -n monitoring

# Service 확인
kubectl get svc -n monitoring
```

## Grafana와 연동

### 1. Loki 데이터 소스 추가
Grafana에 로그인 후:
1. **Configuration** → **Data Sources** 클릭
2. **Add data source** 클릭
3. **Loki** 선택
4. **URL**: `http://loki:3100` 입력
5. **Save & Test** 클릭

### 2. 또는 kubectl로 데이터 소스 추가
```bash
# Loki 데이터 소스 ConfigMap 생성
kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: loki-datasource
  namespace: monitoring
data:
  loki-datasource.yaml: |
    apiVersion: 1
    datasources:
    - name: Loki
      type: loki
      access: proxy
      url: http://loki.monitoring.svc.cluster.local:3100
      isDefault: false
EOF

# Grafana에 ConfigMap 마운트 (values.yaml로 재설치 필요)
```

## 로그 수집 설정

### 1. 애플리케이션 로그 수집
```bash
# 백엔드 앱 로그 수집을 위한 ConfigMap
kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: promtail-config
  namespace: monitoring
data:
  promtail.yaml: |
    server:
      http_listen_port: 9080
      grpc_listen_port: 0

    positions:
      filename: /tmp/positions.yaml

    clients:
      - url: http://loki:3100/loki/api/v1/push

    scrape_configs:
    - job_name: kubernetes-pods
      kubernetes_sd_configs:
      - role: pod
      relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__
      - action: labelmap
        regex: __meta_kubernetes_pod_label_(.+)
      - source_labels: [__meta_kubernetes_namespace]
        action: replace
        target_label: kubernetes_namespace
      - source_labels: [__meta_kubernetes_pod_name]
        action: replace
        target_label: kubernetes_pod_name
EOF
```

### 2. Promtail 재설치 (커스텀 설정 적용)
```bash
# Promtail 삭제 후 재설치
helm uninstall promtail -n monitoring

helm install promtail grafana/promtail \
  --namespace monitoring \
  --set "loki.serviceName=loki" \
  --set "config.file=/etc/promtail/promtail.yaml" \
  --set "configMapName=promtail-config"
```

## 로그 확인

### 1. Grafana에서 로그 확인
1. Grafana 접속: `http://localhost:3000`
2. **Explore** 클릭
3. 데이터 소스에서 **Loki** 선택
4. LogQL 쿼리 예시:
   ```
   {app="sample-nest-server"}
   {kubernetes_namespace="default"}
   {job="kubernetes-pods"}
   ```

### 2. kubectl로 로그 확인
```bash
# Loki Pod 로그 확인
kubectl logs -f deployment/loki -n monitoring

# Promtail Pod 로그 확인
kubectl logs -f daemonset/promtail -n monitoring
```

## 유용한 LogQL 쿼리

### 1. 기본 쿼리
```logql
# 모든 로그
{job="kubernetes-pods"}

# 특정 앱 로그
{app="sample-nest-server"}

# 특정 네임스페이스 로그
{kubernetes_namespace="default"}

# 에러 로그
{job="kubernetes-pods"} |= "error"

# 특정 시간 범위
{job="kubernetes-pods"} [5m]
```

### 2. 고급 쿼리
```logql
# 로그 라인 수 카운트
count_over_time({app="sample-nest-server"}[5m])

# 에러율 계산
rate({app="sample-nest-server"} |= "error" [5m])

# 특정 패턴 검색
{app="sample-nest-server"} |~ "GET.*200"
```

## 서비스 접근

### 1. Loki API 접근
```bash
# Loki API 포트 포워딩
kubectl port-forward svc/loki 3100:3100 -n logging

# API 테스트
curl http://localhost:3100/ready
curl http://localhost:3100/loki/api/v1/labels
```

### 2. Promtail 접근
```bash
# Promtail 메트릭 포트 포워딩
kubectl port-forward svc/promtail 9080:9080 -n logging

# 메트릭 확인
curl http://localhost:9080/metrics
```

## 유용한 명령어

### 1. 상태 확인
```bash
# Loki 상태 확인
kubectl get pods -l app.kubernetes.io/name=loki -n logging

# Promtail 상태 확인
kubectl get pods -l app.kubernetes.io/name=promtail -n logging

# PVC 확인
kubectl get pvc -n logging
```

### 2. 로그 스트림 확인
```bash
# 실시간 로그 스트림
kubectl logs -f deployment/loki -n logging

# Promtail 로그
kubectl logs -f daemonset/promtail -n logging
```

### 3. 정리
```bash
# Loki 삭제
helm uninstall loki -n logging

# Promtail 삭제
helm uninstall promtail -n logging

# 네임스페이스 삭제
kubectl delete namespace logging
```

## 빠른 시작 스크립트

```bash
#!/bin/bash
# loki-quick-start.sh

echo "🚀 Loki 설치 시작..."

# 네임스페이스 생성
kubectl create namespace logging

# Loki 설치
helm install loki grafana/loki \
  --namespace logging

# Promtail 설치
helm install promtail grafana/promtail \
  --namespace logging \
  --set "loki.serviceName=loki"

echo "✅ Loki 설치 완료!"
echo "📊 Loki API: kubectl port-forward svc/loki 3100:3100 -n logging"
echo "📈 Grafana에서 Loki 데이터 소스 추가: http://loki:3100"
```

이제 Loki가 설치되어 애플리케이션 로그를 수집하고 Grafana에서 확인할 수 있습니다! 