from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import numpy as np
from PIL import Image
import io
from run_model import get_prediction

app = Flask(__name__)
CORS(app)

@app.route('/upload', methods=['POST'])
def upload_image():
    # print("Incoming request data:", request.json)  # Log the payload
    image_data = request.json.get("image")  # Access the 'image' key
    if not image_data:
        return jsonify({"error": "No image data received"}), 400

    try:
        header, encoded = image_data.split(',', 1)
        ext = header.split('/')[1].split(';')[0]
        image_bytes = base64.b64decode(encoded)
        
        image = np.array(Image.open(io.BytesIO(image_bytes)))
        prediction = get_prediction(image)
        
        # file_name = f'image.{ext}'
        # with open(file_name, 'wb') as f:
            # f.write(image_bytes)
        
        return jsonify({"prediction": prediction}), 200
    
    except Exception as e:
        print("Error:", str(e))  # Log any server-side error
        return jsonify({"error": f"Error processing image: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(debug=True, port=3000)