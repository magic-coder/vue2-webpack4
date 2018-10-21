const path = require('path');
const fs = require('fs-extra');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const chalk = require('chalk');
const net = require('net');

const TARGET = process.env.npm_lifecycle_event;
const clientItem = {
    dev: process.argv[2],
    server: process.argv[5],
    build: process.argv[2]
};
const vueLoader = {
    dev: "vue-style-loader",
    build: MiniCssExtractPlugin.loader,
    dll: MiniCssExtractPlugin.loader,
};


// 取本机IP地址
const getIPAdress = () => {
    var interfaces = require('os').networkInterfaces();
    for (var devName in interfaces) {
        var iface = interfaces[devName];
        for (var i = 0; i < iface.length; i++) {
            var alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
}

//基本配置
const config = {
    root: path.resolve(__dirname, '../'),
    entry: path.resolve(__dirname, '../src/app/'),
    publicPath: '',
    outPath: path.resolve(__dirname, '../build'),
    devServer: 'localhost',
    port: '3001',
    distPath: '',
    vueLoader: vueLoader[TARGET],
    clientItem: clientItem[TARGET] && clientItem[TARGET].toString().replace('/[,，=]/', ',').split(','),
    target: TARGET
}

//文件是否存在
const isFile = v => {
    return fs.pathExistsSync(v);
}

//取webpack entry 路口
const getEntry = () => {
    var entryObj = {};
    if (config.clientItem) {
        for (let item of config.clientItem) {
            let entryPath = `${path.resolve(__dirname, '../src/app/')}\\${item}\\index.js`;
            entryPath = entryPath.replace(/[\\]/g, '/');
            if (isFile(entryPath)) {
                entryObj[item] = entryPath;
            } else {
                entryObj[item] = {};
                break;
            }
        }
    }
    return entryObj;
}

module.exports.getEntry = getEntry;
module.exports.config = config;
module.exports.isFile = isFile;
module.exports.getIPAdress = getIPAdress;