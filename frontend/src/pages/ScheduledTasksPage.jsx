import React, { useEffect, useState } from 'react';
import { Clock, Plus, Play, Pause, Trash2 } from 'lucide-react';
import { getScheduledTasks } from '../services/api';

export default function ScheduledTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getScheduledTasks();
        if (res.code === 0) setTasks(res.data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const demoTasks = [
    { id: 'dt-1', name: '每日巡检', cron_expr: '0 8 * * *', task_type: 'health_check', is_active: true, last_run_at: null, next_run_at: null },
    { id: 'dt-2', name: '告警汇总报告', cron_expr: '0 */6 * * *', task_type: 'alert_summary', is_active: true, last_run_at: null, next_run_at: null },
    { id: 'dt-3', name: '资源使用分析', cron_expr: '0 0 * * 1', task_type: 'resource_analysis', is_active: false, last_run_at: null, next_run_at: null },
  ];

  const allTasks = [...tasks, ...demoTasks];

  return (
    <div className="h-full overflow-y-auto">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">定时任务</h1>
            <p className="text-amber-100 text-sm mt-1">配置定时执行的自动化运维任务</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm transition">
            <Plus className="w-4 h-4" /> 新建任务
          </button>
        </div>
      </div>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">任务名称</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Cron 表达式</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">类型</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody>
              {allTasks.map((task) => (
                <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-medium text-gray-700">{task.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{task.cron_expr}</code>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded">{task.task_type}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${task.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      {task.is_active ? '运行中' : '已停止'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button className="p-1.5 text-gray-400 hover:text-blue-500 rounded">
                        {task.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-red-500 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
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
