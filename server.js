const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

let players = {}; // เก็บข้อมูล { socketId: { name, x, y, z, peerId } }

io.on('connection', (socket) => {
    socket.on('join-voice', (data) => {
        players[socket.id] = { name: data.name, peerId: data.peerId, x: 0, y: 0, z: 0 };
        io.emit('update-player-list', Object.values(players));
    });

    // รับพิกัดจาก Bridge และส่งต่อไปยังทุกคน
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
        io.emit('update-player-list', Object.values(players));
    });
});

http.listen(process.env.PORT || 3000, () => console.log('Server running...'));
