import React, { useState, useRef, useEffect, useCallback } from 'react'; // Added useCallback
import './App.css';
import logoSvg from './assets/hdr.svg';
import * as tf from '@tensorflow/tfjs';

const ModelDisplay = () => {
    const [isDrawingMode, setIsDrawingMode] = useState(false); // Start NOT in drawing mode
    const [hasDrawn, setHasDrawn] = useState(false);
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const [result, setResult] = useState("");
    const [isMouseDown, setIsMouseDown] = useState(false);
    const [model, setModel] = useState(null);
    const [isModelLoading, setIsModelLoading] = useState(true); // Start as true

    const CLASS_NAMES = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    // Load the TensorFlow.js model
    useEffect(() => {
        const loadModel = async () => {
            try {
                const loadedModel = await tf.loadLayersModel('/public/model/model.json'); // Correct path
                setModel(loadedModel);
                console.log('✅ Model loaded successfully');
            } catch (error) {
                console.error('❌ Error loading model:', error);
                // You might want to display an error message to the user here
            } finally {
                setIsModelLoading(false);
            }
        };
        loadModel();
    }, []);

    // Memoize the clearCanvas function
    const clearCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (canvas) { // ONLY proceed if canvasRef.current is not null
            const context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = '#e9d5b9';
            context.fillRect(0, 0, canvas.width, canvas.height);
        }
        setHasDrawn(false);
        setResult('');
    }, []); // No dependencies needed for clearCanvas itself

    // Initialize the canvas and context when it's in drawing mode and canvas is mounted
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

            // Fill with beige background initially
            context.fillStyle = '#e9d5b9';
            context.fillRect(0, 0, canvas.width, canvas.height);

            contextRef.current = context;
        } else if (!isDrawingMode) {
            // When leaving drawing mode, ensure contextRef is nullified
            // to prevent issues if component tries to use it while canvas is unmounted
            contextRef.current = null;
        }
    }, [isDrawingMode]); // Re-run when isDrawingMode changes

    // Drawing handlers
    const startDrawing = ({ nativeEvent }) => {
        if (!isDrawingMode || isModelLoading || !contextRef.current) return; // Check contextRef
        setIsMouseDown(true);
        const { offsetX, offsetY } = nativeEvent;
        contextRef.current.beginPath();
        contextRef.current.moveTo(offsetX, offsetY);
        setHasDrawn(true);
    };

    const draw = ({ nativeEvent }) => {
        if (!isDrawingMode || !isMouseDown || isModelLoading || !contextRef.current) return; // Check contextRef
        const { offsetX, offsetY } = nativeEvent;
        contextRef.current.lineTo(offsetX, offsetY);
        contextRef.current.stroke();
    };

    const finishDrawing = () => {
        if (!contextRef.current) return; // Check contextRef
        setIsMouseDown(false);
        contextRef.current.closePath();
    };

    const handleTouchStart = (e) => {
        if (!isDrawingMode || isModelLoading || !contextRef.current) return; // Check contextRef
        e.preventDefault();
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
        if (!isDrawingMode || !isMouseDown || isModelLoading || !contextRef.current) return; // Check contextRef
        e.preventDefault();
        const touch = e.touches[0];
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const offsetX = touch.clientX - rect.left;
        const offsetY = touch.clientY - rect.top;

        contextRef.current.lineTo(offsetX, offsetY);
        contextRef.current.stroke();
    };

    const handleTouchEnd = () => {
        if (!contextRef.current) return; // Check contextRef
        setIsMouseDown(false);
        contextRef.current.closePath();
    };

    const preprocessCanvasForModel = (canvas) => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 28;
        tempCanvas.height = 28;
        const tempCtx = tempCanvas.getContext('2d');

        tempCtx.drawImage(canvas, 0, 0, 28, 28);
        const imageData = tempCtx.getImageData(0, 0, 28, 28);

        const data = imageData.data;
        const grayscalePixels = new Float32Array(28 * 28);

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const brightness = (r + g + b) / 3;
            const invertedBrightness = 255 - brightness;
            grayscalePixels[i / 4] = invertedBrightness / 255.0;
        }

        const inputTensor = tf.tensor4d(Array.from(grayscalePixels), [1, 28, 28, 1]);
        return inputTensor;
    };

    const predictDigit = async () => {
        if (!model) {
            alert('Model is not loaded yet. Please wait.');
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) { // Additional check for canvas existence
            alert('Canvas is not ready. Please try again.');
            return;
        }

        if (!hasDrawn) {
            alert('Please draw a digit first.');
            return;
        }

        try {
            const input = preprocessCanvasForModel(canvas);
            console.log("Input tensor shape for prediction:", input.shape);

            const prediction = model.predict(input);
            const probabilities = await prediction.data();
            const predictedDigitIndex = probabilities.indexOf(Math.max(...probabilities));
            const predictedDigit = CLASS_NAMES[predictedDigitIndex];
            const confidence = Math.max(...probabilities) * 100;

            input.dispose();
            prediction.dispose();

            console.log('Raw Probabilities:', probabilities);
            setResult(`${predictedDigit} with ${confidence.toFixed(2)}% confidence! 🌟`);
            // clearCanvas(); // Optionally clear after prediction, if desired
        } catch (error) {
            console.error('Error during prediction:', error);
            alert('Error occurred during prediction. Please try again. Check console for details.');
        }
    };

    const handleBack = () => {
        setIsDrawingMode(false);
        setHasDrawn(false);
        setResult('');
        // clearCanvas will be called by useEffect if isDrawingMode becomes true again
        // Or it can be called explicitly if you want to ensure it clears,
        // but only if canvasRef.current is not null at that moment.
    };

    const handleStartDrawing = () => {
        setIsDrawingMode(true);
        // clearCanvas() is called in the useEffect when isDrawingMode becomes true
        // and canvasRef.current is valid.
    };

    return (
        <div className="hdr-container">
            <div className="hdr-logo">
                <img src={logoSvg} alt="HDR Logo" />
            </div>

            <div className="hdr-frame">
                {!isDrawingMode ? (
                    <div className="start-button" onClick={handleStartDrawing}>
                        {isModelLoading ? 'Loading model...' : 'Start Drawing your digit!'}
                    </div>
                ) : (
                    <div className="drawing-area">
                        {result && (
                            <div className="prediction-result">{result}</div>
                        )}

                        {/* Only render canvas if in drawing mode */}
                        <div className="canvas-frame">
                            {/* Conditional rendering of canvas to ensure it exists when needed */}
                            {isDrawingMode && (
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
                            )}
                        </div>

                        <div className="action-buttons">
                            <button onClick={predictDigit} className="action-button" disabled={isModelLoading || !hasDrawn || !model}>
                                Predict
                            </button>
                            <button onClick={clearCanvas} className="action-button" disabled={isModelLoading}>
                                Clear
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