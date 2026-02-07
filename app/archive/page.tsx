'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { ArrowLeft, BookMarked, Quote, Filter } from 'lucide-react'

export default function ArchiveVault() {
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  useEffect(() => {
    async function fetchNotes() {
      try {
        setLoading(true)
        // 核心：联表查询，带出节点标题和所属路径的分类
        const { data } = await supabase
          .from('notes')
          .select(`
            id,
            content,
            created_at,
            roadmap_nodes (
              title,
              roadmaps (title, category)
            )
          `)
          .order('created_at', { ascending: false })
        
        setNotes(data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchNotes()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center text-[#8E9775] font-serif uppercase tracking-[0.5em] animate-pulse">
      Opening the Vault...
    </div>
  )

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-[#DCD7C9] font-serif p-8 md:p-20">
      {/* 顶部导航 */}
      <nav className="fixed top-0 left-0 w-full p-8 flex justify-between items-center z-50 bg-[#1A1A1A]/80 backdrop-blur-sm">
        <Link href="/" className="group flex items-center gap-2 text-xs opacity-50 hover:opacity-100 transition-opacity">
          <ArrowLeft size={16} /> <span>LIBRARY</span>
        </Link>
        <div className="text-[10px] tracking-[0.4em] uppercase opacity-30">Personal Archive</div>
      </nav>

      <header className="max-w-6xl mx-auto pt-32 mb-24">
        <h1 className="text-7xl font-light italic mb-6 flex items-center gap-6">
          The Vault. <BookMarked className="text-[#8E9775] opacity-50" strokeWidth={1} size={48} />
        </h1>
        <p className="text-[#666] text-xs tracking-[0.4em] uppercase">散落在媒介边缘的灵感碎片</p>
      </header>

      {/* 笔记展示区 - 使用 Masonry 风格布局 */}
      <div className="max-w-6xl mx-auto columns-1 md:columns-2 lg:columns-3 gap-12 space-y-12">
        {notes.map((note) => (
          <div key={note.id} className="break-inside-avoid group bg-[#222]/20 p-8 border border-[#2C2C2C] hover:border-[#8E9775]/40 transition-all duration-700">
            <div className="flex justify-between items-start mb-8">
              <span className="text-[9px] px-2 py-0.5 border border-[#8E9775]/30 text-[#8E9775] uppercase tracking-tighter rounded-full">
                {note.roadmap_nodes?.roadmaps?.category || 'General'}
              </span>
              <span className="text-[9px] text-[#444] font-mono">
                {new Date(note.created_at).toLocaleDateString()}
              </span>
            </div>

            <Quote size={20} className="text-[#8E9775]/20 mb-4" />
            
            <p className="text-[#BBB] leading-relaxed italic text-lg mb-8 font-sans">
              {note.content}
            </p>

            <div className="pt-6 border-t border-[#2C2C2C]">
              <div className="text-[10px] text-[#555] uppercase tracking-widest mb-1">Source Context</div>
              <div className="text-[11px] text-[#8E9775] italic group-hover:text-[#DCD7C9] transition-colors">
                {note.roadmap_nodes?.roadmaps?.title} / {note.roadmap_nodes?.title}
              </div>
            </div>
          </div>
        ))}
      </div>

      {notes.length === 0 && (
        <div className="text-center py-40 opacity-20 italic">仓库目前空无一物。</div>
      )}
    </div>
  )
}