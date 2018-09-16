var path = require('path') // 不再赘述
var ora = require('ora') // 一个很好看的 loading 插件
var webpack = require('webpack') // 加载 webpack
const fs = require('fs-extra');
var webpackConfig = require('../webpack/webpack.prod.config') // 加载 webpack.prod.conf
const config = require('../webpack/config.js'); 
const chalk = require('chalk');
const prConfig = config.processConfig();

// console.log(prConfig.entryObj,prConfig.clientItem)

if (prConfig.entryObj == undefined) {
  console.log(chalk.greenBright.bold(`您输入的 模块文件名 有误，请重新输入!\n`));
  return;
}

console.log('打包处理中...')

var spinner = ora() // 使用 ora 打印出 loading + log
spinner.start() // 开始 loading 动画


//  开始 webpack 的编译
webpack(webpackConfig, function (err, stats) {
  // 编译成功的回调函数
 
  spinner.stop()
  if (err) throw err

  if (fs.statSync(config.dev.outPath).isDirectory()) {
    fs.readdirSync(config.dev.outPath).forEach(function(file,i){
      for(let item of prConfig.clientItem.split(',')){
        if(file.indexOf(`${item}.`)>-1){
          fs.move(config.dev.outPath+'\\'+file,config.dev.outPath+`\\${item}\\${file}`)
        }
        if(file.indexOf(`${item}-assets`)>-1){
          fs.move(config.dev.outPath+'\\'+file,config.dev.outPath+`\\${item}\\${file}`)
        }
      }
    });
}

  console.log( '  打包成功！！！！:\n')
})
