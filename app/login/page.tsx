'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowRight, ShieldCheck, Mail } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    
    try {
      if (isSignUp) {
        // 注册逻辑
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) throw error
        setMessage({ type: 'success', text: '档案已初步建立。请检查邮箱确认链接（若未开启验证则可直接尝试登录）。' })
      } else {
        // 登录逻辑
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '操作失败，请检查凭据。' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-[#DCD7C9] font-serif flex items-center justify-center p-6 selection:bg-[#8E9775] selection:text-black">
      <div className="max-w-md w-full">
        
        {/* 仪式感头部 */}
        <div className="text-center mb-16 space-y-6">
          <div className="inline-block p-4 border border-[#2C2C2C] rounded-full mb-4 opacity-20 group-hover:opacity-100 transition-opacity">
            {isSignUp ? <ShieldCheck size={24} /> : <Mail size={24} />}
          </div>
          <h1 className="text-5xl font-light italic tracking-tighter text-white">
            {isSignUp ? 'The Genesis.' : 'The Entry.'}
          </h1>
          <p className="text-[#8E9775] text-[10px] tracking-[0.5em] uppercase opacity-60">
            {isSignUp ? '建立你的私人研究档案' : '唤醒你的馆藏记忆'}
          </p>
        </div>

        {/* 提示信息 */}
        {message && (
          <div className={`mb-8 p-4 text-[11px] tracking-widest text-center border ${
            message.type === 'success' ? 'border-[#8E9775]/30 text-[#8E9775]' : 'border-[#B85C5C]/30 text-[#B85C5C]'
          } italic bg-white/5`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-10">
          <div className="space-y-1">
            <label className="text-[9px] uppercase tracking-[0.3em] opacity-30 ml-1">Identity / 邮箱</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border-b border-[#2C2C2C] py-4 outline-none focus:border-[#8E9775] transition-all placeholder:text-[#333] italic text-lg"
              placeholder="researcher@example.com"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] uppercase tracking-[0.3em] opacity-30 ml-1">Secret Code / 密码</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border-b border-[#2C2C2C] py-4 outline-none focus:border-[#8E9775] transition-all placeholder:text-[#333] italic text-lg"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            disabled={loading}
            className="w-full py-5 mt-8 border border-[#DCD7C9] rounded-full hover:bg-[#DCD7C9] hover:text-black transition-all duration-1000 flex items-center justify-center gap-4 group disabled:opacity-30"
          >
            <span className="text-[10px] uppercase tracking-[0.4em] font-bold">
              {loading ? <Loader2 className="animate-spin" size={16} /> : (isSignUp ? 'Begin Membership' : 'Open Archive')}
            </span>
            {!loading && <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform duration-500" />}
          </button>
        </form>

        <div className="mt-12 text-center">
          <button 
            onClick={() => {
                setIsSignUp(!isSignUp);
                setMessage(null);
            }}
            className="text-[9px] uppercase tracking-[0.4em] opacity-30 hover:opacity-100 transition-opacity underline underline-offset-8"
          >
            {isSignUp ? 'Existing Researcher? Sign In' : 'New Observer? Create Account'}
          </button>
        </div>
      </div>

      {/* 装饰性页脚 */}
      <footer className="fixed bottom-10 text-[8px] tracking-[1em] uppercase opacity-10">
        Secured by Supabase Auth Gateway
      </footer>
    </div>
  )
}