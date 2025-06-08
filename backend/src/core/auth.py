from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import Optional
import jwt
from jwt.exceptions import InvalidTokenError, DecodeError  # Correct import for JWT exceptions
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from core.database import db_manager
from supabase import create_client, Client
import logging

load_dotenv()
logger = logging.getLogger(__name__)

# Configuration from environment variables
SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret-key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

class AuthService:
    """Service class for handling authentication operations."""
    
    def __init__(self):
        # Regular client for user operations
        self.supabase = db_manager.client
        
        # Service role client for admin operations (like user creation)
        service_key = os.getenv("SUPABASE_SERVICE_KEY")
        supabase_url = os.getenv("SUPABASE_URL")
        
        if service_key and supabase_url:
            self.admin_client = create_client(supabase_url, service_key)
            logger.info("Service role client initialized for admin operations")
        else:
            logger.warning("Service role key not found, using regular client")
            self.admin_client = self.supabase
    
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """
        Create JWT access token.
        
        Args:
            data: Dictionary containing user data to encode
            expires_delta: Optional custom expiration time
        
        Returns:
            Encoded JWT token string
        """
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    async def authenticate_user(self, email: str, password: str) -> Optional[dict]:
        """
        Authenticate user with Supabase Auth.
        
        Args:
            email: User email
            password: User password
        
        Returns:
            User data if authentication successful, None otherwise
        """
        try:
            # Use Supabase Auth for authentication
            auth_response = self.supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            
            if auth_response.user:
                # Get additional user data from your users table
                user_data = self.supabase.table('users').select('*').eq('id', auth_response.user.id).execute()
                
                if user_data.data:
                    return {
                        "id": auth_response.user.id,
                        "email": auth_response.user.email,
                        "supabase_token": auth_response.session.access_token,
                        **user_data.data[0]
                    }
            return None
            
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            return None
    
    async def create_user(self, email: str, password: str, full_name: str = None, company: str = None) -> dict:
        """
        Create new user with Supabase Auth using proper security.
        
        Args:
            email: User email
            password: User password
            full_name: Optional full name
            company: Optional company name
        
        Returns:
            Created user data
        
        Raises:
            HTTPException: If user creation fails
        """
        # Validation for required fields
        if not full_name or not full_name.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Full name is required.")
        if not company or not company.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Company is required.")
        
        try:
            logger.info(f"Creating user with email: {email}")
            
            # Step 1: Create user in Supabase Auth
            auth_response = self.supabase.auth.sign_up({
                "email": email,
                "password": password,
                "options": {
                    "data": {
                        "full_name": full_name,
                        "company": company
                    }
                }
            })
            
            if not auth_response.user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to create user in authentication system"
                )
            
            logger.info(f"Auth user created with ID: {auth_response.user.id}")
            
            # Step 2: Wait a moment for potential trigger to complete
            import asyncio
            await asyncio.sleep(0.5)
            
            # Step 3: Check if user record already exists (created by trigger)
            existing_user = self.admin_client.table('users').select('*').eq('id', auth_response.user.id).execute()
            
            if existing_user.data:
                # User record exists, update it with the provided data
                logger.info(f"User record already exists, updating with provided data")
                
                update_data = {
                    "full_name": full_name.strip(),
                    "company": company.strip(),
                    "email": email,  # Ensure email is set
                    "updated_at": "now()"
                }
                
                result = self.admin_client.table('users').update(update_data).eq('id', auth_response.user.id).execute()
                
                if result.data:
                    updated_user = result.data[0]
                    logger.info(f"User record updated successfully: {updated_user['id']}")
                    
                    return {
                        "id": updated_user["id"],
                        "email": updated_user["email"],
                        "full_name": updated_user["full_name"],
                        "company": updated_user["company"],
                        "created_at": updated_user["created_at"]
                    }
                else:
                    # If update fails, use existing data
                    existing_data = existing_user.data[0]
                    return {
                        "id": existing_data["id"],
                        "email": existing_data["email"],
                        "full_name": existing_data.get("full_name") or full_name,
                        "company": existing_data.get("company") or company,
                        "created_at": existing_data["created_at"]
                    }
            else:
                # User record doesn't exist, create it
                logger.info(f"User record doesn't exist, creating new record")
                
                user_data = {
                    "id": auth_response.user.id,
                    "email": email,
                    "full_name": full_name.strip(),
                    "company": company.strip(),
                    "is_active": True
                }
                
                # Use UPSERT instead of INSERT to handle race conditions
                result = self.admin_client.table('users').upsert(user_data, on_conflict="id").execute()
                
                if result.data:
                    created_user = result.data[0]
                    logger.info(f"User record created successfully: {created_user['id']}")
                    
                    return {
                        "id": created_user["id"],
                        "email": created_user["email"],
                        "full_name": created_user["full_name"],
                        "company": created_user["company"],
                        "created_at": created_user["created_at"]
                    }
                else:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Failed to create user record in database"
                    )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"User creation error: {str(e)}")
            
            # If it's a duplicate key error and we have the user ID, try to fetch the existing user
            if "duplicate key value violates unique constraint" in str(e) and auth_response and auth_response.user:
                try:
                    existing_user = self.admin_client.table('users').select('*').eq('id', auth_response.user.id).execute()
                    if existing_user.data:
                        logger.info("Found existing user record, returning it")
                        existing_data = existing_user.data[0]
                        return {
                            "id": existing_data["id"],
                            "email": existing_data["email"],
                            "full_name": existing_data.get("full_name") or full_name,
                            "company": existing_data.get("company") or company,
                            "created_at": existing_data["created_at"]
                        }
                except Exception as fetch_error:
                    logger.error(f"Failed to fetch existing user: {str(fetch_error)}")
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User creation failed: {str(e)}"
            )
    
    async def get_user_by_id(self, user_id: str) -> Optional[dict]:
        """
        Get user data by ID from Supabase.
        
        Args:
            user_id: User ID
        
        Returns:
            User data if found, None otherwise
        """
        try:
            result = self.supabase.table('users').select('*').eq('id', user_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error fetching user {user_id}: {str(e)}")
            return None

# Global auth service instance
auth_service = AuthService()

async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Dependency to get current authenticated user.
    
    Args:
        token: JWT token from Authorization header
    
    Returns:
        Current user data
    
    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Check if token has proper format
        if not token or len(token.split('.')) != 3:
            logger.warning(f"Invalid token format: {token[:20]}...")
            raise credentials_exception
        
        # Decode JWT token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        
        if user_id is None:
            raise credentials_exception
        
        # Get user from database
        user = await auth_service.get_user_by_id(user_id)
        if user is None:
            raise credentials_exception
        
        return user
        
    except (InvalidTokenError, DecodeError) as e:
        logger.warning(f"JWT decode error: {str(e)}")
        raise credentials_exception
    except Exception as e:
        logger.error(f"Unexpected error in get_current_user: {str(e)}")
        raise credentials_exception

async def get_current_active_user(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Dependency to get current active user.
    
    Args:
        current_user: Current user from get_current_user dependency
    
    Returns:
        Current active user data
    
    Raises:
        HTTPException: If user is not active
    """
    if not current_user.get("is_active"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Inactive user"
        )
    return current_user