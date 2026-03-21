const $url = document.getElementById('url');
const $introUrl = document.getElementById('intro-url');
const $introQr = document.getElementById('intro-qr');
const $car = document.getElementById('car');
const $scoreDisplay = document.getElementById('score-display');
const $gameOver = document.getElementById('game-over');
const $roadStripe = document.getElementById('road-stripe');
const $track = document.querySelector('.track');
const $effectDisplay = document.getElementById('effect-display');

let socket, peer;

// --- Game State ---
let carX = window.innerWidth / 2;
let targetX = window.innerWidth / 2;
let controllerTargetX = window.innerWidth / 2;
let gameRunning = false;
let score = 0;
let bestScore = parseInt(localStorage.getItem('driftBest') || '0');
let obstacles = [];
let animFrameId;
let lastObstacleTime = 0;
let slipperyUntil = 0;

let gameSpeed = 0; // pixels per frame, gas = hoger, rem = lager
let roadOffset = 0; // voor scrollende wegstreep
let controllerGas = false;
let controllerBrake = false;

const getTrackBounds = () => {
    const trackRect = $track.getBoundingClientRect();
    // Smallere speelruimte binnen de visuele baan voor extra uitdaging
    const lanePadding = 30;
    const minX = trackRect.left + lanePadding;
    const maxX = trackRect.right - lanePadding;
    return { minX, maxX };
};

const getObstacleInterval = () => {
    // Hoe hoger de score, hoe frequenter obstakels spawnen
    return Math.max(260, 1050 - score * 3.2);
};

const getObstacleFallSpeed = () => {
    // Progressieve snelheid: score + huidige rijsnelheid
    return 2.6 + score * 0.03 + gameSpeed * 0.55;
};

const getCarHitbox = () => {
    const style = window.getComputedStyle($car);
    const carWidth = $car.offsetWidth;
    const carHeight = $car.offsetHeight;
    const carBottom = parseFloat(style.bottom) || 50;
    const baseTop = window.innerHeight - carBottom - carHeight;

    const horizontalInset = carWidth * 0.18;
    const topInset = carHeight * 0.10;
    const bottomInset = carHeight * 0.12;

    return {
        left: carX - carWidth / 2 + horizontalInset,
        right: carX + carWidth / 2 - horizontalInset,
        top: baseTop + topInset,
        bottom: baseTop + carHeight - bottomInset
    };
};

const getObstacleHitbox = (obs) => {
    const obstacleWidth = obs.el.offsetWidth;
    const obstacleHeight = obs.el.offsetHeight;
    const isCarObstacle = obs.type === 'rock';
    const horizontalInset = obstacleWidth * (isCarObstacle ? 0.22 : 0.12);
    const verticalInset = obstacleHeight * (isCarObstacle ? 0.22 : 0.14);

    return {
        left: obs.x + horizontalInset,
        right: obs.x + obstacleWidth - horizontalInset,
        top: obs.y + verticalInset,
        bottom: obs.y + obstacleHeight - verticalInset
    };
};

const gameLoop = (timestamp) => {
    if (!gameRunning) return;

    // 1) Gas/rem bepalen basissnelheid
    if (controllerGas) {
        gameSpeed = Math.min(gameSpeed + 0.1, 12);
    } else if (controllerBrake) {
        gameSpeed = Math.max(gameSpeed - 0.12, 0.5);
    } else {
        gameSpeed = Math.max(gameSpeed - 0.05, 0);
    }

    // 2) Scrollende middenstreep voor snelheidssensatie
    roadOffset = (roadOffset + gameSpeed) % 105;
    $roadStripe.style.top = -105 + roadOffset + 'px';

    // 3) Tijdelijk glij-effect na olie: minder grip voor 2s
    const slippery = timestamp < slipperyUntil;
    if (slippery) {
        $effectDisplay.style.display = 'block';
    } else {
        $effectDisplay.style.display = 'none';
    }

    // 4) Netwerk/sensor-input smoothen zodat sturen minder schokkerig voelt
    const inputLerp = slippery ? 0.12 : 0.3;
    targetX += (controllerTargetX - targetX) * inputLerp;
    const slipOffset = slippery ? Math.sin(timestamp / 120) * 1.8 : 0;
    const steeringTargetX = targetX + slipOffset;

    // 5) Vloeiend sturen via lerp (lagere grip bij slip)
    const steerLerp = slippery ? 0.05 : 0.14;
    carX += (steeringTargetX - carX) * steerLerp;

    // 6) Limiteer auto binnen smallere baan
    const { minX, maxX } = getTrackBounds();
    carX = Math.max(minX, Math.min(maxX, carX));
    $car.style.left = carX + 'px';
    const tilt = (steeringTargetX - carX) * 0.25;
    $car.style.transform = `translateX(-50%) rotate(${tilt}deg)`;

    // 7) Meterstand: gas geeft extra punten/snelheid
    const gasBonus = controllerGas ? 0.06 : 0;
    score += 0.025 + gasBonus + gameSpeed * 0.012;
    $scoreDisplay.textContent = Math.floor(score) + 'm';

    // 8) Progressief spawnen
    const obstacleInterval = getObstacleInterval();
    if (timestamp - lastObstacleTime > obstacleInterval) {
        spawnObstacle(minX, maxX);
        if (Math.random() < Math.min(0.55, score / 500)) {
            spawnObstacle(minX, maxX);
        }
        lastObstacleTime = timestamp;
    }

    // 9) Obstakels bewegen + collision checks
    const carHitbox = getCarHitbox();
    const obstacleFall = getObstacleFallSpeed();
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.y += obstacleFall;
        obs.el.style.top = obs.y + 'px';

        const obstacleHitbox = getObstacleHitbox(obs);
        const hit = carHitbox.right > obstacleHitbox.left &&
            carHitbox.left < obstacleHitbox.right &&
            carHitbox.bottom > obstacleHitbox.top &&
            carHitbox.top < obstacleHitbox.bottom;
        if (hit) {
            if (obs.type === 'rock') {
                gameOver();
                return;
            }
            if (obs.type === 'oil-spill') {
                slipperyUntil = timestamp + 2000;
                obs.el.remove();
                obstacles.splice(i, 1);
                continue;
            }
        }

        if (obs.y > window.innerHeight) {
            obs.el.remove();
            obstacles.splice(i, 1);
        }
    }

    animFrameId = requestAnimationFrame(gameLoop);
};

const spawnObstacle = (minX, maxX) => {
    const type = Math.random() < 0.65 ? 'rock' : 'oil-spill';
    const el = document.createElement('div');
    el.className = `obstacle ${type}`;

    const obstacleWidth = type === 'oil-spill' ? 100 : 150;
    const spawnX = minX + Math.random() * Math.max(1, maxX - minX - obstacleWidth);
    el.style.left = spawnX + 'px';
    el.style.top = type === 'oil-spill' ? '-60px' : '-120px';

    document.body.appendChild(el);
    obstacles.push({ el, x: spawnX, y: type === 'oil-spill' ? -60 : -120, type });
};

const startGame = () => {
    score = 0;
    lastObstacleTime = 0;
    gameSpeed = 0;
    roadOffset = 0;
    slipperyUntil = 0;
    $effectDisplay.style.display = 'none';
    obstacles.forEach(o => o.el.remove());
    obstacles = [];
    const { minX, maxX } = getTrackBounds();
    carX = targetX = controllerTargetX = (minX + maxX) / 2;
    $gameOver.style.display = 'none';
    gameRunning = true;
    if (peer && peer.connected) {
        peer.send(JSON.stringify({ type: 'running' }));
    }
    animFrameId = requestAnimationFrame(gameLoop);
};

const gameOver = () => {
    gameRunning = false;
    cancelAnimationFrame(animFrameId);
    const finalScore = Math.floor(score);
    if (finalScore > bestScore) {
        bestScore = finalScore;
        localStorage.setItem('driftBest', bestScore);
    }
    document.getElementById('final-score').textContent = `Afstand: ${finalScore}m`;
    document.getElementById('best-score').textContent = `Personal Best: ${bestScore}m`;
    $gameOver.style.display = 'flex';
    if (peer && peer.connected) {
        peer.send(JSON.stringify({ type: 'gameOver' }));
    }
};

// --- WebRTC Setup ---
const init = () => {
    socket = io.connect('/');
    socket.on('connect', () => {
        const url = `${new URL(`/controller.html?id=${socket.id}`, window.location)}`;
        $url.textContent = url;
        $url.setAttribute('href', url);
        if ($introUrl) {
            $introUrl.textContent = url;
            $introUrl.setAttribute('href', url);
        }
        const qr = qrcode(4, 'L');
        qr.addData(url);
        qr.make();
        document.getElementById('qr').innerHTML = qr.createImgTag(4);
        if ($introQr) {
            $introQr.innerHTML = qr.createImgTag(4);
        }
    });
    socket.on('signal', (myId, signal, peerId) => {
        document.getElementById('menu').style.opacity = '0';
        const introOverlay = document.getElementById('screen-start-overlay');
        if (introOverlay) {
            introOverlay.style.display = 'none';
        }
        if (signal.type === 'offer') answerPeerOffer(myId, signal, peerId);
        if (peer) peer.signal(signal);
    });
};

const answerPeerOffer = (myId, offer, peerId) => {
    peer = new SimplePeer();
    peer.id = peerId;
    peer.on('signal', data => {
        socket.emit('signal', peerId, data);
    });
    peer.on('data', data => {
        const message = JSON.parse(data);

        if (message.type === 'start') {
            startGame();
            return;
        }

        if (message.type === 'restart') {
            startGame();
            return;
        }

        const carState = message;

        // Stuurinput van gsm -> doelpositie in smallere lane
        const { minX, maxX } = getTrackBounds();
        const laneCenter = (minX + maxX) / 2;
        controllerTargetX = laneCenter + carState.steer * 13;
        controllerTargetX = Math.max(minX, Math.min(maxX, controllerTargetX));

        // Gas en rem doorgeven aan game loop
        controllerGas = carState.gas;
        controllerBrake = carState.brake;

        if (carState.gas) $car.classList.add('gas'); else $car.classList.remove('gas');
        if (carState.brake) $car.classList.add('brake'); else $car.classList.remove('brake');
    });
};

init();
