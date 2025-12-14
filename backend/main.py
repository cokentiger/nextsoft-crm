import os
from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy import create_engine, Column, Integer, String, Boolean, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.dialects.postgresql import UUID, JSONB
from dotenv import load_dotenv

# Load biến môi trường
load_dotenv()

# Cấu hình DB
DATABASE_URL = os.getenv("DATABASE_URL")
# Fix lỗi nhỏ của thư viện nếu chuỗi bắt đầu bằng postgres://
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

app = FastAPI(title="Nextsoft CRM API")

# Dependency để lấy DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- MODELS (Ánh xạ bảng trong DB) ---
class Customer(Base):
    __tablename__ = "customers"
    id = Column(UUID(as_uuid=True), primary_key=True)
    name = Column(String)
    email = Column(String)
    health_score = Column(Integer)
    lifecycle_stage = Column(String)

class Deployment(Base):
    __tablename__ = "deployments"
    id = Column(UUID(as_uuid=True), primary_key=True)
    customer_id = Column(UUID(as_uuid=True))
    app_url = Column(String)
    current_version = Column(String)
    custom_config = Column(JSONB) # Cấu hình riêng JSON

# --- API ENDPOINTS ---

@app.get("/")
def read_root():
    return {"message": "Nextsoft CRM API is running!"}

@app.get("/customers")
def get_customers(db: Session = Depends(get_db)):
    # Lấy danh sách khách hàng
    return db.query(Customer).all()

@app.get("/deployments/search")
def search_deployments(feature_key: str, db: Session = Depends(get_db)):
    # Tìm khách hàng có dùng tính năng đặc biệt (JSONB Query)
    # VD query: /deployments/search?feature_key=sms_brandname
    sql = text(f"SELECT * FROM deployments WHERE custom_config ? :key")
    result = db.execute(sql, {"key": feature_key}).fetchall()
    return [dict(row._mapping) for row in result]