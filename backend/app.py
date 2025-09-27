from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # allow frontend requests

# GET endpoint (Gemini placeholder)
@app.route("/api/gemini-data", methods=["GET"])
def gemini_data():
    return jsonify({
        "status": "success",
        "results": {"text": "Example OCR text"}
    })

# POST endpoint (frame upload placeholder)
@app.route("/api/process-frame", methods=["POST"])
def process_frame():
    if "image" not in request.files:
        return jsonify(error="No image uploaded"), 400

    image_file = request.files["image"]  # not used yet
    return jsonify({
        "status": "success",
        "ocr_result": {"text": "Detected text from dummy OCR"}
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)

