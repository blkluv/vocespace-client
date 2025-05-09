#!/bin/bash

#=========================================================================#
# shell script for deploy with Docker
#=========================================================================#

#=========================================================================#
# Variables --------------------------------------------------------------#
#=========================================================================#
ROOT_PATH="/root/vocespace-client/"
LOG_FILE="deploy_docker.log"
LOG_SRC="/root/deploy_log"
LOG_PATH="$LOG_SRC/$LOG_FILE"
REPO_URL="https://github.com/Privoce/vocespace-client.git"
BRANCH="main"
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
# Clone or pull and then build Docker ------------------------------------#
#=========================================================================#
# check if the root path is exist
if [ ! -d $ROOT_PATH ]; then
    mkdir -p $ROOT_PATH
fi

cd $ROOT_PATH

# do clone if vocespace_client not exist or cd and do pull
if [ ! -d $ROOT_PATH/live_meet ]; then
    git clone --branch $BRANCH $REPO_URL live_meet
    if [ $? -ne 0 ]; then
        echo "clone live_meet from github repo failed!" >> $LOG_PATH
        echo $ERROR_FMT
        exit 1
    fi
    echo "SYSTEM: clone live_meet from github repo success" >> $LOG_PATH
    # set remote url for future pull
    cd $ROOT_PATH/live_meet
    git remote set-url origin $REPO_URL
else
    cd $ROOT_PATH/live_meet
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
    echo "SYSTEM: pull live_meet from github repo success" >> $LOG_PATH
fi

#=========================================================================#
# Set up environment variables -------------------------------------------#
#=========================================================================#
# Create or update .env file
cat > .env << EOF
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
LIVEKIT_URL=wss://space.voce.chat/rtc
NEXT_PUBLIC_BASE_PATH=/chat
TURN_CREDENTIAL=+Xj4jYs7tuoyt(xX
EOF

#=========================================================================#
# Build and start Docker containers --------------------------------------#
#=========================================================================#
# Check if docker and docker-compose are installed
if ! command -v docker &> /dev/null; then
    echo "docker is not installed. Please install docker first." >> $LOG_PATH
    echo $ERROR_FMT
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "docker-compose is not installed. Please install docker-compose first." >> $LOG_PATH
    echo $ERROR_FMT
    exit 1
fi

# Pull latest images (optional)
docker-compose pull || true

# Build containers
docker-compose build --no-cache
if [ $? -ne 0 ]; then
    echo "docker-compose build failed!" >> $LOG_PATH
    echo $ERROR_FMT
    exit 1
fi
echo "SYSTEM: docker-compose build success" >> $LOG_PATH

# Bring down existing containers
docker-compose down
echo "SYSTEM: brought down existing containers" >> $LOG_PATH

# Start new containers
docker-compose up -d
if [ $? -ne 0 ]; then
    echo "docker-compose up failed!" >> $LOG_PATH
    echo $ERROR_FMT
    exit 1
fi
echo "SYSTEM: docker-compose up success" >> $LOG_PATH

# Check if containers are running
sleep 5
if [ $(docker-compose ps | grep Up | wc -l) -lt 4 ]; then # 检查至少4个服务
    echo "Not all containers are running!" >> $LOG_PATH
    echo $ERROR_FMT
    exit 1
fi
echo "SYSTEM: All containers are running" >> $LOG_PATH

echo "Deploy Docker: All done! Please check $LOG_PATH for more details to make sure everything is fine."
exit 0