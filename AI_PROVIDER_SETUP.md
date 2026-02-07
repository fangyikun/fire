# AI 提供商配置指南

本应用现在支持多个免费的 AI API 提供商，您可以根据需要切换。

## 支持的提供商

### 1. **Groq** (推荐，默认)
- **免费额度**: 30 请求/分钟，无每日限制
- **速度**: 超快（500+ tokens/秒）
- **模型**: Llama 3.3 70B, Mixtral 8x7B
- **注册**: https://console.groq.com/
- **优点**: 速度最快，免费额度充足

### 2. **OpenRouter**
- **免费额度**: 20 请求/分钟，50 请求/天（免费），1000 请求/天（$10 终身充值）
- **模型**: 100+ 模型可选，包括 Llama 3.3 70B, Gemma 3, DeepSeek
- **注册**: https://openrouter.ai/
- **优点**: 模型选择多，灵活

### 3. **DeepSeek**
- **免费额度**: 500K tokens/天
- **模型**: DeepSeek Chat
- **注册**: https://platform.deepseek.com/
- **优点**: 中文支持好，成本低

### 4. **Hugging Face**
- **免费额度**: 1,000 请求/天
- **模型**: Meta Llama 3.1 70B
- **注册**: https://huggingface.co/
- **优点**: 开源模型，社区支持

### 5. **Google Gemini** (原配置)
- **免费额度**: 20 请求/天
- **模型**: Gemini 2.5 Flash
- **注册**: https://makersuite.google.com/app/apikey
- **注意**: 配额较少，可能受地理限制

## 配置方法

### 步骤 1: 获取 API Key

根据您选择的提供商，注册并获取 API Key：

1. **Groq**: 
   - 访问 https://console.groq.com/
   - 注册账号
   - 在 API Keys 页面创建新的 API Key

2. **OpenRouter**:
   - 访问 https://openrouter.ai/
   - 注册账号
   - 在 Keys 页面创建新的 API Key

3. **DeepSeek**:
   - 访问 https://platform.deepseek.com/
   - 注册账号
   - 在 API Keys 页面创建新的 API Key

4. **Hugging Face**:
   - 访问 https://huggingface.co/
   - 注册账号
   - 在 Settings > Access Tokens 创建新的 Token

### 步骤 2: 配置环境变量

#### 本地开发 (.env.local)

```env
# 选择 AI 提供商 (groq, openrouter, deepseek, huggingface, gemini)
AI_PROVIDER=groq

# 根据选择的提供商设置对应的 API Key
GROQ_API_KEY=your_groq_api_key_here
# 或
OPENROUTER_API_KEY=your_openrouter_api_key_here
# 或
DEEPSEEK_API_KEY=your_deepseek_api_key_here
# 或
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
# 或
GEMINI_API_KEY=your_gemini_api_key_here
```

#### Vercel 部署

1. 登录 Vercel Dashboard
2. 选择您的项目
3. 进入 Settings > Environment Variables
4. 添加以下变量：

| 变量名 | 值 | 环境 |
|--------|-----|------|
| `AI_PROVIDER` | `groq` (或您选择的提供商) | Production, Preview, Development |
| `GROQ_API_KEY` | 您的 Groq API Key | Production, Preview, Development |
| (或其他提供商的 API Key) | | |

### 步骤 3: 重启应用

- **本地**: 重启开发服务器 (`npm run dev`)
- **Vercel**: 重新部署项目

## 推荐配置

### 快速开始（推荐）
```env
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key
```
**理由**: Groq 速度最快，免费额度充足，无需等待。

### 多模型选择
```env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your_openrouter_api_key
```
**理由**: 可以访问 100+ 模型，灵活性高。

### 中文优化
```env
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=your_deepseek_api_key
```
**理由**: DeepSeek 对中文支持更好。

## 故障排除

### 错误: "API Key 未配置"
- 检查环境变量名称是否正确
- 确认 API Key 已正确设置
- 重启应用

### 错误: "配额已用完"
- 检查对应提供商的配额限制
- 考虑切换到其他提供商
- 等待配额重置（通常是每天）

### 错误: "模型调用异常"
- 检查 API Key 是否有效
- 确认网络连接正常
- 查看服务器日志获取详细错误信息

## 各提供商对比

| 提供商 | 免费额度 | 速度 | 中文支持 | 推荐度 |
|--------|---------|------|---------|--------|
| Groq | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| OpenRouter | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| DeepSeek | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Hugging Face | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Gemini | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |

## 注意事项

1. **API Key 安全**: 不要将 API Key 提交到代码仓库
2. **配额管理**: 注意各提供商的配额限制
3. **成本**: 免费额度用完后可能需要付费
4. **地区限制**: 某些提供商可能有地理限制

## 切换提供商

只需修改 `AI_PROVIDER` 环境变量并设置对应的 API Key，无需修改代码。
