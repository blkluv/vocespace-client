#!/bin/sh
# 处理运行时环境变量

# 直接重写整个.env文件
cat > /app/.env.local << EOF
LIVEKIT_API_KEY=${LIVEKIT_API_KEY:-devkey}
LIVEKIT_API_SECRET=${LIVEKIT_API_SECRET:-secret}
LIVEKIT_URL=${LIVEKIT_URL:-wss://space.voce.chat}
NEXT_PUBLIC_BASE_PATH=${NEXT_PUBLIC_BASE_PATH:-/chat}
TURN_CREDENTIAL=${TURN_CREDENTIAL:-}
EOF

# 替换构建产物中的占位符
find /app/.next -type f -name "*.js" -exec sed -i "s|__NEXT_PUBLIC_BASE_PATH_PLACEHOLDER__|${NEXT_PUBLIC_BASE_PATH:-/chat}|g" {} \;

echo "环境变量配置:"
cat /app/.env.local

# 启动服务
exec pnpm start