# Sample Nest Server Kubernetes 배포

이 디렉토리는 `rookie0031/sample-nest-server:latest` 이미지를 기반으로 한 Kubernetes 배포 설정을 포함합니다.


## 애플리케이션 배포

kubectl create namespace monitoring
kubectl config set-context --current --namespace=monitoring

kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
