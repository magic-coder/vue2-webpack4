const config = require('./webpack.config.js');
const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs-extra');

let clientItem = process.argv[2];
let entryPath = config.config.entry + '\\' + clientItem;
let fromFile = config.config.root + '\\webpack\\template\\';
fromFile = fromFile.replace(/[\\]/g, '/')
entryPath = entryPath.replace(/[\\]/g, '/')

if (!clientItem) {
    console.log(chalk.red.bold('请输入模块名称！\n  例：npm run create demo'))
    return;
}

if (config.isFile(entryPath)) {
    console.log(chalk.red.bold(`您输入的模块名已存在！`));
    return;
}

inquirer.prompt([{
    type: 'confirm',
    name: 'create',
    message: `确认创建 ${clientItem} 模块?`,
    default: true
}]).then((e) => {
    if (e.create) {
        fs.mkdir(entryPath);
        fs.copy(fromFile, entryPath, function(e) {
            console.log(chalk.yellowBright.bold(`模块创建成功 启动模块为：npm run dev ${clientItem}`));
        });
    }

})