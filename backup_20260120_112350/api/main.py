import os
from typing import Dict, Any, Optional
from fastapi import FastAPI, Header, HTTPException, Depends
from fastapi import UploadFile, File
from core.knowledge_base import KnowledgeBase
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Import your existing engine logic

from core.claude_engine import ClaudeAFLEngine, OperationMode, StrategyType

# Load environment variables (fallback for shared keys)
load_dotenv()

app = FastAPI(title="Analyst by Potomac API")

# --- Security: CORS ---
# This allows your local React frontend to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your specific URL
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Data Models ---
class AFLRequest(BaseModel):
    prompt: str
    mode: str = "generate"  # generate, optimize, debug, etc.
    strategy_type: str = "standalone"
    context: Optional[Dict[str, Any]] = None

# --- API Endpoints ---

@app.get("/")
def health_check():
    return {"status": "online", "message": "Potomac Engine is running"}

@app.post("/process-afl")
async def process_afl(
        request: AFLRequest,
        x_api_key: Optional[str] = Header(None)  # Takes the key from the user's setup screen
):
    """
    The main engine room.
    It takes the prompt, initializes the engine with the user's key, and returns AFL.
    """
    # 1. Determine which API key to use
    api_key = x_api_key or os.getenv("ANTHROPIC_API_KEY")

    if not api_key:
        raise HTTPException(status_code=401, detail="No Anthropic API Key provided.")

    try:
        # 2. Initialize the Engine (from your core folder)
        engine = ClaudeAFLEngine(api_key=api_key)

        # 3. Route the request based on mode
        mode = OperationMode(request.mode.lower())
        strat = StrategyType(request.strategy_type.lower())

        # 4. Generate the response
        result = engine.generate_afl(
            request=request.prompt,
            strategy_type=strat
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-document")
async def upload_document(
        file: UploadFile = File(...),
        category: str = "general"
):
    """
    Uploads a document's metadata to the Supabase Cloud Brain.
    """
    kb = KnowledgeBase()

    # Prepare the data for Supabase
    document_data = {
        "filename": file.filename,
        "category": category,
        "file_type": file.content_type,
        "file_size": 0,  # You can calculate this from the file object
        "summary": f"Uploaded via Analyst API: {file.filename}"
    }

    doc_id = kb.register_document(document_data)

    if doc_id:
        return {"status": "success", "document_id": doc_id, "message": "Metadata saved to Cloud."}
    else:
        raise HTTPException(status_code=500, detail="Failed to register document in Supabase.")

from core.researcher import StrategyResearcher

@app.post("/reverse-engineer")
async def reverse_engineer(strategy_name: str):
    """
    Researches a strategy online and has Claude deconstruct it into AFL.
    """
    # 1. Research the strategy on the web
    researcher = StrategyResearcher()
    web_context = researcher.research_strategy(strategy_name)

    # 2. Initialize the Engine
    # Note: Using 'ClaudeAFLEngine' based on our previous fix
    engine = ClaudeAFLEngine(api_key=os.getenv("ANTHROPIC_API_KEY"))

    # 3. Ask Claude to deconstruct based on the research
    # We use the 'reverse' mode we set up in OperationMode
    result = engine.generate_afl(
        request=f"Reverse engineer this strategy: {strategy_name}. Web Context: {web_context}",
        strategy_type=StrategyType.STANDALONE
    )

    return {
        "strategy": strategy_name,
        "deconstruction": result,
        "sources_consulted": "Tavily AI Search"
    }

@app.get("/strategy-map/{doc_id}")
async def get_strategy_map(doc_id: str):
    # 1. Fetch the strategy text from Supabase using doc_id
    # 2. Ask Claude to turn that text into a JSON Node-Link map
    # 3. Return the JSON
    return {
        "nodes": [...],
        "links": [...]
    }

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)