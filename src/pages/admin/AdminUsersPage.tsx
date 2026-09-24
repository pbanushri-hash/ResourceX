import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { User } from '../../types';
import { Users, Building2, Mail, Phone, ShieldCheck, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';
import { VerificationBadge } from '../../components/common/StatusBadge';

export const AdminUsersPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateStatus = async (userId: string, status: User['verificationStatus']) => {
    try {
      await api.updateUserVerification(userId, status);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, verificationStatus: status } : u));
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Corporate User & Business Directory
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          System directory of all enterprise accounts, representative officers, and platform access roles.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading directory...</div>
      ) : users.length === 0 ? (
        <EmptyState
          title="No businesses registered yet."
          description="The user directory is currently empty. New corporate registrations will appear here automatically."
          icon={Users}
        />
      ) : (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 px-2">Enterprise / Contact</th>
                  <th className="pb-3 px-2">Platform Role</th>
                  <th className="pb-3 px-2">Registration (CIN)</th>
                  <th className="pb-3 px-2">GSTIN</th>
                  <th className="pb-3 px-2">Verification Status</th>
                  <th className="pb-3 px-2 text-right">Administrative Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-2">
                      <div className="font-bold text-slate-900">{u.companyName || u.name}</div>
                      <div className="text-[11px] text-slate-500">{u.name} • {u.email}</div>
                    </td>

                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        u.role === 'seller' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>

                    <td className="py-3 px-2 font-mono text-[11px] text-slate-600">
                      {u.registrationNumber || 'N/A'}
                    </td>

                    <td className="py-3 px-2 font-mono text-[11px] text-slate-600">
                      {u.gstNumber || 'N/A'}
                    </td>

                    <td className="py-3 px-2">
                      <VerificationBadge status={u.verificationStatus} />
                    </td>

                    <td className="py-3 px-2 text-right">
                      <select
                        value={u.verificationStatus}
                        onChange={e => handleUpdateStatus(u.id, e.target.value as any)}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold bg-white"
                      >
                        <option value="pending">Pending</option>
                        <option value="verified">Verified</option>
                        <option value="rejected">Rejected</option>
                        <option value="unverified">Unverified</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
