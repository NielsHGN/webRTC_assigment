let socket;
let peer;
let targetSocketId;
let carState = { steer: 0, gas: false, brake: false };
let carSendInterval;
let pendingStart = false;

const setStatus = (text, color = '') => {
    const statusBar = document.querySelector('.status-bar');
    if (!statusBar) return;
    statusBar.innerText = text;
    statusBar.style.color = color;
};

const cleanupPeerConnection = () => {
    if (carSendInterval) {
        clearInterval(carSendInterval);
        carSendInterval = null;
    }

    if (peer) {
        const oldPeer = peer;
        peer = null;
        oldPeer.removeAllListeners();
        if (!oldPeer.destroyed) {
            oldPeer.destroy();
        }
    }

    carState.gas = false;
    carState.brake = false;

    const btnGas = document.querySelector('.btn-gas');
    const btnBrake = document.querySelector('.btn-brake');
    const restartWrap = document.querySelector('.restart-wrap');
    if (btnGas) btnGas.classList.remove('is-pressed');
    if (btnBrake) btnBrake.classList.remove('is-pressed');
    if (restartWrap) restartWrap.style.display = 'none';
};

const handleConnectionLost = () => {
    cleanupPeerConnection();
    setStatus('❌ Verbinding verbroken. Scan QR opnieuw.', '#e74c3c');
};

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
    });
};

const setupControls = () => {
    const btnGas = document.querySelector('.btn-gas');
    const btnBrake = document.querySelector('.btn-brake');
    const btnRestart = document.querySelector('.btn-restart');
    const restartWrap = document.querySelector('.restart-wrap');

    const pressGas = (e) => {
        e.preventDefault();
        carState.gas = true;
        btnGas.classList.add('is-pressed');
    };
    const releaseGas = (e) => {
        e.preventDefault();
        carState.gas = false;
        btnGas.classList.remove('is-pressed');
    };
    const pressBrake = (e) => {
        e.preventDefault();
        carState.brake = true;
        btnBrake.classList.add('is-pressed');
    };
    const releaseBrake = (e) => {
        e.preventDefault();
        carState.brake = false;
        btnBrake.classList.remove('is-pressed');
    };

    btnGas.addEventListener('touchstart', pressGas);
    btnGas.addEventListener('touchend', releaseGas);
    btnGas.addEventListener('touchcancel', releaseGas);
    btnBrake.addEventListener('touchstart', pressBrake);
    btnBrake.addEventListener('touchend', releaseBrake);
    btnBrake.addEventListener('touchcancel', releaseBrake);

    const triggerRestart = (e) => {
        e.preventDefault();
        if (!peer || !peer.connected) return;
        peer.send(JSON.stringify({ type: 'restart' }));
        restartWrap.style.display = 'none';
    };

    btnRestart.addEventListener('touchstart', triggerRestart);
    btnRestart.addEventListener('click', triggerRestart);
};

const callPeer = (peerId) => {
    cleanupPeerConnection();
    setStatus('Koppelen met pc...');

    const restartWrap = document.querySelector('.restart-wrap');
    peer = new SimplePeer({ initiator: true });
    peer.on('signal', data => { socket.emit('signal', peerId, data); });
    peer.on('connect', () => {
        setStatus('✅ WEBRTC VERBONDEN!', '#2ecc71');
        carSendInterval = setInterval(() => { peer.send(JSON.stringify(carState)); }, 1000 / 30);
        if (pendingStart) {
            peer.send(JSON.stringify({ type: 'start' }));
            pendingStart = false;
        }
    });
    peer.on('close', () => {
        handleConnectionLost();
    });
    peer.on('error', () => {
        handleConnectionLost();
    });
    peer.on('data', data => {
        const msg = JSON.parse(data);
        if (msg.type === 'gameOver') {
            restartWrap.style.display = 'flex';
            if ('vibrate' in navigator) {
                navigator.vibrate([180, 90, 220]);
            }
        } else if (msg.type === 'running') {
            restartWrap.style.display = 'none';
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
    socket.on('connect', () => {
        setStatus('Koppelen met pc...');
        callPeer(targetSocketId);
    });
    socket.on('disconnect', () => {
        handleConnectionLost();
    });
    socket.on('peer-disconnected', () => {
        handleConnectionLost();
    });
    socket.on('signal', (_myId, signal, _peerId) => {
        if (!peer) return;
        peer.signal(signal);
    });
    setupControls();
    setupOrientation();
};

// iOS 13+ vereist expliciete toestemming voor de gyroscoop
window.addEventListener('load', () => {
    const startOverlay = document.querySelector('.controller-start-overlay');
    const startBtn = document.querySelector('.btn-start-controller');
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
        document.querySelector('.sensor-overlay').style.display = 'flex';
        document.querySelector('.sensor-btn').addEventListener('click', async () => {
            const perm = await DeviceOrientationEvent.requestPermission();
            if (perm === 'granted') {
                document.querySelector('.sensor-overlay').style.display = 'none';
                init();
            } else {
                alert('Gyroscoop toegang geweigerd. Herlaad de pagina en probeer opnieuw.');
            }
        });
    } else {
        init(); // Android of oudere iOS: direct starten
    }
});
