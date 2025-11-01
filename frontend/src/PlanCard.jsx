import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function PlanCard({ plan, token, onPlanUpdated }) {
  const [localPlan, setLocalPlan] = useState(plan || '');
  const [loading, setLoading] = useState(false);
  const API_BASE = 'http://localhost:4000/api';

  // 父组件 plan 更新时同步
  useEffect(() => {
    setLocalPlan(plan || '');
  }, [plan]);

  // 保存到云端（始终新建，不更新旧行程）
  const saveCloudPlan = async (updatedText) => {
    if (!token) return alert('请先登录');
    if (!updatedText.trim()) return alert('行程不能为空');

    setLoading(true);
    try {
      await axios.post(
        `${API_BASE}/plans`,
        { plan: updatedText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('✅ 已保存到云端');
      if (onPlanUpdated) onPlanUpdated(); // 刷新列表
    } catch (err) {
      console.error('同步云端失败:', err);
      alert('同步云端失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    const updated = prompt('✏️ 修改行程内容：', localPlan);
    if (updated !== null) {
      setLocalPlan(updated);
      saveCloudPlan(updated);
    }
  };

  return (
    <div style={{
      border: '1px solid #ccc',
      padding: 12,
      borderRadius: 8,
      marginTop: 10,
      background: '#fafafa'
    }}>
      <h3>行程计划</h3>
      <pre style={{
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        color: '#333',
        lineHeight: 1.6
      }}>{localPlan}</pre>

      {token && (
        <button
          onClick={handleEdit}
          style={{
            marginTop: 10,
            padding: '6px 12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
          disabled={loading}
        >
          {loading ? '同步中...' : '修改并同步云端'}
        </button>
      )}
    </div>
  );
}






