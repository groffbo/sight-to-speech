import base64
import json
import io
import cv2
import numpy as np
from google import genai
from google.genai import types
from PIL import Image

# Initialize the Gemini Client
# Assumes GEMINI_API_KEY is set in your environment variables
client = genai.Client()

def frame_to_jpeg_bytes(frame):
    """Converts an OpenCV frame (numpy array) to JPEG bytes."""
    is_success, buffer = cv2.imencode(".jpg", frame)
    if not is_success:
        raise ValueError("Could not encode frame to JPEG.")
    return io.BytesIO(buffer.tobytes())

def capture_and_send_to_gemini(frame, prompt, is_structured_output=True):
    """
    Takes an OpenCV frame, sends it to Gemini for processing, 
    and returns a strict array of strings.
    """
    try:
        # Convert the OpenCV frame (numpy array) to a PIL Image object
        # which is what the Gemini SDK often prefers for image inputs.
        jpeg_bytes_io = frame_to_jpeg_bytes(frame)
        img = Image.open(jpeg_bytes_io)
        
        # Define the strict output schema for an array of strings
        response_schema = types.Schema(
            type=types.Type.ARRAY,
            items=types.Schema(type=types.Type.STRING),
            description="A list of text chunks read from the image, formatted for read-aloud.",
        )
        
        # Set configuration for the model
        config = types.GenerateContentConfig(
            # Enforce the model to return a JSON object that matches the schema
            response_mime_type="application/json",
            response_schema=response_schema,
        )

        # Gemini 2.5 Flash is excellent for multimodal tasks and is fast.
        # You do NOT need a separate OCR tool like EasyOCR.
        model_name = "gemini-2.5-flash"
        
        # Prepare the multimodal content: Image and Text prompt
        content = [
            img, 
            "Analyze the text in this image. Based on the following user request, return a strict JSON array of strings, where each string is a complete sentence or phrase that should be read out loud. DO NOT include any extra text or formatting outside of the JSON array. User Request: " + prompt
        ]
        
        response = client.models.generate_content(
            model=model_name,
            contents=content,
            config=config
        )

        # The response.text is a guaranteed JSON string due to the config
        json_string = response.text.strip()
        
        # Parse the JSON string into a Python list (array of strings)
        return json.loads(json_string)

    except Exception as e:
        print(f"Gemini API Error: {e}")
        # Return a simple error message as an array for consistency
        return [f"An error occurred: {str(e)}"]