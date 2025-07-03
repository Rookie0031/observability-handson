## Getting Started
### 사전준비

1. 시각화 도구로 k9s를 설치한다.

2. 혹시 모르니 도커 세팅에서 메모리 할당량을 늘려준다
<img width="650" alt="image" src="https://github.com/user-attachments/assets/368ff14e-b2d8-4b99-b455-5e3d123d290f" />

3. 6기가 메모리 최대로 미니큐브를 실행한다.
```
minikube start --memory=6000 --addons=default-storageclass,storage-provisioner,metrics-server
```

---

## Logging

### Helm 레포 추가
```
kubectl create namespace monitoring
kubectl config set-context --current --namespace=monitoring

helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
```

### Grafana + Loki

#### Loki 설치
```
helm install loki grafana/loki-distributed -n monitoring
```

#### 프롬테일 설치
```
helm upgrade --install promtail grafana/promtail \
  --namespace monitoring \
  --set "config.clients[0].url=http://loki-loki-distributed-gateway/loki/api/v1/push"
```
#### Grafana 설치
```
helm upgrade --install grafana grafana/grafana \
  --namespace monitoring \
  --set adminPassword=admin123 \
  --set env.GF_TRACING_JAEGER_ENABLED=false
```
접속을 위한 포트포워드
```
kubectl --namespace monitoring port-forward service/grafana 3000:80
```

#### loki 연결 설정
datasource 설정하기
http://loki-loki-distributed-gateway

#### Log 수집 확인
1. backend-app과 netshoot 배포
2. netshoot의 readme를 따라 backend-app으로 요청을 날려 로그 생성

#### explorer에서 살펴보기
<img width="650" alt="image" src="https://github.com/user-attachments/assets/5b0fafed-0222-4d5e-9d1c-33297ffebfbf" />


#### 추가 학습
기본 대시보드 임포트해보기

Dashboards → New → Import
대시보드 ID 입력: 13639 (Kubernetes Logs Dashboard)
Load → Loki 데이터소스 선택 → Import

---
## Metrics
#### Prometheus 설치
```
helm install prometheus prometheus-community/prometheus \
  --namespace monitoring \
  --set alertmanager.enabled=false \
  --set pushgateway.enabled=false
```

Grafana에서 프로메테우스 연동하기
URL: http://prometheus-server:80

#### explorer에서 살펴보기
<img width="650" alt="image" src="https://github.com/user-attachments/assets/0ce29e95-c21c-48f9-a243-6bc9a0987abf" />


#### Grafana에서 Import Dashboard
Dashboard ID: 315 (Kubernetes cluster monitoring)
ID: 11159 - Node.js 애플리케이션 종합 모니터링
ID: 1860 - 시스템 레벨 모니터링 (CPU, 메모리, 디스크, 네트워크)

---

## Trace
### Tempo 설치
미니큐브환경에서 자원사용량 한계 + 그라파나와의 integration 용이로 템포를 사용한다.
```
helm upgrade --install tempo grafana/tempo
```

그라파나에서 설정하기
Configuration > Data Sources
Add data source > Tempo
URL: http://tempo:3200

#### 테스트 앱으로 tracing 트래픽 생성 (다른 터미널)
tracer-sample-app 으로 이동 
```
kubectl apply -f app.yaml 
```

포드포워드하기!
```
kubectl port-forward svc/hotrod 8080:8080
```
여기 접속해서 http://localhost:8080 테스트 버튼을 눌러보자 


### Grafana에서 트레이스 확인

Grafana → Explore (나침반 아이콘)
데이터소스를 Tempo로 선택
Query type을 Search로 설정
Run query 버튼 클릭
트레이스 목록이 나타나면 클릭해서 상세 보기
