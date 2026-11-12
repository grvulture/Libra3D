from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class OrderItemInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    product_id: str = Field(min_length=1, max_length=80)
    quantity: int = Field(ge=1, le=1000)
    color: Optional[str] = Field(default=None, max_length=80)


class OrderCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    shipping_address: str = Field(min_length=1, max_length=300)
    city: str = Field(min_length=1, max_length=100)
    postal_code: str = Field(min_length=1, max_length=30)
    country: str = Field(min_length=1, max_length=100)
    notes: Optional[str] = Field(default=None, max_length=2000)
    items: List[OrderItemInput] = Field(min_length=1, max_length=100)
    client_order_id: Optional[str] = Field(default=None, max_length=120)


class AdminOrderCreate(OrderCreate):
    model_config = ConfigDict(extra="forbid")

    status: Optional[str] = None


class OrderUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: Optional[str] = None
    notes: Optional[str] = Field(default=None, max_length=2000)
    first_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    shipping_address: Optional[str] = Field(default=None, min_length=1, max_length=300)
    city: Optional[str] = Field(default=None, min_length=1, max_length=100)
    postal_code: Optional[str] = Field(default=None, min_length=1, max_length=30)
    country: Optional[str] = Field(default=None, min_length=1, max_length=100)
    items: Optional[List[OrderItemInput]] = Field(default=None, min_length=1, max_length=100)


class OrderResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    status: str
    payment_status: str
    currency: str
    subtotal: float
    shipping: float
    total: float
    created_at: datetime
    updated_at: datetime
