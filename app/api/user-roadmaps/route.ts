import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  // Initialize Supabase client for the backend
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 检查环境变量
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing Supabase environment variables");
      return NextResponse.json({ 
        error: "服务器配置错误",
        roadmaps: [] 
      }, { status: 500 });
    }

    // Authenticate user on the backend using access_token from header
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split(' ')[1]; // Expecting "Bearer YOUR_ACCESS_TOKEN"

    if (!token) {
      console.error("Authorization token missing.");
      return NextResponse.json({ error: "未登录或缺少认证令牌" }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("用户认证失败或会话无效:", authError?.message);
      return NextResponse.json({ error: "未登录或会话无效" }, { status: 401 });
    }

    // 查询该用户的所有路线图
    const { data: roadmaps, error: roadmapsError } = await supabase
      .from('roadmaps')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (roadmapsError) {
      console.error("查询用户路线图失败:", roadmapsError);
      // 返回空数组而不是抛出错误
      return NextResponse.json({ 
        error: roadmapsError.message,
        roadmaps: [] 
      }, { status: 500 });
    }

    // 确保返回数组
    return NextResponse.json(Array.isArray(roadmaps) ? roadmaps : []);

  } catch (error: any) {
    console.error("❌ 获取用户路线图失败:", error.message);
    // 确保总是返回有效的 JSON
    return NextResponse.json({ 
      error: error.message || '获取用户路线图失败',
      roadmaps: [] // 提供默认值，避免前端解析错误
    }, { status: 500 });
  }
}