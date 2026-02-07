# 数据库 Schema 修复指南

## 问题

如果看到以下错误：
- `column profiles.learning_time_seconds does not exist`
- `获取用户资料失败 (可能未创建)`

说明数据库 schema 缺少必要的列。

## 解决步骤

### 1. 登录 Supabase Dashboard

访问 https://supabase.com/dashboard 并登录你的账号

### 2. 选择项目

找到并点击你的 Supabase 项目（URL: `ysnyxesbkycpcptdjqhh.supabase.co`）

### 3. 打开 SQL Editor

在左侧菜单中找到 **SQL Editor** 并点击

### 4. 执行修复 SQL

点击 **New Query**，然后复制粘贴以下 SQL 代码：

```sql
-- 快速修复：为profiles表添加所有必需的列
-- 请在Supabase SQL编辑器中执行此SQL

-- 添加interests列（如果不存在）
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS interests TEXT[];

-- 添加其他可能缺失的列
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS nickname TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS learning_time_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 添加username唯一约束（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_username_key'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
  END IF;
END $$;
```

### 5. 运行 SQL

点击 **Run** 按钮（或按 Ctrl+Enter）执行 SQL

### 6. 验证

执行成功后，你应该看到类似 "Success. No rows returned" 的消息

### 7. 测试

返回你的应用，尝试：
- 注册新用户
- 登录现有用户
- 访问 dashboard

## 完整的 profiles 表结构

执行 SQL 后，`profiles` 表应该包含以下列：

- `id` (UUID, PRIMARY KEY) - 用户 ID
- `username` (TEXT, UNIQUE) - 用户名
- `email` (TEXT) - 邮箱
- `nickname` (TEXT) - 昵称
- `bio` (TEXT) - 个人简介
- `interests` (TEXT[]) - 兴趣列表
- `learning_time_seconds` (INTEGER, DEFAULT 0) - 学习时间（秒）
- `created_at` (TIMESTAMP) - 创建时间
- `updated_at` (TIMESTAMP) - 更新时间

## 常见问题

**Q: 执行 SQL 时出现错误怎么办？**
A: 检查错误信息。如果列已存在，这是正常的（`IF NOT EXISTS` 会跳过）。如果是其他错误，请检查表名和权限。

**Q: 如何查看当前的表结构？**
A: 在 Supabase Dashboard → Table Editor → profiles，可以看到所有列。

**Q: 修复后还是报错？**
A: 
1. 确保 SQL 已成功执行
2. 清除浏览器缓存
3. 重新登录应用
4. 检查浏览器控制台的错误信息

## 文件位置

完整的 SQL 文件位于项目根目录：`fix-profiles-interests.sql`
