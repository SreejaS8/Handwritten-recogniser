import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Papa from 'papaparse';
import * as tf from '@tensorflow/tfjs';

function ModelDisplay() {
  const [weights, setWeights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasPredicted, setHasPredicted] = useState(false);

  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  useEffect(() => {
    async function loadModelFromCSV() {
      try {
        const response = await fetch('/your_model.csv');
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          complete: (results) => {
            console.log("CSV loaded successfully");
            setWeights(results.data);
            setLoading(false);
          },
          header: true
        });
      } catch (err) {
        console.error('Failed to load model weights:', err);
        setError('Failed to load model weights');
        setLoading(false);
      }
    }

    loadModelFromCSV();
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = 280 * 2;
      canvas.height = 280 * 2;
      canvas.style.width = '280px';
      canvas.style.height = '280px';

      const context = canvas.getContext('2d');
      context.scale(2, 2);
      context.lineCap = 'round';
      context.strokeStyle = 'white';
      context.lineWidth = 15;
      contextRef.current = context;

      context.fillStyle = 'black';
      context.fillRect(0, 0, canvas.width / 2, canvas.height / 2);
    }
  }, []);

  const startDrawing = (e) => {
    if (!contextRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    let x, y;
    if (e.touches) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    setIsDrawing(true);
    setHasPredicted(false);
    setPrediction(null);
  };

  const finishDrawing = () => {
    if (!contextRef.current) return;
    contextRef.current.closePath();
    setIsDrawing(false);
  };

  const draw = (e) => {
    if (!isDrawing || !contextRef.current || !canvasRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    let x, y;
    if (e.touches) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
  };

  const clearCanvas = () => {
    if (!contextRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    contextRef.current.fillStyle = 'black';
    contextRef.current.fillRect(0, 0, canvas.width / 2, canvas.height / 2);
    setPrediction(null);
    setHasPredicted(false);
  };

  const predictDigit = () => {
    if (hasPredicted) return;
    
    const canvasData = getCanvasData();
    if (!canvasData) {
      setPrediction({ digit: 'Error', confidence: 'N/A' });
      setHasPredicted(true);
      return;
    }
    
    // Check if the canvas is blank
    if (!hasMeaningfulData(canvasData.data)) {
      setPrediction({ digit: 'Blank', confidence: 'N/A' });
      setHasPredicted(true);
      return;
    }
    
    // Use weights to make prediction
    if (weights) {
      try {
        // Process the canvas data
        const processedData = preprocessCanvasData(canvasData);
        
        // Perform prediction using your CSV weights
        // This is a simplified example - you'll need to implement the actual
        // neural network forward pass logic based on your model architecture
        const result = predictWithCSVModel(processedData);
        
        setPrediction({
          digit: result.digit,
          confidence: `${result.confidence}%`
        });
      } catch (err) {
        console.error('Prediction error:', err);
        setPrediction({ digit: 'Error', confidence: 'N/A' });
      }
    } else {
      setPrediction({ digit: 'Model not loaded', confidence: 'N/A' });
    }
    
    setHasPredicted(true);
  };

  const getCanvasData = () => {
    if (!canvasRef.current) return null;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    return ctx.getImageData(0, 0, canvas.width / 2, canvas.height / 2);
  };

  const hasMeaningfulData = (data) => {
    let nonBlackPixels = 0;
    const threshold = 100;
    
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 20 || data[i + 1] > 20 || data[i + 2] > 20) {
        nonBlackPixels++;
        if (nonBlackPixels > threshold) {
          return true;
        }
      }
    }
    return false;
  };

  const preprocessCanvasData = (imageData) => {
    // Resize to 28x28 (typical for MNIST models)
    const targetSize = 28;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = targetSize;
    tempCanvas.height = targetSize;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Draw the original image to the temp canvas, resizing it
    tempCtx.drawImage(
      canvasRef.current, 
      0, 0, canvasRef.current.width / 2, canvasRef.current.height / 2,
      0, 0, targetSize, targetSize
    );
    
    // Get the resized image data
    const resizedImageData = tempCtx.getImageData(0, 0, targetSize, targetSize);
    
    // Convert to grayscale and normalize (0-1)
    const grayscaleData = new Float32Array(targetSize * targetSize);
    for (let i = 0; i < resizedImageData.data.length; i += 4) {
      const value = resizedImageData.data[i] / 255.0;
      grayscaleData[i/4] = value;
    }
    
    return grayscaleData;
  };

  // This function would contain your model's forward pass logic
  // This is HIGHLY dependent on your model architecture and CSV structure
  const predictWithCSVModel = (pixelData) => {
    // This is a placeholder - you need to implement the actual neural network
    // forward pass using your weights from the CSV
    console.log("Making prediction with CSV weights");
    
    // Example logic (will not work without proper implementation):
    // 1. Flatten the input
    // 2. Apply weights and biases from your CSV for each layer
    // 3. Apply activation functions
    // 4. Calculate final output

    // For now, return a simulated result
    const randomDigit = Math.floor(Math.random() * 10);
    return {
      digit: randomDigit,
      confidence: 95
    };
  };

  return (
    <div className="container">
      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseUp={finishDrawing}
          onMouseMove={draw}
          onMouseLeave={finishDrawing}
          onTouchStart={startDrawing}
          onTouchEnd={finishDrawing}
          onTouchMove={draw}
          className="drawing-canvas"
        />
      </div>
      <div className="buttons">
        <button
          onClick={predictDigit}
          disabled={hasPredicted}
          className={hasPredicted ? 'button-predicted' : ''}
        >
          {hasPredicted ? 'Predicted ✓' : 'Predict'}
        </button>
        <button onClick={clearCanvas}>Clear Canvas</button>
      </div>
      
      {loading ? (
        <p className="loading">Loading data...</p>
      ) : error ? (
        <p className="error">Error: {error}</p>
      ) : (
        <p className="prediction">
          {prediction !== null ? 
            `Prediction: ${prediction.digit} (Confidence: ${prediction.confidence})` : 
            "Draw a digit (0-9)"}
        </p>
      )}
    </div>
  );
}

export default ModelDisplay;