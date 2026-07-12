"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageCircle,
  LogOut,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Loader2,
  Users,
  Power,
} from "lucide-react";

interface BotConfig {
  isActive: boolean;
  waActive: boolean;
  fbActive: boolean;
  igActive: boolean;
  waNumber: string | null;
}

interface UserRow {
  id: string;
  username: string;
  email: string;
  isApproved: boolean;
  paymentStatus: string;
  createdAt: string;
  botConfig: BotConfig | null;
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadUsers = async () => {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    if (res.ok) setUsers(data.users);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const updateUser = async (id: string, data: any) => {
    setBusyId(id);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) await loadUsers();
    setBusyId(null);
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Delete this user permanently?")) return;
    setBusyId(id);
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) await loadUsers();
    setBusyId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-darker flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const pendingCount = users.filter((u) => !u.isApproved).length;
  const activeCount = users.filter((u) => u.botConfig?.isActive).length;

  return (
    <main className="min-h-screen bg-darker">
      <nav className="flex items-center justify-between px-6 md:px-10 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-btn flex items-center justify-center">
            <MessageCircle size={18} className="text-black" />
          </div>
          <span className="font-bold">BotVerse Admin</span>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition">
          <LogOut size={16} /> Logout
        </button>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-1">Admin Dashboard</h1>
        <p className="text-white/50 text-sm mb-6">Manage users and approve payments</p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass rounded-2xl p-5">
            <Users size={18} className="text-primary mb-2" />
            <p className="text-2xl font-bold">{users.length}</p>
            <p className="text-xs text-white/50">Total Users</p>
          </div>
          <div className="glass rounded-2xl p-5">
            <Clock size={18} className="text-yellow-500 mb-2" />
            <p className="text-2xl font-bold">{pendingCount}</p>
            <p className="text-xs text-white/50">Pending Approval</p>
          </div>
          <div className="glass rounded-2xl p-5">
            <Power size={18} className="text-primary mb-2" />
            <p className="text-2xl font-bold">{activeCount}</p>
            <p className="text-xs text-white/50">Active Bots</p>
          </div>
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/50 text-left">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Platforms</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium">{u.username}</td>
                    <td className="px-4 py-3 text-white/60">{u.email}</td>
                    <td className="px-4 py-3">
                      {u.isApproved ? (
                        <span className="inline-flex items-center gap-1 text-primary text-xs px-2 py-1 rounded-full bg-primary/10">
                          <CheckCircle2 size={12} /> Approved
                        </span>
                      ) : u.paymentStatus === "rejected" ? (
                        <span className="inline-flex items-center gap-1 text-red-400 text-xs px-2 py-1 rounded-full bg-red-400/10">
                          <XCircle size={12} /> Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-yellow-500 text-xs px-2 py-1 rounded-full bg-yellow-500/10">
                          <Clock size={12} /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white/60 text-xs">
                      <div className="flex gap-2">
                        <span className={u.botConfig?.waActive ? "text-primary" : "text-white/30"}>WA</span>
                        <span className={u.botConfig?.fbActive ? "text-blue-400" : "text-white/30"}>FB</span>
                        <span className={u.botConfig?.igActive ? "text-pink-400" : "text-white/30"}>IG</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {!u.isApproved && (
                          <button disabled={busyId === u.id}
                            onClick={() => updateUser(u.id, { isApproved: true, paymentStatus: "paid" })}
                            className="text-xs px-3 py-1.5 rounded-lg gradient-btn text-black font-semibold disabled:opacity-50">
                            Approve
                          </button>
                        )}
                        {u.isApproved && (
                          <button disabled={busyId === u.id}
                            onClick={() => updateUser(u.id, { isApproved: false, paymentStatus: "pending" })}
                            className="text-xs px-3 py-1.5 rounded-lg border border-white/15 hover:bg-white/5 disabled:opacity-50">
                            Revoke
                          </button>
                        )}
                        <button disabled={busyId === u.id} onClick={() => deleteUser(u.id)}
                          className="text-white/40 hover:text-red-400 transition disabled:opacity-50">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && <p className="text-center py-10 text-white/40">No users yet</p>}
        </div>
      </div>
    </main>
  );
}
