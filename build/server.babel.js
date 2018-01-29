import nodeExternals from 'webpack-node-externals'
import merge from 'webpack-merge'
import UglifyjsWebpackPlugin from 'uglifyjs-webpack-plugin'

import { resolve } from './config'

import baseConfig, { babelLoader } from './base'

export default merge.smart(baseConfig, {
  entry: resolve('server/index.js'),
  target: 'node',
  output: {
    path: resolve('dist'),
    filename: 'server.js',
    libraryTarget: 'commonjs2',
  },
  externals: nodeExternals(),
  module: {
    rules: [babelLoader(true)],
  },
  plugins: [new UglifyjsWebpackPlugin()],
})