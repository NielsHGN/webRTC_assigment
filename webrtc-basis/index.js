// Express server setup met Socket.io
const express = require('express');
const app = express();
const fs = require('fs');
const options = {
    key: fs.readFileSync('./localhost.key'),
    cert: fs.readFileSync('./localhost.crt')
};
const server = require('https').createServer(options, app);
const { Server } = require("socket.io");
const os = require('os');
const io = new Server(server);

const port = process.env.PORT || 3000;

const publicPath = `${__dirname}/public`;

app.get(['/', '/index.html'], (req, res) => {
    res.sendFile(`${publicPath}/screen.html`);
});

// Serve static files (HTML, CSS, JS)
app.use(express.static('public'));

const clients = {}; // Hou track van verbonden clients
const pairedSockets = new Map();

const pairSockets = (a, b) => {
    if (!a || !b || a === b) return;

    const oldA = pairedSockets.get(a);
    if (oldA && oldA !== b) {
        pairedSockets.delete(oldA);
    }

    const oldB = pairedSockets.get(b);
    if (oldB && oldB !== a) {
        pairedSockets.delete(oldB);
    }

    pairedSockets.set(a, b);
    pairedSockets.set(b, a);
};

const unpairSocket = (id) => {
    const peerId = pairedSockets.get(id);
    pairedSockets.delete(id);
    if (peerId) {
        pairedSockets.delete(peerId);
    }
    return peerId;
};

// Socket.io verbinding handler
io.on('connection', socket => {
    clients[socket.id] = { id: socket.id };
    console.log('Socket connected', socket.id);

    // Wanneer client verbreekt
    socket.on('disconnect', () => {
        console.log('Socket disconnected', socket.id);
        const peerId = unpairSocket(socket.id);
        if (peerId) {
            io.to(peerId).emit('peer-disconnected', socket.id);
        }
        delete clients[socket.id];
    });

    // Relay WebRTC signalen tussen peers (smartphone en desktop)
    socket.on('signal', (peerId, signal) => {
        pairSockets(socket.id, peerId);
        console.log(`Received signal from ${socket.id} to ${peerId}`);
        io.to(peerId).emit('signal', peerId, signal, socket.id);
    });
});

// Start server en toon toegangs URLs
server.listen(port, () => {
    console.log('=================================');
    const networkInterfaces = os.networkInterfaces();
    for (const interfaceName in networkInterfaces) {
        for (const iface of networkInterfaces[interfaceName]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                console.log(`Open op je gsm (of scan QR): https://${iface.address}:${port}`);
            }
        }
    }
    console.log(`Open op je PC: https://localhost:${port}`);
    console.log('=================================');
});