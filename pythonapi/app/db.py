import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Need the SQLite file in the same folder as this file (app/ems.db)
HERE = os.path.dirname(__file__)
DB_FILE = os.path.join(HERE, "ems.db")
DB_FILE = DB_FILE.replace("\\", "/")
DATABASE_URL = f"sqlite:///{DB_FILE}"


engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
