const webpack = require("webpack")
var config = require("./webpack.dev.config.js");
var WebpackDevServer = require('webpack-dev-server');

for (let item in config.entry) {
    config.entry[item] = ["webpack-dev-server/client?http://localhost:3001/", "webpack/hot/dev-server"].concat(config.entry[item])
}

var compiler = webpack(config);
var server = new WebpackDevServer(compiler, {
    contentBase: 'build/',
    publicPath: "/",
    hot: true,
    noInfo: true
});
server.listen(3001);