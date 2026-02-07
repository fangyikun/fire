'use client'

import { useEffect, useState, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, ArrowLeft, Bookmark, PenLine, Check, Hash, Send, GitFork, FileText, Edit2, Users, MessageCircle, X } from 'lucide-react'
import Link from 'next/link'

// --- 局部组件：笔记输入区域 ---
function NoteSection({ nodeId, userId, onSave }: { nodeId: string, userId: string | undefined, onSave: (nid: string, c: string) => Promise<void> }) {
  const [content, setContent] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [done, setDone] = useState(false)

  const handleSave = async () => {
    if (!content.trim()) return
    setIsSaving(true)
    await onSave(nodeId, content)
    setIsSaving(false)
    setContent("")
    setDone(true)
    setTimeout(() => setDone(false), 2000)
  }

  return (
    <div className="mt-8 pt-8 border-t border-[#2C2C2C] max-w-2xl">
      <div className="flex items-center gap-2 mb-4 text-[#8E9775] opacity-60 font-sans">
        <PenLine size={12} />
        <span className="text-[10px] uppercase tracking-[0.3em] font-medium">Capture Reflection / 灵感捕获</span>
      </div>
      <div className="relative bg-[#222]/20 border border-[#333] rounded-lg p-4 focus-within:border-[#8E9775]/50 transition-all">
        <textarea 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="在此处记录你与这一阶段知识碰撞的火花..."
          className="w-full bg-transparent text-sm italic font-sans outline-none resize-none placeholder:text-[#333] leading-relaxed text-[#DCD7C9] min-h-[80px]"
          rows={3}
        />
        <div className="flex justify-end mt-2">
          <button 
            onClick={handleSave}
            disabled={!content.trim() || isSaving}
            className="group flex items-center gap-2 px-4 py-2 rounded-full bg-[#8E9775] text-black text-[10px] uppercase font-bold tracking-widest hover:bg-[#DCD7C9] transition-all disabled:opacity-20"
          >
            {isSaving ? <Loader2 size={12} className="animate-spin" /> : done ? <Check size={12} /> : <Send size={12} />}
            {isSaving ? "Archiving" : done ? "Saved" : "Commit"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function RoadmapDetail() {
  const [roadmap, setRoadmap] = useState<any>(null)
  const [nodes, setNodes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [existingNotes, setExistingNotes] = useState<Record<string, any[]>>({})
  const [retryCount, setRetryCount] = useState(0)
  const [dataReady, setDataReady] = useState(false)
  const [forking, setForking] = useState(false)
  const [forkedFrom, setForkedFrom] = useState<any>(null) // 存储fork来源信息
  const [isEditingReadme, setIsEditingReadme] = useState(false)
  const [readmeContent, setReadmeContent] = useState("")
  const [contract, setContract] = useState<any>(null) // 搭子契约
  const [partner, setPartner] = useState<any>(null) // 搭子信息
  const [showCompanionModal, setShowCompanionModal] = useState(false)
  const [potentialPartners, setPotentialPartners] = useState<any[]>([])
  const [dailyWhisper, setDailyWhisper] = useState("")

  const params = useParams()
  const router = useRouter()
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const loadData = useCallback(async () => {
    if (!params.id) return
    
    // 每次尝试加载时，都将 dataReady 设置为 false
    setDataReady(false);
    setLoading(true); // 确保每次加载时都显示加载状态

    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // 1. 获取主路径，关联查询fork来源
      const { data: main } = await supabase
        .from('roadmaps')
        .select(`
          *,
          forked_from:roadmaps!roadmaps_forked_from_id_fkey(id, title, user_id)
        `)
        .eq('id', params.id)
        .single()
      
      if (!main) {
        console.error(`Roadmap with ID ${params.id} not found.`);
        setLoading(false);
        return;
      }
      setRoadmap(main);
      setReadmeContent(main.readme || "");
      
      // 如果有fork来源，获取原始创建者信息
      if (main.forked_from_id) {
        const { data: original } = await supabase
          .from('roadmaps')
          .select('id, title')
          .eq('id', main.forked_from_id)
          .single()
        setForkedFrom(original);
      }

      // 2. 获取关联节点
      const { data: sub } = await supabase
        .from('roadmap_nodes')
        .select('*')
        .eq('roadmap_id', params.id)
        .order('order_index', { ascending: true })
      
      if (sub && sub.length > 0) {
        setNodes(sub)
        setLoading(false)

        // 3. 获取搭子契约信息
        if (user) {
          const { data: contractData } = await supabase
            .from('contracts')
            .select(`
              *,
              user_a_profile:profiles!contracts_user_a_fkey(username),
              user_b_profile:profiles!contracts_user_b_fkey(username)
            `)
            .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
            .eq('path_id', params.id)
            .eq('status', 'active')
            .single();
          
          if (contractData) {
            setContract(contractData);
            const partnerId = contractData.user_a === user.id ? contractData.user_b : contractData.user_a;
            const partnerProfile = contractData.user_a === user.id 
              ? contractData.user_b_profile 
              : contractData.user_a_profile;
            setPartner({ id: partnerId, ...partnerProfile });
          }
        }

        // 4. 获取笔记（考虑延迟释放机制）
        const nodeIds = sub.map(n => n.id)
        let notesQuery = supabase
          .from('notes')
          .select('*')
          .in('node_id', nodeIds)
          .order('created_at', { ascending: true });
        
        // 如果有搭子契约，需要处理延迟释放
        if (contract && user) {
          // 获取所有笔记，但根据visibility和unlock_date过滤显示
          const { data: notesData } = await notesQuery;
          
          const now = new Date();
          const grouped = notesData?.reduce((acc: any, note: any) => {
            // 自己的笔记总是可见
            if (note.user_id === user.id) {
              acc[note.node_id] = [...(acc[note.node_id] || []), note];
              return acc;
            }
            
            // 搭子的笔记：检查是否已解锁
            if (note.visibility === 'delayed' && note.unlock_date) {
              const unlockDate = new Date(note.unlock_date);
              if (now >= unlockDate) {
                acc[note.node_id] = [...(acc[note.node_id] || []), note];
              } else {
                // 未解锁的笔记显示占位符
                acc[note.node_id] = [
                  ...(acc[note.node_id] || []),
                  { ...note, content: "🔒 此笔记将在解锁日期后可见", is_locked: true }
                ];
              }
            } else if (note.visibility === 'public') {
              acc[note.node_id] = [...(acc[note.node_id] || []), note];
            }
            return acc;
          }, {});
          setExistingNotes(grouped || {});
        } else {
          // 没有搭子契约，只显示自己的笔记和公开笔记
          const { data: notesData } = await notesQuery;
          const grouped = notesData?.reduce((acc: any, note: any) => {
            if (note.user_id === user?.id || note.visibility === 'public') {
              acc[note.node_id] = [...(acc[note.node_id] || []), note];
            }
            return acc;
          }, {});
          setExistingNotes(grouped || {});
        }
        setLoading(false); // 所有数据加载完成后设置为 false
        setDataReady(true); // 标记数据已最终准备好
      } else if (retryCount < 3) {
        console.warn(`Nodes not found for roadmap ${params.id}, retrying... Attempt ${retryCount + 1}/3`);
        setTimeout(() => setRetryCount(prev => prev + 1), 1500);
      } else {
        console.error(`Failed to load nodes for roadmap ${params.id} after 3 retries.`);
        setLoading(false); // 真的没数据了
        alert("无法加载路线图节点，请刷新页面或稍后重试。"); // 弹窗提醒用户
        setDataReady(false); // 数据未准备好
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
      setDataReady(false); // 数据未准备好
    }
  }, [params.id, retryCount, supabase]);

  useEffect(() => {
    loadData()
  }, [loadData])

  const saveNote = async (nodeId: string, content: string) => {
    if (!user) return
    
    // 如果有搭子契约，笔记设置为延迟释放（7天后解锁）
    let visibility = 'public';
    let unlockDate = null;
    
    if (contract) {
      visibility = 'delayed';
      const unlock = new Date();
      unlock.setDate(unlock.getDate() + 7);
      unlockDate = unlock.toISOString();
    }
    
    const { data, error } = await supabase.from('notes').insert({
      node_id: nodeId,
      user_id: user.id,
      content: content,
      visibility: visibility,
      unlock_date: unlockDate
    }).select().single()

    if (!error && data) {
      setExistingNotes(prev => ({ ...prev, [nodeId]: [...(prev[nodeId] || []), data] }))
    }
  }

  const findCompanion = async () => {
    if (!user || !roadmap) return
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch('/api/find-companion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ roadmapId: roadmap.id })
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error)

      setPotentialPartners(result.partners || [])
      setShowCompanionModal(true)
    } catch (e: any) {
      alert("查找搭子失败：" + e.message)
    }
  }

  const createContract = async (partnerUserId: string) => {
    if (!user || !roadmap) return
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch('/api/create-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          roadmapId: roadmap.id,
          partnerUserId: partnerUserId
        })
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error)

      setShowCompanionModal(false)
      // 重新加载数据以获取契约信息
      loadData()
    } catch (e: any) {
      alert("创建契约失败：" + e.message)
    }
  }

  const sendDailyWhisper = async () => {
    if (!contract || !dailyWhisper.trim()) return
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch('/api/daily-whisper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          contractId: contract.id,
          message: dailyWhisper
        })
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error)

      setDailyWhisper("")
      alert("Daily Whisper已发送！")
    } catch (e: any) {
      alert("发送失败：" + e.message)
    }
  }

  const handleFork = async () => {
    if (!user || !roadmap) return
    setForking(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const res = await fetch('/api/fork-roadmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ roadmapId: roadmap.id })
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error)

      // 跳转到fork的roadmap
      if (result.roadmapId) {
        router.push(`/roadmap/${result.roadmapId}`)
      }
    } catch (e: any) {
      alert("Fork失败：" + e.message)
    } finally {
      setForking(false)
    }
  }

  const saveReadme = async () => {
    if (!user || !roadmap) return
    const { error } = await supabase
      .from('roadmaps')
      .update({ readme: readmeContent })
      .eq('id', roadmap.id)
      .eq('user_id', user.id) // 只能编辑自己的roadmap

    if (!error) {
      setIsEditingReadme(false)
      setRoadmap({ ...roadmap, readme: readmeContent })
    } else {
      alert("保存README失败")
    }
  }

  if (loading && !dataReady) return (
    <div className="bg-[#1A1A1A] min-h-screen flex flex-col items-center justify-center text-[#8E9775] font-serif uppercase tracking-[0.5em]">
      <Loader2 className="animate-spin mb-4" />
      <span>Synchronizing Archive...</span>
    </div>
  );

  if (!dataReady && !loading) return (
    <div className="bg-[#1A1A1A] min-h-screen flex flex-col items-center justify-center text-[#666] font-serif p-10 text-center">
      <p className="italic mb-8 font-sans">同步超时：请检查网络或刷新页面</p>
      <button onClick={() => router.push('/')} className="text-[10px] border border-[#333] px-8 py-3 rounded-full hover:border-[#8E9775] transition-all tracking-widest uppercase">返回图书馆</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-[#DCD7C9] font-serif">
      <nav className="fixed top-0 left-0 w-full p-8 flex justify-between items-center z-50 bg-[#1A1A1A]/60 backdrop-blur-md">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-xs opacity-50 hover:opacity-100 transition-opacity">
          <ArrowLeft size={16} /> <span>BACK</span>
        </button>
        <Link href="/dashboard" className="text-[10px] tracking-widest opacity-40 hover:opacity-100 uppercase flex items-center gap-2">
          <Bookmark size={12} /> The Archive
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto pt-48 pb-40 px-6">
        <header className="mb-32">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4 opacity-40">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#8E9775]">{roadmap.category}</span>
              <div className="h-px w-12 bg-[#2C2C2C]" />
            </div>
            {/* Fork按钮 - 只有公开的roadmap且不是自己的才能fork */}
            {roadmap.is_public && roadmap.user_id !== user?.id && (
              <button
                onClick={handleFork}
                disabled={forking}
                className="flex items-center gap-2 px-4 py-2 border border-[#8E9775]/30 text-[#8E9775] text-[10px] uppercase tracking-widest hover:bg-[#8E9775]/10 transition-all disabled:opacity-50"
              >
                <GitFork size={12} />
                {forking ? "Forking..." : "Fork This Path"}
              </button>
            )}
          </div>
          
          {/* 血缘树显示 */}
          {roadmap.forked_from_id && forkedFrom && (
            <div className="mb-6 text-[9px] text-[#8E9775]/50 uppercase tracking-wider font-mono">
              <span className="opacity-40">Forked from </span>
              <Link href={`/roadmap/${forkedFrom.id}`} className="hover:opacity-100 transition-opacity underline">
                {forkedFrom.title}
              </Link>
            </div>
          )}
          <h1 className="text-5xl md:text-7xl font-light italic mb-10 text-white tracking-tighter leading-tight">{roadmap.title}</h1>
          <p className="max-w-2xl text-[#666] italic text-lg leading-relaxed font-sans">“{roadmap.description}”</p>
        </header>

        <div className="relative border-l border-[#2C2C2C] ml-4 md:ml-12 pl-12 md:pl-24 space-y-40">
          {nodes.map((node, index) => (
            <div key={node.id} className="relative group">
              <div className="absolute -left-[53.5px] md:-left-[101.5px] top-2 w-2 h-2 rounded-full bg-[#1A1A1A] border border-[#2C2C2C] group-hover:border-[#8E9775] group-hover:bg-[#8E9775] transition-all duration-700 shadow-[0_0_15px_rgba(142,151,117,0.4)]" />
              <div className="mb-6 flex items-center gap-3">
                <Hash size={10} className="text-[#8E9775] opacity-40" />
                <span className="text-[#8E9775]/40 text-[9px] font-mono tracking-[0.4em]">PHASE 0{index + 1}</span>
              </div>
              <h4 className="text-3xl font-light mb-6 italic text-[#BBB] group-hover:text-white transition-colors tracking-tight">{node.title}</h4>
              <p className="text-[#666] text-sm leading-relaxed mb-10 font-sans max-w-2xl">{node.description}</p>
              
              <div className="space-y-4 mb-10">
                {existingNotes[node.id]?.map((n: any) => (
                  <div key={n.id} className={`bg-[#222]/30 p-6 border-l border-[#8E9775]/50 animate-in fade-in slide-in-from-left-2 duration-700 ${n.is_locked ? 'opacity-50' : ''}`}>
                    <p className="text-sm italic text-[#999] font-sans leading-relaxed">“{n.content}”</p>
                    <div className="text-[8px] mt-4 opacity-20 uppercase tracking-tighter font-mono">
                      Recorded on {new Date(n.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>

              {user?.id && <NoteSection nodeId={node.id} userId={user.id} onSave={saveNote} />}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}