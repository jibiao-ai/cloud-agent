import React, { useEffect, useState } from 'react';
import {
  Cloud,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  Loader2,
  Zap,
  AlertCircle,
  X,
} from 'lucide-react';
import {
  getCloudPlatforms,
  createCloudPlatform,
  updateCloudPlatform,
  deleteCloudPlatform,
  testCloudPlatform,
} from '../services/api';
import toast from 'react-hot-toast';

const PLATFORM_TYPES = [
  { value: 'easystack', label: 'EasyStack', description: '私有云平台，基于OpenStack' },
  { value: 'zstack',    label: 'ZStack',    description: '企业级私有云平台' },
];

const emptyEasyStack = {
  name: '', type: 'easystack',
  auth_url: '', username: '', password: '',
  domain_name: '', project_name: '', project_id: '',
  description: '',
};

const emptyZStack = {
  name: '', type: 'zstack',
  endpoint: '', access_key_id: '', access_key_secret: '',
  description: '',
};

function getStatusBadge(status) {
  switch (status) {
    case 'connected':
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded-full border border-green-200">
          <CheckCircle className="w-3 h-3" /> 已连接
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full border border-red-200">
          <XCircle className="w-3 h-3" /> 连接失败
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full border border-gray-200">
          <AlertCircle className="w-3 h-3" /> 未测试
        </span>
      );
  }
}

function PlatformModal({ open, onClose, onSaved, editPlatform }) {
  const isEdit = !!editPlatform;
  const [form, setForm] = useState(editPlatform || { ...emptyEasyStack });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (open) {
      setForm(editPlatform || { ...emptyEasyStack });
      setTestResult(null);
    }
  }, [open, editPlatform]);

  if (!open) return null;

  const handleTypeChange = (type) => {
    setForm(type === 'zstack' ? { ...emptyZStack } : { ...emptyEasyStack });
    setTestResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let res;
      if (isEdit) {
        res = await updateCloudPlatform(editPlatform.id, form);
      } else {
        res = await createCloudPlatform(form);
      }
      if (res.code === 0) {
        toast.success(isEdit ? '平台已更新' : '平台已添加');
        onSaved();
        onClose();
      } else {
        toast.error(res.message || '操作失败');
      }
    } catch (err) {
      toast.error(err?.message || '操作失败');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!editPlatform?.id) {
      toast.error('请先保存平台配置，再进行连接测试');
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testCloudPlatform(editPlatform.id);
      if (res.code === 0) {
        setTestResult({ ok: true, message: res.data?.message || '连接成功' });
        toast.success('连接测试成功');
      } else {
        setTestResult({ ok: false, message: res.message || '连接失败' });
        toast.error(res.message || '连接失败');
      }
    } catch (err) {
      const msg = err?.message || '连接测试失败';
      setTestResult({ ok: false, message: msg });
      toast.error(msg);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {isEdit ? '编辑云平台' : '接入云平台'}
          </h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Platform Type Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">平台类型</label>
            <div className="grid grid-cols-2 gap-3">
              {PLATFORM_TYPES.map((pt) => (
                <button
                  key={pt.value}
                  type="button"
                  onClick={() => handleTypeChange(pt.value)}
                  className={`p-3 rounded-xl border-2 text-left transition ${
                    form.type === pt.value
                      ? 'border-primary bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`font-semibold text-sm ${form.type === pt.value ? 'text-primary' : 'text-gray-700'}`}>
                    {pt.label}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{pt.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Common field: Platform Name */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">平台名称 *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="例如：生产环境-EasyStack"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              required
            />
          </div>

          {/* EasyStack specific fields */}
          {form.type === 'easystack' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Keystone 认证 URL *</label>
                <input
                  type="text"
                  value={form.auth_url}
                  onChange={(e) => setForm({ ...form, auth_url: e.target.value })}
                  placeholder="https://keystone.example.com:5000"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">用户名 *</label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="admin"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">密码 *</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                    required={!isEdit}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">域 (Domain)</label>
                  <input
                    type="text"
                    value={form.domain_name}
                    onChange={(e) => setForm({ ...form, domain_name: e.target.value })}
                    placeholder="Default"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">项目名称</label>
                  <input
                    type="text"
                    value={form.project_name}
                    onChange={(e) => setForm({ ...form, project_name: e.target.value })}
                    placeholder="admin"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {/* ZStack specific fields */}
          {form.type === 'zstack' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">管理 URL (Endpoint) *</label>
                <input
                  type="text"
                  value={form.endpoint}
                  onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
                  placeholder="http://zstack-mn.example.com:8080"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">AccessKeyID *</label>
                  <input
                    type="text"
                    value={form.access_key_id}
                    onChange={(e) => setForm({ ...form, access_key_id: e.target.value })}
                    placeholder="AccessKeyID"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">AccessKeySecret *</label>
                  <input
                    type="password"
                    value={form.access_key_secret}
                    onChange={(e) => setForm({ ...form, access_key_secret: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                    required={!isEdit}
                  />
                </div>
              </div>
            </>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">描述</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="可选描述信息"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
              testResult.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {testResult.ok ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <XCircle className="w-4 h-4 flex-shrink-0" />}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? '更新配置' : '添加平台'}
            </button>
            {isEdit && (
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 rounded-lg text-sm font-medium transition"
              >
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                测试连接
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg text-sm transition"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CloudPlatformPage() {
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPlatform, setEditPlatform] = useState(null);
  const [testing, setTesting] = useState({});

  useEffect(() => { loadPlatforms(); }, []);

  const loadPlatforms = async () => {
    try {
      const res = await getCloudPlatforms();
      if (res.code === 0) setPlatforms(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定删除该云平台？')) return;
    try {
      const res = await deleteCloudPlatform(id);
      if (res.code === 0) { toast.success('已删除'); loadPlatforms(); }
      else toast.error(res.message || '删除失败');
    } catch { toast.error('删除失败'); }
  };

  const handleTest = async (platform) => {
    setTesting((prev) => ({ ...prev, [platform.id]: true }));
    try {
      const res = await testCloudPlatform(platform.id);
      if (res.code === 0) {
        toast.success(res.data?.message || '连接成功');
        loadPlatforms();
      } else {
        toast.error(res.message || '连接失败');
        loadPlatforms();
      }
    } catch (err) {
      toast.error(err?.message || '连接测试失败');
      loadPlatforms();
    } finally {
      setTesting((prev) => ({ ...prev, [platform.id]: false }));
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-primary to-primary-700 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">接入云平台</h1>
              <p className="text-primary-100 text-sm mt-0.5">管理 EasyStack、ZStack 等多云平台接入配置</p>
            </div>
          </div>
          <button
            onClick={() => { setEditPlatform(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition"
          >
            <Plus className="w-4 h-4" /> 接入平台
          </button>
        </div>
      </div>

      {/* Platform Cards */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : platforms.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Cloud className="w-14 h-14 mx-auto mb-4 opacity-20" />
            <p className="text-base font-medium">暂无云平台接入</p>
            <p className="text-sm mt-1">点击右上角「接入平台」添加第一个云平台</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {platforms.map((platform) => (
              <div
                key={platform.id}
                className="bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all p-5"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                      platform.type === 'easystack' ? 'bg-blue-100' : 'bg-orange-100'
                    }`}>
                      {platform.type === 'easystack' ? '☁️' : '🖥️'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm">{platform.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        platform.type === 'easystack'
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-orange-50 text-orange-600'
                      }`}>
                        {platform.type === 'easystack' ? 'EasyStack' : 'ZStack'}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(platform.status)}
                </div>

                {/* Platform Info */}
                <div className="space-y-1 text-xs text-gray-500 mb-4">
                  {platform.type === 'easystack' && platform.auth_url && (
                    <p className="truncate">URL: {platform.auth_url}</p>
                  )}
                  {platform.type === 'zstack' && platform.endpoint && (
                    <p className="truncate">Endpoint: {platform.endpoint}</p>
                  )}
                  {platform.username && <p>用户: {platform.username}</p>}
                  {platform.description && <p className="text-gray-400 truncate">{platform.description}</p>}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleTest(platform)}
                    disabled={testing[platform.id]}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-600 rounded-lg text-xs font-medium transition"
                  >
                    {testing[platform.id] ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5" />
                    )}
                    测试连接
                  </button>
                  <button
                    onClick={() => { setEditPlatform(platform); setModalOpen(true); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary rounded-lg text-xs font-medium transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(platform.id)}
                    className="ml-auto p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <PlatformModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadPlatforms}
        editPlatform={editPlatform}
      />
    </div>
  );
}
