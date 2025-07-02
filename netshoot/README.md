# Netshoot StatefulSet

네트워크 디버깅을 위한 `nicolaka/netshoot` 이미지를 사용하는 StatefulSet입니다.

## 파일 구조

- `statefulset.yaml`: Netshoot StatefulSet 설정
- `service.yaml`: Netshoot Service 설정

## 배포 방법

```bash
# StatefulSet 배포
kubectl apply -f statefulset.yaml

# Service 배포
kubectl apply -f service.yaml
```

## 사용 방법

### 1. Pod 접속
```bash
# Pod 이름 확인
kubectl get pods -l app=netshoot

# Pod에 접속
kubectl exec -it netshoot-0 -- /bin/bash
```

### 2. 네트워크 도구 사용
Pod 내부에서 사용할 수 있는 네트워크 도구들:

```bash
# DNS 확인
nslookup google.com

# 네트워크 연결 테스트
telnet google.com 80

# HTTP 요청
curl -I http://google.com

# 네트워크 인터페이스 확인
ip addr show

# 라우팅 테이블 확인
ip route show

# 포트 스캔
nmap localhost

# 패킷 캡처
tcpdump -i any

# 네트워크 통계
netstat -tuln
```

### 3. 다른 서비스로의 연결 테스트
```bash
# backend-app 서비스로 연결 테스트
curl http://sample-nest-server-service.default.svc.cluster.local

# DNS 확인
nslookup sample-nest-server-service.default.svc.cluster.local
```

## 상태 확인

```bash
# StatefulSet 상태 확인
kubectl get statefulset netshoot

# Pod 상태 확인
kubectl get pods -l app=netshoot

# Service 상태 확인
kubectl get svc netshoot-service

# PVC 확인
kubectl get pvc

# 로그 확인
kubectl logs netshoot-0
```

## 정리

```bash
# 모든 리소스 삭제
kubectl delete -f statefulset.yaml
kubectl delete -f service.yaml
```

## 특징

- **StatefulSet**: 안정적인 네트워크 식별자와 스토리지 제공
- **Persistent Storage**: 1Gi PVC로 데이터 영속성 보장
- **Network Tools**: 다양한 네트워크 디버깅 도구 포함
- **Root Access**: 네트워크 도구 사용을 위해 root 권한 제공 