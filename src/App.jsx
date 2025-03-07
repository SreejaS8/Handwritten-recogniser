import React from 'react';
import ModelDisplay from './ModelDisplay';
import './App.css'; 

function App() {
  return (
    <div className="App">
      <header>
        <h1>Welcome to handwritten digit recogniser</h1>
      </header>
      <main>
        <ModelDisplay />
        <div className="instructions-container"> {/* Instructions below the model */}
          <div className="instructions">
            <p>Instructions:</p>
            <ol>
              <li>Draw a digit from 0-9 on the black canvas</li>
              <li>Click "Predict" to get a prediction</li>
              <li>Click "Clear Canvas" to try again</li>
            </ol>
          </div>
          {/* Remove credit-container from here */}
        </div>
      </main>
      <div className="credit-container"> {/* Credit container separate */}
        <p>Made by Sreeja</p>
        <a href="https://github.com/SreejaS8" target="_blank" rel="noopener noreferrer">
          GitHub Repository
        </a>
      </div>
    </div>
  );
}

export default App;