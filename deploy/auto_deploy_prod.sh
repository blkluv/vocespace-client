#!/bin/bash

#=========================================================================#
# shell script for deploy prod environment
#=========================================================================#

#=========================================================================#
# Variables --------------------------------------------------------------#
#=========================================================================#
ROOT_PATH="/root/vocespace-client/"
KIND="prod"
PKG_NAME="vocespace_prod"
REPO_URL="https://github.com/Privoce/vocespace-client.git"
BRANCH="main"
DEPLOY_NGINX_CONF="vocespace"
NGINX_CONF="nginx.conf"
NGINX_AVA_PATH="/etc/nginx/sites-available"
NGINX_ENABLED_PATH="/etc/nginx/sites-enabled"
LOG_FILE="deploy_prod.log"
LOG_SRC="/root/deploy_log"
LOG_PATH="$LOG_SRC/$LOG_FILE"
ERROR_FMT="AUTO DEPLOY ERROR: See $LOG_PATH for more details"
#=========================================================================#
# clear or create log file -----------------------------------------------#
#=========================================================================#
# check or create log src
if [ ! -d $LOG_SRC ]; then
    mkdir -p $LOG_SRC
fi
# check or create log file
if [ -f $LOG_PATH ]; then
    rm $LOG_PATH
fi
touch $LOG_PATH
#=========================================================================#
# Clone or pull and then do pkg (prod)-------------------------------------#
#=========================================================================#
# check if the root path is exist
if [ ! -d $ROOT_PATH ]; then
    mkdir -p $ROOT_PATH
fi

cd $ROOT_PATH

# do clone if vocespace_prod not exist or cd and do pull
if [ ! -d $ROOT_PATH/$PKG_NAME ]; then
    git clone --branch $BRANCH $REPO_URL $PKG_NAME
    if [ $? -ne 0 ]; then
        echo "clone vocespace_prod from github repo failed!" >> $LOG_PATH
        echo $ERROR_FMT
        exit 1
    fi
    echo "SYSTEM: clone vocespace_prod from github repo success" >> $LOG_PATH
    # set remote url for future pull
    cd $ROOT_PATH/$PKG_NAME
    git remote set-url origin $REPO_URL
else
    cd $ROOT_PATH/$PKG_NAME
    # set remote url
    git remote set-url origin $REPO_URL
    # do fetch and reset
    git fetch --all
    if [ $? -ne 0 ]; then
        echo "fetch from github repo failed!" >> $LOG_PATH
        echo $ERROR_FMT
        exit 1
    fi
    git reset --hard origin/$BRANCH
    if [ $? -ne 0 ]; then
        echo "reset to origin/$BRANCH failed!" >> $LOG_PATH
        echo $ERROR_FMT
        exit 1
    fi
    echo "SYSTEM: pull vocespace_prod from github repo success" >> $LOG_PATH
fi
#=========================================================================#
# Build environment ------------------------------------------------------#
#=========================================================================#
# make a .env file
# the following is standard .env file content:
# ```
# LIVEKIT_API_KEY=devkey
# LIVEKIT_API_SECRET=secret
# LIVEKIT_URL=wss://space.voce.chat
# ```
# - remove the old .env file and replace with new one
if [ -f .env ]; then
    rm .env
fi
echo "LIVEKIT_API_KEY=devkey" >> .env
echo "LIVEKIT_API_SECRET=secret" >> .env
echo "LIVEKIT_URL=wss://space.voce.chat" >> .env
#=========================================================================#
# install dependencies and build -----------------------------------------#
#=========================================================================#
# do pnpm install and build
pnpm install
if [ $? -ne 0 ]; then
    echo "pnpm install failed!" >> $LOG_PATH
    echo $ERROR_FMT
    exit 1
fi
# - set NODE_OPTIONS for build add heap size to 8192
export NODE_OPTIONS="--max-old-space-size=8192"
# - build the project
pnpm build
if [ $? -ne 0 ]; then
    echo "pnpm build failed!" >> $LOG_PATH
    echo $ERROR_FMT
    exit 1
fi
echo "SYSTEM: pnpm install and build success" >> $LOG_PATH
#=========================================================================#
# pm2 stop and delete old version then pub--------------------------------#
#=========================================================================#
# stop $PKG_NAME
pm2 stop $PKG_NAME
# delete $PKG_NAME
pm2 delete $PKG_NAME
# start pm2 npm 
PORT=3000 pm2 start npm --name $PKG_NAME -- start
# save pm2
pm2 save
# sleep 2s for pm2 server to start
sleep 2
# netstat -tulnp | grep 3000 to check if the server is running, if have echo success
if [ $(netstat -tulnp | grep 3000 | wc -l) -gt 0 ]; then
    echo "pm2 server rebuild success!" >> $LOG_PATH
else 
    echo "pm2 server rebuild failed!" >> $LOG_PATH
    echo $ERROR_FMT
    exit 1
fi
# echo all done
echo "Deploy Prod: All done! Please check $LOG_PATH for more details to make sure everything is fine."
exit 0