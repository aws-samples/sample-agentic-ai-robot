const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Node.js 폴리필 추가
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        "util": require.resolve("util/"),
        "buffer": require.resolve("buffer/"),
        "process": require.resolve("process/browser.js"),
        "fs": false,
        "child_process": false,
        "path": require.resolve("path-browserify"),
        "os": require.resolve("os-browserify/browser"),
        "crypto": require.resolve("crypto-browserify"),
        "stream": require.resolve("stream-browserify"),
        "http": require.resolve("stream-http"),
        "https": require.resolve("https-browserify"),
        "zlib": require.resolve("browserify-zlib"),
        "url": require.resolve("url/"),
        "querystring": require.resolve("querystring-es3"),
        "net": false,
        "tls": false,
        "dns": false,
        "dgram": false,
        "cluster": false,
        "module": false,
        "readline": false,
        "repl": false,
        "tty": false,
        "vm": false,
        "worker_threads": false
      };

      // Provide 플러그인 추가
      webpackConfig.plugins = [
        ...webpackConfig.plugins,
        new webpack.ProvidePlugin({
          process: 'process/browser.js',
          Buffer: ['buffer', 'Buffer'],
        }),
      ];

      return webpackConfig;
    },
  },
};
