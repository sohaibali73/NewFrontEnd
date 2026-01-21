"""Brain/Knowledge Base routes."""

import hashlib
from typing import Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from pydantic import BaseModel

from api.dependencies import get_current_user_id, get_user_api_keys
from core.document_parser import DocumentParser
from core.document_classifier import AIDocumentClassifier
from db.supabase_client import get_supabase

router = APIRouter(prefix="/brain", tags=["Knowledge Base"])

class TextUpload(BaseModel):
    title: str
    content: str
    category: str = "general"

class SearchRequest(BaseModel):
    query: str
    category: Optional[str] = None
    limit: int = 10

@router.post("/upload")
async def upload_document(
        file: UploadFile = File(...),
        title: Optional[str] = Form(None),
        category: Optional[str] = Form("general"),
        user_id: str = Depends(get_current_user_id),
        api_keys: dict = Depends(get_user_api_keys),
):
    """Upload and process a document."""
    db = get_supabase()

    # Read file content
    content_bytes = await file.read()

    # Try to parse based on file type
    try:
        content = content_bytes.decode("utf-8", errors="ignore")
    except:
        content = str(content_bytes)

    # Generate content hash for deduplication
    content_hash = hashlib.sha256(content.encode()).hexdigest()

    # Check for duplicate
    existing = db.table("brain_documents").select("id").eq("content_hash", content_hash).execute()
    if existing.data:
        return {
            "status": "duplicate",
            "document_id": existing.data[0]["id"],
            "message": "Document already exists in knowledge base",
        }

    # Classify document
    classifier = AIDocumentClassifier(api_key=api_keys.get("claude", ""))
    classification = classifier.classify_document(content, file.filename)

    # Use provided category or classified category
    final_category = category if category != "general" else classification.primary_category

    # Store document
    doc_result = db.table("brain_documents").insert({
        "uploaded_by": user_id,
        "title": title or file.filename,
        "filename": file.filename,
        "file_type": file.content_type,
        "file_size": len(content_bytes),
        "category": final_category,
        "subcategories": classification.subcategories,
        "tags": classification.suggested_tags,
        "raw_content": content,
        "summary": classification.summary,
        "content_hash": content_hash,
        "source_type": "upload",
    }).execute()

    document_id = doc_result.data[0]["id"]

    # Chunk document for RAG (simple chunking for now)
    chunk_size = 500
    chunks = [content[i:i + chunk_size] for i in range(0, len(content), chunk_size)]

    for idx, chunk in enumerate(chunks[:50]):  # Limit chunks
        db.table("brain_chunks").insert({
            "document_id": document_id,
            "chunk_index": idx,
            "content": chunk,
            # embedding would be added here with sentence-transformers
        }).execute()

    # Update document
    db.table("brain_documents").update({
        "is_processed": True,
        "chunk_count": len(chunks),
        "processed_at": "now()",
    }).eq("id", document_id).execute()

    return {
        "status": "success",
        "document_id": document_id,
        "classification": {
            "category": final_category,
            "confidence": classification.confidence,
            "summary": classification.summary,
        },
        "chunks_created": min(len(chunks), 50),
    }

@router.post("/upload-text")
async def upload_text(
        data: TextUpload,
        user_id: str = Depends(get_current_user_id),
):
    """Upload text content directly."""
    db = get_supabase()

    content_hash = hashlib.sha256(data.content.encode()).hexdigest()

    # Check duplicate
    existing = db.table("brain_documents").select("id").eq("content_hash", content_hash).execute()
    if existing.data:
        return {"status": "duplicate", "document_id": existing.data[0]["id"]}

    doc_result = db.table("brain_documents").insert({
        "uploaded_by": user_id,
        "title": data.title,
        "category": data.category,
        "raw_content": data.content,
        "content_hash": content_hash,
        "source_type": "upload",
        "is_processed": True,
    }).execute()

    return {"status": "success", "document_id": doc_result.data[0]["id"]}

@router.post("/search")
async def search_knowledge(
        data: SearchRequest,
        user_id: str = Depends(get_current_user_id),
):
    """Search the knowledge base."""
    db = get_supabase()

    # Simple text search for now (vector search requires embeddings)
    query = db.table("brain_documents").select("id, title, category, summary, created_at")

    if data.category:
        query = query.eq("category", data.category)

    # Search in title and summary
    query = query.or_(f"title.ilike.%{data.query}%,summary.ilike.%{data.query}%")

    result = query.limit(data.limit).execute()

    return {"results": result.data, "count": len(result.data)}

@router.get("/documents")
async def list_documents(
        category: Optional[str] = None,
        limit: int = 50,
        user_id: str = Depends(get_current_user_id),
):
    """List all documents in the brain."""
    db = get_supabase()

    query = db.table("brain_documents").select(
        "id, title, filename, category, tags, summary, created_at, chunk_count"
    )

    if category:
        query = query.eq("category", category)

    result = query.order("created_at", desc=True).limit(limit).execute()

    return result.data

@router.get("/stats")
async def get_brain_stats(user_id: str = Depends(get_current_user_id)):
    """Get brain statistics."""
    db = get_supabase()

    docs = db.table("brain_documents").select("id", count="exact").execute()
    chunks = db.table("brain_chunks").select("id", count="exact").execute()
    learnings = db.table("learnings").select("id", count="exact").execute()

    # Get category breakdown
    categories = db.table("brain_documents").select("category").execute()
    category_counts = {}
    for doc in categories.data:
        cat = doc["category"]
        category_counts[cat] = category_counts.get(cat, 0) + 1

    return {
        "total_documents": docs.count or 0,
        "total_chunks": chunks.count or 0,
        "total_learnings": learnings.count or 0,
        "categories": category_counts,
    }

@router.delete("/documents/{document_id}")
async def delete_document(
        document_id: str,
        user_id: str = Depends(get_current_user_id),
):
    """Delete a document from the brain."""
    db = get_supabase()

    # Chunks are deleted via CASCADE
    db.table("brain_documents").delete().eq("id", document_id).execute()

    return {"status": "deleted"}
