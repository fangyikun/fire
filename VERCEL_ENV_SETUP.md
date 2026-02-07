# Vercel 环境变量配置指南

## 问题：Supabase client not initialized

如果在 Vercel 上看到 "Supabase client not initialized" 错误，说明环境变量没有正确配置。

## 解决步骤

### 1. 登录 Vercel Dashboard
访问 https://vercel.com 并登录你的账号

### 2. 选择你的项目
找到并点击项目 `fire`（或你的项目名称）

### 3. 进入项目设置
点击顶部的 **Settings** 标签

### 4. 配置环境变量
在左侧菜单中找到 **Environment Variables**

### 5. 添加以下环境变量

**必须为 Production、Preview、Development 三个环境都添加：**

| 变量名 | 值 | 环境 |
|--------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ysnyxesbkycpcptdjqhh.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_zKTqjOZnMYrKZDU2gw1nDQ_oNeL_-Qj` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production, Preview, Development |
| `GEMINI_API_KEY` | `AIzaSyA1k-tZTcYhj53z4Y32oEsp30zVAH2W3d8` | Production, Preview, Development |

### 6. 重要提示

⚠️ **关键步骤：**

1. **确保变量名完全正确**（区分大小写）
   - `NEXT_PUBLIC_SUPABASE_URL` ✅
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅
   - 不要写成 `NEXT_PUBLIC_SUPABASE_URL_` 或 `NEXT_PUBLIC_SUPABASE_URL `（有空格）

2. **为所有环境添加变量**
   - 点击每个变量旁边的下拉菜单
   - 选择 **Production**、**Preview**、**Development**
   - 或者直接勾选 "Apply to all environments"

3. **重新部署**
   - 配置完环境变量后，必须重新部署才能生效
   - 方法1：在 Vercel Dashboard 点击 **Deployments** → 找到最新的部署 → 点击 **...** → **Redeploy**
   - 方法2：推送新的代码到 GitHub（会自动触发部署）

### 7. 验证配置

部署完成后：

1. 打开浏览器开发者工具（F12）
2. 访问你的 Vercel 应用
3. 在 Console 标签中检查是否有错误
4. 如果看到环境变量相关的错误，说明配置有问题

### 8. 常见问题

**Q: 我已经添加了环境变量，为什么还是报错？**
A: 环境变量更改后必须重新部署。请点击 Redeploy。

**Q: 如何确认环境变量是否正确？**
A: 在 Vercel Dashboard → Settings → Environment Variables 中检查变量名和值是否正确。

**Q: 变量值中有特殊字符怎么办？**
A: 直接复制粘贴即可，Vercel 会自动处理。

**Q: 我可以在代码中直接使用环境变量吗？**
A: 可以，但只有 `NEXT_PUBLIC_*` 开头的变量会在客户端代码中可用。

## 快速检查清单

- [ ] 已登录 Vercel Dashboard
- [ ] 已选择正确的项目
- [ ] 已添加 `NEXT_PUBLIC_SUPABASE_URL`
- [ ] 已添加 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] 已添加 `SUPABASE_SERVICE_ROLE_KEY`
- [ ] 已添加 `GEMINI_API_KEY`
- [ ] 所有变量都已应用到 Production、Preview、Development
- [ ] 已重新部署项目
- [ ] 已清除浏览器缓存并刷新页面

## 需要帮助？

如果按照以上步骤操作后仍然有问题，请检查：

1. Vercel 部署日志中是否有错误
2. 浏览器控制台中的详细错误信息
3. Supabase Dashboard 中的项目配置是否正确
