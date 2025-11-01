// frontend/src/Auth.jsx
import React, { useState } from 'react';

export function Auth({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  async function submit() {
    const url = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const res = await fetch('http://localhost:4000' + url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mode === 'login' ? { email, password } : { email, password, name })
    });
    const data = await res.json();
    if (data.token) {
      if (data.token) {
        localStorage.setItem('token', data.token);
        onLogin && onLogin({ ...data.user, token: data.token });  // ✅ 把 token 一起传给 App
      }
    } else {
      alert(data.error || '登录失败');
    }
  }

  return (
    <div style={{ border: '1px solid #ddd', padding: 12, marginBottom: 12 }}>
      <div>
        <button onClick={() => setMode('login')}>登录</button>
        <button onClick={() => setMode('register')}>注册</button>
      </div>
      <div style={{ marginTop: 8 }}>
        {mode === 'register' && <input value={name} onChange={e => setName(e.target.value)} placeholder="姓名" />}
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="邮箱" />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="密码" />
        <button onClick={submit}>{mode === 'login' ? '登录' : '注册'}</button>
      </div>
    </div>
  );
}
