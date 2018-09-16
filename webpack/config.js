var path = require('path');
const fs = require('fs-extra');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const chalk = require('chalk');
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
	processConfig: () => {
		const TARGET = process.env.npm_lifecycle_event;
		let isDevLoader = (TARGET == 'dev' ? "vue-style-loader"
			: MiniCssExtractPlugin.loader);
		let clientItem = TARGET == 'dev' ? process.argv[5] : process.argv[5];
		clientItem = TARGET == 'build' ? process.argv[2] : clientItem;
		// console.log(JSON.stringify(process.argv))
		return {
			isDevLoader: isDevLoader,
			entryObj: getEntry(clientItem),
			clientItem: clientItem,
			target:TARGET
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
			}
			else {
				console.log(chalk.red.bold(`您输入的模块名不存在！\n 或 npm run dev demo[模块名]`));
				return;
			}
		}
	}
	return entryObj;
}