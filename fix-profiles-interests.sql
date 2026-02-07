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
