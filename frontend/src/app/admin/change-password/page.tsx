'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Key, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const minLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+~`|}{[\]:;?><,./\-=]/.test(newPassword);
  
  const isStrong = minLength && hasUpper && hasLower && hasNumber && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (!isStrong) {
      setError('Please ensure the new password meets all security requirements.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/api/auth/change-password', {
        currentPassword,
        newPassword
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to change password');
      }

      // Successful password change
      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'An error occurred while changing password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-neutral-200">
        <div className="p-8 pb-6 border-b border-neutral-100 text-center">
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Security Update Required</h1>
          <p className="text-sm text-neutral-500 mt-2">
            Your password was recently reset by the administrator. For your security, please create a new password now.
          </p>
        </div>

        {error && (
          <div className="mx-8 mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-8 space-y-6 pt-6">
          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-2">Temporary / Current Password</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input 
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-orange-500 transition-colors text-neutral-900"
                placeholder="Enter current password"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-2">New Password</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input 
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-orange-500 transition-colors text-neutral-900"
                placeholder="Create new password"
              />
            </div>

            <div className="mt-4 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <p className="text-xs font-bold text-neutral-700 uppercase mb-3">Password Requirements:</p>
              <ul className="space-y-2 text-sm">
                <li className={`flex items-center gap-2 ${minLength ? 'text-green-600' : 'text-neutral-500'}`}>
                  {minLength ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-current opacity-30" />}
                  At least 8 characters
                </li>
                <li className={`flex items-center gap-2 ${hasUpper ? 'text-green-600' : 'text-neutral-500'}`}>
                  {hasUpper ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-current opacity-30" />}
                  One uppercase letter (A-Z)
                </li>
                <li className={`flex items-center gap-2 ${hasLower ? 'text-green-600' : 'text-neutral-500'}`}>
                  {hasLower ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-current opacity-30" />}
                  One lowercase letter (a-z)
                </li>
                <li className={`flex items-center gap-2 ${hasNumber ? 'text-green-600' : 'text-neutral-500'}`}>
                  {hasNumber ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-current opacity-30" />}
                  One number (0-9)
                </li>
                <li className={`flex items-center gap-2 ${hasSpecial ? 'text-green-600' : 'text-neutral-500'}`}>
                  {hasSpecial ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-current opacity-30" />}
                  One special character (!@#$...)
                </li>
              </ul>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-2">Confirm New Password</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input 
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-orange-500 transition-colors text-neutral-900"
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !isStrong || !currentPassword || !confirmPassword}
            className="w-full flex justify-center items-center py-3 px-4 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
