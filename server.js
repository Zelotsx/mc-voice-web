// ... (ส่วน import เหมือนเดิม)

io.on('connection', (socket) => {
    // ตอนคนเล่นเข้าห้อง
    socket.on('join-voice', (data) => {
        const { name, peerId, roomKey } = data; // รับ Room Key มาด้วย
        
        socket.join(roomKey); // จับ user ยัดเข้าห้องตามคีย์ที่ใส่มา
        
        // บันทึกข้อมูล (ต้องเก็บ roomKey ไว้ด้วย)
        socket.userData = { name, peerId, roomKey, x:0, y:0, z:0 };
        
        // แจ้งเตือน "เฉพาะคนในห้องนั้น" ให้รู้ว่ามีคนมาใหม่
        const roomPlayers = getPlayersInRoom(roomKey);
        io.to(roomKey).emit('update-list', roomPlayers);
    });

    // ตอน Bridge ส่งพิกัดมา (Bridge ต้องส่ง Key มาด้วยนะ)
    socket.on('bridge-pos-update', (data) => {
        const { name, x, y, z, roomKey } = data;
        
        // ส่งข้อมูลพิกัดไปหา "เฉพาะคนในห้อง roomKey"
        io.to(roomKey).emit('spatial-update', { name, x, y, z });
    });

    socket.on('disconnect', () => {
        if(socket.userData) {
            const { roomKey } = socket.userData;
            // แจ้งคนในห้องเดิมว่ามีคนออก
            const roomPlayers = getPlayersInRoom(roomKey).filter(p => p.peerId !== socket.userData.peerId);
            io.to(roomKey).emit('update-list', roomPlayers);
        }
    });
});

// ฟังก์ชันดึงรายชื่อคนในห้อง
function getPlayersInRoom(roomKey) {
    const players = [];
    const sockets = io.sockets.adapter.rooms.get(roomKey);
    if(sockets) {
        for(const id of sockets) {
            const s = io.sockets.sockets.get(id);
            if(s && s.userData) players.push(s.userData);
        }
    }
    return players;
}
