from fastapi import FastAPI, File, UploadFile
from PIL import Image
import numpy as np
import tensorflow as tf
import io

app = FastAPI()

# Load the trained model
try:
    model = tf.keras.models.load_model("digit_recognizer.h5", compile=False)
    model.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])
    print("✅ Model loaded successfully!")
except Exception as e:
    print(f"❌ Error loading model: {e}")

@app.get("/")  # Root route
def home():
    return {"message": "Welcome to the Handwritten Digit Recognition API!"}

# Preprocessing function with debugging
def preprocess_image(image_bytes):
    image = Image.open(io.BytesIO(image_bytes)).convert("L")  # Convert to grayscale
    image = image.resize((28, 28))  # Resize to MNIST size
    image = np.array(image, dtype=np.float32) / 255.0  # Normalize to [0,1]
    
    if len(image.shape) == 2:  # Ensure it has a channel dimension
        image = np.expand_dims(image, axis=-1)
    
    image = np.expand_dims(image, axis=0)  # Reshape to (1, 28, 28, 1) for model
    return image

@app.post("/predict/")
async def predict(file: UploadFile = File(...)):
    try:
        image = preprocess_image(await file.read())  # Process image

        # Debugging: Check input shape
        print(f"Processed Image Shape: {image.shape}")  # Should be (1, 28, 28, 1)

        prediction = model.predict(image)
        predicted_digit = int(np.argmax(prediction))  # Convert NumPy int to regular int

        # Debugging: Print prediction probabilities
        print(f"Prediction Probabilities: {prediction}")
        print(f"Predicted Digit: {predicted_digit}")

        return {"prediction": predicted_digit}
    except Exception as e:
        return {"error": f"Prediction failed: {e}"}