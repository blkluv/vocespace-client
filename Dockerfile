# Dockerfile for Vocespace

# 使用 Node.js 18 作为基础镜像 --------------------------------------------------
FROM node:23-alpine AS base

# 设置工作目录 -----------------------------------------------------------------
WORKDIR /app

# 安装依赖阶段 -----------------------------------------------------------------
FROM base AS deps
# 安装构建工具 -----------------------------------------------------------------
RUN apk add --no-cache libc6-compat git
# 复制 package.json 相关文件 ---------------------------------------------------
COPY package.json ./
# COPY package-lock.json* ./
# COPY yarn.lock* ./
COPY next.config.js ./
COPY pnpm-lock.yaml* ./
COPY entrypoint.sh ./entrypoint.sh

# 安装依赖 --------------------------------------------------------------------
RUN npm install pnpm -g
RUN pnpm install

# 构建阶段 --------------------------------------------------------------------
FROM deps AS builder
# 不需要再复制node_modules，因为deps阶段已经有了 ----------------------------------
# 复制所有源代码
COPY . .

# 设置环境变量 -----------------------------------------------------------------
# 设置最基础的环境变量配置
ARG LIVEKIT_API_KEY="__LIVEKIT_API_KEY_PLACEHOLDER__"
ARG LIVEKIT_API_SECRET="__LIVEKIT_API_SECRET_PLACEHOLDER__"
ARG LIVEKIT_URL="__LIVEKIT_URL_PLACEHOLDER__"

# 将构建参数写入.env.local ------------------------------------------------------
RUN echo "LIVEKIT_API_KEY=${LIVEKIT_API_KEY}" > .env.local \
    && echo "LIVEKIT_API_SECRET=${LIVEKIT_API_SECRET}" >> .env.local \
    && echo "LIVEKIT_URL=${LIVEKIT_URL}" >> .env.local 

# 配置 next.config.js 启用 standalone 输出
RUN sed -i 's/output: undefined/output: "standalone"/g' next.config.js || echo 'output already set'

# 构建项目 ---------------------------------------------------------------------
ENV NODE_OPTIONS="--max-old-space-size=8192"
ENV NODE_ENV production
RUN pnpm build
# 删除构建缓存
RUN rm -rf .next/cache
# 运行阶段 ---------------------------------------------------------------------
# FROM deps AS runner
FROM node:23-alpine AS runner
WORKDIR /app
# 设置为生产环境 ----------------------------------------------------------------
ENV NODE_ENV production

# 添加非root用户 ---------------------------------------------------------------
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 创建uploads目录并设置权限, 作为文件存储目录 --------------------------------------
RUN mkdir -p /app/uploads && chown -R nextjs:nodejs /app/uploads

# 创建并配置入口点脚本 -----------------------------------------------------------
# COPY deploy/docker/entrypoint.sh /app/entrypoint.sh
COPY --from=builder --chown=nextjs:nodejs /app/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# 复制整个应用 ------------------------------------------------------------------
# COPY --from=builder --chown=nextjs:nodejs /app .
# COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./
# COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
# COPY --from=builder --chown=nextjs:nodejs /app/.env.local ./.env.local
# COPY --from=builder --chown=nextjs:nodejs /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.env.local ./.env.local
RUN npm install -g pnpm 

USER root
# RUN chmod +x ./entrypoint.sh
USER nextjs

# 暴露3000端口 -----------------------------------------------------------------
EXPOSE 3000

# 使用入口脚本启动服务 -----------------------------------------------------------
ENTRYPOINT ["/app/entrypoint.sh"]