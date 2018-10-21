const path = require('path');
var merge = require('webpack-merge');
const webpackConfig = require('../webpack/webpack.base.config.js');
// simple-progress-webpack-plugin build另一种效果
const HtmlWebpackPlugin = require('html-webpack-plugin');
const config = require('../webpack/webpack.config.js');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin');
const chalk = require('chalk');


let conlg = [];
const entry = config.getEntry();

for (let item in entry) {
    conlg.push(chalk.cyan.bold('Your application is running here: ') + chalk.greenBright.bold(`http://${config.config.devServer}:${config.config.port}/${item}/`));
}


let debConfig = {
    entry: entry,
    output: {
        path: config.config.outPath,
        publicPath: '/',
        filename: '[name].[hash].js',
    },
    devtool: 'eval-source-map',
    mode: 'development',
    watchOptions: {
        ignored: /node_modules/,
        aggregateTimeout: 300, //防止重复保存频繁重新编译,300ms内重复保存不打包
        poll: 1000 //每秒询问的文件变更的次数
    },
    devServer: {
        contentBase: path.join(__dirname, "../build"), //网站的根目录为 根目录/dist
        port: config.config.port, //端口改为9000
        host: 'localhost', //如果指定的host，这样同局域网的电脑或手机可以访问该网站,host的值在dos下使用ipconfig获取 
        inline: true, // 默认为true, 意思是，在打包时会注入一段代码到最后的js文件中，用来监视页面的改动而自动刷新页面,当为false时，网页自动刷新的模式是iframe，也就是将模板页放在一个frame中
        hot: true,
        stats: "errors-only",
        compress: true, //压缩,
        noInfo: true,
        before: (app) => {

        }
    },
    plugins: [
        new CleanWebpackPlugin(['./build']),
        new webpack.NamedModulesPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new FriendlyErrorsPlugin({
            compilationSuccessInfo: {
                messages: conlg
            }
        }),
        new webpack.DllReferencePlugin({
            context: path.resolve(config.config.outPath),
            manifest: require('../build/vendor-manifest.json')
        }),
    ]
}

for (item in entry) {
    let templist = path.join(config.config.root, `./src/app/${item}/index.html`);
    if (!config.isFile(templist)) {
        templist = path.join(config.config.root, `./webpack/base-template/index.html`);
    }
    debConfig.plugins.push(
        new HtmlWebpackPlugin({
            filename: `${item}/index.html`,
            template: templist,
            inject: true,
            title: 'wyulang',
            host: config.config.distPath,
            prod: false,
            chunks: [item]
        })
    )
}

module.exports = merge(webpackConfig, debConfig)