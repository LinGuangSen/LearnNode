function divEscapedContentElement(message,selfText) {
    if(selfText){
        return $('<div class="selfMessage"></div>').html('<span>' + message + '</span>')
    }else{
        return $('<div></div>').text(message);
    }
}
function divSystemContentElement(message) {
    return $('<div></div>').html('<i>' + message + '</i>')
}

function processUserInput (chatApp, socket) {
    var message  = $('#send-message').val();
    var systemMessage;
    if(message.charAt(0) == '/'){
        systemMessage = chatApp.processCommand(message)
        if(systemMessage) {
            $('#messages').append(divSystemContentElement(systemMessage));
        }
    }else {
        chatApp.sendMessage($('#room').text(), message);
        $('#messages').append(divEscapedContentElement(message,self));
        $("#messages").scrollTop($('#messages').prop('scrollHeight'))
    }
    $('#send-message').val('')
}
var socket = io.connect()
$(document).ready(function() {
    var chatApp = new Chat(socket);
    socket.on('nameResult', function(result){
        var message;
        if(result.success){
            message = '你现在的名字: ' + result.name +'.'
        }else {
            message = result.message;
        }
        $('#messages').append(divSystemContentElement(message));
    })
    socket.on('joinResult', function(result) {
        $('#room').text(result.room);
        $('#messages').append(divSystemContentElement('欢迎来到 ' + result.room +' 聊天室'));
    })
    socket.on('message', function(message){
        var newElement = $("<div></div>").html('<span>' + message.text + '</span>');
        $('#messages').append(newElement);
    });
    socket.on('rooms', function(rooms) {
        $('#room-list').empty();
        for(var room in rooms){
            room = room.substring(1, room.length);
            if(room != ''){
                $("#room-list").append(divEscapedContentElement(room));
            }
        }
        $('#room-list div').one('click',function() {
            chatApp.processCommand('/join '+ $(this).text());
            $('#send-message').focus();
        })
        $('#creatChatRoom').off('click').on('click',function(event){ // juqery的clcik时间没有刷新页面会重复多次触发，所以先解除事件再棒
            var name = $('#roomName').val();
            chatApp.processCommand('/join '+name)
            $('#send-message').focus()
            $('#roomName').val('')
            event.stopPropagation();            
        })
        $('#changeNameBtn').off('click').on('click',function(event){ // juqery的clcik时间没有刷新页面会重复多次触发，所以先解除事件再棒
            var name = $('#changeName').val();
            chatApp.processCommand('/nick '+name)
            $('#changeName').val('')
            event.stopPropagation();            
        })
    })
    setInterval(function(){
        socket.emit('rooms')
    }, 1000);
    $('#send-form').submit(function() {
        processUserInput(chatApp, socket);
        return false;
    })
    $("#creatChatRoom").mousedown(function(event){
        event.stopPropagation();
    });

})
