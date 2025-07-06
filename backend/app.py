# app.py

import bcrypt
from datetime import datetime, timedelta
from jose import jwt, JWTError
import json # Add json to your imports
from fastapi import Form, FastAPI, Depends, HTTPException, status,File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordBearer
from data_processor import process_csv_file 
from fastapi.responses import StreamingResponse
import io
import os



# --- SQLAlchemy Database Setup ---
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy import ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta, timezone

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./users.db")
SQLALCHEMY_DATABASE_URL = DATABASE_URL
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")






class DBUser(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    history_records = relationship("History", back_populates="owner")

class History(Base):
    __tablename__ = "history"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    upload_date = Column(DateTime, default=datetime.now(timezone.utc))
    status = Column(String, default="completed")
    summary = Column(JSON) # Store the whole summary object
    user_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("DBUser", back_populates="history_records")

Base.metadata.create_all(bind=engine)

# --- JWT Configuration ---
SECRET_KEY = "your-super-secret-key-that-no-one-should-know" # Change this!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# --- Pydantic Models ---
class UserOut(BaseModel):
    username: str
class User(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

# --- FastAPI App & Functions ---
app = FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_access_token(data: dict):
    to_encode = data.copy()               
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(DBUser).filter(DBUser.username == username).first()
    if user is None:
        raise credentials_exception
    return user


# --- CORS Middleware ---
origins = ["http://localhost:8080"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API Endpoints ---
@app.post("/api/register")
def register_user(user: User, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = db.query(DBUser).filter(DBUser.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
        
    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())
    db_user = DBUser(username=user.username, password_hash=hashed_password.decode('utf-8'))
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {"message": f"User {user.username} registered successfully"}

@app.post("/api/login", response_model=Token)
def login_for_access_token(user: User, db: Session = Depends(get_db)):
    db_user = db.query(DBUser).filter(DBUser.username == user.username).first()
    if not db_user or not bcrypt.checkpw(user.password.encode('utf-8'), db_user.password_hash.encode('utf-8')):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...),options: str = Form(...), current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):

    start_time = datetime.now(timezone.utc)
    try:
        # Convert the options string back into a Python dictionary
        options_dict = json.loads(options)

        # Pass both the file and the options to the processor
        summary,df_cleaned = process_csv_file(file, options_dict)
        end_time = datetime.now(timezone.utc)
        processing_time = (end_time - start_time).total_seconds()
        summary["processing_time_seconds"] = round(processing_time, 2)
        new_history_record = History(
            filename=file.filename,
            summary=summary,
            user_id=current_user.id
        )
        db.add(new_history_record)
        db.commit()
        
        summary["filename"] = file.filename
        summary["user"] = current_user.username
        
        return summary

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {e}")


@app.post("/api/download/csv")
async def download_cleaned_csv(
    file: UploadFile = File(...), 
    options: str = Form(...),
    current_user: DBUser = Depends(get_current_user)
):
    try:
        options_dict = json.loads(options)
        # We only need the DataFrame, so we ignore the summary
        _, df_cleaned = process_csv_file(file, options_dict)

        # Convert the DataFrame to a CSV string in memory
        stream = io.StringIO()
        df_cleaned.to_csv(stream, index=False)
        
        # Create a response that the browser will download
        response = StreamingResponse(iter([stream.getvalue()]),
                           media_type="text/csv")
        response.headers["Content-Disposition"] = f"attachment; filename=cleaned_{file.filename}"
        return response
    except Exception as e:
        print("Download error:", str(e))
        raise HTTPException(status_code=500, detail=f"Error creating file for download: {e}")
# In backend/app.py

@app.get("/api/users/me", response_model=UserOut)
async def read_users_me(current_user: DBUser = Depends(get_current_user)):
    """
    Get the details of the currently logged-in user.
    """
    return current_user

@app.get("/api/history")
def get_user_history(current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Fetches all history records from the database for the currently logged-in user.
    """
    history_records = db.query(History).filter(History.user_id == current_user.id).order_by(History.upload_date.desc()).all()
    return history_records

@app.delete("/api/history/{record_id}")
def delete_history(record_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    record = db.query(History).filter_by(id=record_id, user_id=current_user.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(record)
    db.commit()
    return {"message": "Deleted successfully"}

