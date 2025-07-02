### 시작
minikube start --memory=3000 --addons=default-storageclass,storage-provisioner

## Observability 설치

### Helm 레포 추가
kubectl create namespace monitoring
kubectl config set-context --current --namespace=monitoring
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

### Prometheus
helm install prometheus prometheus-community/prometheus \
  --namespace monitoring \
  --set alertmanager.enabled=false \
  --set pushgateway.enabled=false

### Grafana
helm install grafana grafana/grafana \
  --namespace monitoring

### Loki
helm upgrade --install loki grafana/loki-stack \
  --set grafana.enabled=false \
  --set prometheus.enabled=false \
  --set promtail.enabled=true \
  --namespace=monitoring \
  --create-namespace

---

## 포트포워드 후 대시보드 확인
```
kubectl port-forward -n monitoring svc/grafana 3000:80 &
kubectl port-forward -n monitoring svc/prometheus-server 9090:80 &
kubectl port-forward -n monitoring svc/loki 3100:3100 &
```

grafana 비번 확인
kubectl get secret -n monitoring grafana -o jsonpath="{.data.admin-password}" | base64 --decode

grafana: http://localhost:3000
prometheus: http://localhost:9090
loki: http://localhost:3100/ready

---

## 그라파나 데이터소스 연동

Prometheus 데이터소스 추가

Grafana 로그인 후 Configuration > Data Sources
Add data source > Prometheus
URL: http://prometheus-server:80
Save & Test

Loki 데이터소스 추가

Configuration > Data Sources
Add data source > Loki
URL: http://loki:3100
Save & Test