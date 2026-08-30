FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV DATABASE_URL=sqlite:////data/college_rag.db
ENV UPLOAD_DIR=/data/uploads
ENV QDRANT_PATH=/data/qdrant_db
ENV PORT=8000

RUN mkdir -p /data/uploads /data/qdrant_db

EXPOSE 8000

CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
