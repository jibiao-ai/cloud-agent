import React, { useEffect, useState } from 'react';
import { Bot, Plus, Edit2, Trash2, CheckCircle, XCircle, X, Loader2, Cpu, Thermometer, Hash, MessageSquare } from 'lucide-react';
import { getAgents, createAgent, updateAgent, deleteAgent, getAIProviders } from '../services/api';
import toast from 'react-hot-toast';

export default function AgentsPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editAgent, setEditAgent] = useState(null);
  const [form, setForm] = useState({
    name: '', description: '', system_prompt: '', model: '',
    temperature: 0.7, max_tokens: 4096, is_active: true,
  });
  const [availableModels, setAvailableModels] = useState([]);

  useEffect(() => { loadAgents(); loadModels(); }, []);

  const loadModels = async () => {
    try {
      const res = await getAIProviders();
      if (res.code === 0 && res.data) {
        // Show all configured & enabled providers
        const models = res.data
          .filter((p) => p.is_enabled && p.configured)
          .map((p) => ({
            name: p.name,
            label: p.label,
            model: p.model,
            is_default: p.is_default,
          }));
        setAvailableModels(models);
        // Set default model for the form if not already set
        if (!form.model) {
          const defaultModel = models.find((m) => m.is_default) || models[0];
          if (defaultModel) {
            setForm((prev) => ({ ...prev, model: defaultModel.model }));
          }
        }
      }
    } catch (err) {
      console.error('Failed to load AI models:', err);
    }
  };

  const loadAgents = async () => {
    try {
      const res = await getAgents();
      if (res.code === 0) setAgents(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        description: form.description,
        system_prompt: form.system_prompt,
        model: form.model,
        temperature: parseFloat(form.temperature) || 0.7,
        max_tokens: parseInt(form.max_tokens) || 4096,
        is_active: form.is_active,
      };
      if (editAgent) {
        await updateAgent(editAgent.id, payload);
        toast.success('智能体已更新');
      } else {
        await createAgent(payload);
        toast.success('智能体已创建');
      }
      loadAgents();
      resetForm();
    } catch (err) {
      const msg = err?.message || err?.data?.message || '操作失败';
      toast.error(msg);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定删除该智能体?')) return;
    try {
      await deleteAgent(id);
      toast.success('已删除');
      loadAgents();
    } catch (err) { toast.error('删除失败'); }
  };

  const handleEdit = (agent) => {
    setEditAgent(agent);
    setForm({
      name: agent.name || '',
      description: agent.description || '',
      system_prompt: agent.system_prompt || '',
      model: agent.model || '',
      temperature: agent.temperature ?? 0.7,
      max_tokens: agent.max_tokens ?? 4096,
      is_active: agent.is_active !== false,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditAgent(null);
    const defaultModel = availableModels.find((m) => m.is_default) || availableModels[0];
    setForm({ name: '', description: '', system_prompt: '', model: defaultModel?.model || '', temperature: 0.7, max_tokens: 4096, is_active: true });
  };

  // Find the provider label for a given model name
  const getModelProviderLabel = (modelName) => {
    if (!modelName) return '未设置';
    const provider = availableModels.find(m => m.model === modelName);
    return provider ? `${provider.label} (${modelName})` : modelName;
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6 max-w-5xl">
        {/* 页面头部卡片 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-800">智能体管理</h1>
              <p className="text-sm text-gray-400 mt-0.5">配置和管理 AI 运维智能体</p>
            </div>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-2 bg-[#513CC8] hover:bg-[#4230A6] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> 新建智能体
            </button>
          </div>
        </div>

        {/* 新建/编辑表单卡片 */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-800">
                {editAgent ? `编辑智能体 - ${editAgent.name}` : '新建智能体'}
              </h3>
              <button onClick={resetForm} className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 名称 */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    <span className="flex items-center gap-1.5"><Bot className="w-3.5 h-3.5" />名称</span>
                  </label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="输入智能体名称，例如：EasyStack 运维助手"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#513CC8] outline-none" required />
                </div>

                {/* 模型厂商 / 模型选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5" />模型厂商 / 模型</span>
                  </label>
                  {availableModels.length > 0 ? (
                    <select value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#513CC8] outline-none bg-white">
                      <option value="">-- 请选择模型 --</option>
                      {availableModels.map((m) => (
                        <option key={m.name} value={m.model}>
                          {m.label} - {m.model}{m.is_default ? ' ★ 默认' : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full px-3 py-2 border border-orange-200 bg-orange-50 rounded-lg text-sm text-orange-600">
                      暂无已配置的模型，请先前往「模型配置」页面添加
                    </div>
                  )}
                  {form.model && (
                    <p className="text-xs text-gray-400 mt-1">
                      当前选择: {getModelProviderLabel(form.model)}
                    </p>
                  )}
                </div>

                {/* 描述 */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">描述</label>
                  <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="输入智能体描述"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#513CC8] outline-none" />
                </div>

                {/* 系统提示词 */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    <span className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" />系统提示词</span>
                  </label>
                  <textarea value={form.system_prompt} onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
                    placeholder="输入系统提示词，定义智能体的角色和行为..."
                    rows={6} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#513CC8] outline-none resize-none" />
                </div>

                {/* 温度参数 / 最大令牌数 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">
                      <span className="flex items-center gap-1.5"><Thermometer className="w-3.5 h-3.5" />温度参数 (Temperature)</span>
                    </label>
                    <input type="number" step="0.1" min="0" max="2" value={form.temperature}
                      onChange={(e) => setForm({ ...form, temperature: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#513CC8] outline-none" />
                    <p className="text-xs text-gray-400 mt-1">值越大回答越随机，推荐 0.1-0.5 用于精确任务，0.7-1.0 用于创意任务</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">
                      <span className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" />最大令牌数 (Max Tokens)</span>
                    </label>
                    <input type="number" min="256" max="128000" value={form.max_tokens}
                      onChange={(e) => setForm({ ...form, max_tokens: parseInt(e.target.value) || 4096 })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#513CC8] outline-none" />
                    <p className="text-xs text-gray-400 mt-1">控制模型单次回复的最大长度，一般 4096 即可</p>
                  </div>
                </div>

                {/* 启用/停用开关 */}
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                      className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#513CC8]"></div>
                  </label>
                  <span className="text-sm text-gray-600">{form.is_active ? '已启用' : '已停用'}</span>
                </div>

                {/* 提交按钮 */}
                <div className="flex gap-3 pt-2">
                  <button type="submit"
                    className="bg-[#513CC8] hover:bg-[#4230A6] text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
                    {editAgent ? '保存修改' : '创建智能体'}
                  </button>
                  <button type="button" onClick={resetForm}
                    className="border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm transition-colors">
                    取消
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 智能体列表卡片 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-[#513CC8]" />
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Bot className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">暂无智能体，点击"新建智能体"创建第一个</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {agents.map((agent) => (
                <div key={agent.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-[#EEE9FB] rounded-lg flex items-center justify-center mt-0.5">
                        <Bot className="w-5 h-5 text-[#513CC8]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-800">{agent.name}</h3>
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded">#{agent.id}</span>
                          {agent.is_active ? (
                            <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle className="w-3 h-3" />活跃</span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-gray-400"><XCircle className="w-3 h-3" />停用</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{agent.description}</p>
                        <div className="flex gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Cpu className="w-3 h-3" />
                            模型: {agent.model || '未设置'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Thermometer className="w-3 h-3" />
                            温度: {agent.temperature ?? '-'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            最大令牌: {agent.max_tokens ?? '-'}
                          </span>
                        </div>
                        {agent.system_prompt && (
                          <div className="mt-2 text-xs text-gray-400 bg-gray-50 rounded px-2 py-1 max-h-16 overflow-hidden">
                            <span className="font-medium">提示词: </span>
                            {agent.system_prompt.length > 100 ? agent.system_prompt.slice(0, 100) + '...' : agent.system_prompt}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0 ml-2">
                      <button onClick={() => handleEdit(agent)}
                        title="编辑智能体"
                        className="p-1.5 text-gray-400 hover:text-[#513CC8] hover:bg-[#EEE9FB] rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(agent.id)}
                        title="删除智能体"
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
