const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const webpack = require('webpack');
const dotenv = require('dotenv');

// 加载.env文件
const env = dotenv.config().parsed || {};
// 将环境变量转换为webpack可用的格式
const envKeys = Object.keys(env).reduce((prev, next) => {
  prev[`process.env.${next}`] = JSON.stringify(env[next]);
  return prev;
}, {});

module.exports = {
  mode: 'development',
  entry: './src/main.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.js$/,
        loader: 'babel-loader'
      },
      {
        test: /\.css$/,
        use: ['vue-style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html'
    }),
    new VueLoaderPlugin(),
    new webpack.DefinePlugin(envKeys)
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 9000,
    hot: true,
    historyApiFallback: true,
    proxy: [{
      context: ['/api'],
      target: 'http://127.0.0.1:3000',
      changeOrigin: true,
      proxyTimeout: 300000,
      timeout: 300000,
      onError: (err, req, res) => {
        console.error('代理错误:', err);
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('代理请求:', req.method, req.url);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('代理响应:', proxyRes.statusCode, req.url);
      },
      headers: {
        'Connection': 'keep-alive'
      }
    }]
  }
}; 