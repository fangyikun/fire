# 快速配置 AI 提供商（解决 Gemini 地区限制）

由于 Gemini API 在您的地区不可用，请按以下步骤切换到其他 AI 提供商：

## 🚀 推荐方案 1: Groq（最快最简单）

### 步骤 1: 获取 Groq API Key
1. 访问 https://console.groq.com/
2. 使用 Google/GitHub 账号快速注册（免费）
3. 登录后，点击左侧菜单 "API Keys"
4. 点击 "Create API Key"
5. 复制生成的 API Key

### 步骤 2: 配置环境变量

**本地开发 (.env.local):**
```env
AI_PROVIDER=groq
GROQ_API_KEY=你的_groq_api_key_在这里
```

**Vercel 部署:**
1. 登录 Vercel Dashboard: https://vercel.com/dashboard
2. 选择您的项目
3. 进入 Settings > Environment Variables
4. 添加以下变量：
   - `AI_PROVIDER` = `groq`
   - `GROQ_API_KEY` = 你的 Groq API Key
5. 重新部署项目

### 优点
- ✅ 速度超快（500+ tokens/秒）
- ✅ 免费额度充足（30 请求/分钟，无每日限制）
- ✅ 通常没有地区限制
- ✅ 配置简单

---

## 🎯 推荐方案 2: OpenRouter（模型选择多）

### 步骤 1: 获取 OpenRouter API Key
1. 访问 https://openrouter.ai/
2. 注册账号
3. 进入 "Keys" 页面
4. 创建新的 API Key

### 步骤 2: 配置环境变量

**本地开发 (.env.local):**
```env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=你的_openrouter_api_key_在这里
```

**Vercel 部署:**
添加环境变量：
- `AI_PROVIDER` = `openrouter`
- `OPENROUTER_API_KEY` = 你的 OpenRouter API Key

### 优点
- ✅ 100+ 模型可选
- ✅ 免费额度：20 请求/分钟，50 请求/天
- ✅ 灵活性高

---

## 🇨🇳 推荐方案 3: DeepSeek（中文优化）

### 步骤 1: 获取 DeepSeek API Key
1. 访问 https://platform.deepseek.com/
2. 注册账号
3. 进入 "API Keys" 页面
4. 创建新的 API Key

### 步骤 2: 配置环境变量

**本地开发 (.env.local):**
```env
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=你的_deepseek_api_key_在这里
```

**Vercel 部署:**
添加环境变量：
- `AI_PROVIDER` = `deepseek`
- `DEEPSEEK_API_KEY` = 你的 DeepSeek API Key

### 优点
- ✅ 中文支持最好
- ✅ 免费额度：500K tokens/天
- ✅ 成本低

---

## 📝 完整 .env.local 示例

```env
# Supabase 配置（保持不变）
NEXT_PUBLIC_SUPABASE_URL=https://ysnyxesbkycpcptdjqhh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_zKTqjOZnMYrKZDU2gw1nDQ_oNeL_-Qj
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# AI 提供商配置（选择其中一个）
# 方案 1: Groq（推荐）
AI_PROVIDER=groq
GROQ_API_KEY=gsk_你的_groq_api_key

# 方案 2: OpenRouter
# AI_PROVIDER=openrouter
# OPENROUTER_API_KEY=sk-or-v1-你的_openrouter_api_key

# 方案 3: DeepSeek
# AI_PROVIDER=deepseek
# DEEPSEEK_API_KEY=sk-你的_deepseek_api_key

# Gemini（已禁用，因为地区限制）
# GEMINI_API_KEY=AIzaSy...
```

---

## ✅ 配置完成后

1. **本地开发**: 重启开发服务器
   ```bash
   npm run dev
   ```

2. **Vercel 部署**: 
   - 在 Vercel Dashboard 添加环境变量后
   - 点击 "Redeploy" 重新部署
   - 或推送代码触发自动部署

3. **测试**: 尝试创建学习路径，应该可以正常工作了！

---

## 🔍 验证配置

配置完成后，查看服务器日志应该显示：
- ✅ `🔄 尝试 Groq 模型: llama-3.3-70b-versatile`（如果使用 Groq）
- ✅ `✅ 成功使用 Groq 模型: llama-3.3-70b-versatile`

如果看到错误，检查：
1. API Key 是否正确
2. 环境变量名称是否正确（注意大小写）
3. 是否重启了服务器/重新部署

---

## 💡 提示

- **Groq** 是最快的选择，推荐优先使用
- **OpenRouter** 适合需要多种模型的场景
- **DeepSeek** 适合中文内容生成
- 所有提供商都是免费的（在免费额度内）
