FROM python:3.10-slim

# ── مجلد العمل ──────────────────────────────
WORKDIR /app

# ── نسخ ملفات المشروع ───────────────────────
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# ── بناء قاعدة FAISS عند بناء الصورة ────────
RUN mkdir -p data && \
    cp madar_dataset_v2.txt data/madar_dataset_v2.txt && \
    python create_memory_for_llm.py

# ── المنفذ المطلوب من Hugging Face ───────────
EXPOSE 7860

# ── تشغيل الـ API ────────────────────────────
CMD ["uvicorn", "main_api:app", "--host", "0.0.0.0", "--port", "7860"]
