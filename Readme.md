## Getting Started

### 사전준비

1. 시각화 도구로 k9s를 설치한다.
2. 혹시 모르니 도커 세팅에서 메모리 할당량을 늘려준다
   `<img width="650" alt="image" src="https://github.com/user-attachments/assets/368ff14e-b2d8-4b99-b455-5e3d123d290f" />`
3. 6기가 메모리 최대로 미니큐브를 실행한다.

```
minikube start --addons=default-storageclass,storage-provisioner,metrics-server
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

### 실행하면 아래 컴포넌트들이 배포된다.

#### Distributor

역할: 로그 데이터의 진입점 역할

- 클라이언트(Promtail 등)로부터 로그 스트림을 받음
- 로그 데이터를 검증하고 정규화
- 로그를 적절한 Ingester로 라우팅
- 로그 스트림을 여러 Ingester에 복제하여 가용성 보장

#### Gateway

역할: API 프록시 및 로드 밸런서

- 클라이언트 요청을 적절한 백엔드 서비스로 라우팅
- 인증 및 권한 부여 처리
- 멀티 테넌시 지원
- 요청 분산 및 로드 밸런싱

#### Ingester

역할: 로그 데이터 수집 및 임시 저장

- Distributor로부터 받은 로그를 메모리에서 압축하고 정렬
- 청크(chunk) 단위로 로그 데이터를 구성
- 일정 시간 후 또는 크기가 차면 객체 스토리지에 업로드
- 최근 로그에 대한 빠른 쿼리 응답

#### Querier

역할: 로그 쿼리 실행 엔진

- LogQL 쿼리를 파싱하고 실행
- Ingester의 메모리 데이터와 스토리지의 데이터를 모두 조회
- 쿼리 결과를 병합하고 정렬하여 반환
- 인덱스를 사용하여 효율적인 검색 수행

#### Query Frontend

역할: 쿼리 최적화 및 결과 캐싱

- 대용량 쿼리를 작은 단위로 분할하여 병렬 처리
- 쿼리 결과 캐싱으로 성능 향상
- 쿼리 대기열 관리
- Querier들 간의 로드 밸런싱
- 쿼리 재시도 및 타임아웃 처리

#### Querier + Query Frontend 이유

Client → Gateway -> Query Frontend → Querier
로그를 쿼리할 때는 대용량 쿼리라서 쿼리를 분할하여 병렬 실행한다 + 쿼리 캐싱도 가능

```
원본 쿼리: {job="api"} [7d]

Query Frontend가 분할:
- Day 1: {job="api"} [1d] 
- Day 2: {job="api"} [1d]
- Day 3: {job="api"} [1d]
- ... (7개로 분할)

각각을 다른 Querier에게 병렬 처리 후 결과 병합
```


## 요약

#### Log Ingestion Flow
```
Client Request (Promtail/Agent)
    ↓
Gateway (1차 필터링: API 레벨 제한)
    ↓
Distributor (2차 필터링: 테넌트별 세밀 제어)
    ↓
Ingester (메모리 버퍼링 + 청크 생성)
    ↓
Object Storage (장기 저장)
```

#### Log Query Flow
```
Client Query (Grafana/LogCLI)
    ↓
Gateway (라우팅 + 인증)
    ↓
Query Frontend (쿼리 최적화 + 캐싱 + 분할)
    ↓
Querier (LogQL 실행 엔진)
    ↓ ↙
Ingester (최신 데이터)  +  Object Storage (과거 데이터)
    ↓ ↘                      ↓
Query Frontend (결과 병합 + 캐싱)
    ↓
Gateway (응답 라우팅)
    ↓
Client (최종 결과)
```


---

## 프롬테일 설치

```
helm upgrade --install promtail grafana/promtail \
  --namespace monitoring \
  --set "config.clients[0].url=http://loki-loki-distributed-gateway.monitoring.svc.cluster.local/loki/api/v1/push"
```

## Grafana 설치

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

## loki 연결 설정

datasource 설정하기
http://loki-loki-distributed-gateway

## Log 수집 확인

1. backend-app과 netshoot 배포
2. netshoot의 readme를 따라 backend-app으로 요청을 날려 로그 생성

## explorer에서 살펴보기

<img width="650" alt="image" src="https://github.com/user-attachments/assets/5b0fafed-0222-4d5e-9d1c-33297ffebfbf" />

## 추가 학습

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
kubectl apply -f app-tempo.yaml 
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
