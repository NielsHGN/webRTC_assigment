let socket;
let peer;
let targetSocketId;
let carState = { steer: 0, gas: false, brake: false };
let carSendInterval;
let pendingStart = false;

// Kalibratie: sla het nulpunt op zodat de rustpositie = steer 0
let calibrated = false;
let betaOffset = 0;

const getSteer = (e) => {
    const beta = e.beta || 0;
    const gamma = e.gamma || 0;

    let angle = 0;
    if (screen.orientation && screen.orientation.angle !== undefined) {
        angle = screen.orientation.angle;
    } else if (typeof window.orientation !== 'undefined') {
        angle = Number(window.orientation);
    }
    const isLandscape = window.matchMedia('(orientation: landscape)').matches;

    if (isLandscape || angle === 90 || angle === 270 || angle === -90) {
        // Kalibreer bij eerste meting: huidige beta = nulpunt
        if (!calibrated) {
            betaOffset = beta;
            calibrated = true;
        }
        const steer = beta - betaOffset;
        return (angle === 270 || angle === -90) ? -steer : steer;
    }
    return gamma; // portrait
};

const setupOrientation = () => {
    window.addEventListener('deviceorientation', (e) => {
        const steer = getSteer(e);
        carState.steer = Math.round(steer);
        // Update tilt indicator: 50% = midden
        const pct = 50 + (steer / 70) * 50;
        document.getElementById('tilt-bar').style.left =
            Math.min(Math.max(pct, 2), 98) + '%';
    });
};

const setupControls = () => {
    const btnGas = document.getElementById('btn-gas');
    const btnBrake = document.getElementById('btn-brake');
    const btnRestart = document.getElementById('btn-restart');
    btnGas.addEventListener('touchstart', (e) => { e.preventDefault(); carState.gas = true; });
    btnGas.addEventListener('touchend', (e) => { e.preventDefault(); carState.gas = false; });
    btnBrake.addEventListener('touchstart', (e) => { e.preventDefault(); carState.brake = true; });
    btnBrake.addEventListener('touchend', (e) => { e.preventDefault(); carState.brake = false; });

    const triggerRestart = (e) => {
        e.preventDefault();
        if (!peer || !peer.connected) return;
        peer.send(JSON.stringify({ type: 'restart' }));
        document.getElementById('restart-wrap').style.display = 'none';
    };

    btnRestart.addEventListener('touchstart', triggerRestart);
    btnRestart.addEventListener('click', triggerRestart);
};

const callPeer = (peerId) => {
    peer = new SimplePeer({ initiator: true });
    peer.on('signal', data => { socket.emit('signal', peerId, data); });
    peer.on('connect', () => {
        document.getElementById('status-bar').innerText = "✅ WEBRTC VERBONDEN!";
        document.getElementById('status-bar').style.color = "#2ecc71";
        carSendInterval = setInterval(() => { peer.send(JSON.stringify(carState)); }, 1000 / 30);
        if (pendingStart) {
            peer.send(JSON.stringify({ type: 'start' }));
            pendingStart = false;
        }
    });
    peer.on('data', data => {
        const msg = JSON.parse(data);
        if (msg.type === 'gameOver') {
            document.getElementById('restart-wrap').style.display = 'flex';
        }
        if (msg.type === 'running') {
            document.getElementById('restart-wrap').style.display = 'none';
        }
    });
};

const getUrlParameter = name => {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? false : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

const init = () => {
    targetSocketId = getUrlParameter('id');
    if (!targetSocketId) { alert('Missing target ID'); return; }
    socket = io.connect('/');
    socket.on('connect', () => { callPeer(targetSocketId); });
    socket.on('signal', (myId, signal, peerId) => { peer.signal(signal); });
    setupControls();
    setupOrientation();
};

// iOS 13+ vereist expliciete toestemming voor de gyroscoop
window.addEventListener('load', () => {
    const startOverlay = document.getElementById('controller-start-overlay');
    const startBtn = document.getElementById('btn-start-controller');
    if (startOverlay && startBtn) {
        startBtn.addEventListener('click', () => {
            startOverlay.style.display = 'none';
            if (peer && peer.connected) {
                peer.send(JSON.stringify({ type: 'start' }));
            } else {
                pendingStart = true;
            }
        });
    }

    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
        // Safari op iPhone: toon permissie knop
        document.getElementById('sensor-overlay').style.display = 'flex';
        document.getElementById('sensor-btn').addEventListener('click', async () => {
            const perm = await DeviceOrientationEvent.requestPermission();
            if (perm === 'granted') {
                document.getElementById('sensor-overlay').style.display = 'none';
                init();
            } else {
                alert('Gyroscoop toegang geweigerd. Herlaad de pagina en probeer opnieuw.');
            }
        });
    } else {
        init(); // Android of oudere iOS: direct starten
    }
});
