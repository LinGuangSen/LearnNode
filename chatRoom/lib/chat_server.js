var socketio = require('socket.io')
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

exports.listen = function(server) {
    io  = socketio.listen(server) // 地洞Socket.io 服务器，允许它搭载在已有的http服务器上
    io.set('log level', 1)
    io.sockets.on('connection', function(socket) { //定义每一个访客连接的逻辑
        guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);//在用户连接上来时 赋予一个访客名
        joinRoom(socket, 'Lobby'); //在用户连接上开时把他放入聊天室Lobby里
        handleMessageBroadcasting(socket, nickNames);  // 处理用户的消息，更名，以及聊天室的创建和变更
        handleNameChangeAttempts(socket, nickNames, namesUsed); //用户发出请求时，向其提供已经被占用的聊天室的列表
        handleRoomJoining(socket);
        socket.on('rooms', function() {
            socket.emit('rooms', io.sockets.manager.rooms)
        })
        handleClientDisconnection(socket, nickNames, namesUsed); //定义用户断开连接后的清除逻辑
    })
}

function assignGuestName(socket, guestNumber, nickNames, namesUsed){
    var name = 'Guest' + guestNumber; // 生成新昵称
    nickNames[socket.id] = name;  // 把用户昵称跟客户端连接ID关联上
    socket.emit('nameResult', {  // 让用户知道他们的昵称
        success: true,
        name: name
    });
    namesUsed.push(name);  //存放已经被占用的昵称
    return guestNumber +1 //增加用来生成昵称的计数器
}

function joinRoom(socket, room){
    socket.join(room);   //让用户进入房间
    currentRoom[socket.id] = room; //记录用户当前的房间
    socket.emit('joinResult', {room: room}); //告诉用户他进入的哪个房间
    socket.broadcast.to(room).emit('message', { //告诉在房间里的用户谁进入了房间
        text: nickNames[socket.id] + ' 进入了' + room + '.'
    })
    var usersInRoom = io.sockets.clients(room);//确定有哪些用户在房间里
    if(usersInRoom.length > 1){ //如果不止一个用户在房间里
        var usersInRoomSummary = '在 ' + room + '房间的人：'
        for( var index in usersInRoom) {
            var userSocketId = usersInRoom[index].id
            if(userSocketId != socket.id){
                if(index >0){
                    usersInRoomSummary += ', ';
                }
                usersInRoomSummary += nickNames[userSocketId];
            }
        }
        usersInRoomSummary += '.';
        socket.emit('message', {text:usersInRoomSummary})
    }
}

function handleNameChangeAttempts(socket, nickNames, namesUsed) {
    socket.on('nameAttempt', function(name){ // 添加nameAttempt 事件的监听器
        if(name.indexOf('Guest') == 0) {  //id 不能以Guest开头
            socket.emit('nameResult', {
                success: false,
                message:'Names connot begin with "Guest".'
            });
        }else {
            if(namesUsed.indexOf(name) == -1) { //如果昵称没有被注册
                var previousName = nickNames[socket.id];
                var previousNameIndex = namesUsed.indexOf(previousName);
                namesUsed.push(name);
                nickNames[socket.id] = name;
                delete namesUsed[previousNameIndex]; //删掉之前的昵称
                socket.emit('nameResult', {
                    success:true,
                    name:name
                });
                socket.broadcast.to(currentRoom[socket.id]).emit('message',{
                    text:previousName+ '改名为 ' + name + '.'
                });
            } else{  //如果昵称已经被注册了 发送消息
                socket.emit('nameResult', {
                    success:false,
                    message:'That name is already in use'
                })
            }
        }
    })
}

function handleMessageBroadcasting(socket) {
    socket.on('message', function(message) {
        socket.broadcast.to(message.room).emit('message', {
            text: nickNames[socket.id] + ': ' + message.text
        });
    });
}

function handleRoomJoining(socket) {   //更换房间
    socket.on('join', function(room) {
        socket.leave(currentRoom[socket.id]);
        joinRoom(socket, room.newRoom);
    });

}

function handleClientDisconnection(socket) { //用户断开连接
    socket.on('disconnect', function() {
        var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
        delete namesUsed[nameIndex];
        delete nickNames[socket.id];
    });
}

