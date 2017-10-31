var Chat = function(socket) {
    this.socket = socket;
};
Chat.prototype.sendMessage = function(room, text){
    var message = {
        room:room,
        text:text
    };
    this.socket.emit('message', message)
}
Chat.prototype.changeRoom = function(room) {
    this.socket.emit('join', {
        newRoom: room
    });
}
Chat.prototype.processCommand = function(command) {
    var words = command.split(' ');
    var command = words[0].substring(1, words[0].length).toLowerCase()
    var message =false;
    switch(command) {
        case 'join': //处理房间的变换/创建
        words.shift();
        var room = words.join(' ');
        this.changeRoom(room);
        break;
        case 'nick':
        words.shift();
        var name = words.join('');
        this.socket.emit('nameAttempt', name); //处理更名的尝试
        break;
        
    default: //如果命令无法识别，返回错误信息
        message = 'Unrecoginzed command.'
        break;
    }
    return message;
}
