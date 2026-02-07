# Vercel 部署指南

## 前置要求

1. 确保代码已推送到 GitHub 仓库
2. 拥有 Vercel 账号（可通过 GitHub 账号登录）

## 部署步骤

### 方法一：通过 Vercel 网站部署（推荐）

1. 访问 [Vercel](https://vercel.com) 并使用 GitHub 账号登录
2. 点击 "Add New Project"
3. 导入你的 GitHub 仓库 `fangyikun/fire`
4. 配置项目设置：
   - **Framework Preset**: Next.js（会自动检测）
   - **Root Directory**: `kaohuo-app`（如果仓库在子目录中）
   - **Build Command**: `npm run build`（默认）
   - **Output Directory**: `.next`（默认）
   - **Install Command**: `npm install`（默认）

5. **配置环境变量**（重要！）：
   在 "Environment Variables" 部分添加以下变量：
   
   ⚠️ **必须配置所有环境变量，否则构建会失败！**
   
   ```
   NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase匿名密钥
   SUPABASE_SERVICE_ROLE_KEY=你的Supabase服务角色密钥
   GEMINI_API_KEY=你的Google Gemini API密钥
   ```
   
   **重要提示**：
   - 确保为所有环境（Production、Preview、Development）都设置了这些变量
   - `NEXT_PUBLIC_*` 开头的变量会在构建时被嵌入到客户端代码中
   - 配置完环境变量后，需要重新部署才能生效

6. 点击 "Deploy" 开始部署

### 方法二：通过 Vercel CLI 部署

1. 安装 Vercel CLI（如果尚未安装）：
   ```bash
   npm i -g vercel
   ```

2. 在项目根目录登录 Vercel：
   ```bash
   cd kaohuo-app
   vercel login
   ```

3. 部署到生产环境：
   ```bash
   vercel --prod
   ```

4. 首次部署时，CLI 会提示你：
   - 链接到现有项目或创建新项目
   - 配置环境变量（或稍后在 Vercel 网站配置）

## 环境变量说明

| 变量名 | 说明 | 是否公开 |
|--------|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | 是（客户端可见） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | 是（客户端可见） |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务角色密钥 | 否（仅服务端） |
| `GEMINI_API_KEY` | Google Gemini API 密钥 | 否（仅服务端） |

⚠️ **重要**：`SUPABASE_SERVICE_ROLE_KEY` 和 `GEMINI_API_KEY` 是敏感信息，不要提交到代码仓库。

## 部署后检查

1. 访问部署后的 URL（Vercel 会自动生成）
2. 检查控制台是否有错误
3. 测试主要功能：
   - 用户登录/注册
   - 创建学习路径
   - 查看仪表盘

## 更新部署

每次推送到 `main` 分支时，Vercel 会自动重新部署（如果已连接 GitHub）。

也可以手动触发部署：
- 在 Vercel 网站的项目页面点击 "Redeploy"
- 或使用 CLI：`vercel --prod`

## 故障排除

### 构建失败
- 检查环境变量是否都已正确配置
- 查看构建日志中的错误信息
- 确保 `package.json` 中的依赖版本兼容

### 运行时错误
- 检查浏览器控制台的错误信息
- 确认所有环境变量都已设置
- 检查 Supabase 和 Gemini API 的配额和限制

### 环境变量未生效
- 确保变量名拼写正确
- 重新部署项目（环境变量更改需要重新部署）
- 检查变量是否设置为正确的环境（Production/Preview/Development）
