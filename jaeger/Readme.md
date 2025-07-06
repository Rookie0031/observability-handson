## jaeger 설치

```
helm upgrade --install jaeger jaegertracing/jaeger \
  --namespace observability \
  --create-namespace \
  --set provisionDataStore.cassandra=true \
  --set collector.service.otlp.grpc.port=4317 \
  --set collector.service.otlp.grpc.name=otlp-grpc \
  --set collector.service.otlp.http.port=4318 \
  --set collector.service.otlp.http.name=otlp-http
```

hotrod로 테스트한다면 OTLP로 trace를 보낸다. 
따라서 jaeger collector에서 otlp 포트를 활성화시켜야한다.