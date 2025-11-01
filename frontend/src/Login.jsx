// frontend/src/Login.jsx
import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const API_BASE = 'http://localhost:4000/api';

  const handleLogin = async () => {
    if (!email || !password) return alert('请输入邮箱和密码');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        onLogin({ token: data.token, user: data.user });
        alert('登录成功');
      } else {
        alert(data.error || '登录失败');
      }
    } catch (err) {
      console.error('登录异常', err);
      alert('登录异常，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '50px auto', padding: 20, border: '1px solid #ccc', borderRadius: 6 }}>
      <h2>登录</h2>
      <div style={{ marginBottom: 10 }}>
        <input
          type="email"
          placeholder="邮箱"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', padding: 8 }}
        />
      </div>
      <div style={{ marginBottom: 10 }}>
        <input
          type="password"
          placeholder="密码"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', padding: 8 }}
        />
      </div>
      <button
        onClick={handleLogin}
        style={{ width: '100%', padding: 10 }}
        disabled={loading}
      >
        {loading ? '登录中...' : '登录'}
      </button>
    </div>
  );
}
