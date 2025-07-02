### 시작
minikube start --memory=3000 --addons=default-storageclass,storage-provisioner

## Observability 설치

### Helm 레포 추가
kubectl create namespace monitoring
kubectl config set-context --current --namespace=monitoring
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

### Grafana + Loki

# Grafana Helm 레포지토리 추가
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Loki 설치
helm install loki grafana/loki-distributed -n monitoring

# 프롬테일 설치
helm upgrade --install promtail grafana/promtail \
  --namespace monitoring \
  --set "config.clients[0].url=http://loki-loki-distributed-gateway/loki/api/v1/push"

# Grafana 설치

helm install grafana grafana/grafana \
  --namespace monitoring \
  --set adminPassword=admin123

kubectl --namespace monitoring port-forward service/grafana 3000:80

#### loki 연결 설정
datasource
http://loki-loki-distributed-gateway


기본 대시보드 임포트

Dashboards → New → Import
대시보드 ID 입력: 13639 (Kubernetes Logs Dashboard)
Load → Loki 데이터소스 선택 → Import


---

### Prometheus
helm install prometheus prometheus-community/prometheus \
  --namespace monitoring \
  --set alertmanager.enabled=false \
  --set pushgateway.enabled=false


Grafana에서 프로메테우스 연동
URL: http://prometheus-server:80