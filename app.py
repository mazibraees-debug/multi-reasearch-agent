from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os
from dotenv import load_dotenv
from agents import run_research_pipeline

load_dotenv()

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

# The API key is now loaded from the .env file
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/run-research', methods=['POST'])
def run_research():
    data = request.json
    query = data.get('query')
    model = data.get('model', 'meta-llama/llama-3.3-70b-instruct')
    depth = data.get('depth', 'standard')
    
    if not query:
        return jsonify({"error": "Query is required"}), 400
    
    try:
        # For simplicity in this version, we don't stream progress to the client 
        # but we could use Server-Sent Events (SSE) for that later.
        results = run_research_pipeline(OPENROUTER_API_KEY, model, query, depth)
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("NeuroAgent Flask Server starting on http://localhost:5000")
    app.run(debug=True, port=5000)
