# app.py (FastAPI)
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import pandas as pd
from PIL import Image
import io
import base64

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In prod, specify your frontend domain
    allow_methods=["*"],
    allow_headers=["*"],
)

model_df = pd.read_csv("./public/cnn_mnist_datagen.csv") 
@app.get("/")
def read_root():
    return {"message": "FastAPI is running!"}
@app.post("/predict/")
async def predict(data: dict):
    image_data = data["image"]
    header, encoded = image_data.split(",", 1)
    decoded = base64.b64decode(encoded)
    image = Image.open(io.BytesIO(decoded)).convert("L").resize((28, 28))
    img_array = np.array(image).flatten() / 255.0
    prediction = int(np.random.randint(0, 10))

    return {"prediction": prediction}
