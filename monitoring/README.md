# Prometheus + Grafana 모니터링 스택 설치 가이드

Helm을 사용하여 Prometheus, Node Exporter, Grafana를 설치하는 방법입니다.

## 사전 준비

minikube 시작
혹시 미니큐브에서 stoage class addon 추가 
```
minikube addons enable default-storageclass
minikube addons enable storage-provisioner
```

### 2. Helm Repository 추가
```bash
# Prometheus Community Helm Repository 추가
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts

# Grafana Helm Repository 추가
helm repo add grafana https://grafana.github.io/helm-charts

# Repository 업데이트
helm repo update
```

## 모니터링 스택 설치

### 1. 네임스페이스 생성
```bash
# monitoring 네임스페이스 생성
kubectl create namespace monitoring
```

### 2. Prometheus 설치
```bash
# Prometheus 기본 설치
helm install prometheus prometheus-community/prometheus \
  --namespace monitoring
```

server, state-metric, node-exporter 모두 종합세트로 배포!


### 3. Grafana 설치
```bash
# Grafana 기본 설치
helm install grafana grafana/grafana \
  --namespace monitoring
```


### 5. 설치 확인
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

## 서비스 접근

### 1. Prometheus 접근
```bash
# Prometheus 서버 포트 포워딩
kubectl port-forward svc/prometheus-server 9090:80 -n monitoring

# 브라우저에서 http://localhost:9090 접속
```

### 2. Grafana 접근
```bash
# Grafana 포트 포워딩
kubectl port-forward svc/grafana 3000:80 -n monitoring

# 브라우저에서 http://localhost:3000 접속
# 기본 계정: admin / prom-operator
```

## Grafana 설정

### 1. Prometheus 데이터 소스 확인
기본 설치 시 Prometheus 데이터 소스가 자동으로 설정됩니다.
Grafana에 로그인 후 **Configuration** → **Data Sources**에서 확인할 수 있습니다.

### 2. 수동으로 데이터 소스 추가 (필요시)
1. **Configuration** → **Data Sources** 클릭
2. **Add data source** 클릭
3. **Prometheus** 선택
4. **URL**: `http://prometheus-server:80` 입력
5. **Save & Test** 클릭

### 2. 대시보드 임포트
```bash
# Node Exporter 대시보드 ID: 1860
# Prometheus Stats 대시보드 ID: 2
# Kubernetes Cluster 대시보드 ID: 315
```

Grafana에서:
1. **+** → **Import** 클릭
2. 대시보드 ID 입력 (예: 1860)
3. **Load** 클릭
4. **Import** 클릭


## 유용한 명령어

### 1. 상태 확인
```bash
# Prometheus Pod 로그 확인
kubectl logs -f deployment/prometheus-server -n monitoring

# Grafana Pod 로그 확인
kubectl logs -f deployment/prometheus-grafana -n monitoring

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

### 3. Grafana 관리
```bash
# Grafana 관리자 비밀번호 변경
kubectl patch secret grafana -n monitoring \
  -p '{"data":{"admin-password":"bmV3cGFzc3dvcmQ="}}'

# Grafana 설정 확인
kubectl get configmap grafana -n monitoring -o yaml
```

### 4. 정리
```bash
# Prometheus 삭제
helm uninstall prometheus -n monitoring

# Grafana 삭제
helm uninstall grafana -n monitoring

# Node Exporter 삭제
helm uninstall node-exporter -n monitoring

# 네임스페이스 삭제
kubectl delete namespace monitoring
```

## 빠른 시작 스크립트

```bash
#!/bin/bash
# quick-start.sh

echo "🚀 모니터링 스택 설치 시작..."

# 네임스페이스 생성
kubectl create namespace monitoring

# Prometheus 설치
helm install prometheus prometheus-community/prometheus \
  --namespace monitoring

# Grafana 설치
helm install grafana grafana/grafana \
  --namespace monitoring

# Node Exporter 설치
helm install node-exporter prometheus-community/prometheus-node-exporter \
  --namespace monitoring

echo "✅ 설치 완료!"
echo "📊 Prometheus: kubectl port-forward svc/prometheus-server 9090:80 -n monitoring"
echo "📈 Grafana: kubectl port-forward svc/grafana 3000:80 -n monitoring"
echo "🔧 Grafana 계정: admin / prom-operator"
```

이제 완전한 모니터링 스택이 준비되었습니다! Prometheus, Grafana, Node Exporter가 모두 설치되어 클러스터 모니터링을 시작할 수 있습니다. 
