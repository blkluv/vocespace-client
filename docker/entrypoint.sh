#!/bin/sh
# 处理运行时环境变量

# 如果环境变量存在，覆盖.env中的值
[ ! -z "$LIVEKIT_API_KEY" ] && sed -i "s/^LIVEKIT_API_KEY=.*/LIVEKIT_API_KEY=$LIVEKIT_API_KEY/" .env
[ ! -z "$LIVEKIT_API_SECRET" ] && sed -i "s/^LIVEKIT_API_SECRET=.*/LIVEKIT_API_SECRET=$LIVEKIT_API_SECRET/" .env
[ ! -z "$LIVEKIT_URL" ] && sed -i "s|^LIVEKIT_URL=.*|LIVEKIT_URL=$LIVEKIT_URL|" .env
[ ! -z "$NEXT_PUBLIC_BASE_PATH" ] && sed -i "s|^NEXT_PUBLIC_BASE_PATH=.*|NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH|" .env
[ ! -z "$TURN_CREDENTIAL" ] && sed -i "s/^TURN_CREDENTIAL=.*/TURN_CREDENTIAL=$TURN_CREDENTIAL/" .env

# 启动服务
exec node server.js