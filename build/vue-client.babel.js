import _debug from 'debug'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import SWPrecacheWebpackPlugin from 'sw-precache-webpack-plugin'
import VueSSRClientPlugin from 'vue-server-renderer/client-plugin'
import webpack from 'webpack'
import merge from 'webpack-merge'

import { NODE_ENV, __DEV__, resolve } from './config'

import baseConfig, { babelLoader, vueLoader } from './base'

const VUE_ENV = 'client'

const debug = _debug('hi:webpack:client')

debug(
  `create webpack configuration for NODE_ENV:${NODE_ENV}, VUE_ENV:${VUE_ENV}`,
)

const clientConfig = merge.smart(baseConfig, {
  entry: {
    app: ['@babel/polyfill', resolve('src/entry-client.js')],
  },
  target: 'web',
  module: {
    rules: [babelLoader(), vueLoader()],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.VUE_ENV': JSON.stringify(VUE_ENV),
      SERVER_PREFIX: JSON.stringify('/'),
      __SERVER__: JSON.stringify(false),
    }),
    // extract vendor chunks for better caching
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendors',
      minChunks: module =>
        // a module is extracted into the vendors chunk
        // if it's inside node_modules
        /node_modules/.test(module.context) &&
        // and not a CSS file (due to extract-text-webpack-plugin limitation)
        !/\.css$/.test(module.request),
    }),
    // extract webpack runtime & manifest to avoid vendor chunk hash changing
    // on every build.
    new webpack.optimize.CommonsChunkPlugin({
      name: 'manifest',
    }),
    new HtmlWebpackPlugin({
      template: 'src/index.pug',
      filename: '__non-ssr-page__.html',
      favicon: 'src/assets/favicon.ico',
    }),
    new VueSSRClientPlugin({
      filename: '../vue-ssr-client-manifest.json',
    }),
  ],
})

if (!__DEV__) {
  debug(`Enable plugins for ${NODE_ENV} (UglifyJS, SWPrecache).`)

  clientConfig.plugins.push(
    new webpack.optimize.UglifyJsPlugin({ comments: false }),
    new SWPrecacheWebpackPlugin({
      cacheId: 'vue-ssr',
      directoryIndex: false,
      filename: 'service-worker.js',
      minify: true,
      dontCacheBustUrlsMatching: /./,
      staticFileGlobsIgnorePatterns: [/index\.html$/, /\.map$/, /\.json$/],
      stripPrefix: resolve('dist/static').replace(/\\/g, '/'),
      runtimeCaching: [
        {
          urlPattern: /\//,
          handler: 'networkFirst',
        },
      ],
    }),
  )
}

export default clientConfig