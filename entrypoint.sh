#!/bin/bash
set -e

# 创建 supervisor 配置
cat > /tmp/supervisord.conf << EOF
[supervisord]
nodaemon=true
user=root
logfile=/tmp/supervisord.log

[program:nextjs]
command=node server.js
directory=/app
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
user=nextjs

[program:livekit]
command=/usr/local/bin/livekit-server --dev --bind 0.0.0.0
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
EOF

# 启动 supervisor
exec supervisord -c /tmp/supervisord.conf