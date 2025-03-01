#!/bin/bash

#=========================================================================#
# Variables --------------------------------------------------------------#
#=========================================================================#
ROOT_PATH="/root/vocespace-client/"
DEPLOY_NGINX_CONF="vocespace"
NGINX_CONF="nginx.conf"
NGINX_AVA_PATH="/etc/nginx/sites-available"
NGINX_ENABLED_PATH="/etc/nginx/sites-enabled"
LOG_FILE="deploy_nginx.log"
LOG_SRC="/root/deploy_log"
LOG_PATH="$LOG_SRC/$LOG_FILE"
ERROR_FMT="AUTO DEPLOY ERROR: See $LOG_PATH for more details"
SENCRYPT="/etc/letsencrypt/live/space.voce.chat"
SERVER_NAME="space.voce.chat"
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
#!#=========================================================================#
# enable Nginx for dev ---------------------------------------------------#
#=========================================================================#
# - check conf is exist?
if [ ! -f $NGINX_AVA_PATH/$DEPLOY_NGINX_CONF ]; then
    # copy from current dir's nginx.dev.conf as vocespace_dev
    cp $ROOT_PATH/deploy/$NGINX_CONF $NGINX_AVA_PATH/$DEPLOY_NGINX_CONF
fi

# - check $NGINX_ENABLED_PATH is exist? if exist remove it
if [ -f $NGINX_ENABLED_PATH/$DEPLOY_NGINX_CONF ]; then
    rm $NGINX_ENABLED_PATH/$DEPLOY_NGINX_CONF
fi
# ln nginx.dev.conf to sites-enabled
ln -s $NGINX_AVA_PATH/$DEPLOY_NGINX_CONF $NGINX_ENABLED_PATH/$DEPLOY_NGINX_CONF
# check ln is success
if [ $? -ne 0 ]; then
    echo "Enable Nginx failed!" >> $LOG_PATH
    echo $ERROR_FMT
    exit 1
fi
echo "SYSTEM: Enable Nginx success" >> $LOG_PATH
# restart nginx
systemctl restart nginx
# if do not have /etc/letsencrypt/live/space.voce.chat do certbot --nginx -d space.voce.chat
if [ ! -d $SENCRYPT ]; then
    certbot --nginx -d $SERVER_NAME
fi
# echo all done
echo "Deploy Dev: All done! Please check $LOG_PATH for more details to make sure everything is fine."
exit 0