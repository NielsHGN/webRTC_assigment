const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const os = require('os');

const PORT = 3000;

// 1. Functie om jouw lokale Wi-Fi IP adres te vinden
function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

const localIp = getLocalIpAddress();

// 2. Vertel de server dat onze HTML bestanden in de map 'public' staan
app.use(express.static('public'));

// 3. Een handig eindpunt zodat de desktop-pagina weet welk IP in de QR-code moet
app.get('/api/config', (req, res) => {
    res.json({ ip: localIp, port: PORT });
});

// 4. Socket.io (Signaling Layer) - Luister of er iemand verbindt
io.on('connection', (socket) => {
    console.log(`[SUCCES] Iemand is verbonden! Socket ID: ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`[INFO] Client is weer weg gegaan: ${socket.id}`);
    });
});

// 5. Start de server
http.listen(PORT, () => {
    console.log('====================================');
    console.log(`🚀 Server draait succesvol!`);
    console.log(`💻 Open op je PC: http://localhost:${PORT}`);
    console.log('====================================');
});