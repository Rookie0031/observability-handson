# OTLP App

OpenTelemetry SDK를 사용하여 Jaeger Collector(OTLP/HTTP)로 트레이스를 전송하는 Node.js 샘플 애플리케이션

## 특징
- **OpenTelemetry 공식 SDK 사용**
- **OTLP/HTTP 프로토콜**로 Jaeger Collector에 직접 전송
- **여러 계층 span** (DB, 외부 API, 데이터 가공 등)
- **실제 외부 API 호출** 포함
- Express 기반 REST API

OpenTelemetry 자동 계측과 수동 계측 방법을 둘다 비교할 수 있다.
쿠버네티스 환경에서 테스트한다. 여기서는 jaeger collector로 http 방식으로 OTLP 데이터를 보낸다.


## 실행 방법

### 1. 의존성 설치
```bash
npm install
```

### 2. 앱 실행
```bash
npm start
```

### 3. 주요 엔드포인트
- `GET /` - 루트 엔드포인트
- `GET /user/:id` - 사용자 정보 (DB, 외부 API, 데이터 가공 span 생성)
- `GET /order/:id` - 주문 정보 (DB, 결제, 알림 span 생성)
- `GET /error` - 에러 시뮬레이션

## Docker 이미지 빌드 및 멀티플랫폼 푸시

```bash
# 빌더 생성 (최초 1회)
docker buildx create --use

# 멀티플랫폼 빌드 및 푸시
docker buildx build --platform linux/amd64,linux/arm64 -t rookie0031/otlp-app:latest --push .
```
