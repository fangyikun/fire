# 故障排除指南

## SQL 执行后仍有错误？

如果已经在 Supabase 中执行了 SQL，但控制台仍然显示错误，请按照以下步骤操作：

### 1. 清除浏览器缓存

**重要：** 浏览器可能缓存了旧的 JavaScript 文件。

**Chrome/Edge:**
- 按 `Ctrl + Shift + Delete` (Windows) 或 `Cmd + Shift + Delete` (Mac)
- 选择"缓存的图片和文件"
- 点击"清除数据"
- 或者按 `Ctrl + Shift + R` (Windows) 或 `Cmd + Shift + R` (Mac) 进行硬刷新

**Firefox:**
- 按 `Ctrl + Shift + Delete`
- 选择"缓存"
- 点击"立即清除"

### 2. 确认 Vercel 部署已更新

**检查部署状态：**
1. 访问 Vercel Dashboard
2. 进入你的项目
3. 查看 **Deployments** 标签
4. 确认最新的部署是最近的（包含最新的代码更改）

**如果没有最新部署：**
- 推送代码到 GitHub（会自动触发部署）
- 或在 Vercel Dashboard 中手动触发 **Redeploy**

### 3. 验证数据库 Schema

**在 Supabase Dashboard 中检查：**

1. 登录 Supabase Dashboard
2. 选择你的项目
3. 打开 **Table Editor**
4. 选择 `profiles` 表
5. 确认以下列存在：
   - `id` (UUID)
   - `username` (TEXT)
   - `email` (TEXT)
   - `learning_time_seconds` (INTEGER) ✅ **这个很重要**
   - `nickname` (TEXT)
   - `interests` (TEXT[])
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

**如果 `learning_time_seconds` 列不存在：**
- 打开 **SQL Editor**
- 执行：`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS learning_time_seconds INTEGER DEFAULT 0;`

### 4. 检查环境变量

**在 Vercel Dashboard 中：**
1. Settings → Environment Variables
2. 确认以下变量已设置：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
3. 确认所有变量都应用到 Production、Preview、Development

### 5. 查看详细错误信息

**在浏览器控制台中：**
1. 打开开发者工具 (F12)
2. 查看 **Console** 标签
3. 查看 **Network** 标签
4. 找到失败的请求（红色）
5. 点击查看详细信息：
   - **Headers** - 检查请求头
   - **Response** - 查看服务器返回的内容
   - **Preview** - 查看格式化的响应

### 6. 常见错误及解决方案

#### 错误：`column profiles.learning_time_seconds does not exist`
**解决方案：** 执行 SQL 添加列（见步骤 3）

#### 错误：`Failed to execute 'json' on 'Response': Unexpected end of JSON input`
**原因：** API 返回了非 JSON 响应（可能是 HTML 错误页面）
**解决方案：** 
- 检查 API 路由是否正确返回 JSON
- 确认环境变量已正确配置
- 重新部署应用

#### 错误：`500 Internal Server Error` 在 `/api/user-roadmaps`
**原因：** 服务器端错误
**解决方案：**
- 检查 Vercel 部署日志
- 确认 `SUPABASE_SERVICE_ROLE_KEY` 已正确配置
- 检查数据库连接是否正常

#### 错误：`400 Bad Request`
**原因：** 请求格式错误或缺少必需参数
**解决方案：**
- 检查请求头中的 Authorization token
- 确认用户已正确登录

### 7. 测试步骤

**按顺序执行：**

1. ✅ 清除浏览器缓存
2. ✅ 确认 Vercel 部署是最新的
3. ✅ 验证数据库 schema
4. ✅ 检查环境变量
5. ✅ 硬刷新页面 (`Ctrl + Shift + R`)
6. ✅ 尝试登录/注册
7. ✅ 检查控制台是否还有错误

### 8. 如果问题仍然存在

**收集以下信息：**

1. **浏览器控制台的完整错误信息**（截图或复制文本）
2. **Network 标签中失败请求的详细信息**
3. **Vercel 部署日志**（如果有错误）
4. **Supabase 日志**（如果有错误）

然后：
- 检查 GitHub Issues（如果有）
- 或联系技术支持

### 9. 快速诊断命令

**在浏览器控制台中运行：**

```javascript
// 检查环境变量（客户端）
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');

// 检查 API 端点
fetch('/api/user-roadmaps', {
  headers: { 'Authorization': 'Bearer ' + (await supabase.auth.getSession()).data.session?.access_token }
}).then(r => r.json()).then(console.log).catch(console.error);
```

### 10. 验证修复

**成功修复的标志：**

- ✅ 控制台没有红色错误
- ✅ Dashboard 能正常加载
- ✅ 用户数据能正常显示
- ✅ API 请求返回 200 状态码
- ✅ JSON 响应能正常解析
