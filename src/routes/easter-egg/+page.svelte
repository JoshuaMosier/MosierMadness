<script lang="ts">
    import { onMount } from 'svelte';

    let ball: HTMLDivElement;
    let rim: HTMLDivElement;
    let hoop: HTMLDivElement;
    let scoreElement: HTMLDivElement;
    let aimLine: HTMLDivElement;
    let gameContainer: HTMLDivElement;
    let netLeft: HTMLDivElement;
    let netRight: HTMLDivElement;
    let score = 0;
    let pos = { x: 100, y: 300 };
    let vel = { x: 0, y: 0 };
    let isDragging = false;
    let startPos = { x: 0, y: 0 };
    let lastTime = 0;
    let lastScoreTime = 0;
    let animationFrame: number;
    let isShooting = false;
    let containerWidth = 0;
    let containerHeight = 0;
    
    // Default starting position
    const defaultPosition = { x: 200, y: 200 };
    
    const FPS = 60;
    const frameTime = 1000 / FPS;
    const gravity = 0.5;
    const bounce = 0.8;
    const friction = 0.99;
    const powerFactor = 0.2;
    const maxPower = 30;
    const ballRadius = 20; // Half the ball size
    const ballSize = 40;
    const netWidth = 5; // Width of net sides
    const netHeight = 80; // Height of net sides
    const netAngle = 10; // Angle of net sides in degrees
    const minBounceVelocity = 0.5; // Minimum velocity after bounce
    const collisionOffset = 4; // Pixels to offset after collision
    const scoreCooldown = 100; // Milliseconds before another score can be counted
    const scoreZoneOffset = 10; // Pixels below net bottom to check for scoring

    const isMobile = () => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };

    // Reset ball to starting position
    function resetBallPosition() {
        isShooting = false;
        pos = { 
            x: defaultPosition.x, 
            y: containerHeight - ballSize - defaultPosition.y 
        };
        vel = { x: 0, y: 0 };
    }

    // Helper function to check collision between ball and line segment
    function checkLineCollision(ballX: number, ballY: number, x1: number, y1: number, x2: number, y2: number): boolean {
        // Vector from line start to ball
        const v1x = ballX - x1;
        const v1y = ballY - y1;
        // Vector from line start to line end
        const v2x = x2 - x1;
        const v2y = y2 - y1;
        // Length of line segment squared
        const lengthSq = v2x * v2x + v2y * v2y;
        
        // Calculate dot product and clamp to [0,1]
        const t = Math.max(0, Math.min(1, (v1x * v2x + v1y * v2y) / lengthSq));
        
        // Find closest point on line segment
        const closestX = x1 + t * v2x;
        const closestY = y1 + t * v2y;
        
        // Check if distance is less than ball radius
        const dx = ballX - closestX;
        const dy = ballY - closestY;
        const distanceSq = dx * dx + dy * dy;
        
        return distanceSq < ballRadius * ballRadius;
    }

    // Helper function to handle collision response
    function handleNetCollision(netX1: number, netY1: number, netX2: number, netY2: number) {
        // Calculate normal vector of the net line
        const dx = netX2 - netX1;
        const dy = netY2 - netY1;
        const length = Math.sqrt(dx * dx + dy * dy);
        const nx = -dy / length; // Normal x component
        const ny = dx / length;  // Normal y component
        
        // Calculate dot product of velocity and normal
        const dotProduct = vel.x * nx + vel.y * ny;
        
        // Calculate reflection vector
        vel.x = vel.x - 2 * dotProduct * nx;
        vel.y = vel.y - 2 * dotProduct * ny;
        
        // Apply bounce factor
        vel.x *= bounce;
        vel.y *= bounce;

        // Ensure minimum velocity after bounce to prevent sticking
        const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
        if (speed < minBounceVelocity) {
            const scale = minBounceVelocity / speed;
            vel.x *= scale;
            vel.y *= scale;
        }

        // Add a small offset in the direction of the bounce to prevent sticking
        pos.x += nx * collisionOffset;
        pos.y += ny * collisionOffset;
    }

    // Helper function to check if ball is between two x coordinates
    function isBallBetween(x1: number, x2: number, ballX: number): boolean {
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        return ballX >= minX && ballX <= maxX;
    }

    // Helper function to check if a point has crossed a line segment
    function hasPointCrossedLine(prevX: number, prevY: number, currX: number, currY: number, 
                               lineX1: number, lineY1: number, lineX2: number, lineY2: number): boolean {
        // Check if the line segments intersect
        const denominator = ((currX - prevX) * (lineY2 - lineY1) - (currY - prevY) * (lineX2 - lineX1));
        if (denominator === 0) return false;
        
        const ua = ((lineX2 - lineX1) * (prevY - lineY1) - (lineY2 - lineY1) * (prevX - lineX1)) / denominator;
        const ub = ((currX - prevX) * (prevY - lineY1) - (currY - prevY) * (prevX - lineX1)) / denominator;
        
        return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
    }

    function animate(currentTime = performance.now()) {
        const deltaTime = currentTime - lastTime;

        if (deltaTime >= frameTime) {
            lastTime = currentTime - (deltaTime % frameTime);
            
            if (isShooting) {
                // Store previous position for collision resolution
                const prevX = pos.x + ballRadius;
                const prevY = pos.y + ballRadius;

                // Physics simulation
                vel.y += gravity;
                pos.x += vel.x;
                pos.y += vel.y;

                // Get net positions
                const containerRect = gameContainer.getBoundingClientRect();
                const hoopRect = hoop.getBoundingClientRect();
                const netLeftRect = netLeft.getBoundingClientRect();
                const netRightRect = netRight.getBoundingClientRect();
                
                // Calculate net line segments relative to container
                const leftNetX1 = netLeftRect.left - containerRect.left;
                const leftNetY1 = netLeftRect.top - containerRect.top;
                const leftNetX2 = leftNetX1 + Math.sin(netAngle * Math.PI / 180) * netHeight;
                const leftNetY2 = leftNetY1 + Math.cos(netAngle * Math.PI / 180) * netHeight;
                
                const rightNetX1 = netRightRect.left - containerRect.left;
                const rightNetY1 = netRightRect.top - containerRect.top;
                const rightNetX2 = rightNetX1 - Math.sin(netAngle * Math.PI / 180) * netHeight;
                const rightNetY2 = rightNetY1 + Math.cos(netAngle * Math.PI / 180) * netHeight;

                // Ball center position
                const ballCenterX = pos.x + ballRadius;
                const ballCenterY = pos.y + ballRadius;

                // Check for scoring
                if (currentTime - lastScoreTime > scoreCooldown) {
                    // Define scoring line (just below the bottom of the net)
                    const scoreY = Math.max(leftNetY2, rightNetY2) + scoreZoneOffset;
                    const scoreX1 = leftNetX2;
                    const scoreX2 = rightNetX2;

                    // Check if ball has crossed the scoring line from above
                    if (prevY < scoreY && ballCenterY >= scoreY && 
                        isBallBetween(scoreX1, scoreX2, ballCenterX) && 
                        vel.y > 0) { // Only count if ball is moving downward
                        score+=2;
                        lastScoreTime = currentTime;
                        scoreElement.textContent = `Score: ${score}`;
                        
                        // Add score animation
                        scoreElement.style.transform = 'scale(1.2)';
                        setTimeout(() => {
                            scoreElement.style.transform = 'scale(1)';
                        }, 200);
                    }
                }

                // Check for collisions with net sides
                const leftCollision = checkLineCollision(ballCenterX, ballCenterY, leftNetX1, leftNetY1, leftNetX2, leftNetY2);
                const rightCollision = checkLineCollision(ballCenterX, ballCenterY, rightNetX1, rightNetY1, rightNetX2, rightNetY2);

                // Handle only one collision per frame, prioritize the one with higher velocity impact
                if (leftCollision || rightCollision) {
                    // Calculate line vectors for both nets
                    const leftDx = leftNetX2 - leftNetX1;
                    const leftDy = leftNetY2 - leftNetY1;
                    const rightDx = rightNetX2 - rightNetX1;
                    const rightDy = rightNetY2 - rightNetY1;
                    
                    const leftLength = Math.sqrt(leftDx * leftDx + leftDy * leftDy);
                    const rightLength = Math.sqrt(rightDx * rightDx + rightDy * rightDy);
                    
                    const leftDot = leftCollision ? Math.abs(vel.x * (-leftDy / leftLength) + vel.y * (leftDx / leftLength)) : 0;
                    const rightDot = rightCollision ? Math.abs(vel.x * (-rightDy / rightLength) + vel.y * (rightDx / rightLength)) : 0;

                    if (leftCollision && (!rightCollision || leftDot > rightDot)) {
                        handleNetCollision(leftNetX1, leftNetY1, leftNetX2, leftNetY2);
                    } else if (rightCollision) {
                        handleNetCollision(rightNetX1, rightNetY1, rightNetX2, rightNetY2);
                    }
                }

                // Container boundaries
                if (pos.y > containerHeight - ballSize) {
                    // Ball has touched the ground - reset to starting position
                    resetBallPosition();
                }
                else if (pos.x > containerWidth - ballSize) {
                    pos.x = containerWidth - ballSize;
                    vel.x = -vel.x * bounce;
                }
                else if (pos.x < 0) {
                    pos.x = 0;
                    vel.x = -vel.x * bounce;
                }
                else if (pos.y < 0) {
                    pos.y = 0;
                    vel.y = -vel.y * bounce;
                }
                else {
                    // Apply friction
                    vel.x *= friction;
                    vel.y *= friction;
                }
            }

            if (ball) {
                ball.style.left = `${pos.x}px`;
                ball.style.top = `${pos.y}px`;
                
                // Add rotation based on horizontal velocity
                ball.style.transform = `rotate(${vel.x * 5}deg)`;
            }
        }

        animationFrame = requestAnimationFrame(animate);
    }

    function handleMouseDown(event: MouseEvent) {
        if (isShooting) return; // Don't allow new shots while ball is in motion
        
        const ballRect = ball.getBoundingClientRect();
        const containerRect = gameContainer.getBoundingClientRect();
        
        // Convert mouse coordinates to be relative to the container
        const relativeX = event.clientX - containerRect.left;
        const relativeY = event.clientY - containerRect.top;
        
        // Check if click is within the ball
        if (
            relativeX >= ballRect.left - containerRect.left &&
            relativeX <= ballRect.right - containerRect.left &&
            relativeY >= ballRect.top - containerRect.top &&
            relativeY <= ballRect.bottom - containerRect.top
        ) {
            event.preventDefault();
            isDragging = true;
            startPos = { 
                x: ballRect.left - containerRect.left + ballRect.width / 2, 
                y: ballRect.top - containerRect.top + ballRect.height / 2 
            };
            
            // Show aim line
            aimLine.style.display = 'block';
            aimLine.style.left = `${startPos.x}px`;
            aimLine.style.top = `${startPos.y}px`;
            aimLine.style.width = '0';
            aimLine.style.transform = 'rotate(0deg)';
        }
    }

    function handleMouseMove(event: MouseEvent) {
        if (isDragging) {
            event.preventDefault();
            
            const containerRect = gameContainer.getBoundingClientRect();
            const relativeX = event.clientX - containerRect.left;
            const relativeY = event.clientY - containerRect.top;
            
            // Calculate direction and power
            const dx = startPos.x - relativeX;
            const dy = startPos.y - relativeY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            
            // Limit the maximum power
            const power = Math.min(distance, maxPower / powerFactor);
            
            // Update aim line
            aimLine.style.width = `${power * 2}px`;
            aimLine.style.transform = `rotate(${angle}deg)`;
            
            // Update power indicator color based on power level
            const powerRatio = power / (maxPower / powerFactor);
            const r = Math.floor(255 * powerRatio);
            const g = Math.floor(255 * (1 - powerRatio));
            aimLine.style.backgroundColor = `rgb(${r}, ${g}, 0)`;
        }
    }

    function handleMouseUp(event: MouseEvent) {
        if (isDragging) {
            event.preventDefault();
            isDragging = false;
            
            const containerRect = gameContainer.getBoundingClientRect();
            const relativeX = event.clientX - containerRect.left;
            const relativeY = event.clientY - containerRect.top;
            
            // Calculate velocity based on pull distance and direction
            const dx = startPos.x - relativeX;
            const dy = startPos.y - relativeY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Limit the maximum power
            const power = Math.min(distance * powerFactor, maxPower);
            
            // Set velocity based on pull direction and power
            vel.x = dx * powerFactor;
            vel.y = dy * powerFactor;
            
            // Hide aim line
            aimLine.style.display = 'none';
            
            // Start the shot
            isShooting = true;
        }
    }

    function resetGame() {
        score = 0;
        resetBallPosition();
    }

    function updateContainerDimensions() {
        if (gameContainer) {
            const rect = gameContainer.getBoundingClientRect();
            containerWidth = rect.width;
            containerHeight = rect.height;
            resetBallPosition();
        }
    }

    onMount(() => {
        if (!isMobile()) {
            lastTime = performance.now();
            
            // Get container dimensions
            updateContainerDimensions();
            
            // Position ball at starting position
            resetBallPosition();
            
            animate();
            
            // Add event listeners
            window.addEventListener('mousedown', handleMouseDown);
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('resize', updateContainerDimensions);
        }

        return () => {
            if (!isMobile()) {
                if (animationFrame) {
                    cancelAnimationFrame(animationFrame);
                }
                
                // Clean up event listeners
                window.removeEventListener('mousedown', handleMouseDown);
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
                window.removeEventListener('resize', updateContainerDimensions);
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
        
        <div class="basketball-hoop" bind:this={hoop}>
          <div class="rim" bind:this={rim}></div>
          <div class="net-container">
            <div class="net-side net-left" bind:this={netLeft}></div>
            <div class="net-side net-right" bind:this={netRight}></div>
          </div>
        </div>

        <div 
          class="basketball"
          bind:this={ball}
          style="left: {pos.x}px; top: {pos.y}px;"
        >
          🏀
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
        background: linear-gradient(to bottom, #7a828f00, #9fa4b149);
        cursor: default;
        border-radius: 0.5rem;
        position: relative;
    }

    .score {
        position: absolute;
        top: 20px;
        left: 20px;
        font-size: 32px;
        font-weight: bold;
        color: #f59e0b;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        transition: transform 0.2s ease;
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
        transition: background 0.2s;
        z-index: 1000;
    }

    .reset-button:hover {
        background: #92400e;
    }

    .basketball {
        position: absolute;
        width: 40px;
        height: 40px;
        cursor: grab;
        user-select: none;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 50px;
        z-index: 1000;
        transition: transform 0.1s linear;
    }

    .basketball:active {
        cursor: grabbing;
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

    .basketball-hoop {
        position: absolute;
        right: 100px;
        top: 200px;
        width: 120px;
        height: 100px;
        z-index: 900;
    }

    .rim {
        position: absolute;
        right: 15px;
        top: 40px;
        width: 120px;
        height: 5px;
        background: #f59e0b;
        border: 2px solid #b45309;
        border-radius: 3px;
        box-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }

    .net-container {
        position: absolute;
        right: 15px;
        top: 45px;
        width: 120px;
        height: 80px;
        overflow: visible;
    }

    .net-side {
        position: absolute;
        width: 5px;
        height: 80px;
        background-color: rgba(255, 255, 255, 0.2);
        z-index: 899;
    }

    .net-left {
        left: 0;
        transform: rotate(-10deg);
        transform-origin: top left;
    }

    .net-right {
        right: 0;
        transform: rotate(10deg);
        transform-origin: top right;
    }

    .mobile-message {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        font-size: 18px;
        color: #f4f4f5;
    }

    /* Ensure text is readable in light mode too */
    @media (prefers-color-scheme: light) {
        .bg-gradient-to-r.from-amber-700.to-amber-600 {
            color: white;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }
    }
</style>
