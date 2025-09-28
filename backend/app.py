from flask import Flask, request, jsonify
# Assuming the new function is in a file named 'gemini_utils.py'
# from gemini_utils import capture_and_send_to_gemini 
# (For a single file, you don't need the import)
from flask_cors import CORS 

app = Flask(__name__)
CORS(app)

@app.route("/api/gemini", methods=["POST"])
def gemini_endpoint():
    data = request.get_json()
    image = data.get("image")  # base64 data from frontend
    prompt = data.get("prompt")

    if not image or not prompt:
        return jsonify({"error": "Both 'image' (base64) and 'prompt' are required"}), 400

    try:
        import base64
        import cv2
        import numpy as np

        # --- Base64 to OpenCV Frame (This part is correct) ---
        # The base64 data comes in the format: 'data:image/jpeg;base64,...'
        # We need to strip the header.
        if "," in image:
            header, encoded = image.split(",", 1)
        else:
            encoded = image

        img_bytes = base64.b64decode(encoded)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        # -----------------------------------------------------

        # Call the new Gemini function
        # The 'is_structured_output' is now redundant as the function is designed for it.
        result = capture_and_send_to_gemini(frame, prompt) 
        
        # Ensure the result is always a list for the frontend
        return jsonify(result if isinstance(result, list) else [str(result)])
    
    except Exception as e:
        print(f"Endpoint Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # If using your provided code structure, make sure to handle 
    # the environment variable for the API key: os.environ["GEMINI_API_KEY"] = "YOUR_KEY"
    app.run(debug=True)