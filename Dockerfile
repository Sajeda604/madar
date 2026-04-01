FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p vectorstore/db_faiss

EXPOSE 7860

CMD ["sh", "-c", "python create_memory_for_llm.py && uvicorn main_api:app --host 0.0.0.0 --port 7860"]