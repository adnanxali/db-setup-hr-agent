'use client';

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';

export default function LogoutButton() {
  const router = useRouter();
  const { clearUser, addNotification } = useAppStore();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST'
      });

      if (response.ok) {
        clearUser();
        addNotification({
          type: 'success',
          message: 'Logged out successfully'
        });
        router.push('/');
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to logout'
      });
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
    >
      Sign Out
    </button>
  );
}