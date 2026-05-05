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

try:
    build_faiss_vectorstore()
    print("✅ Vectorstore ready.")
except Exception as e:
    print(f"⚠️ Vectorstore build error: {e}")

try:
    rag_chain = build_rag_chain()
    print("✅ RAG chain initialized successfully.")
except Exception as e:
    print(f"⚠️  Error initializing RAG chain: {e}")
    rag_chain = None


class QuestionRequest(BaseModel):
    question: str


@app.get("/", response_class=HTMLResponse)
async def root():
    html_path = os.path.join(os.path.dirname(__file__), "madar-chatbot.html")
    if os.path.exists(html_path):
        with open(html_path, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse(content="<h1>madar-chatbot.html not found</h1>", status_code=404)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "Madar Chatbot API", "rag_ready": rag_chain is not None}


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

        is_english = bool(re.search(r'[a-zA-Z]', question))
        lang_instruction = "IMPORTANT: Reply in English only." if is_english else "أجب بالعربية فقط."
        enhanced_question = f"{lang_instruction}\n\n{question}"

        response = rag_chain.invoke({"input": enhanced_question})

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