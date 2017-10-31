var http = require('http');
var path = require('path')
var fs = require('fs');
var mime = require('mime');
var cache = {};
var chatServer = require('./lib/chat_server');


//发送404错误页面
function send404(response) {
    response.writeHead(404, {'Content-Type': 'text/plain'});
    response.write('Error 404: resource not found');
    response.end();
}

function sendFile(response, filePath, fileContents) {
    response.writeHead(200, {"content-type": mime.lookup(path.basename(filePath))}
);
    response.end(fileContents);
}

//提供静态服务文件
function serveStatic(response,cache, absPath) {
    if(cache[absPath]) {  //检查文件是否缓存在内存中
        sendFile(response, absPath, cache[absPath]);     //从内存中返回文件
    } else {
        fs.exists(absPath, function(exists) {     
            if(exists) {                         //检查文件是否存在
                fs.readFile(absPath, function(err, data) {  //从硬盘中读取文件
                    if(err){
                        send404(response);
                    } else {
                        cache[absPath] = data;           
                        sendFile(response, absPath, data);  //从硬盘中读取文件并返回
                    }
                })
            } else{
                send404(response)
            }
        })
    }
}

//创建HTTP服务器的逻辑
var server = http.createServer(function(request, response){
    var filePatah = false;

    if(request.url == '/') {
        filePatah = 'public/index.html';
    } else {
        filePatah = 'public' + request.url;
    }
    var absPath = './' + filePatah;
    serveStatic(response, cache, absPath)
})

server.listen(3000,function(){
    console.log("server listning at 3000")
})
chatServer.listen(server)