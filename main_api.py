import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from connect_memory_with_llm import build_rag_chain

load_dotenv()

app = FastAPI(title="Madar Software Services Bot API")

# ─── CORS: allow browser-based frontends ───────────────────────────────────────
# In production, replace ["*"] with your actual frontend domain(s),
# e.g. ["https://yourapp.com", "http://localhost:5500"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # ← change to your domain in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ───────────────────────────────────────────────────────────────────────────────

# Initialize RAG chain once at startup
try:
    rag_chain = build_rag_chain()
    print("✅ RAG chain initialized successfully.")
except Exception as e:
    print(f"⚠️  Error initializing RAG chain: {e}")
    rag_chain = None


class QuestionRequest(BaseModel):
    question: str


from fastapi.responses import HTMLResponse

@app.get("/")
async def serve_ui():
    file_path = os.path.join(os.path.dirname(__file__), "madar-chatbot.html")
    return FileResponse(file_path)


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
        response = rag_chain.invoke({"input": request.question.strip()})

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
