import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.redirect(new URL('/login?error=config', request.url))
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(new URL('/login?error=auth', request.url))
      }

      // 如果用户已登录，尝试创建或更新 profile
      if (data.user) {
        try {
          // 只插入基本字段，避免列不存在时的错误
          const profileData: any = {
            id: data.user.id,
            username: data.user.email?.split('@')[0] || 'user',
            email: data.user.email,
          }
          
          // 尝试插入，如果失败则忽略（profile 可能已存在）
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert(profileData, {
              onConflict: 'id'
            })
            
          if (profileError) {
            console.warn('Profile upsert warning:', profileError.message)
            // 如果是因为列不存在，尝试只插入基本字段
            if (profileError.message?.includes('does not exist')) {
              console.warn('Database schema issue detected. Please run fix-profiles-interests.sql in Supabase SQL Editor.')
            }
          }
        } catch (profileErr: any) {
          console.warn('Profile creation failed:', profileErr)
          // 继续执行，不阻止登录
        }
      }
    } catch (err) {
      console.error('Callback error:', err)
      return NextResponse.redirect(new URL('/login?error=callback', request.url))
    }
  }

  return NextResponse.redirect(new URL(next, request.url))
}
