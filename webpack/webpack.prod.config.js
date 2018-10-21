const path = require('path');
var merge = require('webpack-merge');
const webpackConfig = require('../webpack/webpack.base.config.js');
// simple-progress-webpack-plugin build另一种效果
const HtmlWebpackPlugin = require('html-webpack-plugin');
const config = require('../webpack/webpack.config.js');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
var ParallelUglifyPlugin = require('webpack-parallel-uglify-plugin');
const DropConsoleWebpackPlugin = require('drop-console-webpack-plugin')
const entry = config.getEntry();
const _version = new Date().getTime();
let debConfig = {
    entry: entry,
    output: {
        path: config.config.outPath,
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

for (item in entry) {
    clearBuild.push(`${item}/*`);
    let templist = path.join(config.config.root, `./src/app/${item}/index.html`);
    if (!config.isFile(templist)) {
        templist = path.join(config.config.root, `./webpack/template/index.html`);
    }
    debConfig.plugins.push(
        new HtmlWebpackPlugin({
            filename: `${item}/index.html`,
            template: templist,
            inject: false,
            title: 'Custom template',
            host: config.config.distPath,
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
            root: config.config.outPath, //根目录
            verbose: true, //开启在控制台输出信息
            dry: false //启用删除文件
        })
)

module.exports = merge(webpackConfig, debConfig)