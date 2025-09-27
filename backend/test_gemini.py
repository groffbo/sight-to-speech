import json
from google import genai
from google.genai.errors import APIError

# --- Configuration and Setup ---

# Ensure your Gemini API Key is set as an environment variable (GEMINI_API_KEY)
try:
    client = genai.Client()
except Exception as e:
    print(f"Error initializing client. Is GEMINI_API_KEY set? Details: {e}")
    exit()

# The classification task prompt
SYSTEM_INSTRUCTION = """
You are an expert document layout classifier.
Analyze the provided OCR data, which includes the bounding box coordinates (normalized to 1000) followed by the text.
The bounding box format is [Ymin, Xmin, Ymax, Xmax].
***Crucially, use the X-coordinates (Xmin, Xmax) to distinguish between content columns.***

Classify each line into one of: "header", "bullet", "sentence", "note", or "todo".

- "header": short title or section name, often centered or preceding a list/section.
- "bullet": items clustered vertically with small Y-spacing, even without a leading character.
- "sentence": complete ideas.
- "note": reminders or annotations (often contains keywords like 'Reminder').
- "todo": task-oriented items, often numbered.

Return ONLY valid JSON in the specified format. Do not include any other text or markdown outside of the JSON block.
"""

# The format for the final JSON output (same as before)
JSON_SCHEMA = {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "text": {"type": "string", "description": "The cleaned text of the line."},
            "type": {"type": "string", "enum": ["header", "bullet", "sentence", "note", "todo"]}
        },
        "required": ["text", "type"]
    }
}

# --- STRESS TEST DATA (Focus on Bounding Boxes) ---
ocr_output_data = [
    {"text": "Project Titan Kick-off", "bbox": [50, 50, 80, 500]},         # Line 1: Header
    {"text": "Key Objectives", "bbox": [100, 50, 120, 300]},             # Line 2: Header (Left)
    {"text": "Define MVP features", "bbox": [140, 70, 160, 450]},         # Line 3: Bullet (Implicit list)
    {"text": "Initial wireframes", "bbox": [165, 70, 185, 450]},          # Line 4: Bullet (Implicit list)
    {"text": "Schedule Planning", "bbox": [220, 50, 240, 350]},            # Line 5: Header (Left - large Y-gap from above)
    {"text": "Next Steps", "bbox": [100, 600, 120, 850]},                  # Line 6: Header (Right - different X)
    {"text": "Review Q3 budget.", "bbox": [260, 50, 280, 500]},            # Line 7: Sentence
    {"text": "Reminder: Get sign-off by EOD.", "bbox": [310, 55, 330, 480]},  # Line 8: Note (Keyword 'Reminder')
    {"text": "1. Deploy Staging", "bbox": [140, 620, 160, 900]},           # Line 9: Todo (Right column)
    {"text": "2. Send client email", "bbox": [165, 620, 185, 900]},          # Line 10: Todo (Right column)
    {"text": "Weekly Status Report", "bbox": [400, 50, 420, 500]},         # Line 11: Header (Left)
    {"text": "The backend team is on track for milestone A.", "bbox": [440, 50, 460, 550]} # Line 12: Sentence
]

# --- Main Functions (Same logic as before) ---

def format_ocr_data_for_gemini(data):
    """
    Formats the OCR data into a single string, including bounding box information,
    so the model can reason about the spatial layout.
    """
    formatted_lines = []
    # Structure: [Ymin, Xmin, Ymax, Xmax] text_content
    for item in data:
        bbox_str = f"[{item['bbox'][0]}, {item['bbox'][1]}, {item['bbox'][2]}, {item['bbox'][3]}]"
        formatted_lines.append(f"{bbox_str} {item['text']}")
    
    return "\n".join(formatted_lines)

def run_classification_api(formatted_data):
    """
    Calls the Gemini API with the structured prompt and JSON schema.
    """
    print("Sending request to Gemini API...")
    
    # The user-facing prompt that includes the structured data
    user_prompt = f"OCR CONTENT:\n{formatted_data}\n\nAnalyze the content and generate the JSON response."

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=user_prompt,
            config=genai.types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
                response_schema=JSON_SCHEMA,
            )
        )
        return response

    except APIError as e:
        print(f"\n[ERROR] Gemini API call failed: {e}")
        return None
    except Exception as e:
        print(f"\n[ERROR] An unexpected error occurred: {e}")
        return None

# --- Execution ---

if __name__ == "__main__":
    # 1. Format the raw data into a structured string
    structured_content = format_ocr_data_for_gemini(ocr_output_data)
    
    # For review: Print the content being sent to the model
    print("--- Structured Content Sent to Model (Bbox-Guided) ---")
    print(structured_content)
    print("------------------------------------------------------\n")

    # 2. Run the API call
    api_response = run_classification_api(structured_content)

    # 3. Process and display the result
    if api_response and api_response.text:
        print("\n✅ Successfully received and parsed JSON output:\n")
        
        # The response text will be a JSON string, so we load it
        try:
            parsed_json = json.loads(api_response.text)
            print(json.dumps(parsed_json, indent=2))
        except json.JSONDecodeError:
            print("[WARNING] Could not decode JSON. Raw output:")
            print(api_response.text)
    elif api_response is not None:
         print("\n❌ API call succeeded but returned no text.")
    # Error case is handled within run_classification_api