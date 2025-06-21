import { useLayoutEffect, useRef, useState } from "react";

const HeadTracker = ({ onHeadMove }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState(null);
  const [centerX, setCenterX] = useState(null);
  const [status, setStatus] = useState('Click "Start Camera" to begin');
  const [debugInfo, setDebugInfo] = useState({ frame: 0 });

  // Use refs to maintain state across re-mounts
  const streamRef = useRef(null);
  const animationIdRef = useRef(null);
  const isTrackingRef = useRef(false);
  const frameCountRef = useRef(0);
  const centerXRef = useRef(null);
  const previousFrameRef = useRef(null);

  // Sync refs with state
  useLayoutEffect(() => {
    isTrackingRef.current = isTracking;
  }, [isTracking]);

  useLayoutEffect(() => {
    centerXRef.current = centerX;
  }, [centerX]);

  const startCamera = async () => {
    try {
      setStatus("🎥 Starting camera...");
      setError(null);

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });

      streamRef.current = stream;

      // Set up video element
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.play();

        // Wait for video to be ready
        video.onloadedmetadata = () => {
          setStatus("📹 Camera ready! Starting head tracking...");

          // Reset frame counter
          frameCountRef.current = 0;

          // Start tracking
          setIsTracking(true);

          // Start the detection loop after a short delay
          setTimeout(() => {
            startDetection();
          }, 200);
        };

        // Also handle when video starts playing
        video.onplaying = () => {
          if (!isTrackingRef.current) {
            setIsTracking(true);
            setTimeout(() => {
              startDetection();
            }, 100);
          }
        };
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError(
        "❌ Failed to access camera. Please allow camera permissions and try again."
      );
    }
  };

  const stopCamera = () => {
    // Stop the animation loop
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }

    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Reset video
    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }

    // Reset state
    setIsTracking(false);
    isTrackingRef.current = false;
    setCenterX(null);
    centerXRef.current = null;
    setStatus("🛑 Camera stopped");
    frameCountRef.current = 0;
    setDebugInfo({ frame: 0 });
    previousFrameRef.current = null;
  };

  const startDetection = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");

    const detect = () => {
      // Check if we should continue detecting
      if (!isTrackingRef.current) {
        if (animationIdRef.current) {
          cancelAnimationFrame(animationIdRef.current);
          animationIdRef.current = null;
        }
        return;
      }

      // Wait for video to be ready
      if (!video.videoWidth || !video.videoHeight) {
        // Video not ready yet, try again next frame
        animationIdRef.current = requestAnimationFrame(detect);
        return;
      }

      // Increment frame counter
      frameCountRef.current++;
      setDebugInfo({ frame: frameCountRef.current });

      // Set canvas size to match video (only if different)
      if (
        canvas.width !== video.videoWidth ||
        canvas.height !== video.videoHeight
      ) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      // Save context for mirroring
      ctx.save();

      // Flip the canvas horizontally for mirror effect
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width, 0);

      // Draw video frame to canvas (mirrored)
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Restore context
      ctx.restore();

      // Detect head movement (on the mirrored canvas)
      detectHeadMovement(ctx, canvas);

      // Schedule next frame
      animationIdRef.current = requestAnimationFrame(detect);
    };

    // Start the detection loop with a small delay to ensure video is ready
    setTimeout(() => {
      if (isTrackingRef.current) {
        animationIdRef.current = requestAnimationFrame(detect);
      }
    }, 100);
  };

  const detectHeadMovement = (ctx, canvas) => {
    // Get image data for processing
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Simple face detection using skin color detection
    let totalX = 0;
    let totalY = 0;
    let pixelCount = 0;

    // Scan for skin-colored pixels (simplified face detection)
    for (let y = 0; y < canvas.height; y += 4) {
      for (let x = 0; x < canvas.width; x += 4) {
        const index = (y * canvas.width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];

        // Simple skin color detection
        if (isSkinColor(r, g, b)) {
          totalX += x;
          totalY += y;
          pixelCount++;
        }
      }
    }

    if (pixelCount > 500) {
      // Minimum threshold for detection
      const avgX = totalX / pixelCount;
      const avgY = totalY / pixelCount;

      // Draw detection indicator
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(avgX, avgY, 50, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#00ff00";
      ctx.font = "bold 16px Arial";
      ctx.fillText("👤 Head Detected", 10, 30);

      // Process the detected position
      processHeadPosition(avgX, ctx, canvas);
    } else {
      // No face detected
      ctx.fillStyle = "#ff0000";
      ctx.font = "bold 16px Arial";
      ctx.fillText("❌ No face detected", 10, 30);
      ctx.fillText("Move closer to camera", 10, 55);
    }

    // Draw frame counter
    ctx.fillStyle = "#ffffff";
    ctx.font = "12px Arial";
    ctx.fillText(`Frame: ${frameCountRef.current}`, canvas.width - 100, 20);
  };

  const isSkinColor = (r, g, b) => {
    // Simple skin color detection algorithm
    // This is a basic implementation - you can improve it
    return (
      r > 95 &&
      g > 40 &&
      b > 20 &&
      r > g &&
      r > b &&
      Math.abs(r - g) > 15 &&
      Math.max(r, g, b) - Math.min(r, g, b) > 15
    );
  };

  const processHeadPosition = (detectedX, ctx, canvas) => {
    if (centerXRef.current === null) {
      setCenterX(detectedX);
      centerXRef.current = detectedX;
      setStatus(
        "🎯 Center calibrated! Move your head left/right to control paddle."
      );
      return;
    }

    // Calculate movement relative to center with increased sensitivity
    // Since the image is mirrored, we don't need to invert the movement here
    const rawMovement = (detectedX - centerXRef.current) / (canvas.width / 2.2); // Reduced divisor for more sensitivity
    const clampedMovement = Math.max(-1, Math.min(1, rawMovement));

    // Send head movement to parent (no inversion needed since image is already mirrored)
    onHeadMove(clampedMovement);

    // Visual feedback - center line
    ctx.strokeStyle = "#ffff00";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerXRef.current, 0);
    ctx.lineTo(centerXRef.current, canvas.height);
    ctx.stroke();

    // Current position indicator
    ctx.fillStyle = "#ff0000";
    ctx.beginPath();
    ctx.arc(detectedX, canvas.height / 2, 8, 0, Math.PI * 2);
    ctx.fill();

    // Movement indicator
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px Arial";
    ctx.fillText(
      `Movement: ${clampedMovement.toFixed(2)}`,
      10,
      canvas.height - 40
    );

    const direction =
      clampedMovement > 0.1
        ? "→ RIGHT"
        : clampedMovement < -0.1
        ? "← LEFT"
        : "CENTER";
    ctx.fillText(`Direction: ${direction}`, 10, canvas.height - 20);
  };

  const recalibrateCenter = () => {
    setCenterX(null);
    centerXRef.current = null;
    setStatus("🎯 Move your head to center position...");
  };

  // Cleanup effect - crucial for React 19 StrictMode
  useLayoutEffect(() => {
    return () => {
      // Cleanup animation on unmount
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }

      // Stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // Reset refs
      isTrackingRef.current = false;
      frameCountRef.current = 0;
      centerXRef.current = null;
    };
  }, []);

  if (error) {
    return (
      <div className="head-tracker error">
        <h3>🚫 Camera Error</h3>
        <p>{error}</p>
        <button onClick={startCamera}>🔄 Try Again</button>
        <p style={{ fontSize: "12px", color: "#666", marginTop: "10px" }}>
          Make sure to allow camera permissions in your browser
        </p>
      </div>
    );
  }

  return (
    <div className="head-tracker">
      <h2>Head Tracking</h2>

      <div className="tracker-container">
        {/* Hidden video element for camera feed */}
        <video
          ref={videoRef}
          style={{ display: "none" }}
          autoPlay
          muted
          playsInline
        />

        {/* Canvas for detection visualization */}
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="tracker-canvas"
          style={{
            border: "2px solid #333",
            borderRadius: "8px",
            maxWidth: "100%",
            height: "auto",
            backgroundColor: "#000",
          }}
        />

        <div className="tracker-controls">
          {!isTracking ? (
            <button onClick={startCamera} className="start-btn">
              🎥 Start Camera
            </button>
          ) : (
            <>
              <button onClick={recalibrateCenter} className="recalibrate-btn">
                🎯 Recalibrate
              </button>
              <button onClick={stopCamera} className="stop-btn">
                🛑 Stop Camera
              </button>
            </>
          )}
        </div>

        <div className="status-info">
          <p>
            <strong>Status:</strong> {status}
          </p>
          <p>
            <strong>Frame:</strong> {debugInfo.frame}
          </p>
        </div>
      </div>

      <div className="instructions">
        <p>
          📋 <strong>Instructions:</strong>
        </p>
        <p>
          🚀 <strong>Step 1:</strong> Click "Start Camera" and allow camera
          access
        </p>
        <p>
          🎯 <strong>Step 2:</strong> Position your face in center, then click
          "Recalibrate"
        </p>
        <p>
          🎮 <strong>Step 3:</strong> Move your head left/right to control the
          paddle!
        </p>
        <p>
          🪞 <strong>Note:</strong> Camera shows mirror image for natural
          control
        </p>
      </div>
    </div>
  );
};

export default HeadTracker;
