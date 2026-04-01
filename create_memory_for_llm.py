import os
import sys
sys.stdout.reconfigure(encoding="utf-8")

from dotenv import load_dotenv
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import TextLoader, PyPDFLoader

DB_FAISS_PATH = "vectorstore/db_faiss"
os.makedirs(DB_FAISS_PATH, exist_ok=True)

load_dotenv()
HF_TOKEN = os.getenv("HF_TOKEN")

DATA_FOLDERS = ["data", "."]

def load_documents():
    docs = []
    found_folder = None
    for folder in DATA_FOLDERS:
        if os.path.isdir(folder):
            files = [f for f in os.listdir(folder)
                     if f.lower().endswith((".txt", ".pdf"))]
            if files:
                found_folder = folder
                break

    if not found_folder:
        raise FileNotFoundError("لم يتم العثور على ملفات بيانات")

    for filename in os.listdir(found_folder):
        file_path = os.path.join(found_folder, filename)
        if filename.lower().endswith(".txt"):
            print(f"📄 {filename}")
            loader = TextLoader(file_path, encoding="utf-8")
            docs.extend(loader.load())
        elif filename.lower().endswith(".pdf"):
            print(f"📕 {filename}")
            loader = PyPDFLoader(file_path)
            docs.extend(loader.load())
    return docs

def build_faiss_vectorstore():
    if not HF_TOKEN:
        raise RuntimeError("HF_TOKEN غير مضبوط")

    index_path = os.path.join(DB_FAISS_PATH, "index.faiss")
    if os.path.isfile(index_path):
        print("✅ قاعدة FAISS موجودة مسبقاً")
        return

    print("🚀 بدء تحميل المستندات ...")
    docs = load_documents()
    print(f"✅ تم تحميل {len(docs)} مستند")

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=200,
    )
    splits = text_splitter.split_documents(docs)
    print(f"✅ {len(splits)} مقطع")

    print("🧠 إنشاء Embeddings ...")
    embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)
    print("⚙️ بناء قاعدة FAISS ...")
    db = FAISS.from_documents(splits, embeddings)

    print(f"💾 حفظ في: {DB_FAISS_PATH}")
    db.save_local(DB_FAISS_PATH)
    print("🎉 تم بنجاح!")

if __name__ == "__main__":
    build_faiss_vectorstore()
