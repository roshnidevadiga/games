import { useLayoutEffect, useRef, useState } from "react";
import HeadTracker from "./HeadTracker";
import "./PingPongGame.css";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const WALL_HEIGHT = 20;
const BASE_BALL_SPEED = { dx: 4, dy: 3 }; // Base speed values

const PingPongGame = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Game state
  const [gameState, setGameState] = useState({
    ball: { x: 400, y: 300, dx: 4, dy: 3, radius: 10 },
    paddle: { x: 350, y: 550, width: 100, height: 10 },
    score: 0,
    isPlaying: false,
    isPaused: false,
  });

  // Speed control state
  const [speedMultiplier, setSpeedMultiplier] = useState(1); // 0.5x to 3x speed

  // Head tracking state
  const [headPosition, setHeadPosition] = useState(0); // -1 to 1, where 0 is center

  // Use refs to maintain state across re-mounts
  const gameStateRef = useRef(gameState);
  const isPlayingRef = useRef(false);
  const isPausedRef = useRef(false);

  // Sync refs with state
  useLayoutEffect(() => {
    gameStateRef.current = gameState;
    isPlayingRef.current = gameState.isPlaying;
    isPausedRef.current = gameState.isPaused;
  }, [gameState]);

  // Initialize canvas
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
    }
  }, []);

  // Game loop effect
  useLayoutEffect(() => {
    if (gameState.isPlaying && !gameState.isPaused) {
      startGameLoop();
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [gameState.isPlaying, gameState.isPaused]);

  // Update paddle position based on head movement
  useLayoutEffect(() => {
    // Increase sensitivity - use a multiplier to extend range
    const sensitivity = 1.4; // Amplify head movement for better range
    const amplifiedMovement = headPosition * sensitivity;

    setGameState((prev) => ({
      ...prev,
      paddle: {
        ...prev.paddle,
        x: Math.max(
          0,
          Math.min(
            CANVAS_WIDTH - prev.paddle.width,
            CANVAS_WIDTH / 2 +
              amplifiedMovement * (CANVAS_WIDTH / 1.6) -
              prev.paddle.width / 2
          )
        ),
      },
    }));
  }, [headPosition]);

  // Mouse control fallback
  const handleMouseMove = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;

    setGameState((prev) => ({
      ...prev,
      paddle: {
        ...prev.paddle,
        x: Math.max(
          0,
          Math.min(
            CANVAS_WIDTH - prev.paddle.width,
            mouseX - prev.paddle.width / 2
          )
        ),
      },
    }));
  };

  const startGameLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    const gameLoop = () => {
      // Check if we should continue the game loop
      if (!isPlayingRef.current || isPausedRef.current) {
        animationRef.current = null;
        return;
      }

      const currentState = gameStateRef.current;
      if (!currentState) {
        animationRef.current = null;
        return;
      }

      // Clear canvas
      ctx.fillStyle = "#001122";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw wall (top)
      ctx.fillStyle = "#ff6b6b";
      ctx.fillRect(0, 0, CANVAS_WIDTH, WALL_HEIGHT);

      // Calculate new ball position
      const newBall = { ...currentState.ball };

      // Apply speed multiplier to ball movement
      newBall.x += newBall.dx * speedMultiplier;
      newBall.y += newBall.dy * speedMultiplier;

      // Wall collision (top)
      if (newBall.y - newBall.radius <= WALL_HEIGHT) {
        newBall.dy = Math.abs(newBall.dy); // Make sure it bounces down
        newBall.y = WALL_HEIGHT + newBall.radius;
      }

      // Side walls collision
      if (newBall.x - newBall.radius <= 0) {
        newBall.dx = Math.abs(newBall.dx); // Bounce right
        newBall.x = newBall.radius;
      } else if (newBall.x + newBall.radius >= CANVAS_WIDTH) {
        newBall.dx = -Math.abs(newBall.dx); // Bounce left
        newBall.x = CANVAS_WIDTH - newBall.radius;
      }

      // Paddle collision
      if (
        newBall.y + newBall.radius >= currentState.paddle.y &&
        newBall.y - newBall.radius <=
          currentState.paddle.y + currentState.paddle.height &&
        newBall.x >= currentState.paddle.x &&
        newBall.x <= currentState.paddle.x + currentState.paddle.width
      ) {
        // Position ball just above paddle to prevent sticking
        newBall.y = currentState.paddle.y - newBall.radius;

        // Calculate where on the paddle the ball hit (0 = left edge, 1 = right edge)
        const hitPosition =
          (newBall.x - currentState.paddle.x) / currentState.paddle.width;

        // Calculate the current ball speed magnitude to maintain energy
        const currentSpeed = Math.sqrt(
          newBall.dx * newBall.dx + newBall.dy * newBall.dy
        );

        // Determine new trajectory based on hit position
        let newAngle;

        if (hitPosition < 0.2) {
          // Hit on far left - sharp angle left (120-150 degrees)
          newAngle = (Math.PI * (120 + Math.random() * 30)) / 180;
        } else if (hitPosition < 0.4) {
          // Hit on left side - moderate angle left (90-120 degrees)
          newAngle = (Math.PI * (90 + Math.random() * 30)) / 180;
        } else if (hitPosition < 0.6) {
          // Hit in center - mostly straight up with slight variation (60-120 degrees)
          newAngle = (Math.PI * (60 + Math.random() * 60)) / 180;
        } else if (hitPosition < 0.8) {
          // Hit on right side - moderate angle right (60-90 degrees)
          newAngle = (Math.PI * (60 + Math.random() * 30)) / 180;
        } else {
          // Hit on far right - sharp angle right (30-60 degrees)
          newAngle = (Math.PI * (30 + Math.random() * 30)) / 180;
        }

        // Apply the new trajectory while maintaining ball speed
        newBall.dx = Math.cos(newAngle) * currentSpeed;
        newBall.dy = -Math.abs(Math.sin(newAngle) * currentSpeed); // Ensure upward movement

        // Add some randomness for more dynamic gameplay (±10% speed variation)
        const speedVariation = 0.9 + Math.random() * 0.2;
        newBall.dx *= speedVariation;
        newBall.dy *= speedVariation;

        // Ensure minimum upward velocity to prevent horizontal shots
        if (Math.abs(newBall.dy) < 2) {
          newBall.dy = newBall.dy < 0 ? -2 : 2;
        }

        // Update state with new ball and score
        setGameState((prev) => ({
          ...prev,
          ball: newBall,
          score: prev.score + 1,
        }));
      } else if (newBall.y > CANVAS_HEIGHT + 50) {
        // Ball missed (bottom) - game over
        setGameState((prev) => ({
          ...prev,
          ball: {
            x: 400,
            y: 300,
            dx: BASE_BALL_SPEED.dx,
            dy: BASE_BALL_SPEED.dy,
            radius: 10,
          },
          isPlaying: false,
          isPaused: false,
        }));
        animationRef.current = null;
        return; // Exit the game loop
      } else {
        // Normal ball movement - just update ball position
        setGameState((prev) => ({
          ...prev,
          ball: newBall,
        }));
      }

      // Draw ball
      ctx.fillStyle = "#4ecdc4";
      ctx.beginPath();
      ctx.arc(newBall.x, newBall.y, newBall.radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw paddle
      ctx.fillStyle = "#45b7d1";
      ctx.fillRect(
        currentState.paddle.x,
        currentState.paddle.y,
        currentState.paddle.width,
        currentState.paddle.height
      );

      // Draw score
      ctx.fillStyle = "#ffffff";
      ctx.font = "24px Arial";
      ctx.fillText(`Score: ${currentState.score}`, 20, 40);

      // Continue the game loop
      animationRef.current = requestAnimationFrame(gameLoop);
    };

    // Start the game loop
    animationRef.current = requestAnimationFrame(gameLoop);
  };

  const startGame = () => {
    console.log("Starting game...");
    setGameState((prev) => ({
      ...prev,
      ball: {
        x: 400,
        y: 300,
        dx: BASE_BALL_SPEED.dx,
        dy: BASE_BALL_SPEED.dy,
        radius: 10,
      },
      score: 0,
      isPlaying: true,
      isPaused: false,
    }));
  };

  const pauseGame = () => {
    setGameState((prev) => ({
      ...prev,
      isPaused: !prev.isPaused,
    }));
  };

  const stopGame = () => {
    setGameState((prev) => ({
      ...prev,
      isPlaying: false,
      isPaused: false,
    }));
  };

  const resetGame = () => {
    setGameState({
      ball: {
        x: 400,
        y: 300,
        dx: BASE_BALL_SPEED.dx,
        dy: BASE_BALL_SPEED.dy,
        radius: 10,
      },
      paddle: { x: 350, y: 550, width: 100, height: 10 },
      score: 0,
      isPlaying: false,
      isPaused: false,
    });
  };

  // Function to handle head movement from HeadTracker component
  const handleHeadMove = (movement) => {
    setHeadPosition(movement);
  };

  // Function to handle speed change
  const handleSpeedChange = (event) => {
    setSpeedMultiplier(parseFloat(event.target.value));
  };

  return (
    <div className="ping-pong-app">
      <h1>🏓 Motion Ping Pong</h1>
      <p>Move your head left and right to control the paddle!</p>

      <div className="main-container">
        {/* Head Tracker Section */}
        <div className="head-tracker-section">
          <HeadTracker onHeadMove={handleHeadMove} />
        </div>

        {/* Game Section */}
        <div className="game-section">
          <h2>Game</h2>
          <canvas
            ref={canvasRef}
            className="game-canvas"
            onMouseMove={handleMouseMove}
          />

          <div className="game-controls">
            <div className="control-buttons">
              <button
                onClick={startGame}
                className="start-btn"
                disabled={gameState.isPlaying && !gameState.isPaused}
              >
                {gameState.isPlaying
                  ? gameState.isPaused
                    ? "Resume"
                    : "Playing..."
                  : "Start Game"}
              </button>

              {gameState.isPlaying && (
                <button onClick={pauseGame} className="pause-btn">
                  {gameState.isPaused ? "▶️ Resume" : "⏸️ Pause"}
                </button>
              )}

              <button
                onClick={stopGame}
                className="stop-btn"
                disabled={!gameState.isPlaying}
              >
                🛑 Stop
              </button>

              <button onClick={resetGame} className="reset-btn">
                🔄 Reset
              </button>
            </div>

            {/* Speed Control */}
            <div className="speed-control">
              <label htmlFor="speed-slider">
                ⚡ Ball Speed: {speedMultiplier.toFixed(1)}x
              </label>
              <input
                id="speed-slider"
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={speedMultiplier}
                onChange={handleSpeedChange}
                className="speed-slider"
              />
              <div className="speed-labels">
                <span>0.5x</span>
                <span>1x</span>
                <span>2x</span>
                <span>3x</span>
              </div>
            </div>

            <div className="game-info">
              <p className="score">Score: {gameState.score}</p>
              <p className="status">
                {gameState.isPlaying
                  ? gameState.isPaused
                    ? "Game Paused"
                    : "Playing - Use head tracking or mouse!"
                  : "Click Start Game to begin"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PingPongGame;
