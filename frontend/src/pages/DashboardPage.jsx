import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Bot,
  Zap,
  ClipboardList,
  Activity,
  Server,
  HardDrive,
  Network,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { getDashboard } from '../services/api';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await getDashboard();
      if (res.code === 0) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats
    ? [
        { label: '会话总数', value: stats.conversations || 0, icon: MessageSquare, color: 'blue' },
        { label: '消息总数', value: stats.messages || 0, icon: Activity, color: 'green' },
        { label: '可用智能体', value: stats.agents || 0, icon: Bot, color: 'purple' },
        { label: '已配技能', value: stats.skills || 0, icon: Zap, color: 'orange' },
        { label: '执行任务', value: stats.tasks || 0, icon: ClipboardList, color: 'red' },
      ]
    : [];

  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
  };

  // Mock EasyStack resource cards
  const resourceCards = [
    { label: '云主机', value: '--', icon: Server, desc: '连接 EasyStack 后显示', color: 'bg-blue-500' },
    { label: '云硬盘', value: '--', icon: HardDrive, desc: '连接 EasyStack 后显示', color: 'bg-indigo-500' },
    { label: '网络', value: '--', icon: Network, desc: '连接 EasyStack 后显示', color: 'bg-teal-500' },
    { label: '活跃告警', value: '--', icon: AlertTriangle, desc: '连接 EasyStack 后显示', color: 'bg-amber-500' },
  ];

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
        <h1 className="text-2xl font-bold text-white">仪表盘</h1>
        <p className="text-blue-100 text-sm mt-1">EasyStack 智能运维平台概览</p>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Platform Stats */}
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">平台统计</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {loading
            ? Array(5)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg mb-3" />
                    <div className="h-6 bg-gray-100 rounded w-1/2 mb-1" />
                    <div className="h-4 bg-gray-50 rounded w-2/3" />
                  </div>
                ))
            : statCards.map((card, i) => {
                const Icon = card.icon;
                return (
                  <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colorMap[card.color]}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                    <p className="text-sm text-gray-500">{card.label}</p>
                  </div>
                );
              })}
        </div>

        {/* EasyStack Resources */}
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">EasyStack 资源概览</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {resourceCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <TrendingUp className="w-4 h-4 text-gray-300" />
                </div>
                <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-xs text-gray-400 mt-1">{card.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">快速操作</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: '查看云主机列表', desc: '查询所有服务器状态' },
            { label: '检查告警信息', desc: '查看活跃告警' },
            { label: '监控资源使用', desc: 'CPU/内存/磁盘监控' },
            { label: '网络拓扑分析', desc: '网络、子网、路由器' },
          ].map((action, i) => (
            <button
              key={i}
              className="text-left bg-white rounded-xl p-4 border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition group"
            >
              <p className="font-medium text-sm text-gray-700 group-hover:text-blue-600">{action.label}</p>
              <p className="text-xs text-gray-400 mt-1">{action.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
