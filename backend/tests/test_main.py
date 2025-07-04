from fastapi.testclient import TestClient
from ..main import app

client = TestClient(app)

def test_read_main():
    """Test the root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to Ideal Transportation Solutions API"} 