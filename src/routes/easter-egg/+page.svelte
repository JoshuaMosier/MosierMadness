<script lang="ts">
    import { onMount } from 'svelte';
    import Matter from 'matter-js';

    let gameContainer: HTMLDivElement;
    let scoreElement: HTMLDivElement;
    let aimLine: HTMLDivElement;
    let score = 0;
    let lastScoreTime = 0;
    let engine: Matter.Engine;
    let render: Matter.Render;
    let world: Matter.World;
    let ball: Matter.Body;
    let rim: Matter.Body;
    let leftNet: Matter.Body;
    let rightNet: Matter.Body;
    let isDragging = false;
    let startPos = { x: 0, y: 0 };
    let containerWidth = 0;
    let containerHeight = 0;
    let mouseConstraint: Matter.MouseConstraint;
    let runner: Matter.Runner;
    let lastBallPosY = 0;
    let hasPassedRimTop = false;
    let isScoring = false;

    // Constants
    const BALL_RADIUS = 20;
    const RIM_WIDTH = 120;
    const RIM_HEIGHT = 5;
    const NET_WIDTH = 5;
    const NET_HEIGHT = 80;
    const NET_ANGLE = 10;
    const SCORE_COOLDOWN = 100;
    const DEFAULT_X = 200;
    const DEFAULT_Y = 200;
    const PLATFORM_WIDTH = 60;
    const PLATFORM_HEIGHT = 10;
    const BACKBOARD_WIDTH = 10;
    const BACKBOARD_HEIGHT = 100;
    const NET_SEGMENTS = 8;
    const NET_STIFFNESS = 0.1;
    
    // Collision categories
    const Categories = {
        DEFAULT: 0x0001,
        BALL: 0x0002,
        RIM: 0x0004,
        NET: 0x0008,
        SENSOR: 0x0010
    };

    // Game visual settings
    const BALL_COLOR = '#ff6b00';
    const BALL_STROKE = '#c65200';
    const RIM_COLOR = '#f59e0b';
    const NET_COLOR = 'rgba(255, 255, 255, 0.4)';
    const BACKBOARD_COLOR = '#cbd5e1';
    const PLATFORM_COLOR = '#475569';

    const isMobile = () => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };

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
                mask: Categories.DEFAULT | Categories.NET // Only collide with default bodies and net
            }
        });
    }

    function createRim(x: number, y: number) {
        const rim = Matter.Bodies.rectangle(x, y, RIM_WIDTH, RIM_HEIGHT, {
            isStatic: true,
            render: {
                fillStyle: RIM_COLOR,
                strokeStyle: '#b45309',
                lineWidth: 1
            },
            collisionFilter: {
                category: Categories.RIM,
                mask: 0x0000 // Collides with nothing
            }
        });
        
        // Add a sensor to detect ball passing through
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
                render: {
                    fillStyle: BACKBOARD_COLOR
                }
            }
        );
    }

    function createChainNet(x: number, rimWidth: number, y: number) {
    const netGroup = Matter.Body.nextGroup(true);
    const segments = NET_SEGMENTS;
    const segmentWidth = rimWidth / segments;
    
    // Create left and right side of the net (chains)
    const leftSidePoints = [];
    const rightSidePoints = [];
    
    // Create points for the chains with a more natural curve
    for (let i = 0; i <= segments; i++) {
        const yPos = y + (NET_HEIGHT * i / segments);
        const progress = i / segments;
        
        // Enhanced curve calculation for more realistic net shape
        const xOffset = Math.sin(progress * Math.PI) * 8;
        
        leftSidePoints.push({ x: x - rimWidth/2 + xOffset, y: yPos });
        rightSidePoints.push({ x: x + rimWidth/2 - xOffset, y: yPos });
    }
    
    // Create vertical chains with increased stiffness
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
                    2, 
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
                    2, 
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
    
    // Create horizontal chains with optimized spacing
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
                        x, y, 2, 
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
    
    // Create static anchor points with stronger constraints
    const leftRimAnchor = Matter.Bodies.circle(
        x - rimWidth/2, y, 2, 
        {
            isStatic: true,
            render: { visible: false },
            collisionFilter: { group: netGroup }
        }
    );
    
    const rightRimAnchor = Matter.Bodies.circle(
        x + rimWidth/2, y, 2, 
        {
            isStatic: true,
            render: { visible: false },
            collisionFilter: { group: netGroup }
        }
    );
    
    // Connect top chains to anchors with enhanced stiffness
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
    
    // Connect horizontal chains to vertical chains
    const crossConstraints = [];
    horizontalChains.forEach((chain, index) => {
        if (chain.bodies.length > 0) {
            // Left side connection
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
            
            // Right side connection
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
        const platformOptions = {
            isStatic: true,
            render: {
                fillStyle: PLATFORM_COLOR
            }
        };

        // Create three rectangles to form a U shape
        const base = Matter.Bodies.rectangle(x, y, PLATFORM_WIDTH, PLATFORM_HEIGHT, platformOptions);
        const leftWall = Matter.Bodies.rectangle(x - PLATFORM_WIDTH/2 + PLATFORM_HEIGHT/2, y - PLATFORM_HEIGHT, PLATFORM_HEIGHT, PLATFORM_HEIGHT * 2, platformOptions);
        const rightWall = Matter.Bodies.rectangle(x + PLATFORM_WIDTH/2 - PLATFORM_HEIGHT/2, y - PLATFORM_HEIGHT, PLATFORM_HEIGHT, PLATFORM_HEIGHT * 2, platformOptions);

        return [base, leftWall, rightWall];
    }

    function createWalls() {
        const wallOptions = {
            isStatic: true,
            render: {
                visible: false
            }
        };

        return [
            // Ground
            Matter.Bodies.rectangle(containerWidth / 2, containerHeight + 30, containerWidth, 60, wallOptions),
            // Left wall
            Matter.Bodies.rectangle(-30, containerHeight / 2, 60, containerHeight, wallOptions),
            // Right wall
            Matter.Bodies.rectangle(containerWidth + 30, containerHeight / 2, 60, containerHeight, wallOptions),
            // Ceiling
            Matter.Bodies.rectangle(containerWidth / 2, -30, containerWidth, 60, wallOptions)
        ];
    }

    function resetBall() {
        Matter.Body.setPosition(ball, {
            x: DEFAULT_X,
            y: containerHeight - DEFAULT_Y - BALL_RADIUS
        });
        Matter.Body.setVelocity(ball, { x: 0, y: 0 });
        Matter.Body.setAngularVelocity(ball, 0);
    }

    function resetGame() {
        score = 0;
        scoreElement.textContent = `Score: ${score}`;
        resetBall();
    }

    function checkScoring() {
        const currentTime = performance.now();
        const ballPos = ball.position;
        const rimPos = rim.position;
        
        // Store the ball's vertical position to track direction
        const ballMovingDown = ballPos.y > lastBallPosY;
        
        // Check if ball is above rim
        if (ballPos.y < rimPos.y) {
            hasPassedRimTop = true;
        }
        
        // Reset scoring state if ball moves above rim again or is far from rim
        if (ballPos.y < rimPos.y - BALL_RADIUS || 
            Math.abs(ballPos.x - rimPos.x) > RIM_WIDTH) {
            hasPassedRimTop = false;
            isScoring = false;
        }
        
        // Only check for scoring if enough time has passed since last score
        if (currentTime - lastScoreTime > SCORE_COOLDOWN && 
            !isScoring && 
            hasPassedRimTop && 
            ballMovingDown) {
            
            // Check if ball is passing through rim area
            if (ballPos.x > rimPos.x - RIM_WIDTH/2 && 
                ballPos.x < rimPos.x + RIM_WIDTH/2 && 
                ballPos.y > rimPos.y && 
                ballPos.y < rimPos.y + BALL_RADIUS * 2) {
                
                isScoring = true;
                score += 2;
                lastScoreTime = currentTime;
                scoreElement.textContent = `Score: ${score}`;
                
                // Add score animation
                scoreElement.style.transform = 'scale(1.5)';
                setTimeout(() => {
                    scoreElement.style.transform = 'scale(1)';
                }, 300);

                // Add a visual effect for scoring
                createScoreEffect(ballPos.x, ballPos.y);
            }
        }
        
        // Update last ball position
        lastBallPosY = ballPos.y;
    }

    function createScoreEffect(x: number, y: number) {
        // Create a DOM element for the score effect
        const effect = document.createElement('div');
        effect.className = 'score-effect';
        effect.textContent = '+2';
        effect.style.left = `${x}px`;
        effect.style.top = `${y}px`;
        gameContainer.appendChild(effect);
        
        // Remove the element after animation completes
        setTimeout(() => {
            effect.remove();
        }, 1000);
    }

    function updateAimLine(mouseX: number, mouseY: number) {
        if (!isDragging) return;

        const dx = startPos.x - mouseX;
        const dy = startPos.y - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        aimLine.style.width = `${Math.min(distance * 2, 150)}px`;
        aimLine.style.transform = `rotate(${angle}deg)`;
        
        const powerRatio = Math.min(distance / 150, 1);
        const r = Math.floor(255 * powerRatio);
        const g = Math.floor(255 * (1 - powerRatio));
        aimLine.style.backgroundColor = `rgb(${r}, ${g}, 0)`;
    }

    function handleMouseDown(event: MouseEvent) {
        const ballPos = ball.position;
        const mousePos = Matter.Vector.create(
            event.clientX - gameContainer.getBoundingClientRect().left,
            event.clientY - gameContainer.getBoundingClientRect().top
        );

        if (Matter.Vector.magnitude(Matter.Vector.sub(mousePos, ballPos)) < BALL_RADIUS * 2) {
            isDragging = true;
            startPos = { x: ballPos.x, y: ballPos.y };
            
            aimLine.style.display = 'block';
            aimLine.style.left = `${startPos.x}px`;
            aimLine.style.top = `${startPos.y}px`;
            aimLine.style.width = '0';
            aimLine.style.transform = 'rotate(0deg)';

            // Disable mouse constraint and make ball static while aiming
            Matter.World.remove(world, mouseConstraint);
            Matter.Body.setStatic(ball, true);
        }
    }

    function handleMouseMove(event: MouseEvent) {
        if (isDragging) {
            const containerRect = gameContainer.getBoundingClientRect();
            const mouseX = event.clientX - containerRect.left;
            const mouseY = event.clientY - containerRect.top;
            updateAimLine(mouseX, mouseY);
        }
    }

    function handleMouseUp(event: MouseEvent) {
        if (isDragging) {
            const containerRect = gameContainer.getBoundingClientRect();
            const mouseX = event.clientX - containerRect.left;
            const mouseY = event.clientY - containerRect.top;
            
            const dx = startPos.x - mouseX;
            const dy = startPos.y - mouseY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Make ball dynamic again before applying velocity
            Matter.Body.setStatic(ball, false);
            
            // Apply velocity to the ball
            const power = Math.min(distance * 0.2, 30);
            const velocityX = (dx / distance) * power;
            const velocityY = (dy / distance) * power;
            
            Matter.Body.setVelocity(ball, {
                x: velocityX,
                y: velocityY
            });
            
            isDragging = false;
            aimLine.style.display = 'none';

            // Re-enable mouse constraint
            Matter.World.add(world, mouseConstraint);
        }
    }

    function drawBasketballLines(render: Matter.Render) {
        const context = render.context;
        Matter.Events.on(render, 'afterRender', () => {
            const pos = ball.position;
            const angle = ball.angle;
            
            context.save();
            context.translate(pos.x, pos.y);
            context.rotate(angle);
            
            // Draw the lines
            context.beginPath();
            context.strokeStyle = BALL_STROKE;
            context.lineWidth = 2;
            
            // Horizontal line
            context.moveTo(-BALL_RADIUS, 0);
            context.lineTo(BALL_RADIUS, 0);
            
            // Vertical line
            context.moveTo(0, -BALL_RADIUS);
            context.lineTo(0, BALL_RADIUS);
            
            // Curved lines
            context.moveTo(-BALL_RADIUS * 0.7, -BALL_RADIUS * 0.7);
            context.quadraticCurveTo(0, -BALL_RADIUS * 0.2, BALL_RADIUS * 0.7, -BALL_RADIUS * 0.7);
            
            context.moveTo(-BALL_RADIUS * 0.7, BALL_RADIUS * 0.7);
            context.quadraticCurveTo(0, BALL_RADIUS * 0.2, BALL_RADIUS * 0.7, BALL_RADIUS * 0.7);
            
            context.stroke();
            context.restore();
        });
    }



    function drawCourtMarkings(render: Matter.Render) {
        const context = render.context;
        Matter.Events.on(render, 'beforeRender', () => {
            // Draw court floor
            context.fillStyle = '#334155';
            context.fillRect(0, containerHeight - 100, containerWidth, 100);
            
            // Draw free throw line
            context.beginPath();
            context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            context.lineWidth = 2;
            context.setLineDash([5, 5]);
            context.moveTo(100, containerHeight - 100);
            context.lineTo(containerWidth - 100, containerHeight - 100);
            context.stroke();
            context.setLineDash([]);
        });
    }

    onMount(() => {
        if (!isMobile()) {
            const containerRect = gameContainer.getBoundingClientRect();
            containerWidth = containerRect.width;
            containerHeight = containerRect.height;

            // Create engine and world
            engine = Matter.Engine.create({
                enableSleeping: false,
                gravity: { x: 0, y: 0.98 }
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
            ball = createBall(DEFAULT_X, containerHeight - DEFAULT_Y);
            
            // Create rim with collision disabled
            const rimObjects = createRim(containerWidth - 150, 250);
            rim = rimObjects.rim;
            const rimSensor = rimObjects.rimSensor;
            
            // Create chainNet
            const netObjects = createChainNet(containerWidth - 150, RIM_WIDTH, 250);
            
            // Create backboard
            const backboard = createBackboard(containerWidth - 150, 250);

            // Create the platform
            const platform = createPlatform(DEFAULT_X, containerHeight - DEFAULT_Y + BALL_RADIUS * 2 - 40);

            // Add all bodies to the world
            Matter.World.add(world, [
                ball,
                rim,
                rimSensor,
                backboard,
                ...platform,
                ...createWalls(),
                ...netObjects
            ]);

            // Add mouse control
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

            // Keep the mouse in sync with rendering
            render.mouse = mouse;

            // Start the engine and renderer
            runner = Matter.Runner.create({
                isFixed: true,
                delta: 1000/60
            });
            Matter.Runner.run(runner, engine);
            Matter.Render.run(render);

            // Setup basketball appearance
            drawBasketballLines(render);
            drawCourtMarkings(render);

            // Add event listeners
            window.addEventListener('mousedown', handleMouseDown);
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('resize', () => {
                const newRect = gameContainer.getBoundingClientRect();
                containerWidth = newRect.width;
                containerHeight = newRect.height;
                
                Matter.Render.setPixelRatio(render, window.devicePixelRatio);
                render.canvas.width = containerWidth;
                render.canvas.height = containerHeight;
                render.options.width = containerWidth;
                render.options.height = containerHeight;
            });

            // Add collision detection for scoring
            Matter.Events.on(engine, 'afterUpdate', checkScoring);

            // Add ground collision detection for resetting ball
            Matter.Events.on(engine, 'collisionStart', (event) => {
                event.pairs.forEach((pair) => {
                    if ((pair.bodyA === ball || pair.bodyB === ball) &&
                        ((pair.bodyA.position.y > containerHeight - 50) || 
                         (pair.bodyB.position.y > containerHeight - 50))) {
                        resetBall();
                    }
                });
            });
        }

        return () => {
            if (!isMobile()) {
                // Clean up Matter.js
                Matter.Runner.stop(runner);
                Matter.World.clear(world, false);
                Matter.Engine.clear(engine);
                Matter.Render.stop(render);
                render.canvas.remove();
                render.canvas = null;
                render.context = null;
                render.textures = {};

                // Remove event listeners
                window.removeEventListener('mousedown', handleMouseDown);
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            }
        };
    });
</script>

<div class="container mx-auto px-4 py-8 max-w-5xl">
    <div class="text-center mb-8">
        <h1 class="text-4xl font-bold mb-4">
            <span class="bg-gradient-to-r from-amber-700 to-amber-600 text-white px-4 py-2 rounded-lg shadow-md inline-block">
                Basketball Challenge
            </span>
        </h1>
    </div>

    <div class="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-6 shadow-lg border border-zinc-700 mb-8">
        <div class="game-container" bind:this={gameContainer}>
            <div class="score" bind:this={scoreElement}>
                Score: {score}
            </div>

            {#if !isMobile()}
                <button class="reset-button" on:click={resetGame}>Reset Game</button>
                
                <div class="instructions">
                    Click and pull back on the ball to shoot!
                </div>
                
                <div class="aim-line" bind:this={aimLine}></div>
            {:else}
                <div class="mobile-message">
                    Sorry, this game is only available on desktop devices.
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    .game-container {
        width: 100%;
        height: 70vh;
        overflow: hidden;
        background: linear-gradient(to bottom, #1e293b, #334155);
        cursor: default;
        border-radius: 0.5rem;
        position: relative;
        box-shadow: inset 0 0 50px rgba(0, 0, 0, 0.5);
    }

    .score {
        position: absolute;
        top: 20px;
        left: 20px;
        font-size: 32px;
        font-weight: bold;
        color: #f59e0b;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        transition: transform 0.3s ease;
        z-index: 1000;
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

    .aim-line {
        position: absolute;
        height: 4px;
        background-color: #f59e0b;
        transform-origin: left center;
        display: none;
        z-index: 900;
        border-radius: 2px;
        box-shadow: 0 0 5px rgba(245, 158, 11, 0.7);
    }

    .mobile-message {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        font-size: 18px;
        color: #f4f4f5;
        background-color: rgba(39, 39, 42, 0.8);
        padding: 15px 25px;
        border-radius: 10px;
    }

    .score-effect {
        position: absolute;
        font-size: 24px;
        font-weight: bold;
        color: #fbbf24;
        text-shadow: 0 0 5px rgba(0,0,0,0.5);
        animation: score-animation 1s ease-out forwards;
        transform: translate(-50%, -50%);
        pointer-events: none;
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

    /* Ensure text is readable in light mode too */
    @media (prefers-color-scheme: light) {
        .bg-gradient-to-r.from-amber-700.to-amber-600 {
            color: white;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }
    }
</style>