'use client'

import { useEffect, useState, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowUpRight, Compass, LogOut, Loader2, Plus, User, BookOpen, Clock } from 'lucide-react'
import CalendarHeatmap from 'react-calendar-heatmap'
import 'react-calendar-heatmap/dist/styles.css'
import { format, subYears, eachDayOfInterval } from 'date-fns'

export default function MissionControl() {
  const [userRoadmaps, setUserRoadmaps] = useState<any[]>([]) // 存储用户学习路径
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null) // 存储用户昵称
  const [notesCount, setNotesCount] = useState<number>(0) // 存储笔记数量
  const [heatmapData, setHeatmapData] = useState<any[]>([]) // 存储热力图数据
  const [learningTime, setLearningTime] = useState<number>(0) // 存储学习时间
  const [loading, setLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('all');

  const filteredRoadmaps = activeTab === 'all' 
  ? userRoadmaps 
  : userRoadmaps.filter(r => r.category === activeTab);
  
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchUserData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. 获取当前用户信息
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push('/login');
        return;
      }
      setUserEmail(user.email ?? null);

      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) {
        router.push('/login');
        return;
      }

      // 2. 获取用户资料 (昵称, 学习时间)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username, learning_time_seconds')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.warn("获取用户资料失败 (可能未创建):", profileError.message);
        // 如果 profiles 不存在，使用 email 作为 fallback
        setUsername(user.email?.split('@')[0] || null);
        setLearningTime(0);
      } else if (profileData) {
        setUsername(profileData.username || user.email?.split('@')[0] || null);
        setLearningTime(profileData.learning_time_seconds || 0);
      }

      // 3. 获取用户学习路径
      const roadmapsRes = await fetch('/api/user-roadmaps', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const roadmapsData = await roadmapsRes.json();
      if (!roadmapsRes.ok) throw new Error(roadmapsData.error);
      setUserRoadmaps(roadmapsData);

      // 4. 获取用户笔记数量
      const notesCountRes = await fetch('/api/user-notes-count', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const notesCountData = await notesCountRes.json();
      if (!notesCountRes.ok) throw new Error(notesCountData.error);
      setNotesCount(notesCountData.notesCount);

      // 5. 获取用户活跃度数据
      const heatmapRes = await fetch('/api/user-activity-heatmap', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const heatmapData = await heatmapRes.json();
      if (!heatmapRes.ok) throw new Error(heatmapData.error);
      setHeatmapData(heatmapData);

    } catch (e: any) {
      console.error("仪表盘数据加载失败:", e.message);
      router.push('/login'); // 任何数据加载失败都重定向到登录页
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const handleSignOut = async () => {
    setIsLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading || isLoggingOut) return (
    <div className="bg-[#1A1A1A] min-h-screen flex flex-col items-center justify-center text-[#8E9775] font-serif tracking-[0.5em] italic gap-4">
      <Loader2 className="animate-spin opacity-20" size={24} />
      <span className="animate-pulse text-[10px]">
        {isLoggingOut ? 'CLOSING ARCHIVE...' : 'SYNCHRONIZING...'}
      </span>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-[#DCD7C9] font-serif p-8 md:p-20 selection:bg-[#8E9775] selection:text-black">
      <div className="max-w-7xl mx-auto">
        
        {/* 顶部工具栏：加入登出按钮 */}
        <nav className="flex justify-end mb-12">
           <button 
             onClick={handleSignOut}
             className="flex items-center gap-2 text-[9px] tracking-[0.3em] uppercase opacity-30 hover:opacity-100 transition-opacity duration-700"
           >
             <LogOut size={12} /> Sign Out
           </button>
        </nav>

        {/* 标题区：动态显示用户前缀 */}
        <header className="flex flex-col md:flex-row justify-between items-baseline mb-32 gap-8">
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-light italic tracking-tighter text-white">
              {userEmail ? `${userEmail.split('@')[0]}'s Studio.` : 'The Studio.'}
            </h1>
            <p className="text-[#8E9775] text-[10px] tracking-[0.5em] uppercase opacity-60">
              Personal Research Repository / ADL-2026
            </p>
          </div>

          <div className="flex gap-12 mb-20 border-b border-[#2C2C2C] pb-4 overflow-x-auto no-scrollbar">
  {['all', 'book', 'film', 'music', 'course'].map((tab) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      className={`text-[10px] tracking-[0.4em] uppercase transition-all ${
        activeTab === tab ? 'text-[#8E9775] opacity-100' : 'opacity-30 hover:opacity-60'
      }`}
    >
      {tab === 'all' ? 'Everything' : `${tab}s`}
    </button>
  ))}
</div>
          
          <Link href="/" className="group flex items-center gap-4 text-[11px] tracking-[0.4em] uppercase border border-[#2C2C2C] px-8 py-4 rounded-full hover:bg-[#DCD7C9] hover:text-black transition-all duration-1000">
            <Plus size={14} className="group-hover:rotate-90 transition-transform duration-500" />
            Invoke New Idea
          </Link>
        </header>

        {/* 陈列架部分 */}
        {challenges.length === 0 ? (
          <div className="h-96 border border-[#2C2C2C] border-dashed rounded-lg flex flex-col items-center justify-center space-y-8 group">
            <Compass className="w-12 h-12 text-[#2C2C2C] group-hover:text-[#8E9775] transition-colors duration-1000" />
            <div className="text-center space-y-2">
               <p className="italic text-lg text-[#444]">此处空无一物，静候灵感降临。</p>
               <Link href="/" className="text-[10px] text-[#8E9775] tracking-widest uppercase hover:underline">开始第一次研究</Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-28">
            {challenges.map((item, index) => (
              <div key={item.id} className="group relative">
                <span className="absolute -top-12 -left-6 text-[10rem] font-black text-[#2C2C2C]/20 pointer-events-none select-none group-hover:text-[#8E9775]/5 transition-colors duration-1000">
                  {index + 1}
                </span>

                <div className="relative z-10">
                  <div className="aspect-[3/4] bg-[#1E1E1E] border border-[#2C2C2C] group-hover:border-[#8E9775]/30 transition-all duration-1000 p-10 flex flex-col justify-between shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#8E9775]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="space-y-6">
                      <h2 className="text-3xl font-light leading-tight text-white group-hover:italic transition-all duration-700">
                        {item.roadmaps?.title}
                      </h2>
                      <p className="text-[#666] text-xs leading-relaxed italic line-clamp-4 font-sans opacity-0 group-hover:opacity-100 transition-all duration-700 delay-100">
                        {item.roadmaps?.description}
                      </p>
                    </div>

                    <div className="pt-8 border-t border-[#2C2C2C] flex justify-between items-end">
                      <div className="space-y-3">
                        <span className="block text-[8px] uppercase tracking-[0.5em] text-[#8E9775] opacity-50">Current Phase</span>
                        <div className="flex gap-1.5">
                           {[...Array(5)].map((_, i) => (
                             <div key={i} className={`h-[1px] w-5 transition-all duration-1000 ${i < (item.current_step || 1) ? 'bg-[#8E9775] w-8' : 'bg-[#333]'}`} />
                           ))}
                        </div>
                      </div>
                      
                      <Link 
                        href={`/challenge/${item.id}`}
                        className="w-14 h-14 rounded-full border border-[#DCD7C9]/10 flex items-center justify-center hover:bg-[#DCD7C9] hover:text-black transition-all duration-700 transform hover:scale-110 active:scale-90 shadow-xl"
                      >
                        <ArrowUpRight size={20} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="mt-60 mb-20 text-center">
        <div className="h-[1px] w-24 bg-[#2C2C2C] mx-auto mb-12" />
        <p className="opacity-10 text-[9px] tracking-[1em] uppercase">
          Curated by {userEmail?.split('@')[0]} — 2026
        </p>
      </footer>
    </div>
  )
}