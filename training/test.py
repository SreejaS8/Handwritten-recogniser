import tkinter as tk
from PIL import Image, ImageDraw, ImageOps
import numpy as np
from tensorflow.keras.models import load_model

# Load your trained model
model = load_model('model1.h5')

# Create canvas app
class DigitApp:
    def __init__(self, master):
        self.master = master
        self.master.title("Draw a Digit (0–9)")

        self.canvas = tk.Canvas(master, width=280, height=280, bg="black")
        self.canvas.pack()

        self.image = Image.new("L", (280, 280), color=0)
        self.draw = ImageDraw.Draw(self.image)

        self.canvas.bind("<B1-Motion>", self.paint)

        btn_frame = tk.Frame(master)
        btn_frame.pack()

        tk.Button(btn_frame, text="Predict", command=self.predict_digit).pack(side=tk.LEFT)
        tk.Button(btn_frame, text="Clear", command=self.clear_canvas).pack(side=tk.LEFT)

        self.result = tk.Label(master, text="", font=("Arial", 16))
        self.result.pack()

    def paint(self, event):
        x, y = event.x, event.y
        r = 10
        self.canvas.create_oval(x-r, y-r, x+r, y+r, fill="white", outline="white")
        self.draw.ellipse([x-r, y-r, x+r, y+r], fill=255)

    def clear_canvas(self):
        self.canvas.delete("all")
        self.draw.rectangle([0, 0, 280, 280], fill=0)
        self.result.config(text="")

    def preprocess(self):
        img = self.image.resize((28, 28), Image.Resampling.LANCZOS)
        img = ImageOps.invert(img)
        img = ImageOps.autocontrast(img)  # Improve brightness/contrast
        img_array = np.array(img).astype("float32") / 255.0
        return img_array.reshape(1, 28, 28, 1)

    def predict_digit(self):
        input_img = self.preprocess()
        prediction = model.predict(input_img)
        predicted_digit = np.argmax(prediction)
        confidence = np.max(prediction)

        self.result.config(
            text=f"Prediction: {predicted_digit} (Confidence: {confidence:.2f})"
        )

# Run the GUI
root = tk.Tk()
app = DigitApp(root)
root.mainloop()