import { useEffect, useState, useRef } from 'react';
import { authService } from '@/services/auth';

// Cache user data for 5 minutes
// Note: Cache is cleared when user changes (by email comparison)
const USER_CACHE_KEY = 'access_control_user';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CachedUser {
  user: any;
  timestamp: number;
}

export const useAccessControl = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const isFetching = useRef(false);

  useEffect(() => {
    const checkAccess = async () => {
      // Check if already fetching to prevent duplicate calls
      if (isFetching.current) return;
      
      try {
        // Get token to check current user email
        const token = authService.getToken();
        
        // Fetch fresh data first to ensure we have the correct user
        isFetching.current = true;
        const user = await authService.getCurrentUser();
        
        if (!user) {
          // Clear cache if no user
          sessionStorage.removeItem(USER_CACHE_KEY);
          setCurrentUser(null);
          setHasAccess(false);
          setLoading(false);
          isFetching.current = false;
          return;
        }
        
        // Check cache and validate it matches current user
        const cachedData = sessionStorage.getItem(USER_CACHE_KEY);
        if (cachedData) {
          const cached: CachedUser = JSON.parse(cachedData);
          const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
          
          // If cached user email doesn't match current user, clear cache
          if (cached.user && cached.user.email !== user.email) {
            console.log('User changed, clearing cache. Old:', cached.user.email, 'New:', user.email);
            sessionStorage.removeItem(USER_CACHE_KEY);
          } else if (!isExpired && cached.user && cached.user.email === user.email) {
            // Cache is valid and matches current user, use it for faster initial render
            setCurrentUser(cached.user);
            const isAdmin = cached.user.is_superuser === true || cached.user.is_superuser === 'true';
            setHasAccess(isAdmin);
            setLoading(false);
            // Continue to update with fresh data below
          }
        }
        
        // Cache the result
        const cacheData: CachedUser = {
          user,
          timestamp: Date.now()
        };
        sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(cacheData));
        
        setCurrentUser(user);
        
        // Access control based on is_superuser flag - handle both boolean and string
        const isAdmin = user.is_superuser === true || user.is_superuser === 'true' || user.is_superuser === 1;
        setHasAccess(isAdmin);
        
        console.log('useAccessControl - User loaded:', {
          email: user.email,
          full_name: user.full_name,
          is_superuser: user.is_superuser,
          is_superuser_type: typeof user.is_superuser,
          isAdmin: isAdmin
        });
      } catch (error) {
        console.error('Error checking access:', error);
        // Clear cache on error
        sessionStorage.removeItem(USER_CACHE_KEY);
        setCurrentUser(null);
        setHasAccess(false);
      } finally {
        setLoading(false);
        isFetching.current = false;
      }
    };

    checkAccess();
  }, []);

  // Determine isSuperuser - handle boolean, string, and number types
  const isSuperuserValue = currentUser && (
    currentUser.is_superuser === true || 
    currentUser.is_superuser === 'true' || 
    currentUser.is_superuser === 1 ||
    currentUser.is_superuser === '1'
  );

  return {
    currentUser,
    loading,
    hasAccess,
    isSuperuser: Boolean(isSuperuserValue)
  };
}; 