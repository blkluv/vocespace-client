## 部署一个TURN服务器

### 安装coturn
```
sudo apt update
sudo apt install coturn
```

打开服务器时自动启动，您必须修改/etc/default/coturn文件。

```
sudo vim /etc/default/coturn
```

找到以下行并取消注释以将 Coturn 作为自动系统服务守护程序运行。

```
TURNSERVER_ENABLED=1
```


### 配置coturn
```
cp /etc/turnserver.conf /etc/turnserver.conf.backup
sudo vim /etc/turnserver.conf
```

### 基础配置
```
listening-port=3478
fingerprint
lt-cred-mech
user=your-username:your-password
realm=your-domain.com
```

### 启动服务

```
sudo systemctl enable coturn
sudo systemctl start coturn
```