from flask import Flask, request, jsonify
from flask_cors import CORS
import threading
import easyocr
# import time
# import os
# import cv2
# import re
#from symspellpy.symspellpy import SymSpell, Verbosity 
from typing import List, Optional, Tuple

LANGUAGE_LIST = ['en'] 
USE_GPU = False  # Set to True for massive speed increase if you have an NVIDIA GPU + CUDA setup

# For real-time video, BATCH_SIZE should usually be 1.
BATCH_SIZE = 1 
DECODER_TYPE = 'greedy' 

# --- Speed Optimization Configuration ---
SKIP_FRAMES = 10  # OCR will run every 10th frame
TARGET_WIDTH = 700 # Resize the frame to 700 pixels wide for faster OCR processing

# --- SymSpell Dictionary Content (FALLBACK ONLY) ---
# This dictionary is only used if the external file is not found.
DICTIONARY_CONTENT = """\
the 10000000000
of 1000000000
and 100000000
to 100000000
a 100000000
in 100000000
is 10000000
my 5000000
name 4000000
hello 3000000
world 2000000
arthur 1000000
"""

# OpenCV configuration
CAMERA_INDEX = 2
WINDOW_NAME = "EasyOCR Real-Time Scanner (Press 'q' to quit)"

# Initialize OCR Reader
def initialize_ocr_reader():
    """
    Initializes the EasyOCR Reader. This step is slow and should be run only once.
    """
    try:
        # The reader object loads the models. Setting gpu=True/False determines the device.
        reader = easyocr.Reader(LANGUAGE_LIST, gpu=USE_GPU)
        return reader
    except Exception as e:
        print(f"❌ An error occurred during Reader initialization: {e}")
        print("Please ensure all dependencies (easyocr, torch, and opencv-python) are correctly installed.")
        return None

def create_app():
    app = Flask(__name__)
    CORS(app)
    app.config['OCR_READER'] = initialize_ocr_reader()

    # GET endpoint (Get bounding box)

    # POST endpoint (Send Gemini placeholder)

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
    
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)

