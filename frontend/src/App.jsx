import React, { useState, useEffect } from 'react';
import VoiceInput from './VoiceInput';
import Budget from './Budget';
import PlanCard from './PlanCard';
import { Auth } from './Auth';

export default function App() {
  const [query, setQuery] = useState('');
  const [plan, setPlan] = useState(null);
  const [user, setUser] = useState(null);
  const [plansList, setPlansList] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  const API_BASE = 'http://localhost:4000/api';

  // 初始化：如果本地有 token 自动登录
  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    if (token) {
      setUser({ token, name: username });
      fetchUserPlans(token);
    }
  }, []);

  // 获取用户云端行程列表
  async function fetchUserPlans(token) {
    try {
      const res = await fetch(`${API_BASE}/plans`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPlansList(data.plans || []);
        if (data.plans.length > 0 && !selectedPlanId) {
          const lastPlan = data.plans[data.plans.length - 1];
          setPlan(lastPlan.content);
          setSelectedPlanId(lastPlan.id);
        }
      }
    } catch (err) {
      console.error('获取云端行程失败', err);
    }
  }

  // 生成行程并自动保存到云端
  async function generate(text) {
    const payload = {
      textInput: text,
      destination: text,
      days: 3,
      budget: 5000,
      preferences: '',
      companions: ''
    };
    const token = user?.token || localStorage.getItem('token');

    try {
      const res = await fetch(`${API_BASE}/plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.text();
        console.error('AI 接口错误:', errData);
        setPlan('生成行程失败，请稍后重试');
        return;
      }

      const textPlan = await res.text();
      setPlan(textPlan);
      setSelectedPlanId(null);

      // 自动保存到云端
      if (token) {
        const saveRes = await fetch(`${API_BASE}/plans`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ plan: textPlan })
        });
        if (saveRes.ok) fetchUserPlans(token);
      }

    } catch (err) {
      console.error('生成行程失败:', err);
      setPlan('生成行程失败，请稍后重试');
    }
  }

  // 删除行程
  async function deletePlan(id) {
    if (!user) return alert('请先登录');
    const token = user.token;
    if (!window.confirm('确定要删除该行程吗？')) return;

    try {
      const res = await fetch(`${API_BASE}/plans/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        alert('🗑️ 已删除');
        fetchUserPlans(token);
      } else {
        const data = await res.json();
        alert(data.error || '删除失败');
      }
    } catch (err) {
      console.error('删除失败', err);
      alert('删除行程失败，请稍后重试');
    }
  }

  // 查看某条行程
  function viewPlan(p) {
    setPlan(p.content);
    setSelectedPlanId(p.id);
  }

  // 添加支出
  async function addExpense(expense) {
    if (!user) return alert('请先登录记录支出');
    const token = user.token;
    const res = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(expense)
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || '添加支出失败');
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
      <h1>AI 旅行规划器</h1>

      {/* 用户信息 / 登录提示 */}
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {user?.name ? (
          <div style={{ fontWeight: 'bold', color: '#007bff' }}>
            欢迎您，{user.name}！
          </div>
        ) : (
          <div style={{ color: '#666' }}>请先登录以保存和查看云端行程</div>
        )}

        {/* 退出登录按钮 */}
        {user?.token && (
          <button
            onClick={() => {
              if (window.confirm('确定要退出登录吗？')) {
                setUser(null);
                localStorage.removeItem('token');
                localStorage.removeItem('username');
                setPlansList([]);
                setPlan(null);
                setSelectedPlanId(null);
              }
            }}
            style={{
              padding: '4px 10px',
              backgroundColor: '#ff6666',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            退出登录
          </button>
        )}
      </div>

      {/* 登录组件 */}
      {!user?.token && (
        <Auth
          onLogin={(u) => {
            setUser(u);
            localStorage.setItem('token', u.token);
            localStorage.setItem('username', u.name || '用户');
            alert('登录成功');
            fetchUserPlans(u.token);
          }}
        />
      )}

      {/* 输入区 */}
      <div style={{ marginBottom: 12 }}>
        <h3>输入旅行需求（文字或语音）</h3>
        <VoiceInput
          onResult={(t) => { setQuery(t); generate(t); }}
          placeholder="我想去日本，5天，预算1万元，喜欢美食和动漫，带孩子"
        />
        <div style={{ marginTop: 8 }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ width: '70%', padding: 8 }}
          />
          <button onClick={() => generate(query)}>生成行程</button>
        </div>
      </div>

      {/* 当前行程显示 */}
      <div>
        <h3>当前显示的行程</h3>
        {plan ? (
          <PlanCard
            plan={plan}
            token={user?.token}
            onPlanUpdated={() => fetchUserPlans(user?.token)}
          />
        ) : (
          <div>尚未生成行程</div>
        )}
      </div>

      {/* 云端行程列表，仅登录用户可见 */}
      {user?.token && (
        <div style={{ marginTop: 20 }}>
          <h3>🌏 我的云端行程列表</h3>
          <div
            style={{
              height: '400px',
              overflowY: 'auto',
              border: '1px solid #ccc',
              borderRadius: 8,
              padding: 12,
              backgroundColor: '#f9f9f9'
            }}
          >
            {plansList.length > 0 ? (
              plansList.map(p => (
                <div
                  key={p.id}
                  style={{
                    marginBottom: 16,
                    border: p.id === selectedPlanId ? '2px solid #007bff' : '1px dashed #999',
                    padding: 10,
                    borderRadius: 8,
                    cursor: 'pointer',
                    backgroundColor: p.id === selectedPlanId ? '#e9f3ff' : '#fff',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => viewPlan(p)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>行程 ID: {p.id}</strong>
                    <button
                      onClick={(e) => { e.stopPropagation(); deletePlan(p.id); }}
                      style={{ backgroundColor: '#ff6666', color: 'white', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}
                    >
                      删除
                    </button>
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', color: '#333', marginTop: 8, lineHeight: 1.5, wordBreak: 'break-word' }}>
                    {p.content}
                  </div>
                </div>
              ))
            ) : (
              <div>暂无保存行程</div>
            )}
          </div>
        </div>
      )}

      {/* 预算 */}
      <div style={{ marginTop: 20 }}>
        <Budget onAddExpense={addExpense} />
      </div>
    </div>
  );
}





