#!/bin/bash

REPO_URL="https://github.com/Privoce/vocespace-client.git"
BRANCH="vocespace_com"
ROOT_PATH="/var/vocespace/"
PKG_NAME="vocespace_com"
LOG_FILE="deploy_com.log"
LOG_SRC="/root/deploy_log"
LOG_PATH="$LOG_SRC/$LOG_FILE"
ERROR_FMT="AUTO DEPLOY ERROR: See $LOG_PATH for more details"
#==========================================================================#
# clone from github repo --------------------------------------------------#
#==========================================================================#
if [ ! -d $ROOT_PATH ]; then
    mkdir -p $ROOT_PATH
fi

cd $ROOT_PATH

if [ ! -d $ROOT_PATH/$PKG_NAME ]; then
    git clone --branch $BRANCH $REPO_URL $PKG_NAME
    if [ $? -ne 0 ]; then
        echo "clone vocespace_com from github repo failed!" >> $LOG_PATH
        echo $ERROR_FMT
        exit 1
    fi
    echo "SYSTEM: clone vocespace_com from github repo success" >> $LOG_PATH
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
    echo "SYSTEM: pull vocespace_com from github repo success" >> $LOG_PATH
fi

#==========================================================================#
# chmod for index.html ----------------------------------------------------#
#==========================================================================#
cd $ROOT_PATH/$PKG_NAME
if [ -f index.html ]; then
    chmod +rwx index.html
    if [ $? -ne 0 ]; then
        echo "chmod index.html failed!" >> $LOG_PATH
        echo $ERROR_FMT
        exit 1
    fi
    echo "SYSTEM: chmod index.html success" >> $LOG_PATH
else
    echo "index.html not found!" >> $LOG_PATH
    echo $ERROR_FMT
    exit 1
fi