import React, { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';
import logoSvg from './assets/hdr.svg';
import axios from 'axios';

const ModelDisplay = () => {
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const [result, setResult] = useState("");
    const [isMouseDown, setIsMouseDown] = useState(false);

    const clearCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = '#e9d5b9';
            context.fillRect(0, 0, canvas.width, canvas.height);
        }
        setHasDrawn(false);
        setResult('');
    }, []);

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

            context.fillStyle = '#e9d5b9';
            context.fillRect(0, 0, canvas.width, canvas.height);

            contextRef.current = context;
        } else if (!isDrawingMode) {
            contextRef.current = null;
        }
    }, [isDrawingMode]);

    const startDrawing = ({ nativeEvent }) => {
        if (!isDrawingMode || !contextRef.current) return;
        setIsMouseDown(true);
        const { offsetX, offsetY } = nativeEvent;
        contextRef.current.beginPath();
        contextRef.current.moveTo(offsetX, offsetY);
        setHasDrawn(true);
    };

    const draw = ({ nativeEvent }) => {
        if (!isDrawingMode || !isMouseDown || !contextRef.current) return;
        const { offsetX, offsetY } = nativeEvent;
        contextRef.current.lineTo(offsetX, offsetY);
        contextRef.current.stroke();
    };

    const finishDrawing = () => {
        if (!contextRef.current) return;
        setIsMouseDown(false);
        contextRef.current.closePath();
    };

    const handleTouchStart = (e) => {
        if (!isDrawingMode || !contextRef.current) return;
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
        if (!isDrawingMode || !isMouseDown || !contextRef.current) return;
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
        if (!contextRef.current) return;
        setIsMouseDown(false);
        contextRef.current.closePath();
    };

    const predictDigit = async () => {
        const canvas = canvasRef.current;
        if (!canvas) {
            alert('Canvas is not ready. Please try again.');
            return;
        }

        if (!hasDrawn) {
            alert('Please draw a digit first.');
            return;
        }

        try {
            const imageBase64 = canvas.toDataURL('image/png').split(',')[1];

            const res = await axios.post('http://localhost:5000/predict', {
                image: imageBase64,
            });

            if (res.data.success) {
                const { prediction, confidence } = res.data;
                setResult(`${prediction} with ${Math.round(confidence * 100)}% confidence!`);
            } else {
                setResult("Error: " + res.data.error);
            }
        } catch (error) {
            console.error("Prediction error:", error);
            setResult("Error connecting to server.");
        }
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
                            <button onClick={predictDigit} className="action-button" disabled={!hasDrawn}>
                                Predict
                            </button>
                            <button onClick={clearCanvas} className="action-button">
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
