from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests
import json
from typing import Generator
from fastapi.responses import StreamingResponse

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this to specific domains for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Global configurations
def get_text_contents(file):
    with open(file, 'r') as f:
        return f.read()
    

stage = 0
PROMPT_OPTIONS = [get_text_contents(fl) for fl in ['prompt-1-adoption.txt', 'prompt-2-oversight.txt','prompt-3-control.txt']]
SYSTEM_PROMPT = PROMPT_OPTIONS[stage]
MODEL_NAME = "deepseek-r1-distill-llama-8b-abliterated"
API_URL = "http://127.0.0.1:1234/v1/chat/completions"
API_KEY = "lm-studio"


def stream_generator(user_input: str):
    # Create message history with fixed system prompt
    message_history = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_input}
    ]
    
    # Fixed model and temperature configuration
    payload = {
        "model": MODEL_NAME,
        "messages": message_history,
        "temperature": 0.7,  # Using default temperature
        "stream": True
    }
    
    # Send request and stream response
    with requests.post(
        API_URL, 
        headers={"Authorization": f"Bearer {API_KEY}"}, 
        json=payload, 
        stream=True
    ) as response:
        if response.status_code == 200:
            # Stream response token by token
            for line in response.iter_lines():
                if line:  # Ignore empty lines
                    decoded_line = line.decode("utf-8").strip()
                    if decoded_line.startswith("data: "):
                        decoded_line = decoded_line[6:]
                        if decoded_line:
                            try:
                                json_data = json.loads(decoded_line)
                                if "choices" in json_data:
                                    text_chunk = json_data["choices"][0]["delta"].get("content", "")
                                    yield text_chunk
                            except json.JSONDecodeError:
                                continue
        else:
            yield f"Error: {response.status_code}"

@app.get("/chat/stream")
async def chat_stream(user_message: str):
    return StreamingResponse(
        stream_generator(user_message),
        media_type="text/plain"
    )

@app.get("/change_stage")
async def change_stage(new_stage: str):
    global stage, SYSTEM_PROMPT
    stage = 0 if new_stage == 'adoption' else 1 if new_stage == 'oversight' else 2
    print(stage)
    SYSTEM_PROMPT = PROMPT_OPTIONS[stage]
    return {"stage_change":"Sucess"}

@app.get("/chat/stream/docs")
async def chat_stream_docs():
    return {
        "endpoint": "/chat/stream",
        "required_parameter": {
            "user_message": "The user's input message"
        },
        "fixed_parameters": {
            "system_prompt": SYSTEM_PROMPT,
            "model": MODEL_NAME,
            "temperature": 0.7
        },
        "example": "/chat/stream?user_message=What+is+Python?"
    }



