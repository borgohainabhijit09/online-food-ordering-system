import React, { useEffect, useState } from 'react';
import { Shield, Key, AlertTriangle, Clock, Activity, Check } from 'lucide-react';

export default function SecurityTab({ tenant }: { tenant: any }) {
  const [securityInfo, setSecurityInfo] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showResetModal, setShowResetModal] = useState(false);
  const [passwordType, setPasswordType] = useState<'auto' | 'manual'>('auto');
  const [manualPassword, setManualPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetResult, setResetResult] = useState<{ tempPassword?: string; message?: string } | null>(null);

  useEffect(() => {
    fetchSecurityData();
  }, [tenant.id]);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('superAdminToken');
      
      const [secRes, auditRes] = await Promise.all([
        fetch(`/api/super-admin/restaurants/${tenant.id}/security`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/super-admin/restaurants/${tenant.id}/audit-logs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (secRes.ok) setSecurityInfo(await secRes.json());
      if (auditRes.ok) setAuditLogs(await auditRes.json());
    } catch (err) {
      console.error('Error fetching security data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setResetting(true);
    try {
      const token = localStorage.getItem('superAdminToken');
      const res = await fetch(`/api/super-admin/restaurants/${tenant.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          passwordType,
          manualPassword: passwordType === 'manual' ? manualPassword : undefined
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setResetResult({ message: data.message, tempPassword: data.tempPassword });
        fetchSecurityData(); // Refresh security info and audit logs
      } else {
        alert(data.message || 'Failed to reset password');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setResetting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-neutral-500">Loading security data...</div>;
  if (!securityInfo) return <div className="p-8 text-center text-red-500">Failed to load security data. Tenant may not have an admin assigned.</div>;

  const isLocked = securityInfo.lockedUntil && new Date(securityInfo.lockedUntil) > new Date();

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Activity className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-neutral-500 font-bold uppercase">Last Login</p>
            <p className="text-neutral-900 font-medium">
              {securityInfo.lastLoginAt ? new Date(securityInfo.lastLoginAt).toLocaleString() : 'Never'}
            </p>
          </div>
        </div>
        <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 flex items-center gap-3">
          <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Key className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-neutral-500 font-bold uppercase">Last Password Change</p>
            <p className="text-neutral-900 font-medium">
              {securityInfo.lastPasswordChangeAt ? new Date(securityInfo.lastPasswordChangeAt).toLocaleString() : 'Never'}
            </p>
          </div>
        </div>
        <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isLocked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
            {isLocked ? <AlertTriangle className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
          </div>
          <div>
            <p className="text-xs text-neutral-500 font-bold uppercase">Account Status</p>
            <p className={`font-medium ${isLocked ? 'text-red-600' : 'text-green-600'}`}>
              {isLocked ? `Locked until ${new Date(securityInfo.lockedUntil).toLocaleTimeString()}` : 'Secure'}
            </p>
          </div>
        </div>
        <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 flex items-center gap-3">
          <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><AlertTriangle className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-neutral-500 font-bold uppercase">Failed Login Attempts</p>
            <p className="text-neutral-900 font-medium">{securityInfo.failedLoginAttempts || 0}</p>
          </div>
        </div>
      </div>

      {/* Force Password Change Warning */}
      {securityInfo.forcePasswordChange && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
          <div>
            <h4 className="font-bold text-orange-800">Pending Password Change</h4>
            <p className="text-sm text-orange-700 mt-1">
              The user has been forced to change their password and will be prompted to do so on their next login.
            </p>
          </div>
        </div>
      )}

      {/* Reset Password Button */}
      <div className="border-t border-neutral-100 pt-6">
        <h3 className="font-bold text-neutral-900 mb-2">Administrative Actions</h3>
        <button
          onClick={() => setShowResetModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-bold rounded-xl hover:bg-neutral-800 transition-colors"
        >
          <Key className="w-4 h-4" />
          Reset Password
        </button>
      </div>

      {/* Audit Logs */}
      <div className="border-t border-neutral-100 pt-6">
        <h3 className="font-bold text-neutral-900 mb-4">Security Audit Logs</h3>
        {auditLogs.length === 0 ? (
          <p className="text-sm text-neutral-500">No security logs found.</p>
        ) : (
          <div className="bg-neutral-50 rounded-xl border border-neutral-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100 border-b border-neutral-200 text-neutral-500 uppercase">
                <tr>
                  <th className="px-4 py-2">Action</th>
                  <th className="px-4 py-2">Performed By</th>
                  <th className="px-4 py-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {auditLogs.map(log => (
                  <tr key={log.id}>
                    <td className="px-4 py-2 font-medium text-neutral-900">{log.action}</td>
                    <td className="px-4 py-2 text-neutral-600">{log.performedBy}</td>
                    <td className="px-4 py-2 text-neutral-500">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden p-6">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">Reset Password</h2>
            
            {!resetResult ? (
              <>
                <p className="text-sm text-neutral-600 mb-4">
                  This action will immediately invalidate the current password and force the restaurant owner to create a new password on their next login.
                </p>

                <div className="space-y-4 mb-6">
                  <div className="flex bg-neutral-100 p-1 rounded-lg">
                    <button
                      className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-colors ${passwordType === 'auto' ? 'bg-white shadow-sm text-black' : 'text-neutral-500'}`}
                      onClick={() => setPasswordType('auto')}
                    >
                      Auto Generate
                    </button>
                    <button
                      className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-colors ${passwordType === 'manual' ? 'bg-white shadow-sm text-black' : 'text-neutral-500'}`}
                      onClick={() => setPasswordType('manual')}
                    >
                      Manual Entry
                    </button>
                  </div>

                  {passwordType === 'manual' && (
                    <div>
                      <input
                        type="text"
                        placeholder="Enter secure password"
                        value={manualPassword}
                        onChange={(e) => setManualPassword(e.target.value)}
                        className="w-full border border-neutral-200 rounded-xl px-4 py-2 outline-none focus:border-black text-sm"
                      />
                      <p className="text-xs text-neutral-500 mt-1">Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char.</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 justify-end">
                  <button onClick={() => setShowResetModal(false)} className="px-4 py-2 text-sm font-bold text-neutral-500">Cancel</button>
                  <button
                    onClick={handleResetPassword}
                    disabled={resetting || (passwordType === 'manual' && !manualPassword)}
                    className="px-4 py-2 bg-black text-white text-sm font-bold rounded-xl disabled:opacity-50"
                  >
                    {resetting ? 'Resetting...' : 'Confirm Reset'}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-neutral-900 mb-2">Password Reset Successful</h3>
                <p className="text-sm text-neutral-600 mb-4">{resetResult.message}</p>
                
                <div className="bg-neutral-100 p-4 rounded-xl mb-6 select-all border border-neutral-200 text-center font-mono text-lg tracking-wider font-bold">
                  {resetResult.tempPassword}
                </div>
                
                <p className="text-xs text-neutral-500 mb-6">
                  Share this temporary password securely with the restaurant owner.
                </p>
                
                <button
                  onClick={() => {
                    setShowResetModal(false);
                    setResetResult(null);
                  }}
                  className="w-full py-2 bg-black text-white font-bold rounded-xl"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
