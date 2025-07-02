### 시작
1. 도커 세팅에서 메모리 할당량을 늘려준다
2.
minikube start --memory=6000 --addons=default-storageclass,storage-provisioner,metrics-server

## Observability 설치

### Helm 레포 추가
kubectl create namespace monitoring
kubectl config set-context --current --namespace=monitoring

helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts

helm repo update

### Grafana + Loki

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

#### Grafana에서 Import Dashboard
Dashboard ID: 315 (Kubernetes cluster monitoring)
ID: 11159 - Node.js 애플리케이션 종합 모니터링
ID: 1860 - 시스템 레벨 모니터링 (CPU, 메모리, 디스크, 네트워크)

---

### jaeger

helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
helm install jaeger jaegertracing/jaeger --create-namespace --namespace monitoring --set strategy=allinone
kubectl port-forward -n observability svc/jaeger-query 16686:16686

설치 후 statefulset 개수 조절해줘야한다. 기다렷다가 2개로 올라가는데 그 때 1개로 낮춰줘야함.. 
