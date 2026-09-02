import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


def _reject_over_72_bytes(value: str) -> str:
    # bcrypt silently truncates at 72 bytes rather than erroring, which would let
    # two different passwords sharing a 72-byte UTF-8 prefix authenticate identically.
    if len(value.encode("utf-8")) > 72:
        raise ValueError("Password must be at most 72 bytes when UTF-8 encoded")
    return value


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.lower()

    @field_validator("password")
    @classmethod
    def validate_password_bytes(cls, value: str) -> str:
        return _reject_over_72_bytes(value)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.lower()

    @field_validator("password")
    @classmethod
    def validate_password_bytes(cls, value: str) -> str:
        return _reject_over_72_bytes(value)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
