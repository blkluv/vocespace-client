```bash
# 导入image
docker load -i live_meet-livemeet-prod.tar
# 运行image -> container
docker run -p 3000:3000 live_meet-livemeet-prod:latest
```