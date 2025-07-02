# Sample Nest Server Kubernetes 배포

이 디렉토리는 `rookie0031/sample-nest-server:latest` 이미지를 기반으로 한 Kubernetes 배포 설정을 포함합니다.

## 미니큐브 시작하기

### 1. 미니큐브 설치 (macOS)

```bash
# Homebrew를 사용한 설치
brew install minikube

# 또는 직접 다운로드
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-darwin-amd64
sudo install minikube-darwin-amd64 /usr/local/bin/minikube
```

### 2. 미니큐브 시작

```bash
# 미니큐브 중지
minikube stop

# 미니큐브 삭제
minikube delete

# 기본 설정으로 미니큐브 시작
minikube start

# 특정 드라이버로 시작 (예: docker)
minikube start --driver=docker

# 더 많은 메모리와 CPU 할당
minikube start --memory=4096 --cpus=2

# 멀티 노드 클러스터
minikube start --driver=hyperkit --nodes 3
```



### 3. 미니큐브 상태 확인

```bash
# 클러스터 상태 확인
minikube status

# 노드 정보 확인
kubectl get nodes

# 미니큐브 대시보드 열기
minikube dashboard
```

## 애플리케이션 배포

### 1. Deployment 배포

```bash
kubectl apply -f deployment.yaml
```

### 2. Service 배포

```bash
kubectl apply -f service.yaml
```

## 배포 확인

```bash
# Pod 상태 확인
kubectl get pods -l app=sample-nest-server

# Service 상태 확인
kubectl get svc sample-nest-server-service

# 로그 확인
kubectl logs -l app=sample-nest-server

# 서비스 상세 정보
kubectl describe svc sample-nest-server-service
```

## 서비스 접근

### 클러스터 내부 접근
```bash
# 포트 포워딩으로 로컬에서 접근
kubectl port-forward svc/sample-nest-server-service 8080:80

# 브라우저에서 http://localhost:8080 접속
```

### 미니큐브 터널 사용 (외부 접근)
```bash
# 터널 시작 (별도 터미널에서)
minikube tunnel

# Service 타입을 LoadBalancer로 변경하면 외부 IP 할당
```


## 설정 상세

### Deployment
- **Replicas**: 2개
- **Container Port**: 3000
- **Health Check**: `/health` 엔드포인트 사용
- **Resource Limits**: CPU 200m, Memory 256Mi

### Service
- **Type**: ClusterIP
- **Port**: 80 → 3000 (Container Port) 