# 本地正常但 Vercel 报错 - 问题诊断

## 为什么本地正常但 Vercel 报错？

这是很常见的问题，通常由以下原因导致：

### 1. 环境变量未配置 ⚠️ **最常见**

**本地：** 使用 `.env.local` 文件
**Vercel：** 需要在 Dashboard 中手动配置

**解决方案：**
1. 访问 Vercel Dashboard → 你的项目 → Settings → Environment Variables
2. 添加所有必需的环境变量
3. **重要：** 必须为 Production、Preview、Development 都添加
4. 配置后点击 **Redeploy**

### 2. 代码版本不同步

**本地：** 可能是最新代码
**Vercel：** 可能部署的是旧版本

**检查方法：**
1. 访问 Vercel Dashboard → Deployments
2. 查看最新部署的 commit hash
3. 对比 GitHub 上的最新 commit

**解决方案：**
- 推送最新代码到 GitHub（会自动触发部署）
- 或手动点击 Redeploy

### 3. 构建时环境变量注入问题

**Next.js 行为：**
- `NEXT_PUBLIC_*` 变量在**构建时**被注入到客户端代码
- 如果构建时变量不存在，客户端代码中就是 `undefined`

**解决方案：**
- 确保环境变量在**构建前**就已配置
- 配置后必须重新构建（Redeploy）

### 4. 数据库权限差异

**本地：** 可能使用不同的数据库或权限
**Vercel：** 使用生产数据库，可能有不同的 RLS 策略

**检查方法：**
- 访问 Supabase Dashboard → Authentication → Policies
- 确认 RLS 策略是否正确配置

### 5. API 路由环境变量问题

**问题：** API 路由（服务端）需要 `SUPABASE_SERVICE_ROLE_KEY`
**本地：** 从 `.env.local` 读取
**Vercel：** 必须手动配置

**解决方案：**
- 在 Vercel 中配置 `SUPABASE_SERVICE_ROLE_KEY`
- 确保不是 `NEXT_PUBLIC_*` 开头（服务端专用）

## 快速诊断步骤

### 步骤 1: 检查环境变量

访问 `/debug/env` 页面，查看环境变量状态

### 步骤 2: 检查 API 端点

访问 `/debug/api` 页面，测试所有 API 端点

### 步骤 3: 查看 Vercel 日志

1. Vercel Dashboard → 你的项目 → Deployments
2. 点击最新的部署
3. 查看 **Build Logs** 和 **Function Logs**
4. 查找错误信息

### 步骤 4: 对比本地和 Vercel

**本地测试：**
```bash
# 检查环境变量
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# 运行构建
npm run build
```

**Vercel 检查：**
- Dashboard → Settings → Environment Variables
- 确认所有变量都已设置

## 常见错误对比

### 错误：`Supabase client not initialized`

**本地：** ✅ 正常（从 `.env.local` 读取）
**Vercel：** ❌ 报错（环境变量未配置）

**解决：** 在 Vercel Dashboard 中配置环境变量

### 错误：`500 Internal Server Error`

**本地：** ✅ 正常（服务端变量可用）
**Vercel：** ❌ 报错（`SUPABASE_SERVICE_ROLE_KEY` 未配置）

**解决：** 在 Vercel 中配置 `SUPABASE_SERVICE_ROLE_KEY`

### 错误：`406 Not Acceptable` 或 `Cannot coerce to single JSON object`

**本地：** ✅ 正常（数据库有数据）
**Vercel：** ❌ 报错（数据库 schema 不同或数据不存在）

**解决：** 
- 检查数据库 schema 是否一致
- 执行 `fix-profiles-interests.sql` 修复 schema

### 错误：`400 Bad Request` 在 Supabase 查询

**本地：** ✅ 正常（查询语法正确）
**Vercel：** ❌ 报错（可能是外键关系未配置）

**解决：** 
- 检查 Supabase Dashboard → Database → Foreign Keys
- 确认外键关系已正确配置

## 环境变量检查清单

在 Vercel Dashboard 中确认以下变量：

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - 已设置
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - 已设置
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - 已设置（服务端专用）
- [ ] `GEMINI_API_KEY` - 已设置（服务端专用）
- [ ] 所有变量都应用到 Production、Preview、Development
- [ ] 变量名完全正确（区分大小写，无多余空格）

## 调试技巧

### 1. 在代码中添加日志

```typescript
// 在 API 路由中
console.log('Environment check:', {
  hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
})
```

### 2. 查看 Vercel Function Logs

- Vercel Dashboard → 你的项目 → Functions
- 查看实时日志

### 3. 使用诊断页面

- `/debug/env` - 检查环境变量
- `/debug/api` - 测试 API 端点

## 如果问题仍然存在

1. **收集信息：**
   - Vercel 部署日志
   - 浏览器控制台错误
   - Network 标签中的失败请求详情

2. **检查：**
   - GitHub 上的代码是否是最新的
   - Vercel 部署的代码版本
   - 环境变量配置是否正确

3. **尝试：**
   - 完全重新部署（删除并重新导入项目）
   - 检查 Supabase 项目设置
   - 验证数据库连接
