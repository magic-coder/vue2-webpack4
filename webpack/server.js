const webpack = require("webpack")
var config = require("./webpack.dev.config.js");
var WebpackDevServer = require('webpack-dev-server');
const webCfg = require("./config.js");

var hotConfig = [
    '' +
    'webpack-dev-server/client?http://' + webCfg.dev.devServer + ':' + webCfg.dev.port,
    'webpack/hot/dev-server'
]

for (let item in config.entry) {
    config.entry[item] = hotConfig.concat(config.entry[item])
}

var compiler = webpack(config);
var server = new WebpackDevServer(compiler, {
    contentBase: 'build/',
    publicPath: "/",
    hot: true,
    noInfo: true
});
server.listen(webCfg.dev.port);