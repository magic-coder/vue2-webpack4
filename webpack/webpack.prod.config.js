const path = require('path');
var merge = require('webpack-merge');
const webpackConfig = require('../webpack/webpack.base.config.js');
// simple-progress-webpack-plugin build另一种效果
const HtmlWebpackPlugin = require('html-webpack-plugin');
const config = require('../webpack/config.js');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
var ParallelUglifyPlugin = require('webpack-parallel-uglify-plugin');
const DropConsoleWebpackPlugin = require('drop-console-webpack-plugin')
const prConfig = config.processConfig();
const _version = new Date().getTime();
let debConfig = {
  entry: prConfig.entryObj,
  output: {
    path: config.dev.outPath,
    publicPath: '',
    filename: `[name].${_version}.js`,
  },
  devtool: 'cheap-eval-source-map',
  mode: 'production',
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        cache: true,
        parallel: true,
        sourceMap: true // set to true if you want JS source maps
      }),
      new OptimizeCSSAssetsPlugin({})
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: `[name].${_version}.css`
    }),
    new ParallelUglifyPlugin({
      cacheDir: '.cache/',
      uglifyJS: {
        output: {
          comments: false
        },
        compress: {
          warnings: false
        }
      }
    }),
    new DropConsoleWebpackPlugin({
      drop_log: true,
      drop_info: true,
      drop_warn: false,
      drop_error: false
    })
  ]
}


let clearBuild = [];

for (item in prConfig.entryObj) {
  clearBuild.push(`${item}/*`);
  let templist = path.join(config.dev.root, `./src/app/${item}/index.html`);
  if (!config.isFile(templist)) {
    templist = path.join(config.dev.root, `./webpack/template/index.html`);
  }
  debConfig.plugins.push(
    new HtmlWebpackPlugin({
      filename: `${item}/index.html`,
      template: templist,
      inject: false,
      title: 'Custom template',
      host: config.dev.distPath,
      prod: true,
      module: `${item}.${_version}`,
      hash: true,
      chunks: [item],
      minify: {
        removeAttributeQuotes: true,
        collapseWhitespace: true,
        html5: true,
        minifyCSS: true,
        removeComments: true,
        removeEmptyAttributes: true
      }
    })
  )
}

debConfig.plugins.push(
  new CleanWebpackPlugin(
    clearBuild, 　 //匹配删除的文件
    {
      root: config.dev.outPath, //根目录
      verbose: true, //开启在控制台输出信息
      dry: false //启用删除文件
    })
)

module.exports = merge(webpackConfig, debConfig)