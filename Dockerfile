# 使用 Node.js 18 作为基础镜像
FROM node:23-alpine AS base

# 设置工作目录
WORKDIR /app

# 安装依赖阶段
FROM base AS deps
# 安装构建工具
RUN apk add --no-cache libc6-compat git
# 复制 package.json 相关文件
COPY package.json ./
COPY package-lock.json* ./
COPY yarn.lock* ./
COPY next.config.js ./
COPY pnpm-lock.yaml* ./
# 安装依赖
# RUN \
#   if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
#   elif [ -f package-lock.json ]; then npm ci; \
#   elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
#   else npm i; \
#   fi

RUN npm install pnpm -g

RUN pnpm install

# 构建阶段
FROM deps AS builder
# 不需要再复制node_modules，因为deps阶段已经有了
# 复制所有源代码
COPY . .

# 设置环境变量
ARG LIVEKIT_API_KEY=devkey
ARG LIVEKIT_API_SECRET=secret
ARG LIVEKIT_URL=wss://space.voce.chat
ARG NEXT_PUBLIC_BASE_PATH="__NEXT_PUBLIC_BASE_PATH_PLACEHOLDER__"
ARG TURN_CREDENTIAL=""

# 将构建参数写入.env
RUN echo "LIVEKIT_API_KEY=${LIVEKIT_API_KEY}" > .env.local \
    && echo "LIVEKIT_API_SECRET=${LIVEKIT_API_SECRET}" >> .env.local \
    && echo "LIVEKIT_URL=${LIVEKIT_URL}" >> .env.local \
    && echo "NEXT_PUBLIC_BASE_PATH=${NEXT_PUBLIC_BASE_PATH}" >> .env.local \
    && echo "TURN_CREDENTIAL=${TURN_CREDENTIAL}" >> .env.local

# 构建项目
ENV NODE_OPTIONS="--max-old-space-size=8192"
RUN pnpm build

# 运行阶段
FROM deps AS runner
# 设置为生产环境
ENV NODE_ENV production

# 添加非root用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 创建uploads目录并设置权限
RUN mkdir -p /app/uploads && chown -R nextjs:nodejs /app/uploads

# # 安装socket.io依赖（之前有提到过这个缺失问题）
# COPY package.json ./
# RUN npm install --omit=dev socket.io socket.io-client

# 复制构建后的文件
# COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# COPY --from=builder --chown=nextjs:nodejs /app/server.js ./
# COPY --from=builder --chown=nextjs:nodejs /app/.env ./
# COPY --from=builder --chown=nextjs:nodejs /app/docker/entrypoint.sh ./entrypoint.sh
# # 重要：复制 app 目录 - Next.js需要这个来检测App Router
# COPY --from=builder --chown=nextjs:nodejs /app/app ./app

# 创建并配置入口点脚本
COPY docker/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# 复制整个应用
COPY --from=builder --chown=nextjs:nodejs /app .

USER root
# RUN chmod +x ./entrypoint.sh
USER nextjs

# 暴露3000端口
EXPOSE 3001

# # 启动服务 (直接使用pnpm start)
# ENTRYPOINT ["pnpm", "start"]

# 使用入口脚本启动服务
ENTRYPOINT ["/app/entrypoint.sh"]