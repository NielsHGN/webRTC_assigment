WebRTC Rally Game: Smartphone Controller
Concept
Ik ga een rally spelletje maken waarbij je met een auto over een baan rijdt en obstakels moet ontwijken. De besturing gebeurt volledig via de smartphone via een WebRTC verbinding:

Sturen: Door de gsm naar links en rechts te kantelen (gyroscoop).

Snelheid: Een 'GAS' knop op het gsm-scherm.

Driften: Een 'REM' knop op het gsm-scherm. Als je deze induwt, begint de auto te glijden.

Doel: Een meterteller houdt de afstand bij, met een 'personal best' principe om te zien hoe ver je kan geraken.

Ik wil het project qua code behapbaar houden omdat mijn programmeerskills nog in ontwikkeling zijn. Mijn focus ligt op een werkende en stabiele WebRTC connectie in plaats van een te complexe game.

Development Diary (Week 1)
Doel: De basisinfrastructuur opzetten zonder me direct in de game-logica te verliezen.

Uitgevoerd: Node.js server opgezet met Express en Socket.io. Een script geschreven dat mijn lokale IP-adres ophaalt, zodat de desktop een correcte QR-code kan genereren.

Resultaat (MVP): De pc toont een QR-code. Als ik deze met mijn smartphone scan, maken ze succesvol verbinding via websockets (signaling) en wordt het gsm-scherm groen ("VERBONDEN").

Problemen & Oplossingen: Ik had in het begin problemen met het pad van mijn bestanden (Cannot GET / en MODULE_NOT_FOUND). Door mijn mappenstructuur te corrigeren en een public map aan te maken waar mijn html in zit, is dit opgelost.

AI Reflection 🟢
Omdat ik niet de allerbeste ben in coderen, heb ik AI (Gemini) gebruikt om me te helpen bij de opstart. In deze file (en mijn commits) ga je waarschijnlijk veel invloed van AI prompts terugzien.

Hoe ik AI gebruik: Ik gebruik AI vooral als hulpmiddel om foutmeldingen in mijn terminal op te lossen en om de ingewikkelde eerste server-setup (met lokaal IP en QR codes) op te zetten.

Mijn eigen inbreng: Om te zorgen dat ik niet blindelings code kopieer, combineer ik de AI-hulp met het herbekijken van de lesvideo's uit de klas. Zo probeer ik zoveel mogelijk zelf te doen en te snappen wat elke lijn code doet. We hebben samen de scope van het spel bepaald zodat het realistisch blijft.

# Planning (Week 2)
- De WebRTC RTCPeerConnection logica toevoegen via de bestaande websocket.

- Een WebRTC Data Channel openen tussen gsm en pc.

- Een simpele testwaarde (bijv. de kanteling van de gsm) succesvol doorsturen naar de pc via dit Data Channel en loggen in de console.
