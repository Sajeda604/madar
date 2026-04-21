import os
import re
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from connect_memory_with_llm import build_rag_chain
 
load_dotenv()
 
app = FastAPI(title="Madar Software Services Bot API")
 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
from create_memory_for_llm import build_faiss_vectorstore
 
# Build vectorstore on startup if not exists
try:
    build_faiss_vectorstore()
    print("✅ Vectorstore ready.")
except Exception as e:
    print(f"⚠️ Vectorstore build error: {e}")
 
# Initialize RAG chain once at startup
try:
    rag_chain = build_rag_chain()
    print("✅ RAG chain initialized successfully.")
except Exception as e:
    print(f"⚠️  Error initializing RAG chain: {e}")
    rag_chain = None
 
 
class QuestionRequest(BaseModel):
    question: str
 
 
@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "Madar Chatbot API",
        "rag_ready": rag_chain is not None,
    }
 
 
@app.post("/chat")
async def chat_endpoint(request: QuestionRequest):
    if not rag_chain:
        raise HTTPException(
            status_code=503,
            detail="البوت غير جاهز — تعذّر تهيئة RAG chain عند بدء التشغيل."
        )
 
    if not request.question or not request.question.strip():
        raise HTTPException(status_code=422, detail="حقل السؤال فارغ.")
 
    try:
        question = request.question.strip()
 
        # Detect language and inject instruction
        is_english = bool(re.search(r'[a-zA-Z]', question))
        lang_instruction = "IMPORTANT: Reply in English only." if is_english else "أجب بالعربية فقط."
        enhanced_question = f"{lang_instruction}\n\n{question}"
 
        response = rag_chain.invoke({"input": enhanced_question})
 
        # Handle different response shapes from LangChain
        answer: str | None = None
        if isinstance(response, dict):
            answer = (
                response.get("answer")
                or response.get("output_text")
                or response.get("text")
            )
        elif hasattr(response, "content"):
            answer = response.content
        else:
            answer = str(response)
 
        if not answer or not answer.strip():
            answer = "عذراً، لم أستطع العثور على إجابة لسؤالك."
 
        return {"answer": answer.strip()}
 
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ داخلي: {str(e)}")