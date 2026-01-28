"""
Redis caching utilities for BOL lists and other frequently accessed data
"""
import json
import hashlib
from typing import Optional, Any
import redis
from functools import wraps
import os

# Initialize Redis connection
redis_client: Optional[redis.Redis] = None

def get_redis_client() -> Optional[redis.Redis]:
    """Get or create Redis client"""
    global redis_client
    
    if redis_client is not None:
        return redis_client
    
    try:
        redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
        redis_client = redis.from_url(redis_url, decode_responses=True)
        # Test connection
        redis_client.ping()
        return redis_client
    except Exception as e:
        print(f"Redis not available: {e}. Caching disabled.")
        return None

def generate_cache_key(prefix: str, **kwargs) -> str:
    """Generate a cache key from prefix and parameters"""
    # Sort kwargs for consistent key generation
    sorted_params = sorted(kwargs.items())
    param_str = json.dumps(sorted_params, sort_keys=True)
    param_hash = hashlib.md5(param_str.encode()).hexdigest()
    return f"{prefix}:{param_hash}"

def cache_bol_list(ttl: int = 300):
    """
    Decorator to cache BOL list queries
    TTL defaults to 5 minutes (300 seconds)
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            client = get_redis_client()
            
            # If Redis is not available, just call the function
            if client is None:
                return await func(*args, **kwargs) if hasattr(func, '__code__') and 'async' in str(func.__code__) else func(*args, **kwargs)
            
            # Generate cache key from function name and kwargs
            cache_key = generate_cache_key(f"bol_list:{func.__name__}", **kwargs)
            
            # Try to get from cache
            try:
                cached_data = client.get(cache_key)
                if cached_data:
                    return json.loads(cached_data)
            except Exception as e:
                print(f"Error reading from cache: {e}")
            
            # Call the function
            result = await func(*args, **kwargs) if hasattr(func, '__code__') and 'async' in str(func.__code__) else func(*args, **kwargs)
            
            # Store in cache
            try:
                # Convert result to JSON-serializable format if needed
                if hasattr(result, '__dict__'):
                    result = [item.__dict__ if hasattr(item, '__dict__') else item for item in result]
                elif isinstance(result, list):
                    result = [item.__dict__ if hasattr(item, '__dict__') else item for item in result]
                
                client.setex(cache_key, ttl, json.dumps(result, default=str))
            except Exception as e:
                print(f"Error writing to cache: {e}")
            
            return result
        return wrapper
    return decorator

def invalidate_bol_cache(pattern: str = "bol_list:*"):
    """Invalidate all BOL list caches matching a pattern"""
    client = get_redis_client()
    if client is None:
        return
    
    try:
        keys = client.keys(pattern)
        if keys:
            client.delete(*keys)
            print(f"Invalidated {len(keys)} cache keys matching {pattern}")
    except Exception as e:
        print(f"Error invalidating cache: {e}")

def get_cached_data(key: str) -> Optional[Any]:
    """Get data from cache by key"""
    client = get_redis_client()
    if client is None:
        return None
    
    try:
        data = client.get(key)
        if data:
            return json.loads(data)
    except Exception as e:
        print(f"Error getting cached data: {e}")
    
    return None

def set_cached_data(key: str, value: Any, ttl: int = 300):
    """Set data in cache with TTL"""
    client = get_redis_client()
    if client is None:
        return
    
    try:
        client.setex(key, ttl, json.dumps(value, default=str))
    except Exception as e:
        print(f"Error setting cached data: {e}")
