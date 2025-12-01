'use client';

import { useState } from 'react';

export default function ConfirmUsersPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const confirmAllUsers = async () => {
    setLoading(true);
    setResult('');
    
    try {
      const response = await fetch('/api/auth/confirm-all-users', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult(`Success: ${data.message}`);
      } else {
        setResult(`Error: ${data.error}`);
      }
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Admin: Confirm All Users
        </h1>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <p className="text-gray-600 mb-4">
            This will confirm all unconfirmed users in your database, allowing them to sign in without email verification.
          </p>
          
          <button
            onClick={confirmAllUsers}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Confirming Users...' : 'Confirm All Users'}
          </button>
          
          {result && (
            <div className={`mt-4 p-4 rounded-md ${
              result.startsWith('Success') 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {result}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}