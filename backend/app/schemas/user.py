"""Pydantic schemas for user-related API requests and responses."""

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    """Schema for user registration."""

    email: str = Field(..., min_length=5, max_length=255, examples=["user@example.com"])
    username: str = Field(..., min_length=3, max_length=100, examples=["johndoe"])
    password: str = Field(..., min_length=8, max_length=128, examples=["securepassword123"])


class UserLogin(BaseModel):
    """Schema for user login."""

    email: str = Field(..., examples=["user@example.com"])
    password: str = Field(..., examples=["securepassword123"])


class UserResponse(BaseModel):
    """Schema for user data in responses."""

    id: str
    email: str
    username: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """Schema for JWT token response."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse
