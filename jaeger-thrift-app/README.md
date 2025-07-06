# Jaeger Thrift App

Jaeger SDK를 사용하여 Jaeger Agent에 직접 트레이스를 보내는 간단한 샘플 애플리케이션입니다.

## 특징

- **Jaeger SDK 직접 사용**: `jaeger-client` 라이브러리 사용
- **UDP 통신**: Jaeger Agent (포트 6831)로 직접 전송
- **Express.js**: 간단한 웹 서버
- **중첩 Span**: 부모-자식 관계의 span 생성
- **태그와 로그**: span에 태그와 로그 추가

Instrumentation에 jaeger-clinet를 사용한다.
jaeger agent에 UDP 프로토콜로 binary 데이터를 전송한다. (6832 포트)


## 설치 및 실행

### 로컬 실행
```bash
# 의존성 설치
npm install

# 앱 실행
npm start
```


## API 엔드포인트

- `GET /` - 루트 엔드포인트
- `GET /user/:id` - 사용자 정보 조회
- `GET /error` - 에러 시뮬레이션

## 트레이스 확인

Jaeger UI에서 `jaeger-thrift-app` 서비스의 트레이스를 확인할 수 있습니다.

```bash
# Jaeger UI 포트포워딩
kubectl port-forward svc/jaeger-jaeger-query 16686:16686 -n observability
```

## 아키텍처

```
App → Jaeger SDK → Jaeger Agent (UDP:6831) → Jaeger Collector → Storage → Jaeger UI
```

## 주요 설정

- **Agent Host**: `jaeger-agent.observability.svc.cluster.local`
- **Agent Port**: `6832` (UDP)
- **Sampler**: `const` (100% 샘플링)
- **Service Name**: `jaeger-thrift-app` 

---
### Multi Platform Build
docker buildx create --use
docker buildx build --platform linux/amd64,linux/arm64 -t rookie0031/jaeger-thrift-app:latest --push .
