<script lang="ts">
    import { onMount } from 'svelte';
    import Matter from 'matter-js';

    export let onGameOver: ((data: { score: number; madeShots: number }) => void) | null = null;
    export let onScore: ((data: { score: number; madeShots: number }) => void) | null = null;

    let gameContainer: HTMLDivElement;
    let scoreElement: HTMLDivElement;
    let score = 0;
    let lastScoreTime = 0;
    let engine: Matter.Engine;
    let render: Matter.Render;
    let world: Matter.World;
    let ball: Matter.Body;
    let rim: Matter.Body;
    let isDragging = false;
    let startPos = { x: 0, y: 0 };
    let containerWidth = 0;
    let containerHeight = 0;
    let mouseConstraint: Matter.MouseConstraint;
    let runner: Matter.Runner;
    let lastBallPosY = 0;
    let hasPassedRimTop = false;
    let isScoring = false;
    let shotsRemaining = 10;
    let gameActive = true;
    let shotTaken = false;
    let madeShots = 0;
    let showModal = false;
    let highScore = typeof localStorage !== 'undefined' ? parseInt(localStorage.getItem('easter-egg-high-score') ?? '0', 10) : 0;
    let ballPath: { x: number; y: number }[] = [];
    let currentMouse = { x: 0, y: 0 };
    const GRAVITY = 0.99;
    const TRAIL_LENGTH = 14;

    // Swish & streak tracking
    let hitRimOrBackboard = false;
    let streak = 0;
    let scoredThisShot = false;

    // Progressive difficulty
    let hoopPhase = 0;
    let lastHoopUpdate = 0;

    // Responsive ball start position (set in onMount)
    let ballStartX = 200;

    // Reference width for scaling (game calibrated at 800px wide, 4:3 aspect)
    const REF_WIDTH = 800;
    let scale = 1;

    // Scaled game dimensions (set by applyScale in onMount)
    let BALL_RADIUS = 25;
    let RIM_WIDTH = 120;
    let RIM_HEIGHT = 5;
    let NET_HEIGHT = 100;
    const SCORE_COOLDOWN = 100;
    let DEFAULT_X = 200;
    let DEFAULT_Y = 200;
    let BACKBOARD_WIDTH = 10;
    let BACKBOARD_HEIGHT = 120;
    const NET_SEGMENTS = 8;
    let RIM_OFFSET_X = 150;
    let RIM_Y = 250;
    let GROUND_Y_THRESHOLD = 50;

    // Progressive difficulty
    let BASE_HOOP_AMPLITUDE = 45;
    const BASE_HOOP_PERIOD_MS = 4200;
    let MAX_HOOP_AMPLITUDE = 85;
    const MIN_HOOP_PERIOD_MS = 2200;

    // Aim dots
    const AIM_DOT_COUNT = 10;
    let AIM_DOT_SPACING = 18;
    let AIM_DOT_MAX_DIST = 250;

    function applyScale(w: number) {
        scale = Math.max(w / REF_WIDTH, 0.35);
        BALL_RADIUS = 25 * scale;
        RIM_WIDTH = 120 * scale;
        RIM_HEIGHT = 5 * scale;
        NET_HEIGHT = 100 * scale;
        DEFAULT_X = 200 * scale;
        DEFAULT_Y = 200 * scale;
        BACKBOARD_WIDTH = 10 * scale;
        BACKBOARD_HEIGHT = 120 * scale;
        RIM_OFFSET_X = 150 * scale;
        RIM_Y = 250 * scale;
        GROUND_Y_THRESHOLD = 50 * scale;
        BASE_HOOP_AMPLITUDE = 45 * scale;
        MAX_HOOP_AMPLITUDE = 85 * scale;
        AIM_DOT_SPACING = 18 * scale;
        AIM_DOT_MAX_DIST = 250 * scale;
    }

    // Collision categories
    const Categories = {
        DEFAULT: 0x0001,
        BALL: 0x0002,
        RIM: 0x0004,
        NET: 0x0008,
        SENSOR: 0x0010
    };

    // Game visual settings
    const BALL_COLOR = '#e85d04';
    const BALL_STROKE = '#5a2a0a';
    const RIM_COLOR = '#ea580c';
    const RIM_STROKE = '#9a3412';
    const NET_COLOR = 'rgba(255, 255, 255, 0.55)';
    const BACKBOARD_COLOR = '#fafafa';
    const BACKBOARD_BORDER = '#e5e5e5';

    // Progressive difficulty
    function getCurrentAmplitude() {
        return Math.min(BASE_HOOP_AMPLITUDE + Math.floor(score / 4) * 5, MAX_HOOP_AMPLITUDE);
    }
    function getCurrentPeriod() {
        return Math.max(BASE_HOOP_PERIOD_MS - Math.floor(score / 4) * 200, MIN_HOOP_PERIOD_MS);
    }

    function createBall(x: number, y: number) {
        return Matter.Bodies.circle(x, y, BALL_RADIUS, {
            restitution: 0.8,
            friction: 0.005,
            density: 0.001,
            frictionAir: 0.001,
            render: {
                fillStyle: BALL_COLOR,
                strokeStyle: BALL_STROKE,
                lineWidth: 2
            },
            collisionFilter: {
                category: Categories.BALL,
                mask: Categories.DEFAULT | Categories.NET
            }
        });
    }

    function createRim(x: number, y: number) {
        const rim = Matter.Bodies.rectangle(x, y, RIM_WIDTH, RIM_HEIGHT, {
            isStatic: true,
            label: 'rim',
            render: {
                fillStyle: RIM_COLOR,
                strokeStyle: RIM_STROKE,
                lineWidth: 2
            },
            collisionFilter: {
                category: Categories.RIM,
                mask: 0x0000
            }
        });

        const rimSensor = Matter.Bodies.rectangle(x, y, RIM_WIDTH, RIM_HEIGHT * 3, {
            isStatic: true,
            isSensor: true,
            render: {
                visible: false
            },
            collisionFilter: {
                category: Categories.SENSOR,
                mask: Categories.BALL
            }
        });

        return { rim, rimSensor };
    }

    function createBackboard(x: number, y: number) {
        return Matter.Bodies.rectangle(
            x + RIM_WIDTH/2 + BACKBOARD_WIDTH/2,
            y - BACKBOARD_HEIGHT/2,
            BACKBOARD_WIDTH,
            BACKBOARD_HEIGHT,
            {
                isStatic: true,
                label: 'backboard',
                render: {
                    fillStyle: BACKBOARD_COLOR,
                    strokeStyle: BACKBOARD_BORDER,
                    lineWidth: 1
                }
            }
        );
    }

    function createChainNet(x: number, rimWidth: number, y: number) {
    const netGroup = Matter.Body.nextGroup(true);
    const segments = NET_SEGMENTS;

    const leftSidePoints = [];
    const rightSidePoints = [];

    for (let i = 0; i <= segments; i++) {
        const yPos = y + (NET_HEIGHT * i / segments);
        const progress = i / segments;
        const xOffset = Math.sin(progress * Math.PI) * 8 * scale;

        leftSidePoints.push({ x: x - rimWidth/2 + xOffset, y: yPos });
        rightSidePoints.push({ x: x + rimWidth/2 - xOffset, y: yPos });
    }

    const leftChain = Matter.Composites.chain(
        Matter.Composites.stack(
            leftSidePoints[0].x,
            leftSidePoints[0].y,
            1,
            segments,
            0,
            0,
            (x, y, indexX, indexY) => {
                return Matter.Bodies.circle(
                    leftSidePoints[indexY].x,
                    leftSidePoints[indexY].y,
                    2 * scale,
                    {
                        collisionFilter: {
                            category: Categories.NET,
                            mask: Categories.BALL,
                            group: netGroup
                        },
                        render: {
                            fillStyle: NET_COLOR,
                            lineWidth: 1
                        },
                        friction: 0.5,
                        restitution: 0.2,
                        density: 0.001
                    }
                );
            }
        ),
        0, 0, 0, 0,
        {
            stiffness: 0.8,
            damping: 0.5,
            render: {
                type: 'line',
                strokeStyle: NET_COLOR,
                lineWidth: 2,
                anchors: false
            }
        }
    );

    const rightChain = Matter.Composites.chain(
        Matter.Composites.stack(
            rightSidePoints[0].x,
            rightSidePoints[0].y,
            1,
            segments,
            0,
            0,
            (x, y, indexX, indexY) => {
                return Matter.Bodies.circle(
                    rightSidePoints[indexY].x,
                    rightSidePoints[indexY].y,
                    2 * scale,
                    {
                        collisionFilter: {
                            category: Categories.NET,
                            mask: Categories.BALL,
                            group: netGroup
                        },
                        render: {
                            fillStyle: NET_COLOR,
                            lineWidth: 1
                        },
                        friction: 0.5,
                        restitution: 0.2,
                        density: 0.001
                    }
                );
            }
        ),
        0, 0, 0, 0,
        {
            stiffness: 0.8,
            damping: 0.5,
            render: {
                type: 'line',
                strokeStyle: NET_COLOR,
                lineWidth: 2,
                anchors: false
            }
        }
    );

    const horizontalChains = [];
    for (let i = 0; i < segments - 1; i++) {
        const leftPoint = leftSidePoints[i];
        const rightPoint = rightSidePoints[i];
        const horizontalSegments = Math.floor(segments / 2);

        const horizontalChain = Matter.Composites.chain(
            Matter.Composites.stack(
                leftPoint.x,
                leftPoint.y,
                horizontalSegments,
                1,
                (rightPoint.x - leftPoint.x) / horizontalSegments,
                0,
                (x, y) => {
                    return Matter.Bodies.circle(
                        x, y, 2 * scale,
                        {
                            collisionFilter: {
                                category: Categories.NET,
                                mask: Categories.BALL,
                                group: netGroup
                            },
                            render: {
                                fillStyle: NET_COLOR,
                                lineWidth: 1
                            },
                            friction: 0.5,
                            restitution: 0.2,
                            density: 0.001
                        }
                    );
                }
            ),
            0, 0, 0, 0,
            {
                stiffness: 0.6,
                damping: 0.5,
                render: {
                    type: 'line',
                    strokeStyle: NET_COLOR,
                    lineWidth: 1,
                    anchors: false
                }
            }
        );

        horizontalChains.push(horizontalChain);
    }

    const leftRimAnchor = Matter.Bodies.circle(
        x - rimWidth/2, y, 2 * scale,
        {
            isStatic: true,
            render: { visible: false },
            collisionFilter: { group: netGroup }
        }
    );

    const rightRimAnchor = Matter.Bodies.circle(
        x + rimWidth/2, y, 2 * scale,
        {
            isStatic: true,
            render: { visible: false },
            collisionFilter: { group: netGroup }
        }
    );

    const leftTopConstraint = Matter.Constraint.create({
        bodyA: leftRimAnchor,
        bodyB: leftChain.bodies[0],
        stiffness: 1,
        length: 0,
        render: {
            visible: true,
            strokeStyle: NET_COLOR,
            lineWidth: 2
        }
    });

    const rightTopConstraint = Matter.Constraint.create({
        bodyA: rightRimAnchor,
        bodyB: rightChain.bodies[0],
        stiffness: 1,
        length: 0,
        render: {
            visible: true,
            strokeStyle: NET_COLOR,
            lineWidth: 2
        }
    });

    const crossConstraints = [];
    horizontalChains.forEach((chain, index) => {
        if (chain.bodies.length > 0) {
            crossConstraints.push(Matter.Constraint.create({
                bodyA: leftChain.bodies[index],
                bodyB: chain.bodies[0],
                stiffness: 0.7,
                damping: 0.5,
                render: {
                    strokeStyle: NET_COLOR,
                    lineWidth: 1
                }
            }));

            crossConstraints.push(Matter.Constraint.create({
                bodyA: rightChain.bodies[index],
                bodyB: chain.bodies[chain.bodies.length - 1],
                stiffness: 0.7,
                damping: 0.2,
                render: {
                    strokeStyle: NET_COLOR,
                    lineWidth: 1
                }
            }));
        }
    });

    return [
        leftChain, rightChain,
        ...horizontalChains,
        leftRimAnchor, rightRimAnchor,
        leftTopConstraint, rightTopConstraint,
        ...crossConstraints
    ];
}

    function createPlatform(x: number, y: number) {
        const padWidth = 70 * scale;
        const padHeight = 4 * scale;
        const base = Matter.Bodies.rectangle(x, y, padWidth, padHeight, {
            isStatic: true,
            render: {
                fillStyle: '#78716c',
                strokeStyle: '#57534e',
                lineWidth: 1
            }
        });

        return [base];
    }

    function createWalls() {
        const wallOptions = {
            isStatic: true,
            render: {
                visible: false
            }
        };

        return [
            Matter.Bodies.rectangle(containerWidth / 2, containerHeight + 30, containerWidth, 60, wallOptions),
            Matter.Bodies.rectangle(-30, containerHeight / 2, 60, containerHeight, wallOptions),
            Matter.Bodies.rectangle(containerWidth + 30, containerHeight / 2, 60, containerHeight, wallOptions)
        ];
    }

    function resetBall() {
        ballPath = [];
        Matter.Body.setPosition(ball, {
            x: ballStartX,
            y: containerHeight - DEFAULT_Y - BALL_RADIUS
        });
        Matter.Body.setVelocity(ball, { x: 0, y: 0 });
        Matter.Body.setAngularVelocity(ball, 0);

        // Streak tracking: reset on miss
        if (!scoredThisShot && shotTaken) {
            streak = 0;
        }

        // Re-enable ball interaction after reset
        if (shotTaken) {
            Matter.World.add(world, mouseConstraint);
        }
        shotTaken = false;
        hitRimOrBackboard = false;
        scoredThisShot = false;

        if (shotsRemaining <= 0 && gameActive) {
            setTimeout(() => {
                if (!gameActive) return;
                gameActive = false;
                showGameOverModal();
            }, 300);
        }
    }

    function resetGame() {
        score = 0;
        shotsRemaining = 10;
        gameActive = true;
        madeShots = 0;
        showModal = false;
        streak = 0;
        hitRimOrBackboard = false;
        scoredThisShot = false;
        hoopPhase = 0;
        resetBall();
    }

    function updateHighScore() {
        if (score > highScore) {
            highScore = score;
            try { localStorage.setItem('easter-egg-high-score', String(highScore)); } catch {}
        }
    }


    function checkScoring() {
        const ballPos = ball.position;
        if (ballPos.y < -BALL_RADIUS * 2) {
            resetBall();
            if (shotsRemaining <= 0 && gameActive) {
                gameActive = false;
                showGameOverModal();
            }
            return;
        }
        const currentTime = performance.now();
        const rimPos = rim.position;

        const ballMovingDown = ballPos.y > lastBallPosY;

        if (ballPos.y < rimPos.y) {
            hasPassedRimTop = true;
        }

        if (ballPos.y < rimPos.y - BALL_RADIUS ||
            Math.abs(ballPos.x - rimPos.x) > RIM_WIDTH) {
            hasPassedRimTop = false;
            isScoring = false;
        }

        if (currentTime - lastScoreTime > SCORE_COOLDOWN &&
            !isScoring &&
            hasPassedRimTop &&
            ballMovingDown) {

            if (ballPos.x > rimPos.x - RIM_WIDTH/2 &&
                ballPos.x < rimPos.x + RIM_WIDTH/2 &&
                ballPos.y > rimPos.y &&
                ballPos.y < rimPos.y + BALL_RADIUS * 2) {

                isScoring = true;
                const isSwish = !hitRimOrBackboard;
                const points = isSwish ? 3 : 2;
                score += points;
                madeShots++;
                streak++;
                scoredThisShot = true;
                lastScoreTime = currentTime;
                if (score > highScore) {
                    highScore = score;
                    if (typeof localStorage !== 'undefined') localStorage.setItem('easter-egg-high-score', String(highScore));
                }
                if (scoreElement) {
                    const valueEl = scoreElement.querySelector('.score-value') as HTMLElement;
                    if (valueEl) {
                        valueEl.style.transform = 'scale(1.5)';
                        setTimeout(() => { valueEl.style.transform = 'scale(1)'; }, 300);
                    }
                }

                createScoreEffect(ballPos.x, ballPos.y, isSwish, points);
                if (onScore) onScore({ score, madeShots });
            }
        }

        if (!isDragging) {
            const vel = ball.velocity;
            const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
            if (speed > 0.5) {
                ballPath.push({ x: ballPos.x, y: ballPos.y });
                if (ballPath.length > TRAIL_LENGTH) ballPath.shift();
            }
        }

        lastBallPosY = ballPos.y;
    }

    function createScoreEffect(x: number, y: number, isSwish: boolean, points: number) {
        const effect = document.createElement('div');
        effect.className = isSwish ? 'score-effect swish-text' : 'score-effect';
        effect.textContent = isSwish ? `SWISH +${points}` : `+${points}`;
        effect.style.left = `${x}px`;
        effect.style.top = `${y}px`;
        gameContainer.appendChild(effect);
        setTimeout(() => effect.remove(), 1200);

        const particleCount = isSwish ? 18 : 12;
        for (let i = 0; i < particleCount; i++) {
            const p = document.createElement('div');
            p.className = 'swish-particle';
            p.style.left = `${x}px`;
            p.style.top = `${y}px`;
            const angle = (i / particleCount) * Math.PI * 2;
            const dist = isSwish ? 80 : 60;
            p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
            p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
            p.style.animationDelay = `${i * 20}ms`;
            gameContainer.appendChild(p);
            setTimeout(() => p.remove(), 800);
        }
    }

    function updateAimLine(mouseX: number, mouseY: number) {
        if (!isDragging) return;
    }

    // Shared pointer logic for mouse and touch
    function handlePointerDown(clientX: number, clientY: number) {
        if (!gameActive || shotsRemaining <= 0) return;

        const ballPos = ball.position;
        const containerRect = gameContainer.getBoundingClientRect();
        const mousePos = Matter.Vector.create(
            clientX - containerRect.left,
            clientY - containerRect.top
        );

        if (!shotTaken && Matter.Vector.magnitude(Matter.Vector.sub(mousePos, ballPos)) < BALL_RADIUS * 2.5) {
            isDragging = true;
            startPos = { x: ballPos.x, y: ballPos.y };
            shotTaken = false;

            Matter.World.remove(world, mouseConstraint);
            Matter.Body.setStatic(ball, true);
        }
    }

    function handlePointerMove(clientX: number, clientY: number) {
        const containerRect = gameContainer.getBoundingClientRect();
        const mouseX = clientX - containerRect.left;
        const mouseY = clientY - containerRect.top;
        currentMouse.x = mouseX;
        currentMouse.y = mouseY;
        if (isDragging) {
            updateAimLine(mouseX, mouseY);
        }
    }

    function handlePointerUp(clientX: number, clientY: number) {
        if (isDragging && gameActive) {
            const containerRect = gameContainer.getBoundingClientRect();
            const mouseX = clientX - containerRect.left;
            const mouseY = clientY - containerRect.top;

            const dx = startPos.x - mouseX;
            const dy = startPos.y - mouseY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            Matter.Body.setStatic(ball, false);

            const power = Math.min(distance * 0.2, 30 * scale);
            const velocityX = (dx / distance) * power;
            const velocityY = (dy / distance) * power;

            Matter.Body.setVelocity(ball, {
                x: velocityX,
                y: velocityY
            });

            const spinMultiplier = 0.01;
            Matter.Body.setAngularVelocity(ball, velocityX * spinMultiplier);

            if (!shotTaken) {
                shotsRemaining--;
                shotTaken = true;
            }

            isDragging = false;
        }
    }

    // Mouse event handlers
    function handleMouseDown(event: MouseEvent) {
        handlePointerDown(event.clientX, event.clientY);
    }

    function handleMouseMove(event: MouseEvent) {
        handlePointerMove(event.clientX, event.clientY);
    }

    function handleMouseUp(event: MouseEvent) {
        handlePointerUp(event.clientX, event.clientY);
    }

    // Touch event handlers
    function handleTouchStart(event: TouchEvent) {
        event.preventDefault();
        const touch = event.touches[0];
        handlePointerDown(touch.clientX, touch.clientY);
    }

    function handleTouchMove(event: TouchEvent) {
        event.preventDefault();
        const touch = event.touches[0];
        handlePointerMove(touch.clientX, touch.clientY);
    }

    function handleTouchEnd(event: TouchEvent) {
        event.preventDefault();
        const touch = event.changedTouches[0];
        handlePointerUp(touch.clientX, touch.clientY);
    }

    function showGameOverModal() {
        updateHighScore();
        showModal = true;
        if (onGameOver) {
            onGameOver({ score, madeShots });
        }
    }


    function drawBasketballLines(render: Matter.Render, rimBody: Matter.Body) {
        const context = render.context;
        Matter.Events.on(render, 'afterRender', () => {
            const pos = ball.position;
            const angle = ball.angle;

            // Ball trail (tapered)
            if (ballPath.length > 1) {
                for (let i = 1; i < ballPath.length; i++) {
                    const t = i / ballPath.length; // 0 = tail, 1 = head
                    const alpha = t * 0.3;
                    const width = BALL_RADIUS * (0.6 + t * 0.6);
                    context.beginPath();
                    context.strokeStyle = `rgba(249, 115, 22, ${alpha})`;
                    context.lineWidth = width;
                    context.lineCap = 'round';
                    context.moveTo(ballPath[i - 1].x, ballPath[i - 1].y);
                    context.lineTo(ballPath[i].x, ballPath[i].y);
                    context.stroke();
                }
            }

            // Basketball seam lines
            context.save();
            context.translate(pos.x, pos.y);
            context.rotate(angle);

            context.beginPath();
            context.strokeStyle = BALL_STROKE;
            context.lineWidth = 2;

            context.moveTo(-BALL_RADIUS, 0);
            context.lineTo(BALL_RADIUS, 0);
            context.moveTo(0, -BALL_RADIUS);
            context.lineTo(0, BALL_RADIUS);
            context.moveTo(-BALL_RADIUS * 0.7, -BALL_RADIUS * 0.7);
            context.quadraticCurveTo(0, -BALL_RADIUS * 0.2, BALL_RADIUS * 0.7, -BALL_RADIUS * 0.7);
            context.moveTo(-BALL_RADIUS * 0.7, BALL_RADIUS * 0.7);
            context.quadraticCurveTo(0, BALL_RADIUS * 0.2, BALL_RADIUS * 0.7, BALL_RADIUS * 0.7);

            context.stroke();
            context.restore();

            // Aim dots while dragging (linear, color-coded by power)
            if (isDragging) {
                const dx = startPos.x - currentMouse.x;
                const dy = startPos.y - currentMouse.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > 10 * scale) {
                    const powerRatio = Math.min(distance / (150 * scale), 1);
                    const dirX = dx / distance;
                    const dirY = dy / distance;
                    const lineLen = Math.min(distance * 2, AIM_DOT_MAX_DIST);
                    const dotCount = Math.min(AIM_DOT_COUNT, Math.floor(lineLen / AIM_DOT_SPACING));

                    for (let i = 0; i < dotCount; i++) {
                        const t = (i + 1) / (AIM_DOT_COUNT + 1);
                        const px = startPos.x + dirX * (i + 1) * AIM_DOT_SPACING;
                        const py = startPos.y + dirY * (i + 1) * AIM_DOT_SPACING;

                        const alpha = (1 - t) * 0.7 + 0.1;
                        const r = Math.floor(255 * powerRatio);
                        const g = Math.floor(255 * (1 - powerRatio));
                        const dotRadius = (4 - t * 2) * scale;

                        context.beginPath();
                        context.fillStyle = `rgba(${r}, ${g}, 0, ${alpha})`;
                        context.arc(px, py, Math.max(dotRadius, 1.5 * scale), 0, Math.PI * 2);
                        context.fill();
                    }
                }
            }
        });
    }

    function teardownGame() {
        if (!runner) return;
        Matter.Runner.stop(runner);
        Matter.World.clear(world, false);
        Matter.Engine.clear(engine);
        Matter.Render.stop(render);
        render.canvas.remove();
        render.canvas = null;
        render.context = null;
        render.textures = {};
    }

    function initGame() {
        const containerRect = gameContainer.getBoundingClientRect();
        containerWidth = containerRect.width;
        containerHeight = containerRect.height;

        // Scale all game dimensions to container size
        applyScale(containerWidth);

        // Responsive positioning
        ballStartX = Math.min(DEFAULT_X, containerWidth * 0.25);
        const rimX = Math.max(containerWidth - RIM_OFFSET_X, containerWidth * 0.65);

        // Create engine and world (gravity scales with size for consistent physics)
        engine = Matter.Engine.create({
            enableSleeping: false,
            gravity: { x: 0, y: 0.99 * scale }
        });
        world = engine.world;

        // Create renderer
        render = Matter.Render.create({
            element: gameContainer,
            engine: engine,
            options: {
                width: containerWidth,
                height: containerHeight,
                wireframes: false,
                background: 'transparent',
                pixelRatio: window.devicePixelRatio
            }
        });

        // Create game objects
        ball = createBall(ballStartX, containerHeight - DEFAULT_Y);

        const rimObjects = createRim(rimX, RIM_Y);
        rim = rimObjects.rim;
        const rimSensor = rimObjects.rimSensor;

        const netObjects = createChainNet(rimX, RIM_WIDTH, RIM_Y);
        const leftRimAnchor = netObjects[9];
        const rightRimAnchor = netObjects[10];
        const backboard = createBackboard(rimX, RIM_Y);

        const platform = createPlatform(ballStartX, containerHeight - DEFAULT_Y + BALL_RADIUS * 2 - 45 * scale);

        Matter.World.add(world, [
            ball,
            rim,
            rimSensor,
            backboard,
            ...platform,
            ...createWalls(),
            ...netObjects
        ]);

        // Mouse control
        const mouse = Matter.Mouse.create(render.canvas);
        mouseConstraint = Matter.MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: {
                    visible: false
                }
            }
        });
        Matter.World.add(world, mouseConstraint);
        render.mouse = mouse;

        // Start engine and renderer
        runner = Matter.Runner.create({
            isFixed: true,
            delta: 1000/60
        });
        Matter.Runner.run(runner, engine);
        Matter.Render.run(render);

        drawBasketballLines(render, rim);

        // Touch event listeners
        gameContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
        gameContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
        gameContainer.addEventListener('touchend', handleTouchEnd, { passive: false });

        // Scoring
        Matter.Events.on(engine, 'afterUpdate', checkScoring);

        // Ball trail
        Matter.Events.on(engine, 'afterUpdate', () => {
            if (isDragging) return;
            const vel = ball.velocity;
            const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
            if (speed > 0.5) {
                ballPath.push({ x: ball.position.x, y: ball.position.y });
                if (ballPath.length > TRAIL_LENGTH) ballPath.shift();
            }
        });

        // Progressive difficulty hoop animation
        const leftNetAnchor = netObjects[9];
        const rightNetAnchor = netObjects[10];
        lastHoopUpdate = performance.now();
        Matter.Events.on(engine, 'afterUpdate', () => {
            const now = performance.now();
            const dt = (now - lastHoopUpdate) / 1000;
            lastHoopUpdate = now;

            const period = getCurrentPeriod() / 1000;
            hoopPhase += (2 * Math.PI * dt) / period;

            const amp = getCurrentAmplitude();
            const hoopY = RIM_Y + amp * Math.sin(hoopPhase);
            Matter.Body.setPosition(rim, { x: rim.position.x, y: hoopY });
            Matter.Body.setPosition(rimSensor, { x: rimSensor.position.x, y: hoopY });
            Matter.Body.setPosition(backboard, { x: backboard.position.x, y: hoopY - BACKBOARD_HEIGHT / 2 });
            Matter.Body.setPosition(leftNetAnchor, { x: leftNetAnchor.position.x, y: hoopY });
            Matter.Body.setPosition(rightNetAnchor, { x: rightNetAnchor.position.x, y: hoopY });
        });

        // Rim/backboard collision detection (for swish tracking)
        Matter.Events.on(engine, 'collisionStart', (event) => {
            event.pairs.forEach((pair) => {
                const bodies = [pair.bodyA, pair.bodyB];
                if (bodies.includes(ball)) {
                    const other = bodies.find(b => b !== ball);
                    if (other && (other.label === 'backboard' || other.label === 'rim')) {
                        hitRimOrBackboard = true;
                    }
                }
            });
        });

        // Ground collision for ball reset
        Matter.Events.on(engine, 'collisionStart', (event) => {
            event.pairs.forEach((pair) => {
                if ((pair.bodyA === ball || pair.bodyB === ball) &&
                    ((pair.bodyA.position.y > containerHeight - GROUND_Y_THRESHOLD) ||
                     (pair.bodyB.position.y > containerHeight - GROUND_Y_THRESHOLD))) {
                    resetBall();
                    if (shotsRemaining <= 0 && gameActive) {
                        gameActive = false;
                        showGameOverModal();
                    }
                }
            });
        });
    }

    let resizeTimer: ReturnType<typeof setTimeout>;

    function handleResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (!gameContainer) return;
            const newRect = gameContainer.getBoundingClientRect();
            // Only rebuild if size actually changed meaningfully
            if (Math.abs(newRect.width - containerWidth) < 2 && Math.abs(newRect.height - containerHeight) < 2) return;

            // Preserve game state across rebuild
            const savedState = { score, shotsRemaining, gameActive, madeShots, showModal, highScore, streak, hoopPhase, shotTaken };

            teardownGame();
            gameContainer.removeEventListener('touchstart', handleTouchStart);
            gameContainer.removeEventListener('touchmove', handleTouchMove);
            gameContainer.removeEventListener('touchend', handleTouchEnd);

            initGame();

            // Restore game state
            score = savedState.score;
            shotsRemaining = savedState.shotsRemaining;
            gameActive = savedState.gameActive;
            madeShots = savedState.madeShots;
            showModal = savedState.showModal;
            highScore = savedState.highScore;
            streak = savedState.streak;
            hoopPhase = savedState.hoopPhase;
            shotTaken = savedState.shotTaken;
            ballPath = [];
        }, 200);
    }

    onMount(() => {
        try { highScore = Math.max(0, parseInt(localStorage.getItem('easter-egg-high-score') ?? '0', 10)); } catch {}

        initGame();

        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('resize', handleResize);

        return () => {
            clearTimeout(resizeTimer);
            teardownGame();

            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('resize', handleResize);
            gameContainer.removeEventListener('touchstart', handleTouchStart);
            gameContainer.removeEventListener('touchmove', handleTouchMove);
            gameContainer.removeEventListener('touchend', handleTouchEnd);
        };
    });
</script>

<div class="game-wrapper rounded-xl p-6 shadow-lg">
    <div class="game-container relative" bind:this={gameContainer}>
        <div class="score" bind:this={scoreElement}>
            <span class="score-value">{score}</span>
            <span class="score-divider">·</span>
            <span class="shots-remaining" class:shots-urgent={shotsRemaining <= 3}>
                {#each Array(shotsRemaining) as _}
                    <span class="shot-emoji">🏀</span>
                {/each}
            </span>
        </div>

        {#if streak >= 2}
            <div class="streak-display">
                <span class="streak-fire">🔥</span>
                <span class="streak-count">{streak}</span>
            </div>
        {/if}

        <button class="reset-button" on:click={resetGame}>Reset Game</button>

        <div class="instructions">
            Drag back from the ball to aim, release to shoot · 10 shots
        </div>

        {#if showModal}
            <div class="modal-overlay">
                <div class="modal-content">
                    <h2 class="modal-title">Game Over</h2>
                    <div class="modal-stats">
                        <div class="modal-stat">
                            <span class="modal-stat-label">Final Score</span>
                            <span class="modal-stat-value">{score}</span>
                        </div>
                        <div class="modal-stat">
                            <span class="modal-stat-label">Made Shots</span>
                            <span class="modal-stat-value">{madeShots} / 10</span>
                        </div>
                        <div class="modal-stat">
                            <span class="modal-stat-label">Shooting %</span>
                            <span class="modal-stat-value">{((madeShots / 10) * 100).toFixed(1)}%</span>
                        </div>
                        <div class="modal-stat modal-stat-highlight">
                            <span class="modal-stat-label">High Score</span>
                            <span class="modal-stat-value">{highScore}</span>
                        </div>
                    </div>
                    <button class="modal-play-again" on:click={resetGame}>Play Again</button>
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    .game-wrapper {
        background: linear-gradient(145deg, #404040 0%, #2d2d2d 100%);
    }

    .game-container {
        width: 100%;
        aspect-ratio: 4 / 3;
        overflow: hidden;
        cursor: default;
        border-radius: 0.5rem;
        position: relative;
        background: linear-gradient(180deg, #3f3f46 0%, #27272a 35%, #18181b 100%);
        touch-action: none;
    }

    .score {
        position: absolute;
        top: 20px;
        left: 20px;
        right: 140px;
        font-size: 24px;
        font-weight: 700;
        color: #fef3c7;
        text-shadow: 0 2px 8px rgba(0,0,0,0.6);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .score-value { color: #fbbf24; font-size: 28px; transition: transform 0.3s ease; display: inline-block; }
    .score-divider { opacity: 0.5; }
    .shots-remaining {
        display: inline-flex;
        gap: 1px;
        align-items: center;
    }
    .shot-emoji {
        font-size: 16px;
        display: inline-block;
        transition: opacity 0.3s;
    }
    .shots-urgent .shot-emoji {
        animation: pulse-urgent 0.8s ease-in-out infinite;
    }
    .shots-urgent .shot-emoji:nth-child(2) { animation-delay: 0.15s; }
    .shots-urgent .shot-emoji:nth-child(3) { animation-delay: 0.3s; }
    @keyframes pulse-urgent {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(1.3); }
    }

    .streak-display {
        position: absolute;
        top: 60px;
        left: 20px;
        display: flex;
        align-items: center;
        gap: 4px;
        z-index: 1000;
        animation: streak-pop 0.3s ease-out;
    }
    .streak-fire {
        font-size: 28px;
        animation: fire-flicker 0.6s ease-in-out infinite alternate;
    }
    .streak-count {
        font-size: 26px;
        font-weight: 800;
        color: #fb923c;
        text-shadow: 0 0 12px rgba(251, 146, 60, 0.7);
    }
    @keyframes streak-pop {
        from { transform: scale(0.5); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
    }
    @keyframes fire-flicker {
        from { transform: scale(1) rotate(-3deg); }
        to { transform: scale(1.1) rotate(3deg); }
    }

    .instructions {
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 18px;
        font-weight: bold;
        color: #f4f4f5;
        background-color: rgba(39, 39, 42, 0.8);
        padding: 10px 20px;
        border-radius: 20px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        z-index: 1000;
        white-space: nowrap;
    }

    .reset-button {
        position: absolute;
        top: 20px;
        right: 20px;
        padding: 8px 16px;
        background: #b45309;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 16px;
        cursor: pointer;
        transition: background 0.2s, transform 0.1s;
        z-index: 1000;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }

    .reset-button:hover {
        background: #92400e;
        transform: translateY(-2px);
    }

    .reset-button:active {
        transform: translateY(0);
    }


    @keyframes score-animation {
        0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
        100% {
            opacity: 0;
            transform: translate(-50%, -150%) scale(1.5);
        }
    }

    :global(.score-effect) {
        position: absolute;
        font-size: 28px;
        font-weight: 800;
        color: #fbbf24;
        text-shadow: 0 0 12px rgba(251, 191, 36, 0.9), 0 0 24px rgba(245, 158, 11, 0.6);
        pointer-events: none;
        animation: score-animation 1s ease-out forwards;
        transform: translate(-50%, -50%);
    }

    :global(.swish-text) {
        font-size: 32px;
        color: #34d399;
        text-shadow: 0 0 16px rgba(52, 211, 153, 0.9), 0 0 32px rgba(16, 185, 129, 0.6);
    }

    :global(.swish-particle) {
        position: absolute;
        width: 6px;
        height: 6px;
        background: radial-gradient(circle, #fbbf24 0%, #f59e0b 70%, transparent 100%);
        border-radius: 50%;
        pointer-events: none;
        transform: translate(-50%, -50%);
        animation: particle-burst 0.8s ease-out forwards;
    }
    @keyframes particle-burst {
        0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% {
            opacity: 0;
            transform: translate(calc(-50% + var(--dx, 0)), calc(-50% + var(--dy, 0))) scale(0);
        }
    }

    .modal-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.88);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 50;
        animation: modal-fade 0.25s ease-out;
    }
    @keyframes modal-fade {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    .modal-content {
        background: linear-gradient(145deg, #1c1917 0%, #292524 50%, #1c1917 100%);
        padding: 2rem;
        border-radius: 1rem;
        border: 2px solid #b45309;
        box-shadow: 0 0 40px rgba(180, 83, 9, 0.3), 0 25px 50px rgba(0, 0, 0, 0.5);
        max-width: 20rem;
        width: calc(100% - 2rem);
        animation: modal-scale 0.3s ease-out;
    }
    @keyframes modal-scale {
        from { transform: scale(0.9); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
    }
    .modal-title {
        font-size: 2rem;
        font-weight: 800;
        color: #fbbf24;
        text-align: center;
        margin-bottom: 1.5rem;
        text-shadow: 0 0 20px rgba(251, 191, 36, 0.4);
    }
    .modal-stats {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
    }
    .modal-stat {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1rem;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 0.5rem;
    }
    .modal-stat-highlight {
        border: 1px solid rgba(251, 191, 36, 0.4);
        background: rgba(251, 191, 36, 0.08);
    }
    .modal-stat-label { color: #a8a29e; font-size: 0.9rem; }
    .modal-stat-value { color: #fbbf24; font-size: 1.25rem; font-weight: 700; }
    .modal-play-again {
        width: 100%;
        padding: 0.875rem 1.5rem;
        background: linear-gradient(135deg, #b45309 0%, #d97706 100%);
        color: white;
        border: none;
        border-radius: 0.5rem;
        font-weight: 700;
        font-size: 1rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        cursor: pointer;
        transition: all 0.15s ease;
        box-shadow: 0 4px 14px rgba(180, 83, 9, 0.4);
    }
    .modal-play-again:hover {
        background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
    }

    @media (max-width: 640px) {
        .instructions {
            font-size: 11px;
            padding: 6px 12px;
            white-space: normal;
            text-align: center;
            max-width: 85%;
        }
        .score {
            font-size: 18px;
            gap: 5px;
            right: 110px;
        }
        .score-value { font-size: 22px; }
        .shot-emoji { font-size: 13px; }
        .reset-button { font-size: 13px; padding: 6px 12px; }
        .streak-display { top: 50px; }
        .streak-fire { font-size: 22px; }
        .streak-count { font-size: 20px; }
    }
</style>
