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
    
    # Define users to create
    users_to_create = [
        {
            "email": "Deshawn1011@idealtransport.com",
            "password": "Texas@1011",
            "full_name": "Deshawn",
            "is_superuser": False,
            "is_active": True
        },
        {
            "email": "Romeo1012@idealtransport.com",
            "password": "California@1012",
            "full_name": "Romeo",
            "is_superuser": False,
            "is_active": True
        },
        {
            "email": "Augustin1013@idealtransport.com",
            "password": "Vegas@1013",
            "full_name": "Augustin",
            "is_superuser": False,
            "is_active": True
        }
    ]
    
    # Create each user
    for user_data in users_to_create:
        existing_user = db.query(User).filter(User.email == user_data["email"]).first()
        
        if not existing_user:
            new_user = User(
                email=user_data["email"],
                hashed_password=get_password_hash(user_data["password"]),
                full_name=user_data["full_name"],
                is_superuser=user_data["is_superuser"],
                is_active=user_data["is_active"]
            )
            db.add(new_user)
            print(f"Created user: {user_data['email']} with password: {user_data['password']}")
        else:
            print(f"User {user_data['email']} already exists!")
    
    db.commit()
    db.close()
    print("\nAll users created successfully!")
    print("\nUser Credentials:")
    print("1. idealtransport@gmail.com / Ideal@123 (Superuser)")
    print("2. driver1@idealtransport.com / Driver@123 (Regular User)")
    print("3. driver2@idealtransport.com / Driver@123 (Regular User)")
    print("4. manager@idealtransport.com / Manager@123 (Regular User)")

if __name__ == "__main__":
    create_admin_user() 