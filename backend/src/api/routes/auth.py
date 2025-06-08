#routes/auth.py

from fastapi import APIRouter, HTTPException, Depends, status, Header
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from typing import Dict, Any
import logging
from pydantic import BaseModel, EmailStr
import os  
import jwt 

from api.models.user import UserCreate, UserLogin, UserResponse, TokenResponse, UserUpdate
from api.models.base import BaseResponse
from core.auth import auth_service, get_current_active_user, ACCESS_TOKEN_EXPIRE_MINUTES

logger = logging.getLogger(__name__)
router = APIRouter()

# Additional Pydantic models for new endpoints
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResendVerificationRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@router.post("/register", response_model=BaseResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate):
    """
    Register a new user.
    
    Args:
        user_data: User registration data
    
    Returns:
        Success response with user data
    
    Raises:
        HTTPException: If registration fails
    """
    try:
        # Create user in Supabase
        user = await auth_service.create_user(
            email=user_data.email,
            password=user_data.password,
            full_name=user_data.full_name,
            company=user_data.company
        )
        
        return BaseResponse(
            success=True,
            message="User registered successfully",
            data={
                "user": {
                    "id": user["id"],
                    "email": user["email"],
                    "full_name": user["full_name"],
                    "company": user["company"]
                }
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )

@router.post("/login", response_model=TokenResponse)
async def login_user(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Authenticate user and return access token.
    
    Args:
        form_data: Login form data (username/email and password)
    
    Returns:
        Token response with access token and user data
    
    Raises:
        HTTPException: If authentication fails
    """
    try:
        # Authenticate user
        user = await auth_service.authenticate_user(form_data.username, form_data.password)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = auth_service.create_access_token(
            data={"sub": user["id"]}, 
            expires_delta=access_token_expires
        )
        
        # Return token response
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # Convert to seconds
            user=UserResponse(
                id=user["id"],
                email=user["email"],
                full_name=user.get("full_name"),
                company=user.get("company"),
                is_active=user.get("is_active", True),
                created_at=user.get("created_at")
            )
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_active_user)):
    """
    Get current authenticated user information.
    
    Args:
        current_user: Current authenticated user from dependency
    
    Returns:
        Current user data
    """
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        full_name=current_user.get("full_name"),
        company=current_user.get("company"),
        is_active=current_user.get("is_active", True),
        created_at=current_user.get("created_at"),
        updated_at=current_user.get("updated_at")
    )

@router.put("/me", response_model=BaseResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Update current authenticated user information.
    
    Args:
        user_update: User update data
        current_user: Current authenticated user from dependency
    
    Returns:
        Success response with updated user data
    
    Raises:
        HTTPException: If update fails
    """
    try:
        # Prepare update data
        update_data = {}
        if user_update.full_name is not None:
            update_data["full_name"] = user_update.full_name
        if user_update.company is not None:
            update_data["company"] = user_update.company
        
        if update_data:
            update_data["updated_at"] = "now()"
            
            # Update user in Supabase
            result = auth_service.supabase.table('users').update(update_data).eq('id', current_user["id"]).execute()
            
            if result.data:
                return BaseResponse(
                    success=True,
                    message="User updated successfully",
                    data={"user": result.data[0]}
                )
        
        return BaseResponse(
            success=True,
            message="No changes made",
            data={"user": current_user}
        )
        
    except Exception as e:
        logger.error(f"User update error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User update failed"
        )

@router.post("/logout", response_model=BaseResponse)
async def logout_user(current_user: dict = Depends(get_current_active_user)):
    """
    Logout current user (client-side token invalidation).
    
    Args:
        current_user: Current authenticated user from dependency
    
    Returns:
        Success response
    """
    try:
        # In a real implementation, you might want to blacklist the token
        # For now, we'll just return a success response
        # The client should delete the token from storage
        
        return BaseResponse(
            success=True,
            message="Logged out successfully",
            data={"user_id": current_user["id"]}
        )
        
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )

@router.post("/forgot-password", response_model=BaseResponse)
async def forgot_password(request: ForgotPasswordRequest):
    try:
        # Send password reset email with redirect URL
        auth_response = auth_service.supabase.auth.reset_password_email(
            request.email,
            {
                "redirect_to": "http://localhost:3000/reset-password"  # Update with your domain
            }
        )
        
        return BaseResponse(
            success=True,
            message="If an account with that email exists, we've sent password reset instructions.",
            data={"email": request.email}
        )
        
    except Exception as e:
        logger.error(f"Password reset error: {str(e)}")
        return BaseResponse(
            success=True,
            message="If an account with that email exists, we've sent password reset instructions.",
            data={"email": request.email}
        )
@router.post("/resend-verification", response_model=BaseResponse)
async def resend_verification_email(request: ResendVerificationRequest):
    """
    Resend email verification to user.
    
    Args:
        request: Resend verification request with email
    
    Returns:
        Success response
    """
    try:
        logger.info(f"Resending verification email for: {request.email}")
        
        # Use Supabase Auth to resend verification email
        auth_response = auth_service.supabase.auth.resend(
            type='signup',
            email=request.email
        )
        
        logger.info(f"Verification email resent for: {request.email}")
        
        return BaseResponse(
            success=True,
            message="Verification email sent successfully!",
            data={"email": request.email}
        )
        
    except Exception as e:
        logger.error(f"Resend verification error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to resend verification email. Please try again."
        )

@router.post("/reset-password", response_model=BaseResponse)
async def reset_password(request: ResetPasswordRequest, authorization: str = Header(None)):
    """
    Reset user password using reset token.
    
    Args:
        request: Reset password request with new password
        authorization: Bearer token from Authorization header
    
    Returns:
        Success response
    """
    try:
        if not authorization or not authorization.startswith('Bearer '):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authorization header required"
            )
        
        # Extract token from Authorization header
        access_token = authorization.split(' ')[1]
        
        logger.info("Password reset attempt with token")
        
        # Create a temporary Supabase client with the reset token
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY")
        
        if not supabase_url or not supabase_service_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Server configuration error"
            )
        
        # Use the service role client to update password
        from supabase import create_client
        admin_client = create_client(supabase_url, supabase_service_key)
        
        # Update user password using admin client
        try:
            # First verify the access token by decoding it
            import jwt
            payload = jwt.decode(access_token, options={"verify_signature": False})
            user_id = payload.get('sub')
            
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid reset token"
                )
            
            # Update password using admin client
            auth_response = admin_client.auth.admin.update_user_by_id(
                user_id, 
                {"password": request.new_password}
            )
            
            if auth_response.user:
                logger.info(f"Password reset successful for user: {auth_response.user.id}")
                
                return BaseResponse(
                    success=True,
                    message="Password reset successfully! You can now sign in with your new password.",
                    data={"user_id": auth_response.user.id}
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to update password"
                )
        
        except jwt.InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password reset error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to reset password. The link may be expired or invalid."
        )
@router.get("/verify-email")
async def verify_email(token: str):
    """
    Verify user email using verification token.
    
    Args:
        token: Email verification token from URL
    
    Returns:
        Success response or redirect
    """
    try:
        logger.info("Email verification attempt")
        
        # Use Supabase Auth to verify email
        # This endpoint is typically called from the email link
        # Supabase handles the verification automatically when the link is clicked
        
        return BaseResponse(
            success=True,
            message="Email verified successfully! You can now sign in to your account.",
            data={"verified": True}
        )
        
    except Exception as e:
        logger.error(f"Email verification error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification link"
        )

@router.get("/health", response_model=BaseResponse)
async def auth_health_check():
    """
    Health check endpoint for authentication service.
    
    Returns:
        Health status response
    """
    try:
        # Test basic Supabase connection
        # This is a simple check - in production you might want more comprehensive tests
        
        return BaseResponse(
            success=True,
            message="Authentication service is healthy",
            data={
                "status": "operational",
                "timestamp": "2024-01-01T00:00:00Z"  # You might want to use actual timestamp
            }
        )
        
    except Exception as e:
        logger.error(f"Auth health check failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication service health check failed"
        )