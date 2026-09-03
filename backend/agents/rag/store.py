import uuid

import chromadb
from langchain_text_splitters import RecursiveCharacterTextSplitter

_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)


def build_context_store(raw_input: str) -> chromadb.Collection:
    """Chunk + embed raw_input into an ephemeral, in-memory Chroma collection for this run."""
    client = chromadb.Client()
    collection = client.create_collection(name=f"run-{uuid.uuid4().hex}")

    chunks = _splitter.split_text(raw_input) or [raw_input]
    collection.add(documents=chunks, ids=[f"chunk-{i}" for i in range(len(chunks))])
    return collection


def retrieve(collection: chromadb.Collection, query: str, k: int = 4) -> list[str]:
    result = collection.query(query_texts=[query], n_results=min(k, collection.count()))
    documents = result.get("documents") or [[]]
    return documents[0]
