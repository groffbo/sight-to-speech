# SightSpeech

SightSpeech is a two-part application:  
- **Backend**: Flask (Python)  
- **Frontend**: React (Next.js)  

You should start the backend first, then run the frontend.


---

## Quick Start

```bash
# Backend setup
cd backend
python -m venv venv
# macOS/Linux
source venv/bin/activate
# Windows
venv\Scripts\activate
pip install -r requirements.txt
flask run

# In another terminal (frontend setup)
cd sightspeech
npm install   # only first time
npm run dev
```

---

## Backend (Flask)

1. **Navigate into the backend folder**
   ```bash
   cd backend
   ```

2. **Create a Python virtual environment**
   ```bash
   python -m venv venv
   ```
   > This keeps dependencies isolated, so you don’t pollute your global Python install.

3. **Activate the virtual environment**
   - On **macOS/Linux**:
     ```bash
     source venv/bin/activate
     ```
   - On **Windows**:
     ```bash
     venv\Scripts\activate
     ```

4. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Run the Flask server**
   ```bash
   flask run
   ```
   The backend will be available at:  
   ```
   http://127.0.0.1:5000
   ```

---

## Frontend (React/Next.js)

1. **Navigate into the frontend folder**
   ```bash
   cd sightspeech
   ```

2. **Install dependencies** (only the first time)
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   The frontend will be available at:  
   ```
   http://localhost:3000
   ```

---

## Notes & Common Issues

- Make sure the **backend is running** before starting the frontend.  
- On macOS, using `localhost` may sometimes fail when connecting to Flask. Use `127.0.0.1` instead.  
- If you add new Python packages, update `requirements.txt` with:
  ```bash
  pip freeze > requirements.txt
  ```
