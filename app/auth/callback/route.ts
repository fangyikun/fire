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
          await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              username: data.user.email?.split('@')[0] || 'user',
              email: data.user.email,
            }, {
              onConflict: 'id'
            })
        } catch (profileErr) {
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
