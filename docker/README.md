```bash
docker run -p 3001:3001 \
  -e LIVEKIT_API_KEY=用户的密钥 \
  -e LIVEKIT_API_SECRET=用户的密钥 \
  -e LIVEKIT_URL=用户的URL \
  -e NEXT_PUBLIC_BASE_PATH=/自定义路径 \
  your-image-name
```