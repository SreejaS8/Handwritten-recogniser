import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './pixel-style.css';

const PixelDigitRecognizer = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [hasPredicted, setHasPredicted] = useState(false);
  const [result, setResult] = useState({ prediction: '', confidence: 0, message: null });
  const [xp, setXp] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set up canvas
    canvas.width = 280;
    canvas.height = 280;
    ctx.fillStyle = '#D2B48C';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
  }, []);

  // Drawing functions
  const startDrawing = (e) => {
    setIsDrawing(true);
    setHasDrawn(true);
    draw(e);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.beginPath();
      setIsDrawing(false);
    }
  };

  // Function to simulate or make a prediction
  const predict = async () => {
    if (!hasDrawn) {
      // If nothing is drawn, display a message within the UI
      setResult({ prediction: "N/A", confidence: 0, message: "Draw something first!" });
      return;
    }

    if (hasPredicted) {
      // If already predicted for this drawing, show message
      setResult({ ...result, message: "Already predicted! Draw something new." });
      return;
    }

    // Get image data from canvas (base64 encoded)
    const imageBase64 = canvasRef.current.toDataURL('image/png').split(',')[1];
    try {
      // Backend Integration
      const res = await fetch("../app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image })
      });
      if (res.data.success) {
        setResult(res.data);
        const earnedXp = Math.floor(res.data.confidence * 10);
        setXp((prev) => prev + earnedXp);
        setHasPredicted(true); // Mark as predicted
      } else {
        setResult({ prediction: "N/A", confidence: 0, message: "Prediction failed!" });
      }

    } catch (error) {
      console.error("Prediction failed:", error);
      // Display error message in the UI if prediction fails
      setResult({ prediction: "N/A", confidence: 0, message: "Failed to get prediction. Make sure your backend is running!" });
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#D2B48C';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setHasPredicted(false); // Reset prediction state
    setResult({ prediction: '', confidence: 0, message: null });
  };

  // Calculate current level based on XP
  const currentLevel = Math.floor(xp / 50) + 1;
  // Calculate XP bar fill percentage (0-100%)
  const xpFillPercentage = (xp % 50) * 2;

  return (
    <div className="pixel-container">
      {/* Header with Welcome Message and Character */}
      <div className="header-section">
        <div className="character-welcome">
          <img 
            src="src\assests\pixel-girl.png" 
            alt="Pixel Girl" 
            className="pixel-girl header-character"
          />
          <div className="welcome-bubble">
            <span className="howdy-text">HOWDY!</span>
            <span className="welcome-text">Welcome to hdr :P</span>
          </div>
        </div>
        
        <div className="xp-display">
          <div className="xp-section">
            <div className="xp-bar">
              <div 
                className="xp-fill" 
                style={{ width: `${xpFillPercentage}%` }}
              ></div>
            </div>
            <div className="xp-info">
              <div className="xp-text">XP: {xp}</div>
              <div className="level-text">Level {currentLevel}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="game-area">
        <div className="left-panel">
          <div className="result-showcase">
            <div className="label">Result:</div>
            <div className="result-display">
              {result.prediction || '?'}
            </div>
            <div className="confidence-label">
              Confidence: {result.confidence ? `${result.confidence.toFixed(1)}%` : '0%'}
            </div>
          </div>
        </div>

        <div className="center-panel">
          {result.message && (
            <div className="message-display">
              {result.message}
            </div>
          )}
          <div className="drawing-area">
            <div className="label">Draw a number here:</div>
            <canvas
              ref={canvasRef}
              className="drawing-canvas"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
            
            <div className="button-section">
              <button className="pixel-button predict-btn" onClick={predict}>
                Predict
              </button>
              <button className="pixel-button clear-btn" onClick={handleClear}>
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="right-panel">
          <div className="computer-section">
            <img 
              src="src\assests\pixel-computer.gif" 
              alt="Pixel Computer" 
              className="pixel-computer"
            />
          </div>
        </div>
      </div>
      
      <div className="github-credit pixel-text">
        Made by Sreeja
        <a href="https://github.com/SreejaS8" target="_blank" rel="noopener noreferrer" className="github-link">
          <img
            src="https://github.com/SreejaS8.png"
            alt="Sreeja's GitHub profile"
            className="github-avatar"
          />
        </a>
      </div>
    </div>
  );
};

export default PixelDigitRecognizer;