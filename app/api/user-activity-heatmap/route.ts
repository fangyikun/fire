import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  // Initialize Supabase client for the backend
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
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

    // 获取最近一年的活跃度数据
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const startDate = oneYearAgo.toISOString().split('T')[0];

    const { data: activityData, error: activityError } = await supabase
      .from('user_activity')
      .select('activity_date, count')
      .eq('user_id', user.id)
      .gte('activity_date', startDate) // 大于或等于一年前的日期
      .order('activity_date', { ascending: true });

    if (activityError) {
      console.error("查询用户活跃度数据失败:", activityError);
      throw activityError;
    }

    // 返回热力图所需的数据格式
    // { date: "YYYY-MM-DD", count: N }
    const formattedData = activityData?.map(item => ({
      date: item.activity_date,
      count: item.count
    })) || [];

    return NextResponse.json(formattedData);

  } catch (error: any) {
    console.error("❌ 获取用户活跃度数据失败:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}