from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Cookie, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import aiohttp
import base64
import shutil
import zipfile
from bson import ObjectId
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest


# ============================================
# HELPER: ObjectId Serialization
# ============================================
def serialize_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Convert MongoDB document to JSON-serializable dict by handling ObjectId"""
    if doc is None:
        return None
    result = {}
    for key, value in doc.items():
        if key == "_id":
            continue  # Skip _id field
        elif isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, datetime):
            result[key] = value.isoformat()
        elif isinstance(value, dict):
            result[key] = serialize_doc(value)
        elif isinstance(value, list):
            result[key] = [serialize_doc(item) if isinstance(item, dict) else (str(item) if isinstance(item, ObjectId) else item) for item in value]
        else:
            result[key] = value
    return result


def serialize_docs(docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Convert list of MongoDB documents to JSON-serializable list"""
    return [serialize_doc(doc) for doc in docs]

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Stripe setup
STRIPE_API_KEY = os.environ['STRIPE_API_KEY']
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@sounddrops.com')
PLATFORM_FEE_PERCENT = float(os.environ.get('PLATFORM_FEE_PERCENT', '10'))

# Create the main app
app = FastAPI()

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Audio files storage
AUDIO_STORAGE_PATH = ROOT_DIR / "audio_files"
AUDIO_STORAGE_PATH.mkdir(exist_ok=True)

# ZIP files storage (for extracted content)
ZIP_STORAGE_PATH = ROOT_DIR / "zip_files"
ZIP_STORAGE_PATH.mkdir(exist_ok=True)

# ============================================
# PYDANTIC MODELS
# ============================================

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: str = "user"  # user, creator, admin
    stripe_connect_id: Optional[str] = None
    payout_frequency: str = "monthly"  # weekly, monthly
    creator_approved: bool = False
    created_at: datetime

class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime

class SamplePack(BaseModel):
    pack_id: str
    title: str
    description: str
    category: str  # Drums, Bass, Synths, FX, Vocals, Loops
    tags: List[str] = []
    price: float  # 0.0 for free packs
    is_free: bool = False
    is_featured: bool = False  # Featured on homepage
    is_sync_ready: bool = False  # Broadcast-quality loops
    sync_type: Optional[str] = None  # Sports, Film, Cinematic, Broadcast
    bpm: Optional[int] = None  # Tempo
    key: Optional[str] = None  # Musical key
    creator_id: str
    creator_name: str
    audio_file_path: str
    duration: float = 0.0  # in seconds
    file_size: int = 0  # in bytes
    download_count: int = 0
    created_at: datetime

class Purchase(BaseModel):
    purchase_id: str
    user_id: str
    pack_id: str
    amount: float
    stripe_session_id: str
    created_at: datetime

class Subscription(BaseModel):
    subscription_id: str
    user_id: str
    stripe_subscription_id: Optional[str] = None
    status: str  # active, cancelled, expired
    created_at: datetime
    expires_at: Optional[datetime] = None

class Download(BaseModel):
    download_id: str
    user_id: str
    pack_id: str
    downloaded_at: datetime

class Favorite(BaseModel):
    favorite_id: str
    user_id: str
    pack_id: str
    created_at: datetime

class Collection(BaseModel):
    collection_id: str
    user_id: str
    name: str
    description: str = ""
    pack_ids: List[str] = []
    created_at: datetime

class PaymentTransaction(BaseModel):
    transaction_id: str
    session_id: str
    user_id: str
    amount: float
    currency: str
    payment_status: str  # pending, paid, failed, expired
    metadata: Dict = {}
    created_at: datetime

# ============================================
# HELPER FUNCTIONS
# ============================================

async def get_current_user(request: Request, session_token: Optional[str] = Cookie(None)) -> Optional[User]:
    """Authenticate user from cookie or Authorization header"""
    token = session_token
    
    # Fallback to Authorization header
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    
    if not token:
        return None
    
    # Check session in database
    session_doc = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session_doc:
        return None
    
    # Check expiry
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    
    # Get user
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        return None
    
    return User(**user_doc)

async def require_auth(request: Request, session_token: Optional[str] = Cookie(None)) -> User:
    """Require authentication"""
    user = await get_current_user(request, session_token)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

async def require_role(request: Request, required_role: str, session_token: Optional[str] = Cookie(None)) -> User:
    """Require specific role"""
    user = await require_auth(request, session_token)
    
    if user.role == "admin":
        return user  # Admins have all permissions
    
    if required_role == "creator" and user.role in ["creator", "admin"]:
        if not user.creator_approved:
            raise HTTPException(status_code=403, detail="Creator account not approved yet")
        return user
    
    if user.role != required_role:
        raise HTTPException(status_code=403, detail=f"Requires {required_role} role")
    
    return user

async def check_subscription(user_id: str) -> bool:
    """Check if user has active subscription"""
    sub_doc = await db.subscriptions.find_one(
        {"user_id": user_id, "status": "active"},
        {"_id": 0}
    )
    
    if not sub_doc:
        return False
    
    # Check expiry
    if sub_doc.get("expires_at"):
        expires_at = sub_doc["expires_at"]
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            # Update status to expired
            await db.subscriptions.update_one(
                {"subscription_id": sub_doc["subscription_id"]},
                {"$set": {"status": "expired"}}
            )
            return False
    
    return True

# ============================================
# AUTH ENDPOINTS
# ============================================

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    """Exchange session_id for session_token"""
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing X-Session-ID header")
    
    # Call Emergent Auth API
    async with aiohttp.ClientSession() as session:
        headers = {"X-Session-ID": session_id}
        async with session.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers=headers
        ) as resp:
            if resp.status != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            data = await resp.json()
    
    # Create or update user
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    existing_user = await db.users.find_one({"email": data["email"]}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Check if this is admin email and update role if needed
        is_admin = data["email"].lower() == ADMIN_EMAIL.lower()
        update_data = {
            "name": data["name"],
            "picture": data.get("picture")
        }
        # Update role to admin if it matches admin email
        if is_admin and existing_user.get("role") != "admin":
            update_data["role"] = "admin"
        
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": update_data}
        )
    else:
        # Create new user
        # Check if this is admin email
        is_admin = data["email"].lower() == ADMIN_EMAIL.lower()
        
        # Check if user was invited as creator
        invitation = await db.creator_invitations.find_one(
            {"email": data["email"].lower(), "status": "pending"},
            {"_id": 0}
        )
        is_invited_creator = invitation is not None
        
        user_doc = {
            "user_id": user_id,
            "email": data["email"],
            "name": data["name"],
            "picture": data.get("picture"),
            "role": "admin" if is_admin else ("creator" if is_invited_creator else "user"),
            "creator_approved": is_invited_creator,  # Auto-approve invited creators
            "payout_frequency": "monthly",
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(user_doc)
        
        # Mark invitation as accepted
        if is_invited_creator:
            await db.creator_invitations.update_one(
                {"email": data["email"].lower()},
                {"$set": {"status": "accepted", "accepted_at": datetime.now(timezone.utc)}}
            )
    
    # Create session
    session_token = data["session_token"]
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    }
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60  # 7 days
    )
    
    # Get user data
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user_doc

@api_router.get("/auth/me")
async def get_me(request: Request, session_token: Optional[str] = Cookie(None)):
    """Get current user"""
    user = await require_auth(request, session_token)
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response, session_token: Optional[str] = Cookie(None)):
    """Logout user"""
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
        response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ============================================
# SAMPLE PACKS ENDPOINTS
# ============================================

@api_router.get("/samples")
async def list_samples(
    category: Optional[str] = None,
    search: Optional[str] = None,
    creator_id: Optional[str] = None,
    free_only: bool = False,
    featured_only: bool = False,
    sync_ready_only: bool = False,
    sync_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """List sample packs with filters"""
    query = {}
    
    if category:
        query["category"] = category
    if creator_id:
        query["creator_id"] = creator_id
    if free_only:
        query["is_free"] = True
    if featured_only:
        query["is_featured"] = True
    if sync_ready_only:
        query["is_sync_ready"] = True
    if sync_type:
        query["sync_type"] = sync_type
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}}
        ]
    
    samples = await db.sample_packs.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    return samples

@api_router.get("/samples/{pack_id}")
async def get_sample(pack_id: str):
    """Get single sample pack"""
    pack = await db.sample_packs.find_one({"pack_id": pack_id}, {"_id": 0})
    if not pack:
        raise HTTPException(status_code=404, detail="Sample pack not found")
    return pack

@api_router.get("/samples/{pack_id}/audio")
async def get_sample_audio(pack_id: str):
    """Serve audio file for preview"""
    pack = await db.sample_packs.find_one({"pack_id": pack_id}, {"_id": 0})
    if not pack:
        raise HTTPException(status_code=404, detail="Sample pack not found")
    
    file_path = ROOT_DIR / pack["audio_file_path"]
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    return FileResponse(
        path=file_path,
        media_type="audio/mpeg",
        headers={"Accept-Ranges": "bytes"}
    )

@api_router.get("/samples/{pack_id}/download")
async def download_sample(
    pack_id: str,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """Download sample pack (requires purchase or subscription or free)"""
    user = await require_auth(request, session_token)
    
    # Get pack
    pack = await db.sample_packs.find_one({"pack_id": pack_id}, {"_id": 0})
    if not pack:
        raise HTTPException(status_code=404, detail="Sample pack not found")
    
    # Check access
    has_access = False
    
    # Free packs
    if pack["is_free"]:
        has_access = True
    else:
        # Check if user has purchased this pack
        purchase = await db.purchases.find_one(
            {"user_id": user.user_id, "pack_id": pack_id},
            {"_id": 0}
        )
        if purchase:
            has_access = True
        else:
            # Check subscription
            has_subscription = await check_subscription(user.user_id)
            if has_subscription:
                has_access = True
    
    if not has_access:
        raise HTTPException(status_code=403, detail="You don't have access to this pack")
    
    # Record download
    download_doc = {
        "download_id": f"dl_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "pack_id": pack_id,
        "downloaded_at": datetime.now(timezone.utc)
    }
    await db.downloads.insert_one(download_doc)
    
    # Increment download count
    await db.sample_packs.update_one(
        {"pack_id": pack_id},
        {"$inc": {"download_count": 1}}
    )
    
    # Return file
    file_path = ROOT_DIR / pack["audio_file_path"]
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    # Determine media type based on file type
    file_type = pack.get("file_type", "audio")
    if file_type == "zip":
        return FileResponse(
            path=file_path,
            filename=f"{pack['title']}.zip",
            media_type="application/zip"
        )
    else:
        return FileResponse(
            path=file_path,
            filename=f"{pack['title']}.mp3",
            media_type="audio/mpeg"
        )

# ============================================
# PURCHASES & SUBSCRIPTIONS
# ============================================

@api_router.post("/purchase/create-checkout")
async def create_purchase_checkout(
    pack_id: str,
    origin_url: str,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """Create Stripe checkout for pack purchase"""
    user = await require_auth(request, session_token)
    
    # Get pack
    pack = await db.sample_packs.find_one({"pack_id": pack_id}, {"_id": 0})
    if not pack:
        raise HTTPException(status_code=404, detail="Sample pack not found")
    
    if pack["is_free"]:
        raise HTTPException(status_code=400, detail="This pack is free")
    
    # Initialize Stripe
    host_url = origin_url
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    # Create checkout session
    success_url = f"{origin_url}/purchase-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/browse"
    
    checkout_request = CheckoutSessionRequest(
        amount=pack["price"],
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "type": "pack_purchase",
            "user_id": user.user_id,
            "pack_id": pack_id
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create pending transaction
    transaction_doc = {
        "transaction_id": f"tx_{uuid.uuid4().hex[:12]}",
        "session_id": session.session_id,
        "user_id": user.user_id,
        "amount": pack["price"],
        "currency": "usd",
        "payment_status": "pending",
        "metadata": {
            "type": "pack_purchase",
            "pack_id": pack_id
        },
        "created_at": datetime.now(timezone.utc)
    }
    await db.payment_transactions.insert_one(transaction_doc)
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/purchase/status/{session_id}")
async def check_purchase_status(
    session_id: str,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """Check purchase status"""
    user = await require_auth(request, session_token)
    
    # Initialize Stripe
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
    
    # Get checkout status
    checkout_status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction
    transaction = await db.payment_transactions.find_one(
        {"session_id": session_id},
        {"_id": 0}
    )
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Update status
    if checkout_status.payment_status == "paid" and transaction["payment_status"] != "paid":
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": "paid"}}
        )
        
        # Create purchase record
        pack_id = transaction["metadata"]["pack_id"]
        purchase_doc = {
            "purchase_id": f"pur_{uuid.uuid4().hex[:12]}",
            "user_id": user.user_id,
            "pack_id": pack_id,
            "amount": transaction["amount"],
            "stripe_session_id": session_id,
            "created_at": datetime.now(timezone.utc)
        }
        await db.purchases.insert_one(purchase_doc)
    
    return {
        "status": checkout_status.status,
        "payment_status": checkout_status.payment_status,
        "amount_total": checkout_status.amount_total
    }

@api_router.post("/subscribe/create-checkout")
async def create_subscription_checkout(
    origin_url: str,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """Create Stripe checkout for $5/month subscription"""
    user = await require_auth(request, session_token)
    
    # Check if already subscribed
    existing_sub = await db.subscriptions.find_one(
        {"user_id": user.user_id, "status": "active"},
        {"_id": 0}
    )
    if existing_sub:
        raise HTTPException(status_code=400, detail="Already subscribed")
    
    # Initialize Stripe
    host_url = origin_url
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    # Create checkout session
    success_url = f"{origin_url}/subscription-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/browse"
    
    checkout_request = CheckoutSessionRequest(
        amount=5.00,
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "type": "subscription",
            "user_id": user.user_id
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create pending transaction
    transaction_doc = {
        "transaction_id": f"tx_{uuid.uuid4().hex[:12]}",
        "session_id": session.session_id,
        "user_id": user.user_id,
        "amount": 5.00,
        "currency": "usd",
        "payment_status": "pending",
        "metadata": {
            "type": "subscription"
        },
        "created_at": datetime.now(timezone.utc)
    }
    await db.payment_transactions.insert_one(transaction_doc)
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/subscribe/status/{session_id}")
async def check_subscription_status(
    session_id: str,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """Check subscription payment status"""
    user = await require_auth(request, session_token)
    
    # Initialize Stripe
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
    
    # Get checkout status
    checkout_status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction
    transaction = await db.payment_transactions.find_one(
        {"session_id": session_id},
        {"_id": 0}
    )
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Update status
    if checkout_status.payment_status == "paid" and transaction["payment_status"] != "paid":
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": "paid"}}
        )
        
        # Create subscription record (30 days)
        subscription_doc = {
            "subscription_id": f"sub_{uuid.uuid4().hex[:12]}",
            "user_id": user.user_id,
            "stripe_subscription_id": session_id,
            "status": "active",
            "created_at": datetime.now(timezone.utc),
            "expires_at": datetime.now(timezone.utc) + timedelta(days=30)
        }
        await db.subscriptions.insert_one(subscription_doc)
    
    return {
        "status": checkout_status.status,
        "payment_status": checkout_status.payment_status,
        "amount_total": checkout_status.amount_total
    }

@api_router.get("/subscribe/status")
async def get_subscription_status(request: Request, session_token: Optional[str] = Cookie(None)):
    """Get user's subscription status"""
    user = await require_auth(request, session_token)
    
    has_sub = await check_subscription(user.user_id)
    
    if has_sub:
        sub_doc = await db.subscriptions.find_one(
            {"user_id": user.user_id, "status": "active"},
            {"_id": 0}
        )
        return {"active": True, "expires_at": sub_doc.get("expires_at")}
    
    return {"active": False}

# ============================================
# FAVORITES & COLLECTIONS
# ============================================

@api_router.post("/favorites/{pack_id}")
async def add_favorite(pack_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    """Add pack to favorites"""
    user = await require_auth(request, session_token)
    
    # Check if already favorited
    existing = await db.favorites.find_one(
        {"user_id": user.user_id, "pack_id": pack_id},
        {"_id": 0}
    )
    if existing:
        return {"message": "Already favorited"}
    
    favorite_doc = {
        "favorite_id": f"fav_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "pack_id": pack_id,
        "created_at": datetime.now(timezone.utc)
    }
    await db.favorites.insert_one(favorite_doc)
    
    return {"message": "Added to favorites"}

@api_router.delete("/favorites/{pack_id}")
async def remove_favorite(pack_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    """Remove pack from favorites"""
    user = await require_auth(request, session_token)
    
    await db.favorites.delete_one({"user_id": user.user_id, "pack_id": pack_id})
    
    return {"message": "Removed from favorites"}

@api_router.get("/favorites")
async def list_favorites(request: Request, session_token: Optional[str] = Cookie(None)):
    """List user's favorite packs"""
    user = await require_auth(request, session_token)
    
    favorites = await db.favorites.find({"user_id": user.user_id}, {"_id": 0}).to_list(100)
    pack_ids = [f["pack_id"] for f in favorites]
    
    packs = await db.sample_packs.find({"pack_id": {"$in": pack_ids}}, {"_id": 0}).to_list(100)
    
    return packs

@api_router.post("/collections")
async def create_collection(
    name: str = Form(...),
    description: str = Form(""),
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    """Create new collection"""
    user = await require_auth(request, session_token)
    
    collection_doc = {
        "collection_id": f"col_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "name": name,
        "description": description,
        "pack_ids": [],
        "created_at": datetime.now(timezone.utc)
    }
    await db.collections.insert_one(collection_doc)
    
    return serialize_doc(collection_doc)

@api_router.get("/collections")
async def list_collections(request: Request, session_token: Optional[str] = Cookie(None)):
    """List user's collections"""
    user = await require_auth(request, session_token)
    
    collections = await db.collections.find({"user_id": user.user_id}, {"_id": 0}).to_list(100)
    
    return collections

@api_router.post("/collections/{collection_id}/packs/{pack_id}")
async def add_to_collection(
    collection_id: str,
    pack_id: str,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """Add pack to collection"""
    user = await require_auth(request, session_token)
    
    # Check ownership
    collection = await db.collections.find_one(
        {"collection_id": collection_id, "user_id": user.user_id},
        {"_id": 0}
    )
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    # Add pack
    if pack_id not in collection["pack_ids"]:
        await db.collections.update_one(
            {"collection_id": collection_id},
            {"$push": {"pack_ids": pack_id}}
        )
    
    return {"message": "Added to collection"}

@api_router.delete("/collections/{collection_id}/packs/{pack_id}")
async def remove_from_collection(
    collection_id: str,
    pack_id: str,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """Remove pack from collection"""
    user = await require_auth(request, session_token)
    
    await db.collections.update_one(
        {"collection_id": collection_id, "user_id": user.user_id},
        {"$pull": {"pack_ids": pack_id}}
    )
    
    return {"message": "Removed from collection"}

# ============================================
# CREATOR ENDPOINTS
# ============================================

@api_router.post("/creator/apply")
async def apply_for_creator(request: Request, session_token: Optional[str] = Cookie(None)):
    """Apply to become a creator"""
    user = await require_auth(request, session_token)
    
    if user.role in ["creator", "admin"]:
        return {"message": "Already a creator"}
    
    # Update role to creator (pending approval)
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"role": "creator", "creator_approved": False}}
    )
    
    return {"message": "Application submitted. Awaiting admin approval."}

@api_router.post("/creator/packs")
async def upload_pack(
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    tags: str = Form(""),
    price: float = Form(...),
    bpm: Optional[int] = Form(None),
    key: Optional[str] = Form(None),
    is_featured: bool = Form(False),
    is_sync_ready: bool = Form(False),
    sync_type: Optional[str] = Form(None),
    audio_file: UploadFile = File(...),
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    """Upload new sample pack (creator only) - supports audio files and ZIP archives"""
    user = await require_role(request, "creator", session_token)
    
    # Validate price
    if price < 0:
        raise HTTPException(status_code=400, detail="Price cannot be negative")
    
    # Save file
    pack_id = f"pack_{uuid.uuid4().hex[:12]}"
    file_extension = audio_file.filename.split(".")[-1].lower()
    
    # Handle ZIP files
    if file_extension == "zip":
        # Save ZIP file
        zip_filename = f"{pack_id}.zip"
        zip_path = ZIP_STORAGE_PATH / zip_filename
        
        with open(zip_path, "wb") as f:
            shutil.copyfileobj(audio_file.file, f)
        
        file_size = os.path.getsize(zip_path)
        file_path = f"zip_files/{zip_filename}"
    else:
        # Save audio file
        audio_filename = f"{pack_id}.{file_extension}"
        audio_path = AUDIO_STORAGE_PATH / audio_filename
        
        with open(audio_path, "wb") as f:
            shutil.copyfileobj(audio_file.file, f)
        
        file_size = os.path.getsize(audio_path)
        file_path = f"audio_files/{audio_filename}"
    
    # Parse tags
    tags_list = [t.strip() for t in tags.split(",") if t.strip()]
    
    # Create pack
    pack_doc = {
        "pack_id": pack_id,
        "title": title,
        "description": description,
        "category": category,
        "tags": tags_list,
        "price": price,
        "is_free": price == 0,
        "is_featured": is_featured,
        "is_sync_ready": is_sync_ready,
        "sync_type": sync_type if is_sync_ready else None,
        "bpm": bpm,
        "key": key,
        "creator_id": user.user_id,
        "creator_name": user.name,
        "audio_file_path": file_path,
        "file_type": "zip" if file_extension == "zip" else "audio",
        "duration": 0.0,
        "file_size": file_size,
        "download_count": 0,
        "created_at": datetime.now(timezone.utc)
    }
    await db.sample_packs.insert_one(pack_doc)
    
    # Return serialized document (without _id)
    return serialize_doc(pack_doc)

@api_router.get("/creator/packs")
async def list_creator_packs(request: Request, session_token: Optional[str] = Cookie(None)):
    """List creator's own packs"""
    user = await require_role(request, "creator", session_token)
    
    packs = await db.sample_packs.find({"creator_id": user.user_id}, {"_id": 0}).to_list(100)
    
    return packs

@api_router.get("/creator/earnings")
async def get_creator_earnings(request: Request, session_token: Optional[str] = Cookie(None)):
    """Get creator earnings summary"""
    user = await require_role(request, "creator", session_token)
    
    # Get all creator's packs
    packs = await db.sample_packs.find({"creator_id": user.user_id}, {"_id": 0}).to_list(1000)
    pack_ids = [p["pack_id"] for p in packs]
    
    # Get purchases
    purchases = await db.purchases.find({"pack_id": {"$in": pack_ids}}, {"_id": 0}).to_list(10000)
    
    # Calculate earnings (90% to creator)
    total_revenue = sum(p["amount"] for p in purchases)
    creator_earnings = total_revenue * 0.9
    
    # Get downloads
    downloads = await db.downloads.find({"pack_id": {"$in": pack_ids}}, {"_id": 0}).to_list(10000)
    
    return {
        "total_packs": len(packs),
        "total_purchases": len(purchases),
        "total_downloads": len(downloads),
        "total_revenue": total_revenue,
        "creator_earnings": creator_earnings,
        "platform_fee": total_revenue * 0.1
    }

@api_router.post("/creator/payout-settings")
async def update_payout_settings(
    frequency: str = Form(...),
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    """Update payout frequency (weekly/monthly)"""
    user = await require_role(request, "creator", session_token)
    
    if frequency not in ["weekly", "monthly"]:
        raise HTTPException(status_code=400, detail="Invalid frequency")
    
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"payout_frequency": frequency}}
    )
    
    return {"message": f"Payout frequency updated to {frequency}"}

# ============================================
# ADMIN ENDPOINTS
# ============================================

@api_router.get("/admin/creators")
async def list_pending_creators(request: Request, session_token: Optional[str] = Cookie(None)):
    """List creators pending approval"""
    user = await require_role(request, "admin", session_token)
    
    creators = await db.users.find(
        {"role": "creator", "creator_approved": False},
        {"_id": 0}
    ).to_list(100)
    
    return creators

@api_router.post("/admin/creators/{creator_id}/approve")
async def approve_creator(
    creator_id: str,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """Approve creator"""
    user = await require_role(request, "admin", session_token)
    
    await db.users.update_one(
        {"user_id": creator_id},
        {"$set": {"creator_approved": True}}
    )
    
    return {"message": "Creator approved"}

@api_router.post("/admin/packs")
async def admin_upload_pack(
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    tags: str = Form(""),
    price: float = Form(...),
    creator_email: str = Form(...),
    is_free: bool = Form(False),
    bpm: Optional[int] = Form(None),
    key: Optional[str] = Form(None),
    is_featured: bool = Form(False),
    is_sync_ready: bool = Form(False),
    sync_type: Optional[str] = Form(None),
    audio_file: UploadFile = File(...),
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    """Admin upload pack for a creator - supports audio files and ZIP archives"""
    admin = await require_role(request, "admin", session_token)
    
    # Get creator
    creator = await db.users.find_one({"email": creator_email}, {"_id": 0})
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    
    # Validate price
    if price < 0:
        raise HTTPException(status_code=400, detail="Price cannot be negative")
    
    # Save file
    pack_id = f"pack_{uuid.uuid4().hex[:12]}"
    file_extension = audio_file.filename.split(".")[-1].lower()
    
    # Handle ZIP files
    if file_extension == "zip":
        # Save ZIP file
        zip_filename = f"{pack_id}.zip"
        zip_path = ZIP_STORAGE_PATH / zip_filename
        
        with open(zip_path, "wb") as f:
            shutil.copyfileobj(audio_file.file, f)
        
        file_size = os.path.getsize(zip_path)
        file_path = f"zip_files/{zip_filename}"
    else:
        # Save audio file
        audio_filename = f"{pack_id}.{file_extension}"
        audio_path = AUDIO_STORAGE_PATH / audio_filename
        
        with open(audio_path, "wb") as f:
            shutil.copyfileobj(audio_file.file, f)
        
        file_size = os.path.getsize(audio_path)
        file_path = f"audio_files/{audio_filename}"
    
    # Parse tags
    tags_list = [t.strip() for t in tags.split(",") if t.strip()]
    
    # Create pack
    pack_doc = {
        "pack_id": pack_id,
        "title": title,
        "description": description,
        "category": category,
        "tags": tags_list,
        "price": price if not is_free else 0.0,
        "is_free": is_free or price == 0,
        "is_featured": is_featured,
        "is_sync_ready": is_sync_ready,
        "sync_type": sync_type if is_sync_ready else None,
        "bpm": bpm,
        "key": key,
        "creator_id": creator["user_id"],
        "creator_name": creator["name"],
        "audio_file_path": file_path,
        "file_type": "zip" if file_extension == "zip" else "audio",
        "duration": 0.0,
        "file_size": file_size,
        "download_count": 0,
        "created_at": datetime.now(timezone.utc)
    }
    await db.sample_packs.insert_one(pack_doc)
    
    # Return serialized document (without _id)
    return serialize_doc(pack_doc)

@api_router.post("/admin/packs/{pack_id}/mark-free")
async def mark_pack_free(
    pack_id: str,
    is_free: bool = Form(...),
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    """Mark pack as free or paid"""
    admin = await require_role(request, "admin", session_token)
    
    update_data = {"is_free": is_free}
    if is_free:
        update_data["price"] = 0.0
    
    await db.sample_packs.update_one(
        {"pack_id": pack_id},
        {"$set": update_data}
    )
    
    return {"message": f"Pack marked as {'free' if is_free else 'paid'}"}

@api_router.post("/admin/packs/{pack_id}/mark-featured")
async def mark_pack_featured(
    pack_id: str,
    is_featured: bool = Form(...),
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    """Mark pack as featured"""
    admin = await require_role(request, "admin", session_token)
    
    await db.sample_packs.update_one(
        {"pack_id": pack_id},
        {"$set": {"is_featured": is_featured}}
    )
    
    return {"message": f"Pack marked as {'featured' if is_featured else 'not featured'}"}

@api_router.post("/admin/packs/{pack_id}/mark-sync-ready")
async def mark_pack_sync_ready(
    pack_id: str,
    is_sync_ready: bool = Form(...),
    sync_type: Optional[str] = Form(None),
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    """Mark pack as sync-ready with type"""
    admin = await require_role(request, "admin", session_token)
    
    update_data = {"is_sync_ready": is_sync_ready}
    if is_sync_ready and sync_type:
        update_data["sync_type"] = sync_type
    elif not is_sync_ready:
        update_data["sync_type"] = None
    
    await db.sample_packs.update_one(
        {"pack_id": pack_id},
        {"$set": update_data}
    )
    
    return {"message": f"Pack marked as {'sync-ready' if is_sync_ready else 'not sync-ready'}"}

@api_router.post("/admin/packs/{pack_id}/update-metadata")
async def update_pack_metadata(
    pack_id: str,
    bpm: Optional[int] = Form(None),
    key: Optional[str] = Form(None),
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    """Update pack BPM and Key"""
    admin = await require_role(request, "admin", session_token)
    
    update_data = {}
    if bpm is not None:
        update_data["bpm"] = bpm
    if key is not None:
        update_data["key"] = key
    
    if update_data:
        await db.sample_packs.update_one(
            {"pack_id": pack_id},
            {"$set": update_data}
        )
    
    return {"message": "Pack metadata updated"}

@api_router.get("/admin/stats")
async def get_admin_stats(request: Request, session_token: Optional[str] = Cookie(None)):
    """Get platform statistics"""
    admin = await require_role(request, "admin", session_token)
    
    total_users = await db.users.count_documents({})
    total_creators = await db.users.count_documents({"role": "creator", "creator_approved": True})
    total_packs = await db.sample_packs.count_documents({})
    total_purchases = await db.purchases.count_documents({})
    total_subscriptions = await db.subscriptions.count_documents({"status": "active"})
    
    # Calculate revenue
    purchases = await db.purchases.find({}, {"_id": 0}).to_list(10000)
    total_revenue = sum(p["amount"] for p in purchases)
    platform_earnings = total_revenue * 0.1
    creator_earnings = total_revenue * 0.9
    
    # Subscription revenue
    subscriptions = await db.subscriptions.find({"status": "active"}, {"_id": 0}).to_list(10000)
    subscription_revenue = len(subscriptions) * 5.0
    
    return {
        "total_users": total_users,
        "total_creators": total_creators,
        "total_packs": total_packs,
        "total_purchases": total_purchases,
        "total_subscriptions": total_subscriptions,
        "total_revenue": total_revenue,
        "subscription_revenue": subscription_revenue,
        "platform_earnings": platform_earnings,
        "creator_earnings": creator_earnings
    }

@api_router.get("/admin/users")
async def get_all_users(request: Request, session_token: Optional[str] = Cookie(None)):
    """Get all registered users with their emails"""
    admin = await require_role(request, "admin", session_token)
    
    users = await db.users.find({}, {"_id": 0, "user_id": 1, "email": 1, "name": 1, "role": 1, "created_at": 1}).to_list(10000)
    
    return users

@api_router.post("/admin/invite-creator")
async def invite_creator(
    email: str = Form(...),
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    """Send creator invitation email"""
    admin = await require_role(request, "admin", session_token)
    
    # Store invitation in database
    invitation_doc = {
        "invitation_id": f"inv_{uuid.uuid4().hex[:12]}",
        "email": email.lower(),
        "invited_by": admin.user_id,
        "status": "pending",
        "created_at": datetime.now(timezone.utc)
    }
    
    # Check if already invited
    existing = await db.creator_invitations.find_one({"email": email.lower()}, {"_id": 0})
    if existing:
        return {"message": "Creator already invited", "invitation": existing}
    
    await db.creator_invitations.insert_one(invitation_doc)
    
    return {"message": "Creator invitation sent", "invitation": invitation_doc}

@api_router.get("/admin/invitations")
async def list_invitations(request: Request, session_token: Optional[str] = Cookie(None)):
    """Get all creator invitations"""
    admin = await require_role(request, "admin", session_token)
    
    invitations = await db.creator_invitations.find({}, {"_id": 0}).to_list(1000)
    
    return invitations

# ============================================
# WEBHOOK ENDPOINTS
# ============================================

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    body = await request.body()
    signature = request.headers.get("Stripe-Signature", "")
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Update transaction status
        if webhook_response.payment_status == "paid":
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {"payment_status": "paid"}}
            )
        
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# ============================================
# TEST ENDPOINT
# ============================================

@api_router.get("/")
async def root():
    return {"message": "SoundDrops API v1.0"}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
