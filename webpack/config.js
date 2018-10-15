var path = require('path');
const fs = require('fs-extra');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const chalk = require('chalk');
var net = require('net');

module.exports = {
    mode: "",
    dev: {
        root: path.resolve(__dirname, '../'),
        entry: path.resolve(__dirname, '../src/app/'),
        publicPath: '',
        outPath: path.resolve(__dirname, '../build'),
        assetsLib: path.resolve(__dirname, '../lib/utils'),
        devServer: 'localhost',
        port: '3001',
        distPath: ''
    },
    prod: {
        publicPath: '',
        distPath: '',
        imgageAssets: path.resolve(__dirname, '../dist/assets')
    },
    dll: {
        path: path.resolve(__dirname, '../build')
    },
    isFile: (v) => {
        return fs.pathExistsSync(v);
    },
    isPort: (v) => {
        var server = net.createServer().listen(v);
        let isPt;
        server.on('error', function(err) {
            if (err.code === 'EADDRINUSE') { // 端口已经被使用
                console.log(chalk.red.bold(`============端口被占用或启动了其它模块========\n`));
            }
        })
        server.on('listening', function() { // 执行这块代码说明端口未被占用
            server.close() // 关闭服务
            console.log('=======================================')
        })


    },
    processConfig: () => {
        const TARGET = process.env.npm_lifecycle_event;
        let isDevLoader = (TARGET == 'dev' ? "vue-style-loader" : MiniCssExtractPlugin.loader);
        let clientItem = TARGET == 'dev' ? process.argv[2] : process.argv[5];

        if (TARGET == 'server') {
            isDevLoader = (TARGET == 'server' ? "vue-style-loader" : MiniCssExtractPlugin.loader);
            clientItem = TARGET == 'server' ? process.argv[5] : process.argv[5];
        }

        clientItem = TARGET == 'build' ? process.argv[2] : clientItem;
        // console.log(JSON.stringify(process.argv))
        return {
            isDevLoader: isDevLoader,
            entryObj: getEntry(clientItem),
            clientItem: clientItem,
            target: TARGET
        }
    }
}

function getEntry(v) {
    let clientItem;
    var entryObj = {};
    if (v) {
        clientItem = v.toString().replace('/[,，=]/', ',').split(',');
        for (let item of clientItem) {
            let entryPath = `${path.resolve(__dirname, '../src/app/')}\\${item}\\index.js`;
            entryPath = entryPath.replace(/[\\]/g, '/');
            if (fs.pathExistsSync(entryPath)) {
                entryObj[item] = entryPath;
            } else {
                console.log(chalk.red.bold(`============您输入的${item}模块名不存在！ 或 npm run dev demo[模块名]========\n`));
                process.exit(1);
                break;
            }
        }
    }
    return entryObj;
}