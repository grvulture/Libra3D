from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import time
import uuid
import timing
import auth
import product_service
import order_service
from order_schemas import OrderCreate, AdminOrderCreate, OrderUpdate
import ticket_service
from ticket_schemas import (
    TicketCreate, TicketAccessRequest, TicketAccessExchange, TicketReply, TicketUpdate,
)
import uuid
from datetime import datetime, timedelta, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url, event_listeners=[timing.DatabaseTimingListener()])
db = client[os.environ['DB_NAME']]
auth.validate_security_config()

# Create the main app without a prefix
app = FastAPI()

@app.middleware("http")
async def request_timing(request, call_next):
    request_id = request.headers.get("x-request-id") or uuid.uuid4().hex
    started = time.perf_counter()
    response = await call_next(request)
    route = request.scope.get("route")
    route_template = getattr(route, "path", "unknown")
    duration_ms = (time.perf_counter() - started) * 1000
    logging.getLogger(__name__).info(
        "request_id=%s route=%s status=%s duration_ms=%.2f",
        request_id,
        route_template,
        response.status_code,
        duration_ms,
    )
    response.headers["X-Request-ID"] = request_id
    return response

@app.middleware("http")
async def security_headers(request, call_next):
    response = await call_next(request)
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response

@app.middleware("http")
async def request_size_limit(request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > 1_000_000:
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=413, content={"detail": "Request too large"})
    return await call_next(request)

@app.on_event("startup")
async def create_indexes():
    auth.validate_security_config()
    await db.users.create_index("email", unique=True)
    await db.sessions.create_index("token_hash", unique=True)
    await db.sessions.create_index("expires_at")
    await db.auth_rate_limits.create_index("key", unique=True)
    await db.tickets.create_index("id", unique=True)
    await db.tickets.create_index([("status", 1), ("priority", 1), ("updated_at", -1)])
    await db.tickets.create_index("customer_email")
    await db.ticket_messages.create_index([("ticket_id", 1), ("created_at", 1)])
    await db.ticket_access_tokens.create_index("token_hash", unique=True)
    await db.ticket_access_tokens.create_index("ticket_id")
    await db.ticket_access_tokens.create_index("expires_at")
    await db.ticket_guest_sessions.create_index("token_hash", unique=True)
    await db.ticket_guest_sessions.create_index("ticket_id")
    await db.ticket_guest_sessions.create_index("expires_at")
    await db.email_notifications.create_index("id", unique=True)
    await db.email_notifications.create_index([("related_type", 1), ("related_id", 1), ("created_at", -1)])
    await db.products.create_index("id", unique=True)
    await db.products.create_index("category")
    await db.orders.create_index("id", unique=True)
    await db.orders.create_index("created_at")
    await db.orders.create_index("status")
    await db.orders.create_index("client_order_id", sparse=True, unique=True)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    name: str
    category: str
    price: float
    rating: float = 0
    reviews: int = 0
    bestSeller: bool = False
    inStock: bool = True
    material: str
    materials: List[str] = []
    colors: List[str] = []
    dimensions: str = ""
    description: str = ""
    images: List[str] = []
    new: bool = False

class ProductCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=80, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    name: str = Field(min_length=1, max_length=200)
    category: str
    price: float = Field(ge=0, le=1000000)
    rating: float = Field(default=0, ge=0, le=5)
    reviews: int = Field(default=0, ge=0)
    bestSeller: bool = False
    inStock: bool = True
    material: str = Field(min_length=1, max_length=80)
    materials: List[str] = Field(default_factory=list, max_length=20)
    colors: List[str] = Field(default_factory=list, max_length=20)
    dimensions: str = Field(default="", max_length=120)
    description: str = Field(default="", max_length=10000)
    images: List[str] = Field(default_factory=list, max_length=20)
    new: bool = False


class ProductUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    category: Optional[str] = None
    price: Optional[float] = Field(default=None, ge=0, le=1000000)
    rating: Optional[float] = Field(default=None, ge=0, le=5)
    reviews: Optional[int] = Field(default=None, ge=0)
    bestSeller: Optional[bool] = None
    inStock: Optional[bool] = None
    material: Optional[str] = Field(default=None, min_length=1, max_length=80)
    materials: Optional[List[str]] = Field(default=None, max_length=20)
    colors: Optional[List[str]] = Field(default=None, max_length=20)
    dimensions: Optional[str] = Field(default=None, max_length=120)
    description: Optional[str] = Field(default=None, max_length=10000)
    images: Optional[List[str]] = Field(default=None, max_length=20)
    new: Optional[bool] = None


@api_router.get("/admin/products")
async def admin_list_products(
    request: Request,
    page: int = 1,
    page_size: int = 20,
    q: Optional[str] = None,
    category: Optional[str] = None,
    in_stock: Optional[bool] = None,
    material: Optional[str] = None,
):
    await auth.require_roles(db, request, "admin")
    try:
        return await product_service.list_products(
            db, page=page, page_size=page_size, query=q, category=category,
            in_stock=in_stock, material=material,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@api_router.post("/admin/products", status_code=201)
async def admin_create_product(payload: ProductCreate, request: Request):
    await auth.require_roles(db, request, "admin")
    auth.require_csrf(request)
    try:
        product = await product_service.create_product(db, payload.model_dump())
    except ValueError as exc:
        detail = str(exc)
        status_code = 409 if "already exists" in detail else 422
        raise HTTPException(status_code=status_code, detail=detail)
    return product


@api_router.patch("/admin/products/{product_id}")
async def admin_update_product(product_id: str, payload: ProductUpdate, request: Request):
    await auth.require_roles(db, request, "admin")
    auth.require_csrf(request)
    updates = payload.model_dump(exclude_unset=True)
    try:
        product = await product_service.update_product(db, product_id, updates)
    except ValueError as exc:
        detail = str(exc)
        status_code = 404 if "not found" in detail else 422
        raise HTTPException(status_code=status_code, detail=detail)
    return product


# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

@api_router.get("/products", response_model=List[Product])
async def get_products():
    try:
        products = await db.products.find({}, {"_id": 0}).to_list(10000)
    except Exception:
        raise HTTPException(status_code=503, detail="Products are temporarily unavailable")
    return products


@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    try:
        product = await db.products.find_one({"id": product_id}, {"_id": 0})
    except Exception:
        raise HTTPException(status_code=503, detail="Products are temporarily unavailable")
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@api_router.get("/auth/csrf")
async def get_csrf_token(response: Response):
    token = __import__("secrets").token_urlsafe(32)
    response.set_cookie(
        key=auth.CSRF_COOKIE_NAME,
        value=token,
        httponly=False,
        secure=auth.SESSION_COOKIE_SECURE,
        samesite="lax",
        path="/",
        max_age=auth.SESSION_TTL_SECONDS,
    )
    return {"csrf_token": token}


class LoginRequest(BaseModel):
    email: str
    password: str


@api_router.post("/auth/login")
async def login(payload: LoginRequest, request: Request, response: Response):
    auth.require_csrf(request)
    ip = request.client.host if request.client else "unknown"
    try:
        await auth.check_ip_rate_limit(db, ip)
    except PermissionError:
        raise HTTPException(status_code=429, detail="Too many requests")

    email = auth.normalize_email(payload.email)
    if not auth.valid_email(email):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user = await auth.get_user_by_email(db, email)
    now = auth.utcnow()

    if user and user.get("locked_until") and user["locked_until"] > now:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    password_ok = False
    if user and user.get("status") == "active":
        password_ok = auth.verify_password(payload.password, user["password_hash"])
    else:
        auth.verify_password(payload.password, auth.DUMMY_PASSWORD_HASH)

    if not user or not password_ok:
        if user:
            failed = user.get("failed_login_count", 0) + 1
            locked_until = now + timedelta(seconds=auth.LOGIN_LOCKOUT_SECONDS) if failed >= auth.LOGIN_MAX_ATTEMPTS else None
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"failed_login_count": failed, "locked_until": locked_until, "updated_at": now}},
            )
        raise HTTPException(status_code=401, detail="Invalid credentials")

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"failed_login_count": 0, "locked_until": None, "last_login_at": now, "updated_at": now}},
    )

    token, csrf_token = await auth.create_session(db, user["_id"])
    response.set_cookie(
        key=auth.SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=auth.SESSION_COOKIE_SECURE,
        samesite="lax",
        path="/",
        max_age=auth.SESSION_TTL_SECONDS,
    )
    response.set_cookie(
        key=auth.CSRF_COOKIE_NAME,
        value=csrf_token,
        httponly=False,
        secure=auth.SESSION_COOKIE_SECURE,
        samesite="lax",
        path="/",
        max_age=auth.SESSION_TTL_SECONDS,
    )
    return auth.serialize_user(user)


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    auth.require_csrf(request)
    token = request.cookies.get(auth.SESSION_COOKIE_NAME)
    await auth.revoke_session(db, token)
    response.delete_cookie(auth.SESSION_COOKIE_NAME, path="/")
    response.delete_cookie(auth.CSRF_COOKIE_NAME, path="/")
    return {"detail": "Logged out"}


@api_router.get("/auth/me")
async def me(request: Request):
    user = await auth.get_current_user(db, request)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user


@api_router.get("/admin/access-check")
async def admin_access_check(request: Request):
    return await auth.require_roles(db, request, "admin")



# --- Support tickets ---

@api_router.post("/tickets", status_code=201)
async def create_ticket(payload: TicketCreate, request: Request):
    ip = request.client.host if request.client else "unknown"
    try:
        ticket = await ticket_service.create_ticket(db, payload, ip)
    except PermissionError:
        raise HTTPException(status_code=429, detail="Too many requests")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    return {"id": ticket["id"], "status": ticket["status"]}


@api_router.post("/tickets/access", status_code=202)
async def request_ticket_access(payload: TicketAccessRequest, request: Request):
    ip = request.client.host if request.client else "unknown"
    try:
        await ticket_service.request_ticket_access(db, payload.email, ip)
    except PermissionError:
        raise HTTPException(status_code=429, detail="Too many requests")
    return {"detail": "If the email address is associated with a ticket, an access link has been sent."}


@api_router.get("/tickets/access")
async def get_ticket_access_status(token: str):
    ticket_id = await ticket_service.get_ticket_access_status(db, token)
    if not ticket_id:
        raise HTTPException(status_code=401, detail="Invalid or expired access link")
    return {"ticket_id": ticket_id}


@api_router.post("/tickets/access/exchange")
async def exchange_ticket_access(payload: TicketAccessExchange, request: Request, response: Response):
    auth.require_csrf(request)
    result = await ticket_service.exchange_access_token(db, payload.token)
    if not result:
        raise HTTPException(status_code=401, detail="Invalid or expired access link")
    ticket_id, guest_token, csrf_token = result
    response.set_cookie(
        key="libra3d_ticket_session",
        value=guest_token,
        httponly=True,
        secure=auth.SESSION_COOKIE_SECURE,
        samesite="lax",
        path="/",
        max_age=ticket_service.GUEST_SESSION_TTL_SECONDS,
    )
    response.set_cookie(
        key=auth.CSRF_COOKIE_NAME,
        value=csrf_token,
        httponly=False,
        secure=auth.SESSION_COOKIE_SECURE,
        samesite="lax",
        path="/",
        max_age=ticket_service.GUEST_SESSION_TTL_SECONDS,
    )
    return {"ticket_id": ticket_id}


@api_router.get("/tickets/{ticket_id}")
async def get_customer_ticket(ticket_id: str, request: Request):
    user = await auth.get_current_user(db, request)
    if user and user["role"] in {"admin", "support"}:
        ticket = await ticket_service.get_ticket(db, ticket_id)
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        messages = await ticket_service.get_ticket_messages(db, ticket_id, include_internal=True)
        return {"ticket": ticket, "messages": messages}
    guest_token = request.cookies.get("libra3d_ticket_session")
    session = await ticket_service.get_guest_session(db, guest_token)
    if not session or session["ticket_id"] != ticket_id:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket = await ticket_service.get_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    messages = await ticket_service.get_ticket_messages(db, ticket_id, include_internal=False)
    return {"ticket": ticket, "messages": messages}


@api_router.post("/tickets/{ticket_id}/messages", status_code=201)
async def customer_ticket_reply(ticket_id: str, payload: TicketReply, request: Request):
    auth.require_csrf(request)
    guest_token = request.cookies.get("libra3d_ticket_session")
    session = await ticket_service.get_guest_session(db, guest_token)
    if not session or session["ticket_id"] != ticket_id:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ip = request.client.host if request.client else "unknown"
    try:
        message = await ticket_service.guest_reply(db, ticket_id, payload.body, ip)
    except PermissionError:
        raise HTTPException(status_code=429, detail="Too many requests")
    if not message:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return message


# --- Admin/support tickets ---

@api_router.get("/admin/tickets")
async def admin_list_tickets(
    request: Request,
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    q: Optional[str] = None,
):
    await auth.require_roles(db, request, "admin", "support")
    result = await ticket_service.list_tickets(db, page=page, page_size=page_size, status=status, priority=priority, query=q)
    return result


@api_router.get("/admin/tickets/{ticket_id}")
async def admin_get_ticket(ticket_id: str, request: Request):
    await auth.require_roles(db, request, "admin", "support")
    ticket = await ticket_service.get_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    messages = await ticket_service.get_ticket_messages(db, ticket_id, include_internal=True)
    notifications = await ticket_service.get_ticket_notifications(db, ticket_id)
    return {"ticket": ticket, "messages": messages, "notifications": notifications}


@api_router.post("/admin/tickets/{ticket_id}/messages", status_code=201)
async def admin_reply_ticket(ticket_id: str, payload: TicketReply, request: Request):
    auth.require_csrf(request)
    user = await auth.require_roles(db, request, "admin", "support")
    ip = request.client.host if request.client else "unknown"
    message = await ticket_service.agent_reply(db, ticket_id, payload.body, user, ip)
    if not message:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return message


@api_router.patch("/admin/tickets/{ticket_id}")
async def admin_update_ticket(ticket_id: str, payload: TicketUpdate, request: Request):
    auth.require_csrf(request)
    user = await auth.require_roles(db, request, "admin", "support")
    try:
        ticket = await ticket_service.update_ticket(
            db, ticket_id, status=payload.status, priority=payload.priority, user=user
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@api_router.post("/admin/email-notifications/{notification_id}/retry")
async def retry_email_notification(notification_id: str, request: Request):
    auth.require_csrf(request)
    await auth.require_roles(db, request, "admin", "support")
    notification = await ticket_service.send_notification(db, notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification


@api_router.post("/tickets/access/validate")
async def validate_ticket_access(payload: TicketAccessExchange):
    ticket_id = await ticket_service.get_ticket_access_status(db, payload.token)
    if not ticket_id:
        raise HTTPException(status_code=401, detail="Invalid or expired access link")
    return {"ticket_id": ticket_id}



# --- Orders ---

@api_router.post("/orders", status_code=201)
async def create_storefront_order(payload: OrderCreate, request: Request):
    ip = request.client.host if request.client else "unknown"
    try:
        order = await order_service.create_order(db, payload, source="storefront", created_by=None, ip=ip)
    except PermissionError:
        raise HTTPException(status_code=429, detail="Too many requests")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    return order


@api_router.get("/admin/orders")
async def admin_list_orders(
    request: Request,
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
    q: Optional[str] = None,
):
    await auth.require_roles(db, request, "admin")
    try:
        return await order_service.list_orders(db, page=page, page_size=page_size, status=status, query=q)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@api_router.get("/admin/orders/{order_id}")
async def admin_get_order(order_id: str, request: Request):
    await auth.require_roles(db, request, "admin")
    order = await order_service.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@api_router.post("/admin/orders", status_code=201)
async def admin_create_order(payload: AdminOrderCreate, request: Request):
    await auth.require_roles(db, request, "admin")
    auth.require_csrf(request)
    user = await auth.get_current_user(db, request)
    try:
        order = await order_service.create_order(
            db, payload, source="admin", created_by=user["id"] if user else None, ip=None
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    if payload.status:
        try:
            order = await order_service.update_order(db, order["id"], {"status": payload.status}, user=user)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc))
    return order


@api_router.patch("/admin/orders/{order_id}")
async def admin_update_order(order_id: str, payload: OrderUpdate, request: Request):
    await auth.require_roles(db, request, "admin")
    auth.require_csrf(request)
    user = await auth.get_current_user(db, request)
    updates = payload.model_dump(exclude_unset=True)
    try:
        order = await order_service.update_order(db, order_id, updates, user=user)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


class PasswordChangeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    current_password: str = Field(min_length=1, max_length=256)
    new_password: str = Field(min_length=1, max_length=256)


@api_router.post("/auth/password")
async def change_password(payload: PasswordChangeRequest, request: Request):
    user = await auth.require_current_user(db, request)
    auth.require_csrf(request)
    try:
        auth.valid_password(payload.new_password)
    except Exception:
        pass
    if not auth.valid_password(payload.new_password):
        raise HTTPException(status_code=422, detail="New password does not meet requirements")
    try:
        await auth.change_password(
            db,
            user["id"],
            payload.current_password,
            payload.new_password,
            request.cookies.get(auth.SESSION_COOKIE_NAME),
        )
    except ValueError as exc:
        detail = str(exc)
        status_code = 401 if "current password" in detail else 422
        raise HTTPException(status_code=status_code, detail=detail)
    return {"detail": "Password changed"}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
