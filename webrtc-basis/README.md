# WebRTC Rally Game: Smartphone Controller

## Concept
Ik ga een rally spelletje maken waarbij je met een auto over een baan rijdt en obstakels moet ontwijken. De besturing gebeurt volledig via de smartphone via een WebRTC verbinding:

* **Sturen:** Door de gsm naar links en rechts te kantelen (gyroscoop).
* **Snelheid:** Een 'GAS' knop op het gsm-scherm.
* **Driften:** Een 'REM' knop op het gsm-scherm. Als je deze induwt, begint de auto te glijden.
* **Doel:** Een meterteller houdt de afstand bij, met een 'personal best' principe om te zien hoe ver je kan geraken.

Ik wil het project qua code behapbaar houden omdat mijn programmeerskills nog in ontwikkeling zijn. Mijn focus ligt op een werkende en stabiele WebRTC connectie in plaats van een te complexe game.

---

## Development Diary (Week 1)
* **Doel:** De basisinfrastructuur opzetten zonder me direct in de game-logica te verliezen.
* **Uitgevoerd:** Node.js server opgezet met Express en Socket.io. Een script geschreven dat mijn lokale IP-adres ophaalt, zodat de desktop een correcte QR-code kan genereren.
* **Resultaat (MVP):** De pc toont een QR-code. Als ik deze met mijn smartphone scan, maken ze succesvol verbinding via websockets (signaling) en wordt het gsm-scherm groen ("VERBONDEN").
* **Problemen & Oplossingen:** Ik had in het begin problemen met het pad van mijn bestanden (`Cannot GET /` en `MODULE_NOT_FOUND`). Door mijn mappenstructuur te corrigeren en een `public` map aan te maken waar mijn html in zit, is dit opgelost.

---

## AI Reflection 🟢
Omdat ik niet de allerbeste ben in coderen, heb ik AI (Gemini) gebruikt om me te helpen bij de opstart. In deze file (en mijn commits) ga je waarschijnlijk veel invloed van AI prompts terugzien.

* **Hoe ik AI gebruik:** Ik gebruik AI vooral als hulpmiddel om foutmeldingen in mijn terminal op te lossen en om de ingewikkelde eerste server-setup (met lokaal IP en QR codes) op te zetten.
* **Mijn eigen inbreng:** Om te zorgen dat ik niet blindelings code kopieer, combineer ik de AI-hulp met het herbekijken van de lesvideo's uit de klas. Zo probeer ik zoveel mogelijk zelf te doen en te snappen wat elke lijn code doet. We hebben samen de scope van het spel bepaald zodat het realistisch blijft.

---

## Planning (Week 2)
1. De WebRTC `RTCPeerConnection` logica toevoegen via de bestaande websocket.
2. Een WebRTC Data Channel openen tussen gsm en pc.
3. Een simpele testwaarde (bijv. de kanteling van de gsm) succesvol doorsturen naar de pc via dit Data Channel en loggen in de console.


## Development Diary (Week 2) - WebRTC Data Channels

**Doel van deze week:** De besturing (gas, rem, sturen) die eerst via Socket.io liep, omzetten naar een rechtstreekse WebRTC Data Channel verbinding (Peer-to-Peer).

**Stap-voor-stap evolutie van de code:**
1. **Van Websockets naar Signaling:** Ik ben begonnen met mijn MVP uit week 1. Om aan de rubric te voldoen, heb ik de server (`index.js`) zo aangepast dat deze niet meer de X/Y coördinaten doorstuurt, maar enkel nog dient als 'telefoonboek'. De server luistert nu naar een `signal` event en stuurt dit door naar de andere client om de WebRTC handshake mogelijk te maken.
2. **Implementatie van `simple-peer`:** In de les hebben we gewerkt met de `simple-peer` library (les 12-14). Ik heb besloten deze code als fundament te gebruiken omdat dit de complexe WebRTC logica (Offers, Answers, ICE candidates) veiliger afhandelt.
3. **De Smartphone (Sender / Initiator):** Mijn `controller.html` is nu de initiator (`new SimplePeer({ initiator: true })`). In plaats van een videostream (zoals in de les), leest het script de gyroscoop (`deviceorientation`) en de knoppen uit. Zodra de connectie open is, stuurt hij deze data 30 keer per seconde via `peer.send()`.
4. **De Desktop (Receiver):** Mijn `index.html` (de game) wacht op het signaal van de gsm. Zodra verbonden, luistert hij via `peer.on('data')` naar de binnenkomende JSON-data van de gsm en updatet hij de positie en CSS-classes (gas/rem effecten) van de auto.

**Huidige status (Consult):** De code voor de WebRTC verbinding via `simple-peer` is geïmplementeerd en gecommit naar main. Ik loop momenteel nog wel vast op een lokaal netwerk/IP-probleem (waarschijnlijk de 'localhost' routing of Client Isolation op het netwerk) waardoor de apparaten elkaar niet kunnen vinden. Dit ga ik tijdens het consult bespreken.

---

## AI Reflection (Week 2) 🟢

Ik heb AI (Gemini) opnieuw gebruikt als mentor om de brug te slaan tussen mijn concept en de theorie uit de lessen. 

**Hoe ik AI stuurde:**
Ik wilde voorkomen dat de AI willekeurige code op het internet ging zoeken die de docent niet zou herkennen. Daarom heb ik expliciet de bestandsnamen en theorie uit de lessenreeks aan de AI gevoed. 

**Mijn exacte prompts waren onder andere:**
> *"ik heb ook nog code van in mijn cursus da je misschien kan gebruiken en die code beter inplementeert dan je eigen code ik zal zeggen van wat we oefeningen hebben over gemaakt: [Lijst met webrtc_01 t/m webrtc_14]. dit zijn alle onderwerpen welke van deze zou je nu op dit moment kunnen gebruiken?"*

> *"dit is de receiver.html [code...], dit is de sender.html [code...], en dit is de index.js [code...]"*

> *"De WebRTC RTCPeerConnection logica toevoegen via de bestaande websocket. Een WebRTC Data Channel openen tussen gsm en pc. Een simpele testwaarde (bijv. de kanteling van de gsm) succesvol doorsturen naar de pc via dit Data Channel en loggen in de console. dit is het volgende dat ik ga doen voor mijn creative code kan je mij helpen hoe ik dit stap voor stap het best doe?"*

**Resultaat:** De AI hielp me om de video-stream code van de les (`simple-peer`) om te bouwen naar een Data Channel voor mijn gyroscoop. Ook was de AI een grote hulp bij het troubleshooten van terminal-fouten (zoals `MODULE_NOT_FOUND` en netwerk/hotspot theorie).


## Planning (Volgende week)
1. **Netwerk & WebRTC fixen:** De connectieproblemen (localhost / IP-adres conflicten) definitief oplossen, zodat de `simple-peer` WebRTC verbinding altijd betrouwbaar werkt, zowel thuis als via een hotspot.
2. **Vlotte besturing:** Zorgen dat de doorgestuurde gyroscoop-data de auto soepel en zonder haperingen over het desktop-scherm laat sturen.
3. **Obstakels & Game Loop:** Een simpele game-loop programmeren waarbij er obstakels van boven naar beneden over het scherm komen die je moet ontwijken.
4. **Score & Botsingen:** Een 'Collision Detection' (botsing) toevoegen waardoor je af bent als je een obstakel raakt. Daarnaast de meterteller inbouwen die bijhoudt hoe ver je bent geraakt (Personal Best).

---

## Development Diary (Week 3) - Game Loop, Obstakels & Besturing

**Doel van deze week:** De game volledig playable maken: vlotte gyroscoop-besturing, een werkende game loop met obstakels, collision detection, score en personal best.

**Stap-voor-stap evolutie van de code:**

### 1. Game Loop met `requestAnimationFrame` (index.html)

De auto bewoog vroeger schokkerig omdat de positie direct werd overschreven bij elk binnenkomend WebRTC pakket (30x/sec). De oplossing was om de game op te splitsen in twee delen:
- `peer.on('data')` slaat alleen de **doelpositie** (`targetX`) op.
- Een aparte `requestAnimationFrame` loop (60fps) beweegt de auto **vloeiend** naar die doelpositie via een **lerp** (linear interpolation).

```js
// Elke frame legt de auto 12% van de resterende afstand af -> zachte beweging
carX += (targetX - carX) * 0.12;
$car.style.left = carX + 'px';
```

### 2. Obstakels spawnen en bewegen (index.html)

Obstakels worden als `<div>` elementen aangemaakt bovenaan het scherm op een willekeurige X-positie. Elke frame zakken ze naar beneden met `gameSpeed` pixels. De tussentijd tussen obstacles start op 2000ms en krimpt elke spawn met 15ms zodat het spel progressief moeilijker wordt.

```js
function spawnObstacle() {
    const el = document.createElement('div');
    el.className = 'obstacle';
    el.style.left = (Math.random() * (window.innerWidth - 70)) + 'px';
    el.style.top = '-85px';
    document.body.appendChild(el);
    obstacles.push({ el, y: -85 });
}
```

### 3. Collision Detection (index.html)

Botsingen worden gedetecteerd met `getBoundingClientRect()` op de auto en elk obstakel. Er is een inset van 8px voor een vergevingsgezinde hitbox.

```js
const carRect = $car.getBoundingClientRect();
const r = obs.el.getBoundingClientRect();
const hit = carRect.right  - 8 > r.left  &&
            carRect.left   + 8 < r.right &&
            carRect.bottom - 8 > r.top   &&
            carRect.top    + 8 < r.bottom;
if (hit) { gameOver(); return; }
```

### 4. Gas en Rem als echte rijphysica (index.html)

`gameSpeed` bepaalt hoe snel obstakels naar beneden komen (= hoe snel de auto "rijdt"). De auto start stilstaand. Gas verhoogt de snelheid, remmen verlaagt ze, en zonder input remt de auto geleidelijk af tot stilstand.

```js
if (controllerGas) {
    gameSpeed = Math.min(gameSpeed + 0.08, 9);   // versnellen tot max 9
} else if (controllerBrake) {
    gameSpeed = Math.max(gameSpeed - 0.12, 0);   // afremmen tot stilstand
} else {
    gameSpeed = Math.max(gameSpeed - 0.05, 0);   // geleidelijk stoppen
}
```

### 5. iOS Gyroscoop permissie + horizontaal sturen (controller.html)

**Probleem 1:** Op iPhone vereist Safari sinds iOS 13 een expliciete klik van de gebruiker vóór `DeviceOrientationEvent` data stuurt. Zonder dit krijg je alleen `null` waarden.

```js
window.addEventListener('load', () => {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        document.getElementById('sensor-overlay').style.display = 'flex';
        document.getElementById('sensor-btn').addEventListener('click', async () => {
            const perm = await DeviceOrientationEvent.requestPermission();
            if (perm === 'granted') {
                document.getElementById('sensor-overlay').style.display = 'none';
                init();
            }
        });
    } else {
        init(); // Android: direct starten
    }
});
```

**Probleem 2:** Bij horizontaal gebruik van de telefoon is de verkeerde gyroscoop-as actief. `gamma` = links/rechts bij staand gebruik, maar liggend moet je `beta` gebruiken. De `getSteer()` functie detecteert de schermhoek automatisch.

```js
function getSteer(e) {
    const angle = (screen.orientation && screen.orientation.angle !== undefined)
        ? screen.orientation.angle
        : (typeof window.orientation !== 'undefined' ? Number(window.orientation) : 0);

    if (angle === 90)  return -(e.beta || 0);  // landscape links
    if (angle === 270 || angle === -90) return (e.beta || 0); // landscape rechts
    return (e.gamma || 0); // staand
}
```

---

## AI Reflection (Week 3) 🟢

Ik heb GitHub Copilot gebruikt als AI-assistent voor week 3.

**Mijn exacte prompts waren:**

> *"het werkt maar mij sturen werkt niet ik wil mijn gsm zo horizontaal gebruiken dus als ik mijn gsm naar links kantel ga ik naar links en als ik mijn gsm horizontaal naar rechts kantel dat ik naar recht ga. ik wil ook ni dat de objecten naar het autotje toe komt maar dat de auto zo naar de objecten rijdt en jij moet ze dan ontwijken door bv te sturen of te remmen want deze werken niet."*

> *"waar staat in mijn code voor gas en remmen want ik wil stilstaant beginnen da ik zelf gas moet geven en remmen"*

> *"pas nu mijn readme aan met welke prompts ik gebruikt heb en ook de code erbij zetten"*

**Wat de AI uitlegde en waarom:**
- De AI legde uit waarom de gyroscoop op iPhone niet werkte (iOS 13 permissievereiste) en waarom de verkeerde sensor-as gebruikt werd bij liggend gebruik (`gamma` vs `beta`).
- Voor de game loop legde de AI het concept van **lerp** uit: in plaats van de positie direct te overschrijven, beweeg je elke frame een percentage van de resterende afstand. Dit geeft een verende, soepele beweging.
- Voor gas/rem legde de AI uit dat `gameSpeed = 0` bij start en de snelheid als variabele werkt die gas ophoogt en remmen/loslaten verlaagt — exact zoals een echte auto.

**Mijn eigen inbreng:**
Ik heb de AI gestuurd door exact te beschrijven wat ik voelde dat niet werkte (schokkerige besturing, obstakels die de verkeerde kant op gingen, iOS die niets deed). De AI gaf uitleg bij elke aanpassing zodat ik begreep waarom `requestAnimationFrame` beter is dan direct uit `peer.on('data')` sturen, en waarom `getBoundingClientRect()` de juiste tool is voor collision detection.



---

## Development Diary (Week 4) - HTTPS, Landscape Sturen & Meer Obstakels

### 1. HTTPS server voor gyroscoop op telefoon (index.js)

**Probleem:** De DeviceOrientation API (gyroscoop) werkt op mobiele browsers **alleen via HTTPS**. Over gewoon HTTP geeft de telefoon geen sensordata door (`null` waarden).

**Prompt:**
> *"het sturen werkt nogsteeds niet als ik mijn gsm kantel en ik heb het gevoel dat dit komt omdat ik niet in https werk maar in http. hoe kan ik dit oplossen"*

**Oplossing:** Een self-signed SSL certificaat gegenereerd via de terminal en de server omgezet van HTTP naar HTTPS.

```bash
openssl req -x509 -out localhost.crt -keyout localhost.key \
  -newkey rsa:2048 -nodes -sha256 \
  -subj '/CN=localhost' -extensions EXT -config <( \
   printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")
```

```js
const fs = require('fs');
const options = {
    key: fs.readFileSync('./localhost.key'),
    cert: fs.readFileSync('./localhost.crt')
};
const server = require('https').createServer(options, app);
```

---

### 2. Landscape sturen met kalibratie (controller.html)

**Probleem:** In landscape mode geeft `beta` een basiswaarde van ~90° in plaats van 0°, waardoor de auto direct naar de rand werd geduwd. De verkeerde gyroscoop-as werd gebruikt.

**Prompts:**
> *"de gyro werkt nu op de verticale as van men gsm maar ik wil het laten werken dat ik mijn gsm in landscape mode wil zetten"*

> *"het werkt maar ik wil graag dat je de gsm moet tillen als je hem in landscape mode vast hebt, nu moet ik hem tilten langs de verticale as"*

> *"nee niet zo, stel je voor je houdt de telefoon vast in landscape mode en je wilt dat je kan tilten naar links en rechts"*

**Oplossing:** De `getSteer()` functie gebruikt nu `beta` in landscape mode met **kalibratie**: de eerste sensorwaarde wordt opgeslagen als nulpunt, zodat de rustpositie altijd steer = 0 oplevert, ongeacht de hoek waaronder je de telefoon vasthoudt.

```js
let calibrated = false;
let betaOffset = 0;

function getSteer(e) {
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
}
```

---

### 3. Meer obstakels (index.html)

**Prompt:**
> *"add way more obstacles"*

**Oplossing:** Start interval verlaagd van 2000ms naar 800ms, minimum interval van 800ms naar 350ms, en 50% kans op een dubbel obstakel per spawn voor progressief hogere moeilijkheidsgraad.

```js
let obstacleInterval = 800;

// In de game loop:
if (timestamp - lastObstacleTime > obstacleInterval) {
    spawnObstacle();
    if (Math.random() < 0.5) spawnObstacle(); // kans op dubbel obstakel
    lastObstacleTime = timestamp;
    if (obstacleInterval > 350) obstacleInterval -= 10;
}
```

---

## AI Reflection (Week 4) 🟢

Ik heb GitHub Copilot (Claude Sonnet) gebruikt als AI-assistent voor week 4.

**Wat de AI uitlegde en waarom:**
- De AI legde uit dat `DeviceOrientationEvent` een **Secure Context** (HTTPS) vereist — `http://192.168.x.x` voldoet daar niet aan, waardoor `e.gamma` en `e.beta` altijd `null` zijn.
- Voor het sturen legde de AI uit dat `beta` in landscape een rustwaarde van ~90° heeft (niet 0°), en dat je moet **kalibreren** door de eerste meting als nulpunt op te slaan.
- `window.matchMedia('(orientation: landscape)')` wordt gebruikt als extra fallback voor browsers die `screen.orientation.angle` verkeerd rapporteren.

**Mijn eigen inbreng:**
Ik heb de AI meerdere keren bijgestuurd door exact te beschrijven hoe ik mijn telefoon vasthoud en welke beweging ik verwachtte. De AI probeerde eerst `gamma`, dan `-beta`, maar door mijn feedback kwamen we uit op de correcte oplossing met kalibratie. Ik begreep door de uitleg van de AI het verschil tussen de drie gyroscoop-assen (`alpha`, `beta`, `gamma`) en wanneer welke van toepassing is.

---

## Mijn doelen voor volgende week
- De styling beter maken en een betere user interface
- Moeilijkheidsgraad variëren — Verschillende soorten obstakels (breed/smal), of een snelheidsboost power-up.
- Visuele feedback op de controller — De telefoon laten trillen bij een botsing (`navigator.vibrate()`), of het scherm rood laten flashen.


