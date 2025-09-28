import easyocr
import time
import os
import cv2
import re
import requests
import json
import base64
from symspellpy.symspellpy import SymSpell, Verbosity 
from typing import List, Optional, Tuple
from flask import Flask, jsonify, request, Response
from flask_cors import CORS 
import threading 



# --- Gemini API Configuration ---
API_KEY = "AIzaSyDJz9CzFTWejNGOBfDaVY8Vl9fIDsU5O9s" 
API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key={API_KEY}"

RESPONSE_SCHEMA = {
    "type": "ARRAY",
    "items": { "type": "STRING" }
}

# --- EasyOCR Configuration ---
LANGUAGE_LIST = ['en'] 
USE_GPU = False  

BATCH_SIZE = 1 
DECODER_TYPE = 'greedy' 

# How many frames to skip between EasyOCR runs 
SKIP_FRAMES = 30  
TARGET_WIDTH = 700 

# OpenCV configuration
CAMERA_INDEX = 1
WINDOW_NAME = "Scanner change title later"

# --- SymSpell Dictionary Content (FALLBACK ONLY) ---
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

# ----------------------------------------------------
# 2. FLASK APP AND DATA MANAGEMENT
# ----------------------------------------------------
app = Flask(__name__) 
CORS(app) 
data = "g" 

# --- Global storage ---
latest_words = []  # will hold the last Gemini array
latest_frame = None
frame_lock = threading.Lock()

def gen_mjpeg():
    global latest_frame
    while True:
        with frame_lock:
            frame = None if latest_frame is None else latest_frame.copy()
        if frame is None:
            time.sleep(0.02)
            continue
        ok, jpeg = cv2.imencode('.jpg', frame)
        if not ok:
            continue
        frame_bytes = jpeg.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        time.sleep(0.03)  # throttle to ~30 fps (adjust as needed)

@app.route('/video_feed')
def video_feed():
    return Response(gen_mjpeg(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/data', methods=['GET'])
def get_data():
    global latest_words
    print("GET /data called, returning:", latest_words)  # debug
    return jsonify({"words": latest_words})

@app.route('/data', methods=['POST'])
def receive_data():
    global data
    
    received_json = request.json
    
    if received_json and 'key' in received_json:
        command = received_json['key']
        if command in ['c', 'v', 'n', 'p']:
            data = command 
            print(f"Received and set global data to: '{data}'")
            return jsonify({"status": "success", "data_received": data}), 200
        else:
             return jsonify({"status": "error", "message": f"Invalid command '{command}'. Expected 'c', 'v', 'n', or 'p'."}), 400
    else:
        return jsonify({"status": "error", "message": "Invalid JSON format. Expected {'key': 'value'}"}), 400

def run_flask_app():
    app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False) 

def array_buffer_to_base64(buffer) -> str:
    return base64.b64encode(buffer).decode('utf-8')

def capture_and_send_to_gemini(frame, user_prompt: str, is_structured_output: bool = True) -> Optional[List[str]]:
    global latest_words
    print("\n--- Sending Image to Gemini API...---")
    start_time = time.time()
    encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 90]
    _, buffer = cv2.imencode('.jpeg', frame, encode_param)
    base64_image = array_buffer_to_base64(buffer)
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    { "text": user_prompt },
                    {
                        "inlineData": {
                            "mimeType": "image/jpeg",
                            "data": base64_image
                        }
                    }
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json" if is_structured_output else "text/plain",
            "responseSchema": RESPONSE_SCHEMA if is_structured_output else None
        }
    }
    
    try:
        max_retries = 3
        retry_delay = 1 
        
        for attempt in range(max_retries):
            try:
                config_headers = {'Content-Type': 'application/json'}
                
                response = requests.post(
                    API_URL, 
                    headers=config_headers, 
                    data=json.dumps(payload),
                    timeout=20 
                )
                response.raise_for_status() 
                break 
            except requests.exceptions.HTTPError as e:
                if response.status_code >= 500 and attempt < max_retries - 1:
                    print(f"Server error ({response.status_code}). Retrying in {retry_delay}s...")
                    time.sleep(retry_delay)
                    retry_delay *= 2
                    continue
                raise e

        result = response.json()
        
        end_time = time.time()
        print(f"--- API call finished in {end_time - start_time:.2f} seconds. ---")
        text_response = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text')
        
        if text_response:
            if is_structured_output:
                word_array = json.loads(text_response)
                print(f"Gemini Success (Structured)! Recognized {len(word_array)} words:")
                print("----------------- GEMINI OCR RESULT (C) -----------------")
                print(word_array)
                latest_words.clear()
                latest_words.extend(word_array)

                print("---------------------------------------------------------")
                return word_array
            else:
                print("Gemini Success (Custom)! Analysis:")
                print("----------------- GEMINI CUSTOM RESULT (V) -----------------")
                print(text_response)
                print("------------------------------------------------------------")
                return None
        else:
            print("Gemini Error: Returned an empty or unparsable response.")
            return None

    except requests.exceptions.RequestException as e:
        print(f"Network or API Error (Check connection/API enablement): {e}")
        return None
    except json.JSONDecodeError:
        print("Error: Failed to parse JSON response from Gemini API (Check prompt or expected schema).")
        return None
    except Exception as e:
        print(f"An unexpected error occurred during Gemini call: {e}")
        return None

def initialize_ocr_reader() -> Optional[easyocr.Reader]:
    print("Initializing EasyOCR Reader (One-Time Setup)...")
    try:
        start_init_time = time.time()
        reader = easyocr.Reader(LANGUAGE_LIST, gpu=USE_GPU)
        end_init_time = time.time()
        print(f"EasyOCR Reader initialized in {end_init_time - start_init_time:.2f} seconds.")
        return reader
    except Exception as e:
        print(f"An error occurred during EasyOCR Reader initialization: {e}")
        return None


def initialize_sym_spell() -> Optional[SymSpell]:
    print("Initializing SymSpell Checker...")
    try:
        sym_spell = SymSpell(max_dictionary_edit_distance=2, prefix_length=7)
        dictionary_path = "frequency_dictionary_en_82_765.txt"
        
        if sym_spell.load_dictionary(dictionary_path, term_index=0, count_index=1):
            print(f"SymSpell Checker initialized from external file: {dictionary_path}.")
        else:
            print(f"Warning: Could not find '{dictionary_path}'. Falling back to embedded dictionary.")
            for line in DICTIONARY_CONTENT.splitlines():
                if line:
                    key, count = line.split()
                    sym_spell.create_dictionary_entry(key.lower(), int(count))
            print("SymSpell Checker initialized with embedded dictionary.")
        
        return sym_spell
    except Exception as e:
        print(f"Could not initialize SymSpell Checker: {e}")
        return None


def process_frame_for_ocr(reader: easyocr.Reader, frame) -> Tuple[List[Tuple[List[List[int]], str, float]], float]:
    if frame is None:
        return [], 0.0

    try:
        start_ocr_time = time.time()
        results_detailed = reader.readtext(frame, detail=1, batch_size=BATCH_SIZE, decoder=DECODER_TYPE)
        end_ocr_time = time.time()
        frame_latency = end_ocr_time - start_ocr_time
        
        return results_detailed, frame_latency

    except Exception as e:
        print(f"An error occurred during frame processing: {e}")
        return [], 0.0


def sort_results_by_location(results_detailed: List[Tuple[List[List[int]], str, float]]) -> List[Tuple[List[List[int]], str, float]]:
    if not results_detailed:
        return []

    first_bbox = results_detailed[0][0]
    y_coords = [p[1] for p in first_bbox]
    avg_line_height = max(y_coords) - min(y_coords)
    
    LINE_Y_TOLERANCE = max(10, avg_line_height * 0.5) 
    
    lines = [] 
    
    sorted_by_y = sorted(results_detailed, key=lambda res: res[0][0][1])
    
    for res in sorted_by_y:
        y_top = res[0][0][1] 
        
        if lines and abs(y_top - lines[-1][-1][0][0][1]) < LINE_Y_TOLERANCE:
            lines[-1].append(res)
        else:
            lines.append([res])

    final_sorted_results = []
    for line in lines:
        line_sorted_by_x = sorted(line, key=lambda res: res[0][0][0])
        final_sorted_results.extend(line_sorted_by_x)
        
    return final_sorted_results


def correct_and_segment_text(text_list: List[str], sym_spell: SymSpell) -> List[str]:
    corrected_phrases = []
    pattern_strip = re.compile(r'[^a-zA-Z0-9]+')

    for phrase in text_list:
        cleaned_phrase = pattern_strip.sub('', phrase).lower()
        
        if not cleaned_phrase:
            continue
        
        result = sym_spell.word_segmentation(cleaned_phrase, max_edit_distance=2, max_segmentation_word_length=25)
        corrected_phrases.append(result.corrected_string.capitalize())

    return corrected_phrases

if __name__ == "__main__":
    print("Starting Flask server in a separate thread...")
    flask_thread = threading.Thread(target=run_flask_app)
    flask_thread.daemon = True 
    flask_thread.start()
    time.sleep(1) 

    GEMINI_STRUCTURED_PROMPT = (
        "Analyze this image and extract all visible words. Return the result as a strict JSON array "
        "of strings, ensuring the words are ordered sequentially from left to right, line-by-line."
    )
    GEMINI_CUSTOM_PROMPT = "describe this image as descriptive as possible as if you are trying to describe a scene to a blind person so they could imagine it. A blind person cannot read, so you must describe it to them as if you were talking to them. Do it in 2-3 sentences and always start with: \"You are currently looking at\". You should always be using their relative position like: your left." 

    ocr_reader = initialize_ocr_reader()
    sym_spell_checker = initialize_sym_spell()
    if ocr_reader is None or sym_spell_checker is None:
        exit()


    cap = cv2.VideoCapture(CAMERA_INDEX)

    if not cap.isOpened():
        print(f"Error: Could not open camera at index {CAMERA_INDEX}. Exiting.")
        print("Hint: If using an external USB camera, try changing CAMERA_INDEX (e.g., to 0 or 1).")
        exit()

    print("\n--- Hybrid OCR Scanner Started (API Mode) ---")
    print(f"API Endpoint: http://127.0.0.1:5000/data")
    print("Commands: 'c', 'v', 'n', 'p'. Press 'q' key in video window to quit.")
    
    last_results_detailed = []
    last_latency = 0.0
    last_recognized_text = []
    last_corrected_phrases = [] 
    focused_box_index = -1 
    
    frame_count = 0
    while cap.isOpened():
        ret, frame = cap.read()
        
        if not ret:
            print("Error: Failed to grab frame.")
            break

        

        height, width, _ = frame.shape
        scale_factor = width / TARGET_WIDTH 

        if frame_count % SKIP_FRAMES == 0:
            target_height = int(height * (TARGET_WIDTH / width))
            ocr_frame = cv2.resize(frame, (TARGET_WIDTH, target_height), interpolation=cv2.INTER_AREA)

            results_unsorted, last_latency = process_frame_for_ocr(ocr_reader, ocr_frame)
            last_results_detailed = sort_results_by_location(results_unsorted)
            last_recognized_text = [text for (bbox, text, conf) in last_results_detailed]
            last_corrected_phrases = correct_and_segment_text(last_recognized_text, sym_spell_checker)

            if not last_results_detailed:
                focused_box_index = -1
            elif focused_box_index >= len(last_results_detailed):
                focused_box_index = 0

            if last_corrected_phrases:
                print(f"[EasyOCR {frame_count:04d}] Latency: {last_latency:.3f}s | Text: {' | '.join(last_corrected_phrases[:3])}...")
            else:
                print(f"[EasyOCR {frame_count:04d}] Latency: {last_latency:.3f}s | Text: (None detected)")

        
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break


        command_to_process = data 

        if command_to_process == "c":
            capture_and_send_to_gemini(frame, GEMINI_STRUCTURED_PROMPT, is_structured_output=True)
            data = "g"
        elif command_to_process == "v":
            capture_and_send_to_gemini(frame, GEMINI_CUSTOM_PROMPT, is_structured_output=False)
            data = "g" 
        elif last_results_detailed:
            num_boxes = len(last_results_detailed)
            
            if command_to_process == "n": 
                if focused_box_index == -1: focused_box_index = 0
                else: focused_box_index = (focused_box_index + 1) % num_boxes
                print(f"-> EasyOCR Focused box {focused_box_index+1}/{num_boxes}")
                data = "g" 
            elif command_to_process == "p":
                if focused_box_index == -1: focused_box_index = num_boxes - 1
                else: focused_box_index = (focused_box_index - 1 + num_boxes) % num_boxes
                print(f"<- EasyOCR Focused box {focused_box_index+1}/{num_boxes}")
                data = "g" 


        for i, (bbox, original_text, conf) in enumerate(last_results_detailed):
            top_left_scaled = tuple(map(lambda x: int(x * scale_factor), bbox[0]))
            bottom_right_scaled = tuple(map(lambda x: int(x * scale_factor), bbox[2]))
            
            box_color = (160, 32, 240) if i == focused_box_index else (0, 255, 0) 

            cv2.rectangle(frame, top_left_scaled, bottom_right_scaled, box_color, 2)
            
        cv2.putText(frame, "", (20, 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        cv2.putText(frame, "", (20, 55), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)


        cv2.imshow(WINDOW_NAME, frame)

        with frame_lock:
            latest_frame = frame.copy()

        frame_count += 1
        
    cap.release()
    cv2.destroyAllWindows()
    print("\nHybrid OCR Scanner stopped. Thank you.")
