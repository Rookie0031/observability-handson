# Netshoot StatefulSet

네트워크 디버깅을 위한 `nicolaka/netshoot` 이미지를 사용하는 StatefulSet입니다.


## 배포 방법

```
kubectl apply -f statefulset.yaml
kubectl apply -f service.yaml
```

해당 파드 내부 접속하여 curl 수행 
```
for i in {1..50}; do
  curl http://sample-nest-server-service
done
```