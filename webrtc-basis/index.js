const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const os = require('os');
const io = new Server(server);

const port = process.env.PORT || 3000;

app.use(express.static('public'));

const clients = {};

io.on('connection', socket => {
    clients[socket.id] = { id: socket.id };
    console.log('Socket connected', socket.id);

    socket.on('disconnect', () => {
        console.log('Socket disconnected', socket.id);
        delete clients[socket.id];
    });

    // DIT IS DE EXACTE CODE VAN JE DOCENT
    socket.on('signal', (peerId, signal) => {
        console.log(`Received signal from ${socket.id} to ${peerId}`);
        io.to(peerId).emit('signal', peerId, signal, socket.id);
    });
});

server.listen(port, () => {
    console.log('=================================');
    const networkInterfaces = os.networkInterfaces();
    for (const interfaceName in networkInterfaces) {
        for (const iface of networkInterfaces[interfaceName]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                console.log(`Open op je gsm (of scan QR): http://${iface.address}:${port}`);
            }
        }
    }
    console.log(`Open op je PC: http://localhost:${port}`);
    console.log('=================================');
});