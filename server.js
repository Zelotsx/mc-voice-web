const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static('public'));

let players = {}; 

io.on('connection', (socket) => {
    socket.on('join-voice', (data) => {
        players[socket.id] = { name: data.name, x: 0, y: 0, z: 0 };
        io.emit('update-list', Object.values(players));
    });

    // รับพิกัดจาก Bridge แล้วส่งกระจายให้ทุกคนในเว็บ
    socket.on('bridge-pos-update', (data) => {
        for (let id in players) {
            if (players[id].name === data.name) {
                players[id].x = data.x;
                players[id].y = data.y;
                players[id].z = data.z;
            }
        }
        io.emit('spatial-update', players);
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('update-list', Object.values(players));
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log('Sybtown Server Online!'));
