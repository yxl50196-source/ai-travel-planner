// src/api.js
const API_BASE = 'http://localhost:4000/api';

// 注册
export async function registerUser(email, password, name) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  return res.json();
}

// 登录
export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

// 获取行程
export async function getPlans(token) {
  const res = await fetch(`${API_BASE}/plans`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

// AI生成行程
export async function generatePlan(token, inputData) {
  const res = await fetch(`${API_BASE}/plan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(inputData),
  });
  return res.json();
}

// 添加支出
export async function addExpense(token, expense) {
  const res = await fetch(`${API_BASE}/expenses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(expense),
  });
  return res.json();
}
