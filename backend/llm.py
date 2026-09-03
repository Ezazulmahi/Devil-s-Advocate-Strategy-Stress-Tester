from langchain_groq import ChatGroq

from config import settings


def get_llm(temperature: float = 0.7) -> ChatGroq:
    return ChatGroq(
        model=settings.groq_model,
        temperature=temperature,
        api_key=settings.groq_api_key,
    )
