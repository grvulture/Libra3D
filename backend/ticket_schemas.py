from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class TicketCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    subject: str = Field(min_length=1, max_length=200)
    message: str = Field(min_length=1, max_length=5000)


class TicketAccessRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr


class TicketAccessExchange(BaseModel):
    model_config = ConfigDict(extra="forbid")

    token: str = Field(min_length=20, max_length=256)


class TicketReply(BaseModel):
    model_config = ConfigDict(extra="forbid")

    body: str = Field(min_length=1, max_length=5000)


class TicketUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: Optional[str] = None
    priority: Optional[str] = None


class TicketMessageResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    ticket_id: str
    author_type: str
    author_name: Optional[str] = None
    body: str
    created_at: datetime
    visibility: str = "public"


class TicketResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    subject: str
    status: str
    priority: str
    customer_name: str
    customer_email: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    messages: List[TicketMessageResponse] = []
    notifications: List[dict] = []
