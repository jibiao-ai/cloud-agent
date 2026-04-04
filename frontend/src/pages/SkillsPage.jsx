import React, { useEffect, useState } from 'react';
import { Zap, Server, HardDrive, Network, Activity, ShieldCheck } from 'lucide-react';
import { getSkills } from '../services/api';

const iconMap = {
  compute: Server,
  storage: HardDrive,
  network: Network,
  monitor: Activity,
  loadbalancer: ShieldCheck,
};

export default function SkillsPage() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getSkills();
        if (res.code === 0) setSkills(res.data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className="h-full overflow-y-auto">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 px-8 py-6">
        <h1 className="text-2xl font-bold text-white">技能管理</h1>
        <p className="text-orange-100 text-sm mt-1">管理智能体可调用的 EasyStack API 技能</p>
      </div>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="grid gap-4 md:grid-cols-2">
          {skills.map((skill) => {
            let config = {};
            try { config = JSON.parse(skill.config || '{}'); } catch {}
            const Icon = iconMap[config.service] || Zap;
            return (
              <div key={skill.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800">{skill.name}</h3>
                      <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded">{skill.type}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{skill.description}</p>
                    {config.capabilities && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {config.capabilities.map((cap, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 bg-gray-50 text-gray-500 rounded-full border border-gray-100">
                            {cap}
                          </span>
                        ))}
                      </div>
                    )}
                    {config.api_version && (
                      <p className="text-xs text-gray-400 mt-2">API版本: {config.api_version}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
