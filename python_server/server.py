from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import numpy as np
from PIL import Image
import io
from utils import get_prediction, submit_feedback

app = Flask(__name__)
CORS(app)

@app.route('/process_image', methods=['POST'])
def upload_image():
    """Processes the image and returns the model prediction."""
    image_data = request.json.get("image")  # Access the 'image' key

    if not image_data:
        return jsonify({"error": "No image data received"}), 400

    try:
        # Decode base64 image
        header, encoded = image_data.split(',', 1)
        image_bytes = base64.b64decode(encoded)
        image = np.array(Image.open(io.BytesIO(image_bytes)))

        # Get model prediction
        prediction = get_prediction(image)

        return jsonify({"prediction": prediction}), 200

    except Exception as e:
        print("Error:", str(e))  # Log any server-side error
        return jsonify({"error": f"Error processing image: {str(e)}"}), 500


def fix_base64_padding(base64_string):
    """Fix missing padding in Base64 strings."""
    missing_padding = len(base64_string) % 4
    if missing_padding:
        base64_string += "=" * (4 - missing_padding)
    return base64_string


@app.route('/submit_feedback', methods=['POST'])
def submit_user_feedback():
    """Accepts user feedback after they receive the prediction."""
    try:
        data = request.json

        # Validate required fields
        required_fields = ["image", "image_label", "model_prediction", "user_feedback", "platform"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        # Fix Base64 padding and decode
        base64_string = data["image"].split(",", 1)[-1]  # Remove the header if present (e.g., "data:image/png;base64,")
        fixed_base64 = fix_base64_padding(base64_string)
        image_binary = base64.b64decode(fixed_base64)

        # Submit feedback to the database
        feedback_response = submit_feedback(
            image_binary,  # Convert base64 back to binary
            data["image_label"],
            data["model_prediction"],
            data["user_feedback"],
            data["platform"]
        )

        return jsonify(feedback_response), 200


    except Exception as e:
        print("Error:", str(e))  # Log any server-side error
        return jsonify({"error": f"Error submitting feedback: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(debug=True, port=8000)