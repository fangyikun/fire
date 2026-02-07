'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
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
  : userRoadmaps.filter(r => (r.category || r.roadmaps?.category) === activeTab);
  
  const router = useRouter()
  // 使用 useMemo 延迟创建客户端，避免构建时执行
  const supabase = useMemo(() => {
    if (typeof window === 'undefined') return null
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    return supabaseUrl && supabaseAnonKey 
      ? createBrowserClient(supabaseUrl, supabaseAnonKey)
      : null
  }, [])

  const fetchUserData = useCallback(async () => {
    if (!supabase) {
      console.error('Supabase client not initialized')
      router.push('/login')
      return
    }
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
      // 使用 maybeSingle() 而不是 single()，因为 profile 可能不存在
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username, learning_time_seconds')
        .eq('id', user.id)
        .maybeSingle(); // 使用 maybeSingle() 允许返回 null
      
      if (profileError) {
        console.warn("获取用户资料失败 (可能未创建):", profileError.message);
        // 如果 profiles 不存在或列不存在，使用 email 作为 fallback
        setUsername(user.email?.split('@')[0] || null);
        setLearningTime(0);
      } else if (profileData) {
        setUsername(profileData.username || user.email?.split('@')[0] || null);
        // 安全地获取 learning_time_seconds，如果列不存在则默认为 0
        setLearningTime(profileData.learning_time_seconds ?? 0);
      } else {
        // profile 不存在，使用默认值
        setUsername(user.email?.split('@')[0] || null);
        setLearningTime(0);
      }

      // 3. 获取用户学习路径
      const roadmapsRes = await fetch('/api/user-roadmaps', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!roadmapsRes.ok) {
        // 尝试解析错误响应
        let errorData;
        try {
          const text = await roadmapsRes.text();
          errorData = text ? JSON.parse(text) : { error: '获取路线图失败' };
        } catch {
          errorData = { error: '获取路线图失败' };
        }
        console.warn('获取路线图失败:', errorData.error || roadmapsRes.statusText);
        setUserRoadmaps([]); // 设置默认值
      } else {
        // 尝试解析成功响应
        let roadmapsData;
        try {
          const text = await roadmapsRes.text();
          roadmapsData = text ? JSON.parse(text) : [];
        } catch (parseError) {
          console.error('解析路线图数据失败:', parseError);
          roadmapsData = [];
        }
        setUserRoadmaps(Array.isArray(roadmapsData) ? roadmapsData : (roadmapsData?.roadmaps || []));
      }

      // 4. 获取用户笔记数量
      const notesCountRes = await fetch('/api/user-notes-count', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!notesCountRes.ok) {
        console.warn('获取笔记数量失败');
        setNotesCount(0); // 设置默认值
      } else {
        const notesCountData = await notesCountRes.json().catch(() => ({ notesCount: 0 }));
        setNotesCount(notesCountData.notesCount || 0);
      }

      // 5. 获取用户活跃度数据
      const heatmapRes = await fetch('/api/user-activity-heatmap', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!heatmapRes.ok) {
        console.warn('获取活跃度数据失败');
        setHeatmapData([]); // 设置默认值
      } else {
        const heatmapData = await heatmapRes.json().catch(() => []);
        setHeatmapData(Array.isArray(heatmapData) ? heatmapData : []);
      }

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
    if (!supabase) return
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

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
          
          <Link href="/" className="group flex items-center gap-4 text-[11px] tracking-[0.4em] uppercase border border-[#2C2C2C] px-8 py-4 rounded-full hover:bg-[#DCD7C9] hover:text-black transition-all duration-1000">
            <Plus size={14} className="group-hover:rotate-90 transition-transform duration-500" />
            Invoke New Idea
          </Link>
        </header>

        {/* 统计信息和热力图 */}
        <section className="mb-20 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 统计数据 */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 text-[#8E9775] mb-6">
              <BookOpen size={16} className="opacity-50" />
              <span className="text-[10px] tracking-[0.4em] uppercase">Statistics</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-[#2C2C2C] p-6 rounded-lg">
                <div className="text-[#666] text-[9px] uppercase tracking-widest mb-2">Roadmaps</div>
                <div className="text-3xl font-light text-white">{userRoadmaps.length}</div>
              </div>
              <div className="border border-[#2C2C2C] p-6 rounded-lg">
                <div className="text-[#666] text-[9px] uppercase tracking-widest mb-2">Notes</div>
                <div className="text-3xl font-light text-white">{notesCount}</div>
              </div>
              <div className="border border-[#2C2C2C] p-6 rounded-lg">
                <div className="text-[#666] text-[9px] uppercase tracking-widest mb-2">Learning Time</div>
                <div className="text-3xl font-light text-white">
                  {Math.floor(learningTime / 3600)}h
                </div>
              </div>
              <div className="border border-[#2C2C2C] p-6 rounded-lg">
                <div className="text-[#666] text-[9px] uppercase tracking-widest mb-2">Active Days</div>
                <div className="text-3xl font-light text-white">{heatmapData.length}</div>
              </div>
            </div>
          </div>

          {/* 热力图 */}
          <div>
            <div className="flex items-center gap-4 text-[#8E9775] mb-6">
              <Clock size={16} className="opacity-50" />
              <span className="text-[10px] tracking-[0.4em] uppercase">Activity Heatmap</span>
            </div>
            <div className="border border-[#2C2C2C] p-6 rounded-lg bg-[#1E1E1E]">
              {heatmapData.length > 0 ? (
                <CalendarHeatmap
                  startDate={subYears(new Date(), 1)}
                  endDate={new Date()}
                  values={heatmapData.map((item: any) => ({
                    date: item.date,
                    count: item.count || 0
                  }))}
                  classForValue={(value: any) => {
                    if (!value) return 'color-empty'
                    if (value.count === 0) return 'color-scale-0'
                    if (value.count <= 2) return 'color-scale-1'
                    if (value.count <= 4) return 'color-scale-2'
                    return 'color-scale-3'
                  }}
                />
              ) : (
                <div className="text-center py-12 text-[#666] text-sm italic">
                  No activity data yet
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 标签过滤 */}
        <div className="mb-12 border-b border-[#2C2C2C] pb-4">
          <div className="flex gap-12 overflow-x-auto no-scrollbar">
            {['all', 'book', 'film', 'music', 'course'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-[10px] tracking-[0.4em] uppercase transition-all whitespace-nowrap ${
                  activeTab === tab ? 'text-[#8E9775] opacity-100' : 'opacity-30 hover:opacity-60'
                }`}
              >
                {tab === 'all' ? 'Everything' : `${tab}s`}
              </button>
            ))}
          </div>
        </div>

        {/* 陈列架部分 */}
        {filteredRoadmaps.length === 0 ? (
          <div className="h-96 border border-[#2C2C2C] border-dashed rounded-lg flex flex-col items-center justify-center space-y-8 group">
            <Compass className="w-12 h-12 text-[#2C2C2C] group-hover:text-[#8E9775] transition-colors duration-1000" />
            <div className="text-center space-y-2">
               <p className="italic text-lg text-[#444]">此处空无一物，静候灵感降临。</p>
               <Link href="/?openInput=true" className="text-[10px] text-[#8E9775] tracking-widest uppercase hover:underline">开始第一次研究</Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-28">
            {filteredRoadmaps.map((item: any, index: number) => (
              <div key={item.id} className="group relative">
                <span className="absolute -top-12 -left-6 text-[10rem] font-black text-[#2C2C2C]/20 pointer-events-none select-none group-hover:text-[#8E9775]/5 transition-colors duration-1000">
                  {index + 1}
                </span>

                <div className="relative z-10">
                  <div className="aspect-[3/4] bg-[#1E1E1E] border border-[#2C2C2C] group-hover:border-[#8E9775]/30 transition-all duration-1000 p-10 flex flex-col justify-between shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#8E9775]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-light leading-tight text-white group-hover:italic transition-all duration-700">
                          {item.title || item.roadmaps?.title}
                        </h2>
                        {(item.category || item.roadmaps?.category) && (
                          <span className="text-[8px] text-[#666] border border-[#2C2C2C] bg-[#1E1E1E] px-2 py-1 rounded uppercase tracking-widest">
                            {item.category || item.roadmaps?.category}
                          </span>
                        )}
                      </div>
                      <p className="text-[#666] text-xs leading-relaxed italic line-clamp-4 font-sans opacity-0 group-hover:opacity-100 transition-all duration-700 delay-100">
                        {item.description || item.roadmaps?.description}
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