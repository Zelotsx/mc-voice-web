const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static('public'));

let rooms = {}; // เก็บข้อมูลผู้เล่นแยกตามห้อง { roomKey: { socketId: { name, peerId, x, y, z } } }

io.on('connection', (socket) => {
    socket.on('join-room', (data) => {
        const { name, peerId, roomKey } = data;
        socket.join(roomKey);
        
        if (!rooms[roomKey]) rooms[roomKey] = {};
        rooms[roomKey][socket.id] = { name, peerId, x: 0, y: 0, z: 0 };

        // ส่งรายชื่อคนในห้องนั้นให้ทุกคนในห้องรู้
        io.to(roomKey).emit('update-list', Object.values(rooms[roomKey]));
        console.log(`[${roomKey}] ${name} joined`);
    });

    // รับพิกัดจาก Bridge (ต้องระบุ roomKey มาด้วย)
    socket.on('bridge-pos-update', (data) => {
        const { roomKey, name, x, y, z } = data;
        if (rooms[roomKey]) {
            for (let id in rooms[roomKey]) {
                if (rooms[roomKey][id].name === name) {
                    rooms[roomKey][id].x = x;
                    rooms[roomKey][id].y = y;
                    rooms[roomKey][id].z = z;
                }
            }
            // ส่งพิกัดให้คนในห้องนั้นไปคำนวณเสียง
            io.to(roomKey).emit('spatial-update', rooms[roomKey]);
        }
    });

    socket.on('disconnect', () => {
        for (let key in rooms) {
            if (rooms[key][socket.id]) {
                const name = rooms[key][socket.id].name;
                delete rooms[key][socket.id];
                io.to(key).emit('update-list', Object.values(rooms[key]));
                console.log(`[${key}] ${name} left`);
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log('Sybtown Voice Server Online!'));
