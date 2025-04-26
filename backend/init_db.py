from database import Base, engine
from models.user import User
from models.transaction import Transaction

def init_db():
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    init_db() 