from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
from typing import List
from app.models.schemas import UserOut, CreateUserRequest, UpdateUserStatusRequest
from app.database import db
from app.security import get_password_hash, get_current_user_payload

router = APIRouter(prefix="/api/users", tags=["Team User Management"])


@router.get("", response_model=List[UserOut])
async def list_users(user_payload: dict = Depends(get_current_user_payload)):
    """Returns all team members"""
    return [
        UserOut(
            id=u["id"],
            email=u["email"],
            role=u["role"],
            status=u["status"],
            created_at=u["created_at"],
            last_login_at=u.get("last_login_at"),
        )
        for u in db.app_users
    ]


@router.post("", response_model=UserOut)
async def create_user(
    req: CreateUserRequest,
    user_payload: dict = Depends(get_current_user_payload),
):
    """Admin-only: Creates a new user"""
    if user_payload.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privilege required to create users",
        )

    # Check duplicate
    if any(u["email"].lower() == req.email.lower() for u in db.app_users):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )

    now = datetime.now(timezone.utc)
    new_user = {
        "id": len(db.app_users) + 1,
        "email": req.email,
        "password_hash": get_password_hash(req.password),
        "role": req.role,
        "status": "active",
        "created_at": now,
        "last_login_at": None,
    }
    db.app_users.append(new_user)

    return UserOut(
        id=new_user["id"],
        email=new_user["email"],
        role=new_user["role"],
        status=new_user["status"],
        created_at=new_user["created_at"],
        last_login_at=None,
    )


@router.patch("/{id}/status", response_model=UserOut)
async def update_user_status(
    id: int,
    req: UpdateUserStatusRequest,
    user_payload: dict = Depends(get_current_user_payload),
):
    """Enables or disables a user account"""
    user_match = next((u for u in db.app_users if u["id"] == id), None)
    if not user_match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user_match["status"] = req.status
    return UserOut(
        id=user_match["id"],
        email=user_match["email"],
        role=user_match["role"],
        status=user_match["status"],
        created_at=user_match["created_at"],
        last_login_at=user_match.get("last_login_at"),
    )


@router.delete("/{id}")
async def delete_user(
    id: int,
    user_payload: dict = Depends(get_current_user_payload),
):
    """Deletes a user account"""
    if id == 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete primary administrator",
        )

    initial_len = len(db.app_users)
    db.app_users = [u for u in db.app_users if u["id"] != id]
    if len(db.app_users) == initial_len:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return {"message": "User deleted successfully"}
