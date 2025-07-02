# Prometheus 설치 가이드

Helm을 사용하여 Prometheus를 설치하고 Node Exporter를 설정하는 방법입니다.

## 사전 준비

### 1. Helm 설치 확인
```bash
# Helm 설치 확인
helm version

# Helm이 설치되지 않은 경우 설치
brew install helm
```

### 2. Prometheus Helm Repository 추가
```bash
# Prometheus Community Helm Repository 추가
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts

# Repository 업데이트
helm repo update
```

## Prometheus 설치

### 1. 기본 설치
```bash
# 기본 설정으로 Prometheus 설치
helm install prometheus prometheus-community/prometheus

# 또는 네임스페이스 지정하여 설치
kubectl create namespace monitoring
helm install prometheus prometheus-community/prometheus -n monitoring
```

### 2. 커스텀 설정으로 설치
```bash
# values.yaml 파일 생성 후 설치
helm install prometheus prometheus-community/prometheus \
  --namespace monitoring \
  --create-namespace \
  --set server.persistentVolume.enabled=true \
  --set server.persistentVolume.size=10Gi \
  --set alertmanager.persistentVolume.enabled=true \
  --set alertmanager.persistentVolume.size=5Gi
```

### 3. 설치 확인
```bash
# Helm 릴리스 확인
helm list -n monitoring

# Pod 상태 확인
kubectl get pods -n monitoring

# Service 확인
kubectl get svc -n monitoring

# PVC 확인
kubectl get pvc -n monitoring
```

## Prometheus 접근

### 1. 포트 포워딩으로 접근
```bash
# Prometheus 서버 접근
kubectl port-forward svc/prometheus-server 9090:80 -n monitoring

# 브라우저에서 http://localhost:9090 접속
```

### 2. Grafana 접근 (설치된 경우)
```bash
# Grafana 포트 포워딩
kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring

# 브라우저에서 http://localhost:3000 접속
# 기본 계정: admin / prom-operator
```

## ServiceMonitor 설정

### 1. 백엔드 앱 모니터링 설정
```bash
# ServiceMonitor 생성
kubectl apply -f - <<EOF
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: sample-nest-server
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: sample-nest-server
  endpoints:
  - port: http
    path: /metrics
    interval: 30s
EOF
```

### 2. Netshoot 모니터링 설정
```bash
# Netshoot ServiceMonitor 생성
kubectl apply -f - <<EOF
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: netshoot
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: netshoot
  endpoints:
  - port: http
    interval: 30s
EOF
```

## 유용한 명령어

### 1. 상태 확인
```bash
# Prometheus Pod 로그 확인
kubectl logs -f deployment/prometheus-server -n monitoring

# Node Exporter 로그 확인
kubectl logs -f daemonset/node-exporter -n monitoring

# ServiceMonitor 상태 확인
kubectl get servicemonitor -n monitoring
```

### 2. 메트릭 확인
```bash
# Node Exporter 메트릭 확인
kubectl port-forward svc/node-exporter 9100:9100 -n monitoring
curl http://localhost:9100/metrics

# 백엔드 앱 메트릭 확인
kubectl port-forward svc/sample-nest-server-service 8080:80
curl http://localhost:8080/metrics
```

### 3. 정리
```bash
# Prometheus 삭제
helm uninstall prometheus -n monitoring

# Node Exporter 삭제
helm uninstall node-exporter -n monitoring

# 네임스페이스 삭제
kubectl delete namespace monitoring
```

## 설정 파일 예시

### values.yaml (Prometheus 커스텀 설정)
```yaml
server:
  persistentVolume:
    enabled: true
    size: 10Gi
  retention: 15d
  
alertmanager:
  persistentVolume:
    enabled: true
    size: 5Gi

pushgateway:
  enabled: false

nodeExporter:
  enabled: true
  serviceMonitor:
    enabled: true
```

이제 Prometheus와 Node Exporter가 설치되어 클러스터 모니터링을 시작할 수 있습니다! 
