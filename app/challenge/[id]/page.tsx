'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, ArrowLeft, CheckCircle2, Film } from 'lucide-react'
import Link from 'next/link'

export default function ChallengePage() {
  const [progress, setProgress] = useState<any>(null)
  const [nodes, setNodes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  
  const params = useParams()
  const router = useRouter()
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  useEffect(() => {
    async function loadChallenge() {
      try {
        const { data: prog } = await supabase.from('user_progress').select(`*, roadmaps(*)`).eq('id', params.id).single()
        if (prog) {
          setProgress(prog)
          const { data: nds } = await supabase.from('roadmap_nodes').select('*').eq('roadmap_id', prog.roadmap_id).order('order_index', { ascending: true })
          setNodes(nds || [])
        }
      } catch (e) { console.error(e) } 
      finally { setLoading(false) }
    }
    loadChallenge()
  }, [params.id])

  const handleComplete = async () => {
    if (updating) return
    setUpdating(true)
    const nextStep = (progress.current_step || 1) + 1
    
    // 如果还没到最后一关
    if (nextStep <= nodes.length) {
      await supabase.from('user_progress').update({ current_step: nextStep }).eq('id', params.id)
      setProgress({ ...progress, current_step: nextStep })
    } else {
      // 完结撒花
      await supabase.from('user_progress').update({ status: 'completed' }).eq('id', params.id)
      alert("✨ 恭喜，这趟学术旅程已抵达终点。")
      router.push('/dashboard')
    }
    setUpdating(false)
  }

  if (loading) return <div className="bg-[#1A1A1A] min-h-screen flex items-center justify-center text-[#8E9775] font-serif tracking-widest animate-pulse italic">FILM LOADING...</div>

  const currentNode = nodes[(progress?.current_step || 1) - 1]

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-[#DCD7C9] font-serif overflow-hidden">
      {/* 顶部极简导航 */}
      <nav className="fixed top-0 w-full p-8 flex justify-between items-center z-50 mix-blend-difference">
        <Link href="/dashboard" className="text-[10px] tracking-[0.4em] uppercase opacity-40 hover:opacity-100 transition-opacity flex items-center gap-2">
          <ArrowLeft size={12} /> Exit Studio
        </Link>
        <div className="text-[10px] tracking-[0.5em] uppercase opacity-30 italic">
          Scene {(progress?.current_step || 1)} / {nodes.length}
        </div>
      </nav>

      <main className="h-screen flex flex-col items-center justify-center px-6 relative">
        {/* 背景大数字：增加电影感 */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] select-none pointer-events-none">
          <span className="text-[40rem] font-bold">{(progress?.current_step || 1)}</span>
        </div>

        <div className="max-w-3xl w-full text-center z-10 space-y-12">
          {/* 任务类型标签 */}
          <span className="inline-block px-4 py-1 border border-[#8E9775]/30 text-[#8E9775] text-[9px] tracking-[0.4em] uppercase rounded-full animate-in fade-in slide-in-from-bottom duration-1000">
            {currentNode?.type || 'Research'}
          </span>

          {/* 核心任务文字：巨大的、有呼吸感的字体 */}
          <h2 className="text-4xl md:text-6xl font-light italic leading-tight tracking-tighter animate-in fade-in zoom-in duration-700">
            {currentNode?.title}
          </h2>

          <p className="text-[#666] text-lg italic max-w-xl mx-auto leading-relaxed opacity-80">
            {currentNode?.description || "深呼吸，沉浸在这一章的逻辑里。"}
          </p>

          {/* 交互按钮 */}
          <div className="pt-12">
            <button 
              onClick={handleComplete}
              disabled={updating}
              className="group relative overflow-hidden px-16 py-5 border border-[#DCD7C9] rounded-full transition-all duration-700 hover:bg-[#DCD7C9] hover:text-black"
            >
              <span className="relative z-10 tracking-[0.3em] text-[10px] uppercase font-bold flex items-center gap-3">
                {updating ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} className="opacity-40 group-hover:opacity-100" />}
                {progress?.current_step === nodes.length ? "Finish Project" : "Next Scene"}
              </span>
            </button>
          </div>
        </div>

        {/* 底部电影胶片进度条 */}
        <div className="fixed bottom-0 left-0 w-full h-1 bg-[#2C2C2C]">
          <div 
            className="h-full bg-[#8E9775] transition-all duration-1000 ease-out"
            style={{ width: `${((progress?.current_step || 1) / nodes.length) * 100}%` }}
          />
        </div>
      </main>
    </div>
  )
}