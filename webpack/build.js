var ora = require('ora') // 一个很好看的 loading 插件
var webpack = require('webpack') // 加载 webpack
const fs = require('fs-extra');
var webpackConfig = require('../webpack/webpack.prod.config') // 加载 webpack.prod.conf
const config = require('../webpack/webpack.config.js');
const chalk = require('chalk');
const entry = config.getEntry();

console.log(JSON.stringify(entry))

if (Object.keys(entry).length == 0) {
    console.log(chalk.greenBright.bold(`您输入的 模块文件名 有误，请重新输入!\n`));
    return;
}

console.log('打包处理中...')

var spinner = ora() // 使用 ora 打印出 loading + log
spinner.start() // 开始 loading 动画


//  开始 webpack 的编译
webpack(webpackConfig, function(err, stats) {
    // 编译成功的回调函数

    spinner.stop()
    if (err) throw err

    if (fs.statSync(config.config.outPath).isDirectory()) {
        fs.readdirSync(config.config.outPath).forEach(function(file, i) {
            for (let item of config.config.clientItem) {
                if (file.indexOf(`${item}.`) > -1) {
                    fs.move(config.config.outPath + '\\' + file, config.config.outPath + `\\${item}\\${file}`)
                }
                if (file.indexOf(`${item}-assets`) > -1) {
                    fs.move(config.config.outPath + '\\' + file, config.config.outPath + `\\${item}\\${file}`)
                }
            }
        });
    }

    console.log('  打包成功！！！！:\n')
})