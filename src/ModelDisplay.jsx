import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import logoSvg from './assets/hdr.svg';

const ModelDisplay = () => {
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [result, setResult] = useState('');
  const [isMouseDown, setIsMouseDown] = useState(false);

  useEffect(() => {
    if (isDrawingMode && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = 280;
      canvas.height = 280;
      canvas.style.width = '280px';
      canvas.style.height = '280px';

      const context = canvas.getContext('2d');
      context.lineCap = 'round';
      context.strokeStyle = 'black';
      context.lineWidth = 15;

      // Fill with beige background
      context.fillStyle = '#e9d5b9';
      context.fillRect(0, 0, canvas.width, canvas.height);

      contextRef.current = context;
    }
  }, [isDrawingMode]);

  const startDrawing = ({ nativeEvent }) => {
    if (!isDrawingMode) return;
    setIsMouseDown(true);
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setHasDrawn(true);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawingMode || !isMouseDown) return;
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
  };

  const finishDrawing = () => {
    setIsMouseDown(false);
    contextRef.current.closePath();
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const offsetX = touch.clientX - rect.left;
    const offsetY = touch.clientY - rect.top;

    setIsMouseDown(true);
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setHasDrawn(true);
  };

  const handleTouchMove = (e) => {
    if (!isMouseDown) return;
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const offsetX = touch.clientX - rect.left;
    const offsetY = touch.clientY - rect.top;

    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
  };

  const handleTouchEnd = () => {
    setIsMouseDown(false);
    contextRef.current.closePath();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Refill beige background
    context.fillStyle = '#e9d5b9';
    context.fillRect(0, 0, canvas.width, canvas.height);

    setHasDrawn(false);
    setResult('');
  };

  const predictDigit = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  
    const isEmpty = !hasDrawn || imageData.data.every(pixel => pixel === 0);
    if (isEmpty) {
      alert('Nothing on canvas');
      return;
    }
  
    const dataURL = canvas.toDataURL('image/png');
    console.log('Sending image:', dataURL);
  
    // TODO: Send this to your FastAPI backend
    const prediction = Math.floor(Math.random() * 10); // Replace this with real API call
    setResult(`${prediction} it is!!🌟`);
    context.clearRect(0, 0, canvas.width, canvas.height);

    setHasDrawn(false);
  };

  const handleBack = () => {
    setIsDrawingMode(false);
    setHasDrawn(false);
    setResult('');
  };

  const handleStartDrawing = () => {
    setIsDrawingMode(true);
  };

  return (
    <div className="hdr-container">
      <div className="hdr-logo">
        <img src={logoSvg} alt="HDR Logo" />
      </div>

      <div className="hdr-frame">
        {!isDrawingMode ? (
          <div className="start-button" onClick={handleStartDrawing}>
            Start Drawing your digit!
          </div>
        ) : (
          <div className="drawing-area">
            {result && (
              <div className="prediction-result">{result}</div>
            )}

            <div className="canvas-frame">
              <canvas
                ref={canvasRef}
                className="drawing-canvas"
                onMouseDown={startDrawing}
                onMouseUp={finishDrawing}
                onMouseMove={draw}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              />
            </div>

            <div className="action-buttons">
              <button onClick={predictDigit} className="action-button">
                Predict
              </button>
              <button onClick={handleBack} className="action-button">
                Back
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="hdr-title">
        The <br /> HDR
      </div>
      <div className="credit">
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

export default ModelDisplay;
