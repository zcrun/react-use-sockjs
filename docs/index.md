# react-use-sockjs

React hooks for [SockJS-client](https://github.com/sockjs/sockjs-client) with [STOMP](https://stomp.github.io/) messaging protocol.

## 安装

```sh
npm install --save react-use-sockjs
```

## 例子

```tsx
import React, { useState } from 'react';
import useSockjs from 'react-use-sockjs';

export default () => {
  const [data, setData] = useState({});

  const { sendMessage } = useSockjs({
    url: 'http://localhost/ws',
    topics: ['/user'],
    onMessage: (body, destination) => {
      console.log(body, destination);
      setData(body);
    },
  });

  return <div>test</div>;
};
```

## API

Auto generated docs available [here](/docs/API.md).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
