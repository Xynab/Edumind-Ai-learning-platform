from fastapi import APIRouter
from pydantic import BaseModel, EmailStr
from typing import Optional
from services.auth_service import register_user, login_user

router = APIRouter()


class RegisterReq(BaseModel):
    name: str
    email: EmailStr
    password: str
    goal: Optional[str] = ""


class LoginReq(BaseModel):
    email: EmailStr
    password: str


@router.post("/register")
async def register(data: RegisterReq):
    return await register_user(data.name, data.email, data.password, data.goal)


@router.post("/login")
async def login(data: LoginReq):
    return await login_user(data.email, data.password)
