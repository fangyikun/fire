# 快速修复指南

## 当前错误状态

如果你看到以下错误，说明代码已修复但 Vercel 可能还没有部署最新版本：

### 1. 406 错误 - `Cannot coerce the result to a single JSON object`
**状态：** ✅ 已修复（使用 `maybeSingle()` 替代 `single()`）
**位置：** 
- `app/dashboard/page.tsx` ✅
- `app/page.tsx` ✅

### 2. 500 错误 - `/api/user-roadmaps`
**状态：** ✅ 已修复（改进错误处理，确保返回有效 JSON）
**位置：** `app/api/user-roadmaps/route.ts` ✅

### 3. 400 错误 - roadmaps 查询
**状态：** ✅ 已修复（添加错误处理）
**位置：** `app/page.tsx` ✅

## 立即操作步骤

### 步骤 1: 确认 Vercel 部署状态

1. 访问 Vercel Dashboard
2. 进入你的项目
3. 查看 **Deployments** 标签
4. 确认最新的部署时间是否在最近几分钟内

**如果部署不是最新的：**
- 等待自动部署完成（通常 1-2 分钟）
- 或手动点击 **Redeploy**

### 步骤 2: 清除浏览器缓存

**Chrome/Edge:**
- 按 `Ctrl + Shift + Delete`
- 选择"缓存的图片和文件"
- 点击"清除数据"
- 或按 `Ctrl + Shift + R` 硬刷新

**Firefox:**
- 按 `Ctrl + Shift + Delete`
- 选择"缓存"
- 点击"立即清除"

### 步骤 3: 验证修复

1. 硬刷新页面 (`Ctrl + Shift + R`)
2. 打开浏览器控制台 (F12)
3. 检查是否还有 406 和 500 错误
4. 如果仍有错误，查看 Network 标签中的详细错误信息

## 如果错误仍然存在

### 检查清单：

- [ ] Vercel 部署是否是最新的？
- [ ] 浏览器缓存是否已清除？
- [ ] 是否硬刷新了页面？
- [ ] 环境变量是否已正确配置？
- [ ] 数据库 schema 是否已修复（`learning_time_seconds` 列是否存在）？

### 查看详细错误：

1. 打开浏览器控制台 (F12)
2. 查看 **Network** 标签
3. 找到失败的请求（红色）
4. 点击查看：
   - **Headers** - 检查请求头
   - **Response** - 查看服务器返回的内容
   - **Preview** - 查看格式化的响应

### 常见问题：

**Q: 为什么修复后还有错误？**
A: 可能是浏览器缓存了旧的 JavaScript 文件。请清除缓存并硬刷新。

**Q: 如何确认代码已更新？**
A: 检查 Vercel 部署日志，确认最新的部署包含了你的代码更改。

**Q: 406 错误是什么意思？**
A: Supabase 的 `.single()` 方法要求必须返回一条记录。如果 profile 不存在，会返回 406。已修复为使用 `.maybeSingle()`。

## 代码修复总结

### 已修复的文件：

1. ✅ `app/dashboard/page.tsx` - 使用 `maybeSingle()` 替代 `single()`
2. ✅ `app/page.tsx` - 使用 `maybeSingle()` 并添加错误处理
3. ✅ `app/api/user-roadmaps/route.ts` - 改进错误处理，确保返回有效 JSON

### 修复内容：

- 所有 `profiles` 查询都使用 `maybeSingle()` 而不是 `single()`
- API 路由现在总是返回有效的 JSON
- 添加了更好的错误处理和日志记录
- 前端现在能优雅地处理 API 错误

## 验证成功标志

修复成功后，你应该看到：

- ✅ 控制台没有 406 错误
- ✅ 控制台没有 500 错误（或错误被正确处理）
- ✅ Dashboard 能正常加载
- ✅ 首页能正常显示公开的路线图
- ✅ 用户 profile 信息能正常显示（即使不存在也能使用默认值）
