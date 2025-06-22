from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
import numpy as np

from PIL import Image, ImageOps
import base64
import io

app = Flask(__name__)
CORS(app)  # Allow React to talk to Flask

# Load trained model
model = load_model("./training/model1.h5")

def preprocess_image(image_data_base64):
    image_data = base64.b64decode(image_data_base64)
    image = Image.open(io.BytesIO(image_data)).convert("L")  # Grayscale

    image = image.resize((28, 28), Image.Resampling.LANCZOS)
    image = ImageOps.invert(image)
    image = ImageOps.autocontrast(image)

    img_array = np.array(image).astype("float32") / 255.0
    return img_array.reshape(1, 28, 28, 1)

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        image_base64 = data.get("image")

        input_img = preprocess_image(image_base64)
        prediction = model.predict(input_img)
        predicted_digit = int(np.argmax(prediction))
        confidence = float(np.max(prediction))

        return jsonify({
            "success": True,
            "prediction": predicted_digit,
            "confidence": confidence
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400

if __name__ == "__main__":
    app.run(debug=True)
