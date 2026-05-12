# NeuroAgent — Multi-Agent AI Research System (Flask Edition)

A sophisticated multi-agent AI research pipeline powered by a **Python (Flask)** backend and the **OpenRouter API**.

## 🧠 What It Does

NeuroAgent orchestrates **5 specialized AI agents** in sequence to produce deep, comprehensive research reports. The orchestration and logic are handled securely on the backend.

| Agent | Role |
|-------|------|
| 🧠 **PLANNER** | Decomposes your query into structured subtasks & research angles |
| 🔍 **RESEARCHER** | Performs deep knowledge extraction across all subtasks |
| ⚖️ **CRITIC** | Identifies gaps, biases, counter-arguments, and weaknesses |
| ⚗️ **SYNTHESIZER** | Merges research + critique into a unified, balanced view |
| ✍️ **WRITER** | Produces a polished, structured research report |

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.10+ installed
- An OpenRouter API Key (Get one at [openrouter.ai](https://openrouter.ai))

### 2. Installation
```bash
# Clone the repository and navigate to the project
cd ai-research-agent

# Install dependencies
pip install -r requirements.txt

# Create a .env file and add your API key
echo "OPENROUTER_API_KEY=your_key_here" > .env
```

### 3. Running the Application
```bash
# Start the Flask server
python app.py
```
Then open **`http://localhost:5000`** in your browser.

## 📁 Project Structure

```
ai-research-agent/
├── app.py              # Flask server & API endpoints
├── agents.py           # Multi-agent logic & OpenRouter integration (Python)
├── templates/
│   └── index.html      # Frontend UI template
├── static/
│   ├── css/
│   │   └── style.css   # Modern dark-mode styling
│   └── js/
│       └── app.js      # Frontend controller (communicates with Flask)
├── requirements.txt    # Python dependencies
└── README.md
```

## 🤖 Supported Models (via OpenRouter)

- **Llama 3.3 70B** (Recommended / Default)
- **Mistral 7B Instruct**
- **Gemma 3 12B**
- **GPT-4o / GPT-4o Mini**
- **Claude 3 Haiku**

## ⚙️ Features

- **Python Backend** — Securely manages API calls and agent logic.
- **Flask Integration** — Standard web architecture with `static` and `templates`.
- **Multi-Agent Sequence** — Watch agents move through the pipeline from Planner to Writer.
- **Deep Research** — Control depth with Standard/Deep settings.
- **Export Reports** — Download finalized research as Markdown files.
- **Activity Logs** — Live updates from the backend agents.

## 🧪 Example Queries

- *"Analyze the implications of quantum computing on modern cryptography"*
- *"Compare transformer vs state space models for long-context NLP tasks"*
- *"Evaluate the economic impacts of Universal Basic Income based on current pilots?"*

## 📝 License

MIT — Free to use, modify, and distribute.

---
Built with Flask & OpenRouter API · Powered by Multi-Agent Architecture
