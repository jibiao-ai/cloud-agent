import React, { useEffect, useState } from 'react';
import { Users, Plus, Edit2, Trash2, Shield, User } from 'lucide-react';
import { getUsers, createUser, updateUser, deleteUser } from '../services/api';
import toast from 'react-hot-toast';

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
        await updateUser(editId, form);
        toast.success('用户已更新');
      } else {
        await createUser(form);
        toast.success('用户已创建');
      }
      loadUsers();
      setShowForm(false);
      setEditId(null);
      setForm({ username: '', password: '', email: '', role: 'user' });
    } catch (err) { toast.error('操作失败'); }
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
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" required disabled={!!editId} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">密码{editId && '（留空不修改）'}</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" required={!editId} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">邮箱</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">角色</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    <option value="user">普通用户</option>
                    <option value="admin">管理员</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
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
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{u.username}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">{u.email || '-'}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${
                      u.role === 'admin' ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-500'
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
                        className="p-1.5 text-gray-400 hover:text-blue-500 rounded"><Edit2 className="w-4 h-4" /></button>
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
