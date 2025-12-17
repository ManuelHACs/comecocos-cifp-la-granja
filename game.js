// Wait for DOM to be fully loaded
window.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded');

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const levelElement = document.getElementById('level');
    const restartBtn = document.getElementById('restartBtn');
    const startScreen = document.getElementById('startScreen');
    const startBtn = document.getElementById('startBtn');

    // Sound Manager using Web Audio API
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const sounds = {
        eat: () => {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200, audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(400, audioCtx.currentTime + 0.1);

            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

            osc.start();
            osc.stop(audioCtx.currentTime + 0.1);
        },
        eatPower: () => {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 0.2);

            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

            osc.start();
            osc.stop(audioCtx.currentTime + 0.2);
        },
        eatGhost: () => {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.type = 'square';
            osc.frequency.setValueAtTime(800, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);

            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
        },
        gameOver: () => {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(400, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 1);

            gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1);

            osc.start();
            osc.stop(audioCtx.currentTime + 1);
        },
        start: () => {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.type = 'square';
            osc.frequency.setValueAtTime(200, audioCtx.currentTime);
            osc.frequency.setValueAtTime(300, audioCtx.currentTime + 0.2);
            osc.frequency.setValueAtTime(400, audioCtx.currentTime + 0.4);

            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime + 0.4);
            gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.6);

            osc.start();
            osc.stop(audioCtx.currentTime + 0.6);
        }
    };

    // Load Logo Image
    const logoImg = new Image();
    logoImg.src = 'logo.png';
    let logoLoaded = false;
    logoImg.onload = () => {
        logoLoaded = true;
        console.log('Logo loaded');
    };

    // Game Constants
    const TILE_SIZE = 32;
    const ROWS = 15;
    const COLS = 14;
    const PACMAN_SPEED = 2;
    const GHOST_SPEED = 1.5;
    const POWER_DURATION = 300; // frames (about 5 seconds at 60fps)

    // Colors - CIFP La Granja Theme
    const WALL_COLOR = '#2d5f5d'; // Muros verdes originales
    const WALL_BORDER = '#3d7f7d';
    const DOT_COLOR = '#8fd98f';
    const PACMAN_COLOR = '#6ec96e';

    // Game State
    let score = 0;
    let level = 1;
    let gameRunning = false;
    let gameStarted = false;
    let animationId;
    let messageText = '';
    let messageTimer = 0;

    // Map layout - 3 = Power Pellet (Café de Poli)
    const mapLayout = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 3, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 3, 1],
        [1, 2, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 2, 1],
        [1, 2, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 2, 1],
        [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
        [1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 2, 1],
        [1, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 1],
        [1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1],
        [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
        [1, 2, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 2, 1],
        [1, 2, 2, 2, 1, 2, 1, 1, 2, 1, 2, 2, 2, 1],
        [1, 1, 1, 2, 1, 2, 1, 1, 2, 1, 2, 1, 1, 1],
        [1, 3, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 3, 1],
        [1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ];

    // Custom messages for each ghost
    const ghostMessages = {
        'El Inspector': 'Te comiste al Inspector',
        'Viernes a última': 'Te comiste el Viernes a última',
        'La Guardia con los de Básica': 'Te comiste la Guardia con los de Básica'
    };

    // Entities
    let pacman = {
        x: 1.5 * TILE_SIZE,
        y: 1.5 * TILE_SIZE,
        radius: 12,
        direction: 0,
        nextDirection: 0,
        mouthOpen: 0,
        mouthSpeed: 0.2,
        powered: false,
        powerTimer: 0
    };

    let ghosts = [
        { x: 6.5 * TILE_SIZE, y: 6.5 * TILE_SIZE, color: '#ef4444', scaredColor: '#4444ff', direction: 2, speed: GHOST_SPEED, name: 'El Inspector', scared: false, eaten: false, startX: 6.5 * TILE_SIZE, startY: 6.5 * TILE_SIZE },
        { x: 7.5 * TILE_SIZE, y: 6.5 * TILE_SIZE, color: '#f472b6', scaredColor: '#4444ff', direction: 0, speed: GHOST_SPEED, name: 'Viernes a última', scared: false, eaten: false, startX: 7.5 * TILE_SIZE, startY: 6.5 * TILE_SIZE },
        { x: 6.5 * TILE_SIZE, y: 7.5 * TILE_SIZE, color: '#22d3ee', scaredColor: '#4444ff', direction: 3, speed: GHOST_SPEED, name: 'La Guardia con los de Básica', scared: false, eaten: false, startX: 6.5 * TILE_SIZE, startY: 7.5 * TILE_SIZE }
    ];

    let pellets = [];

    // Initialization
    function initGame() {
        console.log('Initializing game...');
        score = 0;
        level = 1;
        gameRunning = true;
        scoreElement.innerText = score;
        levelElement.innerText = level;
        restartBtn.classList.add('hidden');
        sounds.start();

        pacman = {
            x: 1.5 * TILE_SIZE,
            y: 1.5 * TILE_SIZE,
            radius: 12,
            direction: 0,
            nextDirection: 0,
            mouthOpen: 0,
            mouthSpeed: 0.2,
            powered: false,
            powerTimer: 0
        };

        ghosts = [
            { x: 6.5 * TILE_SIZE, y: 6.5 * TILE_SIZE, color: '#ef4444', scaredColor: '#4444ff', direction: 2, speed: GHOST_SPEED, name: 'El Inspector', scared: false, eaten: false, startX: 6.5 * TILE_SIZE, startY: 6.5 * TILE_SIZE },
            { x: 7.5 * TILE_SIZE, y: 6.5 * TILE_SIZE, color: '#f472b6', scaredColor: '#4444ff', direction: 0, speed: GHOST_SPEED, name: 'Viernes a última', scared: false, eaten: false, startX: 7.5 * TILE_SIZE, startY: 6.5 * TILE_SIZE },
            { x: 6.5 * TILE_SIZE, y: 7.5 * TILE_SIZE, color: '#22d3ee', scaredColor: '#4444ff', direction: 3, speed: GHOST_SPEED, name: 'La Guardia con los de Básica', scared: false, eaten: false, startX: 6.5 * TILE_SIZE, startY: 7.5 * TILE_SIZE }
        ];

        pellets = [];
        for (let row = 0; row < mapLayout.length; row++) {
            for (let col = 0; col < mapLayout[row].length; col++) {
                if (mapLayout[row][col] === 2) {
                    pellets.push({ x: col * TILE_SIZE + TILE_SIZE / 2, y: row * TILE_SIZE + TILE_SIZE / 2, type: 'dot' });
                } else if (mapLayout[row][col] === 3) {
                    pellets.push({ x: col * TILE_SIZE + TILE_SIZE / 2, y: row * TILE_SIZE + TILE_SIZE / 2, type: 'power' });
                }
            }
        }

        if (animationId) cancelAnimationFrame(animationId);
        gameLoop();
    }

    // Input Handling
    document.addEventListener('keydown', (e) => {
        if (!gameRunning) return;
        switch (e.key) {
            case 'ArrowRight': pacman.nextDirection = 0; break;
            case 'ArrowDown': pacman.nextDirection = 1; break;
            case 'ArrowLeft': pacman.nextDirection = 2; break;
            case 'ArrowUp': pacman.nextDirection = 3; break;
        }
    });

    // Start button handler
    if (startBtn) {
        startBtn.addEventListener('click', function () {
            console.log('Start button clicked!');
            startScreen.classList.add('hidden');

            // Show header when game starts
            const mainHeader = document.getElementById('mainHeader');
            if (mainHeader) mainHeader.classList.remove('hidden');

            gameStarted = true;
            initGame();
        });
        console.log('Start button listener added');
    }

    // Restart button handler
    if (restartBtn) {
        restartBtn.addEventListener('click', initGame);
    }

    // Core Logic
    function canMove(x, y, direction) {
        let checkX = x;
        let checkY = y;
        const offset = TILE_SIZE / 2 + 2;

        if (direction === 0) checkX += offset;
        if (direction === 1) checkY += offset;
        if (direction === 2) checkX -= offset;
        if (direction === 3) checkY -= offset;

        const col = Math.floor(checkX / TILE_SIZE);
        const row = Math.floor(checkY / TILE_SIZE);

        if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false;

        return mapLayout[row][col] !== 1;
    }

    function update() {
        if (!gameRunning) return;

        // Update message timer
        if (messageTimer > 0) {
            messageTimer--;
            if (messageTimer <= 0) {
                messageText = '';
            }
        }

        // Update power timer
        if (pacman.powered) {
            pacman.powerTimer--;
            if (pacman.powerTimer <= 0) {
                pacman.powered = false;
                ghosts.forEach(g => g.scared = false);
            }
        }

        const centerX = Math.floor(pacman.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
        const centerY = Math.floor(pacman.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
        const dist = Math.sqrt((pacman.x - centerX) ** 2 + (pacman.y - centerY) ** 2);

        if (dist < 4) {
            if (canMove(centerX, centerY, pacman.nextDirection)) {
                pacman.direction = pacman.nextDirection;
                if (pacman.direction === 1 || pacman.direction === 3) pacman.x = centerX;
                if (pacman.direction === 0 || pacman.direction === 2) pacman.y = centerY;
            }
        }

        if (canMove(pacman.x, pacman.y, pacman.direction)) {
            if (pacman.direction === 0) pacman.x += PACMAN_SPEED;
            if (pacman.direction === 1) pacman.y += PACMAN_SPEED;
            if (pacman.direction === 2) pacman.x -= PACMAN_SPEED;
            if (pacman.direction === 3) pacman.y -= PACMAN_SPEED;

            pacman.mouthOpen += pacman.mouthSpeed;
            if (pacman.mouthOpen > 0.25 || pacman.mouthOpen < 0) pacman.mouthSpeed = -pacman.mouthSpeed;
        }

        // Eat Pellets
        for (let i = pellets.length - 1; i >= 0; i--) {
            const p = pellets[i];
            const d = Math.sqrt((pacman.x - p.x) ** 2 + (pacman.y - p.y) ** 2);
            if (d < pacman.radius) {
                pellets.splice(i, 1);
                if (p.type === 'power') {
                    // Café de Poli!
                    score += 50;
                    pacman.powered = true;
                    pacman.powerTimer = POWER_DURATION;
                    ghosts.forEach(g => {
                        g.scared = true;
                        g.eaten = false;
                    });
                    sounds.eatPower();
                } else {
                    score += 10;
                    sounds.eat();
                }
                scoreElement.innerText = score;
            }
        }

        if (pellets.length === 0) {
            alert("¡Nivel Completado!");
            level++;
            levelElement.innerText = level;
            initGame();
        }

        // Ghost Logic
        ghosts.forEach(ghost => {
            if (ghost.eaten) return; // Ghost is gone forever

            const gCenterX = Math.floor(ghost.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
            const gCenterY = Math.floor(ghost.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
            const gDist = Math.sqrt((ghost.x - gCenterX) ** 2 + (ghost.y - gCenterY) ** 2);

            if (gDist < 4) {
                const possibleDirs = [];
                if (canMove(gCenterX, gCenterY, 0)) possibleDirs.push(0);
                if (canMove(gCenterX, gCenterY, 1)) possibleDirs.push(1);
                if (canMove(gCenterX, gCenterY, 2)) possibleDirs.push(2);
                if (canMove(gCenterX, gCenterY, 3)) possibleDirs.push(3);

                const reverseDir = (ghost.direction + 2) % 4;
                const filteredDirs = possibleDirs.filter(d => d !== reverseDir);

                if (filteredDirs.length > 0) {
                    ghost.direction = filteredDirs[Math.floor(Math.random() * filteredDirs.length)];
                } else if (possibleDirs.length > 0) {
                    ghost.direction = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
                }
            }

            const ghostSpeed = ghost.scared ? GHOST_SPEED * 0.5 : ghost.speed;
            if (ghost.direction === 0) ghost.x += ghostSpeed;
            if (ghost.direction === 1) ghost.y += ghostSpeed;
            if (ghost.direction === 2) ghost.x -= ghostSpeed;
            if (ghost.direction === 3) ghost.y -= ghostSpeed;

            // Collision with Pacman
            const distToPacman = Math.sqrt((pacman.x - ghost.x) ** 2 + (pacman.y - ghost.y) ** 2);
            if (distToPacman < pacman.radius + 10) {
                if (pacman.powered && ghost.scared && !ghost.eaten) {
                    // Eat the ghost!
                    ghost.eaten = true;
                    score += 200;
                    scoreElement.innerText = score;
                    messageText = ghostMessages[ghost.name] || `Te comiste a ${ghost.name}`;
                    messageTimer = 120; // Show for 2 seconds at 60fps
                    console.log(messageText);
                    sounds.eatGhost();
                } else if (!ghost.scared && !ghost.eaten) {
                    sounds.gameOver();
                    gameOver();
                }
            }
        });
    }

    function draw() {
        ctx.fillStyle = '#ffffff'; // Fondo blanco (caminos)
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Map
        for (let row = 0; row < mapLayout.length; row++) {
            for (let col = 0; col < mapLayout[row].length; col++) {
                if (mapLayout[row][col] === 1) {
                    ctx.fillStyle = WALL_COLOR;
                    ctx.strokeStyle = WALL_BORDER;
                    ctx.lineWidth = 2;
                    ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    ctx.strokeRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);

                    ctx.shadowBlur = 5;
                    ctx.shadowColor = 'rgba(255, 255, 255, 0.2)';
                    ctx.shadowBlur = 0;
                }
            }
        }

        // Draw Pellets
        pellets.forEach(p => {
            if (p.type === 'power') {
                // Draw Café de Poli (coffee cup emoji)
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('☕', p.x, p.y);
            } else {
                ctx.fillStyle = DOT_COLOR;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Draw Pacman
        ctx.save();
        ctx.translate(pacman.x, pacman.y);

        // Rotate based on direction
        // 0: Right, 1: Down, 2: Left, 3: Up
        const rotationAngle = pacman.direction * Math.PI / 2;
        ctx.rotate(rotationAngle);

        if (logoLoaded) {
            // Draw Logo
            const logoSize = pacman.radius * 2;
            ctx.drawImage(logoImg, -logoSize / 2, -logoSize / 2, logoSize, logoSize);

            // Draw Mouth (wedge matching background color to simulate opening)
            ctx.fillStyle = '#ffffff'; // Match background color
            ctx.beginPath();
            ctx.moveTo(0, 0);
            // Draw wedge from -mouthOpen to +mouthOpen
            ctx.arc(0, 0, pacman.radius + 2, -pacman.mouthOpen * Math.PI * 2, pacman.mouthOpen * Math.PI * 2);
            ctx.lineTo(0, 0);
            ctx.fill();

            // Power effect
            if (pacman.powered) {
                ctx.shadowBlur = 20;
                ctx.shadowColor = '#fbbf24';
                // Redraw logo with shadow behind (this might be tricky with the mouth cut, 
                // but simpler is just a glow around the current state)
                // For simplicity, let's just add a glow ring
                ctx.strokeStyle = '#fbbf24';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, pacman.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        } else {
            // Fallback Classic Pacman
            ctx.fillStyle = PACMAN_COLOR;
            ctx.beginPath();
            ctx.arc(0, 0, pacman.radius, pacman.mouthOpen * Math.PI * 2, (2 - pacman.mouthOpen * 2) * Math.PI);
            ctx.lineTo(0, 0);
            ctx.fill();
        }
        ctx.restore();

        // Draw Ghosts
        ghosts.forEach(g => {
            if (g.eaten) return; // Don't draw eaten ghosts

            const ghostColor = g.scared ? g.scaredColor : g.color;
            ctx.fillStyle = ghostColor;
            ctx.beginPath();
            ctx.arc(g.x, g.y - 2, 12, Math.PI, 0);
            ctx.lineTo(g.x + 12, g.y + 12);
            ctx.lineTo(g.x + 4, g.y + 8);
            ctx.lineTo(g.x - 4, g.y + 12);
            ctx.lineTo(g.x - 12, g.y + 12);
            ctx.fill();

            // Eyes
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(g.x - 4, g.y - 4, 4, 0, Math.PI * 2);
            ctx.arc(g.x + 4, g.y - 4, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = g.scared ? 'white' : 'blue';
            ctx.beginPath();
            ctx.arc(g.x - 4 + (g.direction === 0 ? 2 : -2), g.y - 4, 2, 0, Math.PI * 2);
            ctx.arc(g.x + 4 + (g.direction === 0 ? 2 : -2), g.y - 4, 2, 0, Math.PI * 2);
            ctx.fill();

            // Draw ghost name
            if (g.scared) {
                ctx.fillStyle = 'black'; // Texto negro para fondo blanco
                ctx.font = '8px Outfit';
                ctx.textAlign = 'center';
                ctx.fillText(g.name, g.x, g.y + 20);
            }
        });

        // Draw message if active
        if (messageText && messageTimer > 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, canvas.height / 2 - 40, canvas.width, 80);

            ctx.fillStyle = '#fbbf24';
            ctx.font = 'bold 24px Outfit';
            ctx.textAlign = 'center';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#fbbf24';
            ctx.fillText(messageText, canvas.width / 2, canvas.height / 2);
            ctx.shadowBlur = 0;
        }
    }

    function gameLoop() {
        update();
        draw();
        if (gameRunning) {
            animationId = requestAnimationFrame(gameLoop);
        }
    }

    function gameOver() {
        gameRunning = false;
        // Dark overlay
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Main Title
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 40px Outfit';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ef4444';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 80);
        ctx.shadowBlur = 0;

        // Custom Message
        ctx.fillStyle = '#f8fafc';
        ctx.font = '18px Outfit';
        ctx.shadowBlur = 0;

        const lines = [
            "Oooh, no lo has conseguido...",
            "Vuelve a intentarlo antes de que suban",
            "las programaciones al SERVIDOR.",
            "Espabila!!!"
        ];

        let lineY = canvas.height / 2 - 30;
        lines.forEach(line => {
            ctx.fillText(line, canvas.width / 2, lineY);
            lineY += 25; // Line spacing
        });

        restartBtn.classList.remove('hidden');
    }

    console.log('Game initialized and ready');
});
