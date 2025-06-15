from setuptools import setup, find_packages

setup(
    name="idealtransportation",
    version="0.1",
    packages=find_packages(),
    install_requires=[
        "fastapi",
        "sqlalchemy>=2.0.0",
        "alembic",
        "pydantic",
        "python-jose[cryptography]",
        "passlib[bcrypt]",
        "python-multipart",
        "psycopg2-binary",
    ],
) 