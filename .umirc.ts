import { defineConfig } from 'dumi';

export default defineConfig({
  mode: "site",
  title: 'react-use-sockjs',
  logo: './logo.png',
  hash: true,
  history: {
    type: 'hash'
  },
  publicPath: './',
  navs: [
    null, // null 值代表保留约定式生成的导航，只做增量配置
    {
      title: 'GitHub',
      path: 'https://github.com/qizhancheng/react-use-sockjs',
    },
  ],
  // more config: https://d.umijs.org/config
});
