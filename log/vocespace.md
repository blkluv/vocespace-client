# vocespace

Base URLs: `vocespace.com/chat/api/space`

## GET 获取房间用户信息

GET /chat/api/space

## 说明

请求前缀: vocespace.com/chat/api/space
1. 获取简单信息，只需要附带all参数，为true （vocespace.com/chat/api/space?all="true"）
2. 获取完整信息，需要增加detail参数，且为true

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|all|query|boolean| 否 |获取所有房间信息|
|detail|query|boolean| 否 |是否获取用户详情|

## 返回示例

### 简单信息返回

```json
{
    // 房间名称
    "fs68-n94u": [
        "as__6bex" // 用户id
    ],
    "kie5-ub1z": [
        "User 01__6bex"
    ]
}
```

### 完整信息返回

```json
{
    "fs68-n94u": {
        "participants": {
            "as__6bex": {
                "name": "as",
                "blur": 0.15,
                "volume": 80,
                "status": "online",
                "socketId": "qP8-c9FdAe5uvterAAAF",
                "virtual": {
                    "enabled": false,
                    "role": "None",
                    "bg": "v_bg1.png"
                }
            }
        }
    },
    "kie5-ub1z": {
        "participants": {
            "User 01__6bex": {
                "name": "User 01",
                "blur": 0.15,
                "volume": 80,
                "status": "online",
                "virtual": {
                    "enabled": false,
                    "role": "None",
                    "bg": "v_bg1.png"
                }
            }
        }
    }
}
```