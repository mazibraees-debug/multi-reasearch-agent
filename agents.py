import requests
import json
import time

OPENROUTER_BASE = "https://openrouter.ai/api/v1/chat/completions"

AGENTS = {
    "planner": {
        "name": "PLANNER",
        "systemPrompt": """You are the PLANNER agent in a multi-agent AI research system.
Your job is to receive a research query and decompose it into a structured research plan.

Output a JSON object with this EXACT structure:
{
  "topic": "main topic",
  "goal": "what we aim to achieve",
  "subtasks": [
    {"id": 1, "task": "specific subtask", "priority": "high/medium/low"},
    ...
  ],
  "keywords": ["keyword1", "keyword2", ...],
  "estimated_complexity": "simple/moderate/complex",
  "research_angles": ["angle1", "angle2", ...]
}

Be thorough, precise, and strategic. Identify 4-6 subtasks.
Return ONLY the JSON, no markdown, no explanation."""
    },
    "researcher": {
        "name": "RESEARCHER",
        "systemPrompt": """You are the RESEARCHER agent in a multi-agent AI research system.
You receive a structured research plan and must provide comprehensive research content.

Structure your response as detailed sections covering core concepts, current state, key facts, examples, perspectives, and applications.
Be thorough, accurate, and intellectually rigorous. Aim for depth over breadth."""
    },
    "critic": {
        "name": "CRITIC",
        "systemPrompt": """You are the CRITIC agent in a multi-agent AI research system.
You receive research content and must critically analyze it for gaps, biases, and weaknesses."""
    },
    "synthesizer": {
        "name": "SYNTHESIZER",
        "systemPrompt": """You are the SYNTHESIZER agent in a multi-agent AI research system.
Merge the research with the critique to create a more complete, balanced, and insightful synthesis."""
    },
    "writer": {
        "name": "WRITER",
        "systemPrompt": """You are the WRITER agent in a multi-agent AI research system.
Produce a polished, professional research report based on the synthesis provided."""
    }
}

def call_openrouter(api_key, model, system_prompt, user_message):
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5000",
        "X-Title": "NeuroAgent Python Backend"
    }
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        "temperature": 0.7,
        "max_tokens": 4000
    }
    
    response = requests.post(OPENROUTER_BASE, headers=headers, json=payload)
    if not response.ok:
        raise Exception(f"API Error: {response.text}")
    
    data = response.json()
    return {
        "text": data['choices'][0]['message']['content'],
        "tokens": data.get('usage', {}).get('total_tokens', 0)
    }

def run_research_pipeline(api_key, model, query, depth="standard", progress_callback=None):
    results = {
        "plan": None,
        "research": None,
        "critique": None,
        "synthesis": None,
        "report": None,
        "totalTokens": 0
    }
    
    passes = 1 if depth == "quick" else 3 if depth == "deep" else 2
    
    def log(agent, msg, type="info"):
        if progress_callback:
            progress_callback({"agent": agent, "msg": msg, "type": type})

    # 1. PLANNER
    log("planner", "Analyzing query and building research plan...")
    plan_res = call_openrouter(api_key, model, AGENTS['planner']['systemPrompt'], f"Research query: {query}")
    results['totalTokens'] += plan_res['tokens']
    
    try:
        # Extract JSON if it's wrapped in markdown
        text = plan_res['text']
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        results['plan'] = json.loads(text)
    except:
        results['plan'] = {"topic": query, "subtasks": []}
    
    log("planner", f"Plan created with {len(results['plan'].get('subtasks', []))} tasks", "success")

    # 2. RESEARCHER
    log("researcher", "Extracting deep knowledge...")
    research_prompt = f"Plan: {json.dumps(results['plan'])}\nQuery: {query}\nPasses: {passes}"
    res_res = call_openrouter(api_key, model, AGENTS['researcher']['systemPrompt'], research_prompt)
    results['totalTokens'] += res_res['tokens']
    results['research'] = res_res['text']
    log("researcher", "Research complete", "success")

    # 3. CRITIC
    log("critic", "Analyzing for gaps and biases...")
    critique_prompt = f"Research: {results['research'][:3000]}"
    crit_res = call_openrouter(api_key, model, AGENTS['critic']['systemPrompt'], critique_prompt)
    results['totalTokens'] += crit_res['tokens']
    results['critique'] = crit_res['text']
    log("critic", "Critique complete", "success")

    # 4. SYNTHESIZER
    log("synthesizer", "Merging research and critique...")
    synth_prompt = f"Research: {results['research'][:2500]}\nCritique: {results['critique'][:1500]}"
    synth_res = call_openrouter(api_key, model, AGENTS['synthesizer']['systemPrompt'], synth_prompt)
    results['totalTokens'] += synth_res['tokens']
    results['synthesis'] = synth_res['text']
    log("synthesizer", "Synthesis complete", "success")

    # 5. WRITER
    log("writer", "Generating final report...")
    report_prompt = f"Synthesis: {results['synthesis'][:3500]}\nTopic: {query}"
    writer_res = call_openrouter(api_key, model, AGENTS['writer']['systemPrompt'], report_prompt)
    results['totalTokens'] += writer_res['tokens']
    results['report'] = writer_res['text']
    log("writer", "Report finished!", "success")
    
    return results
