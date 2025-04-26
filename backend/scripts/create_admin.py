import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_path = str(Path(__file__).parent.parent)
sys.path.append(backend_path)

from sqlalchemy.orm import Session
from database import engine, Base
from models.user import User
from utils.auth import get_password_hash

def create_admin_user():
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    # Create a session
    db = Session(engine)
    
    # Check if admin user already exists
    admin = db.query(User).filter(User.email == "admin@idealtransport.com").first()
    
    if not admin:
        # Create admin user
        admin_user = User(
            email="admin@idealtransport.com",
            hashed_password=get_password_hash("Admin@123"),
            full_name="Admin User",
            is_superuser=True,
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        print("Admin user created successfully!")
    else:
        print("Admin user already exists!")
    
    db.close()

if __name__ == "__main__":
    create_admin_user() 