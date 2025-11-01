# 🌍 AI Travel Planner

## 📦 GitHub 仓库
👉 https://github.com/yxl50196-source/ai-travel-planner

## 🧠 项目简介
一个基于 AI 的智能旅行规划系统，支持：
- ✈️ 自动生成行程规划（调用星火 / OpenAI / 百炼 API）
- 🎤 语音识别（Whisper）
- 👤 用户系统（JWT 登录）
- 💰 预算功能（按用户区分）
- ☁️ 云端存储行程
- 🐳 一键部署（Docker + GitHub Actions）

---
### 安装 ffmpeg

本项目依赖 ffmpeg，请在本地自行下载并放置在 `backend/ffmpeg/` 文件夹中。

1. 下载地址：
   - [ffmpeg 官方网站](https://ffmpeg.org/download.html)
2. 解压并将 `ffmpeg.exe` 放入 `backend/ffmpeg/`
3. 确保路径正确，无需将 ffmpeg.exe 提交到 GitHub

## 🚀 快速运行

### ✅ 方式一：本地运行
```bash
git clone https://github.com/yxl50196-source/ai-travel-planner.git
cd ai-travel-planner

# 启动后端
cd backend
npm install
npm run dev

# 启动前端
cd ../frontend
npm install
npm start
