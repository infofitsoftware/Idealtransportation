import { useEffect, useState, useRef } from 'react';
import { authService } from '@/services/auth';

// Cache user data for 5 minutes
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
        // Check cache first
        const cachedData = sessionStorage.getItem(USER_CACHE_KEY);
        if (cachedData) {
          const cached: CachedUser = JSON.parse(cachedData);
          const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
          
          if (!isExpired && cached.user) {
            setCurrentUser(cached.user);
            setHasAccess(cached.user.email === 'admin@idealtransport.com');
            setLoading(false);
            return;
          }
        }
        
        // Fetch fresh data if cache miss or expired
        isFetching.current = true;
        const user = await authService.getCurrentUser();
        
        // Cache the result
        if (user) {
          const cacheData: CachedUser = {
            user,
            timestamp: Date.now()
          };
          sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(cacheData));
        }
        
        setCurrentUser(user);
        
        // Temporary access control: only idealtransport@gmail.com can access reports
        if (user && user.email === 'admin@idealtransport.com') {
          setHasAccess(true);
        } else {
          setHasAccess(false);
        }
      } catch (error) {
        console.error('Error checking access:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
        isFetching.current = false;
      }
    };

    checkAccess();
  }, []);

  return {
    currentUser,
    loading,
    hasAccess,
    isSuperuser: currentUser?.email === 'admin@idealtransport.com'
  };
}; 