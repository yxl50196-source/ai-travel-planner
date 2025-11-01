import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { exec } from 'child_process';
import util from 'util';
import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';

dotenv.config();
ffmpeg.setFfmpegPath(ffmpegPath);
const execPromise = util.promisify(exec);

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --------------------
// 初始化 LowDB
// --------------------
const dbFile = path.join(process.cwd(), 'data', 'db.json');
if (!fs.existsSync(path.dirname(dbFile))) fs.mkdirSync(path.dirname(dbFile), { recursive: true });

const adapter = new JSONFile(dbFile);
const defaultData = { users: [], plans: [], budgets: [], expenses: [] };
const db = new Low(adapter, defaultData);

await db.read();
await db.write();

// --------------------
// JWT 鉴权
// --------------------
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'missing auth' });
  const token = auth.split(' ')[1];
  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'invalid token' });
  }
}

// --------------------
// 用户注册/登录
// --------------------
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  await db.read();
  if (db.data.users.find(u => u.email === email)) return res.status(400).json({ error: '用户已存在' });
  const hash = await bcrypt.hash(password, 10);
  const user = { id: Date.now().toString(), email, password: hash, name: name || email, createdAt: Date.now() };
  db.data.users.push(user);
  await db.write();
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  await db.read();
  const user = db.data.users.find(u => u.email === email);
  if (!user) return res.status(400).json({ error: '用户不存在' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ error: '密码错误' });
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

// --------------------
// 星火 AI 行程生成
// --------------------
function getAuthUrl(hostUrl, apiKey, apiSecret, appId) {
  const url = new URL(hostUrl);
  const host = url.host;
  const date = new Date().toUTCString();
  const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${url.pathname} HTTP/1.1`;
  const signatureSha = crypto.createHmac('sha256', apiSecret).update(signatureOrigin).digest('base64');
  const authorizationOrigin = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signatureSha}"`;
  const authorization = Buffer.from(authorizationOrigin).toString('base64');
  return `${hostUrl}?authorization=${authorization}&date=${encodeURIComponent(date)}&host=${host}&app_id=${appId}`;
}

app.post('/api/plan', authMiddleware, async (req, res) => {
  const { textInput, destination, days, budget, preferences, companions } = req.body;
  const sparkAppId = process.env.SPARK_APP_ID;
  const sparkApiKey = process.env.SPARK_API_KEY;
  const sparkApiSecret = process.env.SPARK_API_SECRET;
  const sparkApiUrl = process.env.SPARK_API_URL || 'wss://spark-api.xf-yun.com/v1/x1';

  if (!sparkAppId || !sparkApiKey || !sparkApiSecret) return res.status(500).json({ error: '星火 API 配置缺失' });

  const prompt = `请根据以下需求生成详细旅行计划：
目的地：${destination || textInput}
天数：${days || 3}
预算：${budget || '不限'}
同行：${companions || '无'}
偏好：${preferences || '无'}
请以纯文本格式输出完整行程计划。`;

  try {
    const authUrl = getAuthUrl(sparkApiUrl, sparkApiKey, sparkApiSecret, sparkAppId);
    const ws = new WebSocket(authUrl);
    let fullMsg = '';
    let responded = false;

    ws.on('open', () => {
      const payload = {
        header: { app_id: sparkAppId, uid: "user_123" },
        parameter: { chat: { domain: "x1", temperature: 0.7, max_tokens: 2048 } },
        payload: { message: { text: [{ role: "user", content: prompt }] } }
      };
      ws.send(JSON.stringify(payload));
    });

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        if (data?.payload?.choices?.text) fullMsg += data.payload.choices.text.map(t => t.content).join('');
        if (data.header?.status === 2 && !responded) {
          responded = true;
          ws.close();
          res.send(fullMsg || '生成失败，请稍后重试');
        }
      } catch {}
    });

    ws.on('error', (err) => {
      if (!responded) {
        responded = true;
        res.status(500).json({ error: '星火接口调用失败', details: err.message });
      }
    });

    ws.on('close', () => {
      if (!responded) {
        responded = true;
        res.send(fullMsg || '生成失败，请稍后重试');
      }
    });

  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: '星火接口异常', details: err.message });
  }
});

// --------------------
// 用户预算与支出
// --------------------
app.get('/api/expenses', authMiddleware, async (req, res) => {
  await db.read();
  const userId = req.user.id;
  const userBudget = db.data.budgets.find(b => b.userId === userId);
  const userExpenses = db.data.expenses.filter(e => e.userId === userId);
  res.json({ budget: userBudget ? userBudget.total : 0, expenses: userExpenses });
});

app.post('/api/budget', authMiddleware, async (req, res) => {
  const { total } = req.body;
  if (!total || total <= 0) return res.status(400).json({ error: '预算必须大于 0' });
  await db.read();
  const userId = req.user.id;
  const existing = db.data.budgets.find(b => b.userId === userId);
  if (existing) existing.total = total;
  else db.data.budgets.push({ userId, total });
  await db.write();
  res.json({ success: true, total });
});

app.post('/api/expenses', authMiddleware, async (req, res) => {
  const { amount, note } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: '支出金额无效' });
  await db.read();
  const expense = { id: Date.now().toString(), userId: req.user.id, amount, note: note || '未备注', createdAt: Date.now() };
  db.data.expenses.push(expense);
  await db.write();
  res.json({ success: true, expense });
});

app.delete('/api/expenses/:id', authMiddleware, async (req, res) => {
  const id = req.params.id;
  await db.read();
  db.data.expenses = db.data.expenses.filter(e => !(e.id === id && e.userId === req.user.id));
  await db.write();
  res.json({ success: true });
});

// --------------------
// Whisper 本地语音识别
// --------------------
const upload = multer({ dest: 'uploads/' });
function convertAudio(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec('pcm_s16le')
      .audioChannels(1)
      .audioFrequency(16000)
      .toFormat('wav')
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .save(outputPath);
  });
}

app.post('/api/asr', upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: '缺少音频文件' });
  try {
    const convertedPath = `uploads/${Date.now()}_converted.wav`;
    await convertAudio(req.file.path, convertedPath);
    const pythonPath = 'python';
    const modelPath = path.resolve('models/for-tests-ggml-small.bin');
    const cmd = `${pythonPath} local_whisper.py "${convertedPath}" -m "${modelPath}" -l zh`;
    const { stdout, stderr } = await execPromise(cmd);
    if (stderr) console.error(stderr);
    fs.unlinkSync(req.file.path);
    fs.unlinkSync(convertedPath);
    res.json({ text: stdout?.trim() || '识别结果为空' });
  } catch (err) {
    res.status(500).json({ error: '语音识别失败', details: err.message });
  }
});

// --------------------
// 行程 CRUD
// --------------------
app.post('/api/plans', authMiddleware, async (req, res) => {
  let planText = req.body;
  if (typeof planText === 'object' && planText.plan) planText = planText.plan;
  if (typeof planText !== 'string') return res.status(400).json({ error: '无效的行程内容，应为字符串' });
  await db.read();
  const newPlan = { id: Date.now().toString(), userId: req.user.id, content: planText, createdAt: Date.now() };
  db.data.plans.push(newPlan);
  await db.write();
  res.json({ success: true, plan: newPlan });
});

app.get('/api/plans', authMiddleware, async (req, res) => {
  await db.read();
  const plans = db.data.plans.filter(p => p.userId === req.user.id);
  res.json({ plans });
});

app.delete('/api/plans/:id', authMiddleware, async (req, res) => {
  const id = req.params.id;
  await db.read();
  db.data.plans = db.data.plans.filter(p => !(p.id === id && p.userId === req.user.id));
  await db.write();
  res.json({ success: true });
});

// --------------------
// 健康检查 & 启动
// --------------------
app.get('/', (req, res) => res.json({ message: 'AI Travel Planner Backend OK' }));
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));














