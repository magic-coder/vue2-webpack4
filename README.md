1、版本：vue2.5   webpack4.17

2、不采用vue-cli构建，而是采用webpack原生态构建一套vue模块化框架，

3、框架采取公共部分，模块独立，每个模块都有各自的入口，模块之间互都是解耦的，耦合部分都是公用部分，

4、框加采用了module块化 每个模块都是一个独立体，且打包后都是独立打包在四个文件[assets,build.js,index.html,build.css]

5、框加采用自动化模式，

=============================================================================================================

6、webpack文件说明

   --template 生成新模块模版，index.html 可分为生产，开发分配置
   
   --build.js打包文件
   
   --config.js
   
   --webpack.base.config.js 基础配置
   
   --webpack.dev.config.js 开发配置
   
   --webpack.dll.config.js 开发中提取公用chunk 打包，提高开发环境构建速度，提速度80%，速度在250/ms 之间
   
   --webpack.prod.config.js 生产配置
   
   --webpack.create.config.js 用于创建新模块， 执行后，会在src/app/文件下生成一个新模块，如demo
   
   
   =============================================================================================================
   
   
7、构建命令使用方法

   npm run dev [模块名]    如：npm run dev demo 单模块启动，多模块启动：npm run dev demo,demo2,demo3..
   
   npm run dll             生成chuck文件，生成在build/vender-manifest.json,与vendor.dll.js
   
   npm run build [模块名]    打包文件 如：npm run build demo 单模块打包，多模块打包：npm run  demo,demo2,demo3..
   
   npm run create [模块名]  创建一个新模块 如：npm run create demo,不支持多模块创建
   
8、框架、打包后图片自动压缩，多线程构建，css自动补全
