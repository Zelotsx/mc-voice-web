const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static('public'));

io.on('connection', (socket) => {
    socket.on('join', (name) => {
        socket.broadcast.emit('user-connected', name);
    });
});

http.listen(process.env.PORT || 3000, () => {
    console.log('Server is running...');
});
