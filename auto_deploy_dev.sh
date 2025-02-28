#!/bin/bash

#=========================================================================#
# shell script for deploy dev environment
#=========================================================================#

#=========================================================================#
# Variables --------------------------------------------------------------#
#=========================================================================#
# name to the project for temporary directory
TMP_NAME="tmp"
SRC_PATH="~/vocespce-client/src"
RELEASE_PATH="~/vocespce-client/release"
PKG_NAME="vocespace_client_dev"
NGINX_DEV_CONF="nginx.dev.conf"
# version file
VERSION_FILE="~/vocespce-client/src/tmp/vocespace_client/.version"
CLIENT_REPO_URL="https://github.com/Privoce/vocespace-client.git"
BRANCH="dev"
NGINX_AVA_PATH="/etc/nginx/sites-available/vocespace_dev"
NGINX_ENABLED_PATH="/etc/nginx/sites-enabled/vocespace_dev"

#=========================================================================#
# clean up before all-----------------------------------------------------#
#=========================================================================#
# - remove the tmp directory
if [ -d $SRC_PATH/$TMP_NAME ]; then
    rm -rf $SRC_PATH/$TMP_NAME
fi
#=========================================================================#
# Clone and do pkg (dev)--------------------------------------------------#
#=========================================================================#
# - cd to src
cd $SRC_PATH
# - clone from github, branch dev, now we get the source code in ./tmp
git clone --branch $BRANCH $CLIENT_REPO_URL $TMP_NAME
# - check clone is success
if [ $? -ne 0 ]; then
    echo "Clone from github repo failed!"
    exit 1
fi
# - cd to the project directory
cd $TMP_NAME
# - check pnpm is installed?
if ! command -v pnpm &> /dev/null
then
    echo "pnpm could not be found, please install pnpm"
    exit 1
fi
# - install dependencies
pnpm install
# - check install is success
if [ $? -ne 0 ]; then
    echo "Install dependencies failed!"
    exit 1
fi
# - build the project
pnpm build
# - check build is success
if [ $? -ne 0 ]; then
    echo "Build project failed!"
    exit 1
fi

#=========================================================================#
# Build environment ------------------------------------------------------#
#=========================================================================#
# make a .env file
# the following is standard .env file content:
# ```
# LIVEKIT_API_KEY=devkey
# LIVEKIT_API_SECRET=secret
# LIVEKIT_URL=wss://dev.space.voce.chat
# NODE_ENV=development
# ```
# - remove the old .env file and replace with new one
if [ -f .env ]; then
    rm .env
fi
echo "LIVEKIT_API_KEY=devkey" >> .env
echo "LIVEKIT_API_SECRET=secret" >> .env
echo "LIVEKIT_URL=wss://dev.space.voce.chat" >> .env
echo "NODE_ENV=development" >> .env

#=========================================================================#
# copy .next and rename to $VERSION/vocespace_client_dev ---------------#
#=========================================================================#
# - get the version from .version file if not exist, echo error
if [ ! -f $VERSION_FILE ]; then
    echo ".version file not exist!"
    exit 1
fi
VERSION=$(cat $VERSION_FILE)
# - copy .next to $RELEASE_PATH/$VERSION/vocespace_client_dev
cp -r .next $RELEASE_PATH/$VERSION/$PKG_NAME
# - check copy is success
if [ $? -ne 0 ]; then
    echo "Copy .next -> release pkg path failed!"
    exit 1
fi

#=========================================================================#
# enable Nginx for dev ---------------------------------------------------#
#=========================================================================#
# - check nginx is installed?
if ! command -v nginx &> /dev/null
then
    echo "nginx could not be found, please install nginx"
    exit 1
fi
# - check conf is exist?
if [ ! -f $NGINX_CONF_PATH ]; then
    # copy from current dir's nginx.dev.conf as vocespace_dev
    cp ./$NGINX_DEV_CONF $NGINX_AVA_PATH
    exit 1
fi

# - check $NGINX_AVA_PATH is exist? if exist remove it
if [ -f $NGINX_AVA_PATH ]; then
    rm $NGINX_AVA_PATH
fi
# ln nginx.dev.conf to sites-enabled
ln -s $NGINX_AVA_PATH $NGINX_ENABLED_PATH
# check ln is success
if [ $? -ne 0 ]; then
    echo "Enable Nginx failed!"
    exit 1
fi
# do nginx -t
nginx -t
# check nginx -t is success
if [ $? -ne 0 ]; then
    echo "Nginx -t failed!"
    exit 1
fi
# certbot for https for dev url
certbot --nginx -d dev.space.voce.chat
# check certbot is success
if [ $? -ne 0 ]; then
    echo "Certbot failed for dev.space.voce.chat!"
    exit 1
fi
# restart nginx
systemctl restart nginx

#=========================================================================#
# clean up ---------------------------------------------------------------#
#=========================================================================#
# - remove the tmp directory
rm -rf $SRC_PATH/$TMP_NAME
# echo all done
echo "Deploy Dev: All done!"