import React, { useEffect, useState } from 'react';
import { Users, Plus, Edit2, Trash2, Shield, User, CheckCircle, XCircle } from 'lucide-react';
import { getUsers, createUser, updateUser, deleteUser } from '../services/api';
import toast from 'react-hot-toast';

// Password strength checker
function checkPasswordStrength(password) {
  if (!password) return { level: 0, label: '', color: '' };
  let score = 0;
  const checks = {
    length:   password.length >= 9,
    upper:    /[A-Z]/.test(password),
    lower:    /[a-z]/.test(password),
    digit:    /[0-9]/.test(password),
    special:  /[^A-Za-z0-9]/.test(password),
  };
  score = Object.values(checks).filter(Boolean).length;
  if (score <= 2) return { level: 1, label: '弱', color: 'bg-red-500', checks };
  if (score <= 3) return { level: 2, label: '中', color: 'bg-yellow-500', checks };
  if (score === 4) return { level: 3, label: '较强', color: 'bg-blue-500', checks };
  return { level: 4, label: '强', color: 'bg-green-500', checks };
}

function PasswordStrengthBar({ password }) {
  const strength = checkPasswordStrength(password);
  if (!password) return null;

  const requirements = [
    { key: 'length',  label: '至少9位字符' },
    { key: 'upper',   label: '包含大写字母' },
    { key: 'lower',   label: '包含小写字母' },
    { key: 'digit',   label: '包含数字' },
    { key: 'special', label: '包含特殊字符' },
  ];

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1 flex-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i <= strength.level ? strength.color : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <span className={`text-xs font-medium ${
          strength.level <= 1 ? 'text-red-500' :
          strength.level === 2 ? 'text-yellow-600' :
          strength.level === 3 ? 'text-blue-600' : 'text-green-600'
        }`}>
          {strength.label}
        </span>
      </div>
      {/* Requirements checklist */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        {requirements.map((req) => (
          <div key={req.key} className="flex items-center gap-1 text-xs">
            {strength.checks?.[req.key] ? (
              <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
            ) : (
              <XCircle className="w-3 h-3 text-gray-300 flex-shrink-0" />
            )}
            <span className={strength.checks?.[req.key] ? 'text-green-600' : 'text-gray-400'}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', email: '', role: 'user' });
  const [editId, setEditId] = useState(null);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const res = await getUsers();
      if (res.code === 0) setUsers(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        const res = await updateUser(editId, form);
        if (res.code === 0) {
          toast.success('用户已更新');
        } else {
          toast.error(res.message || '更新失败');
          return;
        }
      } else {
        const res = await createUser(form);
        if (res.code === 0) {
          toast.success('用户已创建');
        } else {
          toast.error(res.message || '创建失败');
          return;
        }
      }
      loadUsers();
      setShowForm(false);
      setEditId(null);
      setForm({ username: '', password: '', email: '', role: 'user' });
    } catch (err) {
      toast.error(err?.message || '操作失败');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定删除该用户?')) return;
    try { await deleteUser(id); toast.success('已删除'); loadUsers(); } catch { toast.error('删除失败'); }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="bg-gradient-to-r from-gray-700 to-gray-900 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">用户管理</h1>
            <p className="text-gray-300 text-sm mt-1">管理平台用户和权限</p>
          </div>
          <button onClick={() => { setShowForm(true); setEditId(null); setForm({ username: '', password: '', email: '', role: 'user' }); }}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm transition">
            <Plus className="w-4 h-4" /> 新建用户
          </button>
        </div>
      </div>
      <div className="p-6 max-w-5xl mx-auto">
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">{editId ? '编辑用户' : '新建用户'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">用户名</label>
                  <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none" required disabled={!!editId} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">密码{editId && '（留空不修改）'}</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none" required={!editId}
                    placeholder="≥9位，含大小写字母、数字和特殊字符" />
                  {/* Password strength indicator */}
                  {form.password && <PasswordStrengthBar password={form.password} />}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">邮箱</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">角色</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none">
                    <option value="user">普通用户</option>
                    <option value="admin">管理员</option>
                  </select>
                </div>
              </div>
              {/* Password requirement hint */}
              {!form.password && (
                <p className="text-xs text-gray-400">
                  密码要求：至少9位字符，必须包含大写字母、小写字母、数字和特殊字符（如 Admin@2024!）
                </p>
              )}
              <div className="flex gap-3">
                <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-lg text-sm transition">
                  {editId ? '更新' : '创建'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">
                  取消
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">用户</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">邮箱</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">角色</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">创建时间</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{u.username}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">{u.email || '-'}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${
                      u.role === 'admin' ? 'bg-primary-50 text-primary' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {u.role === 'admin' && <Shield className="w-3 h-3" />}
                      {u.role === 'admin' ? '管理员' : '用户'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-400">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => { setEditId(u.id); setForm({ username: u.username, password: '', email: u.email, role: u.role }); setShowForm(true); }}
                        className="p-1.5 text-gray-400 hover:text-primary rounded"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(u.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
