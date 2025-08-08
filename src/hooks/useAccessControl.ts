import { useEffect, useState } from 'react';
import { authService } from '@/services/auth';

export const useAccessControl = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const user = await authService.getCurrentUser();
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