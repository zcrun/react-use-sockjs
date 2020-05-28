/**
 * React hooks for SockJS-client with STOMP messaging protocol.
 *
 * @see {@link https://stomp.github.io/|STOMP}
 * @see {@link https://github.com/sockjs/sockjs-client|StompJS}
 */
import { useRef, useEffect, useCallback } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import difference from 'lodash/difference';

export interface SockjsProps {
  /**
   * 要连接的HTTP
   */
  url: string;
  /**
   * 传递给SockJS的其他选项(https://github.com/sockjs/sockjs-client#sockjs-client-api)
   */
  options?: object;
  /**
   * 订阅(subscribe)的数组
   */
  topics: string[];
  /**
   * 建立连接后回调
   */
  onConnect?: () => any;
  /**
   * 断开连接后回调
   */
  onDisconnect?: () => any;
  /**
   * 下一次重试的时间间隔。默认seconds
   */
  getRetryInterval?: (count: number) => any;
  /**
   * 收到消息后回调
   * @param {(string|Object)} msg 消息从服务器收到，如果JSON格式则是对象
   * @param {string} topic 主题接收消息的主题
   */
  onMessage?: (msg: any, destination: any) => any;
  /**
   * 请求头，将通过STOMP的连接框架传递给服务器或代理
   */
  headers?: object;
  /**
   * 订阅目标时将传递的请求头
   */
  subscribeHeaders?: object;
  /**
   * 是否客户端在断开连接的情况下自动连接
   */
  autoReconnect?: boolean;
  /**
   * 启用调试模式
   */
  debug?: boolean;
  /**
   * 发送和等待心跳消息的毫秒数
   */
  heartbeat?: number;
  /**
   * 接收心跳消息的毫秒数
   */
  heartbeatIncoming?: number;
  /**
   * 发送心跳消息的毫秒数
   */
  heartbeatOutgoing?: number;
  /**
   * 无法建立连接的回调
   */
  onConnectFailure?: (error: any) => any;
}

export interface UseSockjs {
  /**
   * 手动连接到服务器，默认自动连接
   */
  connect: () => void;
  /**
   * 断开 STOMP 客户端并禁用所有重新连接。
   */
  disconnect: () => void;
  /**
   * 将消息发送到指定的订阅地址
   * @param {any} topic 订阅地址
   * @param {any} msg 发送的消息
   * @param {any} optHeaders 订阅请求头消息
   */
  sendMessage: (topic: any, msg: any, optHeaders?: any) => void;
  /**
   * 将Json消息发送到指定的订阅地址
   * @param {any} topic 订阅地址
   * @param {any} msg 发送的消息
   * @param {any} optHeaders 订阅请求头消息
   */
  sendJsonMessage: (topic: any, msg: any, optHeaders?: any) => void;

  /**
   * 获取Stomp实例
   */
  client: any;
}

const useSockjs = (props: SockjsProps): UseSockjs => {
  const {
    onConnect = () => {},
    onDisconnect = () => {},
    getRetryInterval = count => {
      return 1000 * count;
    },
    onMessage = (msg, destination) => {},
    options = {},
    headers = {},
    subscribeHeaders = {},
    autoReconnect = true,
    debug = false,
    heartbeat = 10000,
  } = props;

  const connected = useRef(false);
  const explicitDisconnect = useRef(false);
  const topicsRef = useRef(props.topics);
  const subscriptions = useRef(new Map()); // 监听
  const retryCount = useRef(0);
  const timeoutId = useRef<any>(null);
  const client = useRef<any>(null); // Websocket实例

  const _initStompClient = useCallback(() => {
    // stompjs的Websocket只能打开一次
    client.current = Stomp.over(new SockJS(props.url, null, options));
    client.current.heartbeat.outgoing = heartbeat;
    client.current.heartbeat.incoming = heartbeat;

    if (Object.keys(props).includes('heartbeatIncoming')) {
      client.current.heartbeat.incoming = props.heartbeatIncoming;
    }
    if (Object.keys(props).includes('heartbeatOutgoing')) {
      client.current.heartbeat.outgoing = props.heartbeatOutgoing;
    }
    if (!debug) {
      client.current.debug = () => {};
    }
  }, []);

  const _cleanUp = useCallback(() => {
    connected.current = false;
    client.current = 0;
    retryCount.current = 0;
    subscriptions.current.clear();
  }, []);

  const _log = useCallback(msg => {
    if (debug) {
      console.log(msg);
    }
  }, []);

  const _subscribe = useCallback(topic => {
    if (!subscriptions.current.has(topic)) {
      let sub = client.current.subscribe(
        topic,
        (msg: any) => {
          let body = _processMessage(msg.body);
          onMessage(body, msg.headers.destination);
          if (body && body.status === 'END') {
            disconnect();
          }
        },
        subscribeHeaders,
      );
      subscriptions.current.set(topic, sub);
    }
  }, []);

  const _processMessage = useCallback(msgBody => {
    try {
      return JSON.parse(msgBody);
    } catch (e) {
      return msgBody;
    }
  }, []);

  const _unsubscribe = useCallback(topic => {
    let sub = subscriptions.current.get(topic);
    sub.unsubscribe();
    subscriptions.current.delete(topic);
  }, []);

  const _connect = useCallback(() => {
    _initStompClient();
    client.current.connect(
      headers,
      () => {
        connected.current = true;
        topicsRef.current.forEach(topic => {
          _subscribe(topic);
        });
        onConnect();
      },
      (error: any) => {
        if (error) {
          if (props.onConnectFailure) {
            props.onConnectFailure(error);
          } else {
            _log(error.stack);
          }
        }
        if (connected.current) {
          _cleanUp();
          // 对于每个连接，onDisconnect应该只调用一次
          onDisconnect();
        }
        if (autoReconnect && !explicitDisconnect.current) {
          retryCount.current = retryCount.current + 1;
          timeoutId.current = setTimeout(
            _connect,
            getRetryInterval(retryCount.current),
          );
        }
      },
    );
  }, []);

  const connect = useCallback(() => {
    explicitDisconnect.current = false;
    if (!connected.current) {
      _connect();
    }
  }, []);

  const disconnect = useCallback(() => {
    // 在显式调用disconnect时，不需要重新连接
    // 清除timeoutId，以防组件试图重新连接
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
      timeoutId.current = null;
    }
    explicitDisconnect.current = true;
    if (connected.current) {
      subscriptions.current.forEach((subid, topic) => {
        _unsubscribe(topic);
      });
      client.current.disconnect(() => {
        _cleanUp();
        onDisconnect();
        _log('Stomp client is successfully disconnected!');
      });
    }
  }, []);

  const sendMessage = useCallback((topic, msg, optHeaders = {}) => {
    if (connected.current) {
      client.current.send(topic, optHeaders, msg);
    } else {
      throw new Error('Send error: SockJsClient is disconnected');
    }
  }, []);

  const sendJsonMessage = useCallback(
    (topic, msg, optHeaders = {}) => {
      sendMessage(topic, JSON.stringify(msg), optHeaders);
    },
    [sendMessage],
  );

  useEffect(() => {
    if (connected.current) {
      // 订阅新topics
      difference(props.topics, topicsRef.current).forEach(newTopic => {
        _log('Subscribing to topic: ' + newTopic);
        _subscribe(newTopic);
      });
      // 取消订阅topics
      difference(topicsRef.current, props.topics).forEach(oldTopic => {
        _log('Unsubscribing from topic: ' + oldTopic);
        _unsubscribe(oldTopic);
      });
      topicsRef.current = props.topics;
    }
  }, [props.topics]);

  useEffect(() => {
    _connect();
    return () => disconnect();
  }, []);

  return {
    connect,
    disconnect,
    sendMessage,
    sendJsonMessage,
    client: client.current,
  };
};

export default useSockjs;
