// frontend/src/Budget.jsx
import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:4000/api';

export default function Budget() {
  const [totalBudget, setTotalBudget] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [remaining, setRemaining] = useState(0);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const token = localStorage.getItem('token');
    if (!token) return;
    const res = await fetch(`${API_BASE}/expenses`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setTotalBudget(data.budget || 0);
    setExpenses(data.expenses || []);
    calcRemaining(data.budget, data.expenses);
  }

  function calcRemaining(total, expList) {
    const spent = expList.reduce((sum, e) => sum + e.amount, 0);
    setRemaining((total || 0) - spent);
  }

  async function setBudget() {
    const token = localStorage.getItem('token');
    if (!token) return alert('请先登录');
    if (!totalBudget || totalBudget <= 0) return alert('请输入有效预算');
    await fetch(`${API_BASE}/budget`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ total: parseFloat(totalBudget) })
    });
    alert('✅ 预算已更新');
    loadData();
  }

  async function addExpense(exp) {
    const token = localStorage.getItem('token');
    if (!token) return alert('请先登录');
    const res = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(exp)
    });
    if (res.ok) {
      setAmount('');
      setNote('');
      loadData();
    } else {
      const err = await res.json();
      alert(err.error || '添加失败');
    }
  }

  async function deleteExpense(id) {
    const token = localStorage.getItem('token');
    if (!token) return alert('请先登录');
    if (!window.confirm('确定删除该支出？')) return;
    await fetch(`${API_BASE}/expenses/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    loadData();
  }

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, background: '#fafafa' }}>
      <h3>💰 预算与支出管理</h3>

      {/* 设置总预算 */}
      <div style={{ marginBottom: 12 }}>
        <label>总预算：</label>
        <input
          type="number"
          value={totalBudget}
          onChange={e => setTotalBudget(e.target.value)}
          placeholder="请输入预算金额"
          style={{ padding: 6, marginRight: 8 }}
        />
        <button onClick={setBudget}>保存预算</button>
      </div>

      {/* 添加支出 */}
      <div>
        <input
          placeholder="支出金额"
          value={amount}
          type="number"
          onChange={e => setAmount(e.target.value)}
          style={{ padding: 6, width: 100, marginRight: 8 }}
        />
        <input
          placeholder="备注"
          value={note}
          onChange={e => setNote(e.target.value)}
          style={{ padding: 6, width: 200, marginRight: 8 }}
        />
        <button onClick={() => addExpense({ amount: parseFloat(amount || 0), note })}>添加支出</button>
      </div>

      {/* 预算汇总 */}
      <div style={{ marginTop: 16 }}>
        <strong>总预算：</strong>{totalBudget || 0} 元<br />
        <strong>已支出：</strong>{expenses.reduce((sum, e) => sum + e.amount, 0)} 元<br />
        <strong>剩余预算：</strong>{remaining >= 0 ? remaining : 0} 元
      </div>

      {/* 支出记录 */}
      <div style={{ marginTop: 12, maxHeight: 200, overflowY: 'auto', borderTop: '1px solid #ccc', paddingTop: 8 }}>
        {expenses.length === 0 ? (
          <p>暂无支出记录</p>
        ) : (
          <ul>
            {expenses.map(e => (
              <li key={e.id}>
                {new Date(e.createdAt).toLocaleString()} — <b>{e.amount}</b> 元 — {e.note}
                <button
                  style={{ marginLeft: 8 }}
                  onClick={() => deleteExpense(e.id)}
                >删除</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}






