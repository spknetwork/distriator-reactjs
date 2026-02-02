import { useEffect } from 'react';
import { useAuthStore } from 'hive-authentication';
import { toast } from 'sonner';

const TokenExpirationHandler = () => {
  const { clearAllUsers } = useAuthStore();

  const handleProgrammaticLogout = async () => {
    try {
      clearAllUsers();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const handleTokenExpired = (event: CustomEvent) => {
      if (signal.aborted) return;
      toast(event.detail.message);
      handleProgrammaticLogout();
      controller.abort();
    };

    // Listen for token expiration events
    window.addEventListener('tokenExpired', handleTokenExpired as EventListener);

    // Cleanup listener on unmount
    return () => {
      controller.abort();
      window.removeEventListener('tokenExpired', handleTokenExpired as EventListener);
    };
  }, []);

  // This component doesn't render anything
  return null;
};

export default TokenExpirationHandler;
