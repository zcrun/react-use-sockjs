## Api

## 方法

### connect

手动连接到服务器，默认自动连接

### disconnect

断开 STOMP 客户端并禁用所有重新连接。

### sendMessage

将消息发送到指定的订阅地址

#### 参数

- `topic` 订阅地址
- `msg` 发送消息
- `opt_headers` 订阅请求头消息

### sendJsonMessage

将Json消息发送到指定的订阅地址（参数同`sendMessage`）

### client

获取Stomp实例

<hr/>

## 参数

### url

要连接的 HTTP URL

### options

传递给 SockJS 的其他选项(https://github.com/sockjs/sockjs-client#sockjs-client-api)

### topics

订阅(subscribe)的数组

### onConnect

建立连接后回调

### onDisconnect

断开连接后回调

### getRetryInterval

下一次重试的时间间隔

#### 参数

- `count` 当前断开的重试次数

### onMessage

收到消息后回调

#### 参数

- `msg` 消息从服务器收到，如果 JSON 格式则是对象
- `topic` 接收消息的订阅

### headers

请求头，将通过 STOMP 的连接框架传递给服务器或代理

### subscribeHeaders

订阅目标时将传递的请求头

### autoReconnect

是否客户端在断开连接的情况下自动连接

### debug

启用调试模式

### heartbeat

发送和等待心跳消息的毫秒数

### heartbeatIncoming

接收心跳消息的毫秒数

### heartbeatOutgoing

发送心跳消息的毫秒数

### onConnectFailure

无法建立连接的回调
