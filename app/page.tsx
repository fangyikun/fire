'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sparkles, Loader2, Plus, X, Book, Film, Music, GraduationCap, User, GitFork, Users, MessageCircle, FileText, Award, MapPin } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [roadmaps, setRoadmaps] = useState<any[]>([])
  const [generating, setGenerating] = useState(false)
  const [isInputOpen, setIsInputOpen] = useState(false)
  const [topic, setTopic] = useState("")
  const [category, setCategory] = useState<'book' | 'film' | 'music' | 'course'>('book')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [scrollY, setScrollY] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [perspective, setPerspective] = useState({ rotateX: 0, rotateY: 0 })
  const [showCompanionView, setShowCompanionView] = useState(false)
  const [animationPhase, setAnimationPhase] = useState(0)
  const [geometryRotation, setGeometryRotation] = useState(0)
  const headerRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 单独处理 URL 参数，确保在页面加载后检查
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const openInput = params.get('openInput')
      if (openInput === 'true') {
        // 延迟打开，确保页面完全渲染
        const timer = setTimeout(() => {
          setIsInputOpen(true)
          // 清除 URL 参数，避免刷新时重复打开
          window.history.replaceState({}, '', '/')
        }, 300)
        return () => clearTimeout(timer)
      }
    }
  }, [])

  // 使用 useMemo 延迟创建客户端，避免构建时执行
  const supabase = useMemo(() => {
    if (typeof window === 'undefined') return null
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    return supabaseUrl && supabaseAnonKey 
      ? createBrowserClient(supabaseUrl, supabaseAnonKey)
      : null
  }, [])


  const fetchRoadmaps = async () => {
    if (!supabase) return
    try {
      // 只获取公开的roadmaps，不关联查询 profiles（避免 400 错误）
      const { data, error } = await supabase
        .from('roadmaps')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.warn('获取公开路线图失败:', error.message)
        setRoadmaps([])
      } else {
        setRoadmaps(data || [])
      }
    } catch (err: any) {
      console.error('获取路线图时出错:', err)
      setRoadmaps([])
    }
  }

  useEffect(() => { 
    fetchRoadmaps()
    // 检查当前登录用户
    async function checkUser() {
      if (!supabase) return
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUser(user)
        // 获取用户profile（包含nickname和username）
        // 使用 maybeSingle() 因为 profile 可能不存在
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, nickname')
          .eq('id', user.id)
          .maybeSingle()
        setUserProfile(profile)
      }
    }
    checkUser()
    
    // 页面加载动画
    setIsVisible(true)
    
    // 纪念碑谷风格的几何动画
    const startMonumentValleyAnimation = () => {
      let rotation = 0
      const animate = () => {
        rotation += 0.005
        if (rotation > Math.PI * 2) rotation = 0
        
        // 平滑的几何旋转
        setGeometryRotation(rotation)
        
        // 周期性触发视角转换
        const rotateY = Math.sin(rotation * 2) * 20 // 最大20度
        const rotateX = Math.cos(rotation * 1.5) * 10 // 最大10度
        
        setPerspective({ rotateX, rotateY })
        
        // 当旋转到特定角度时显示对方视角
        if (Math.abs(rotateY) > 12) {
          setShowCompanionView(true)
          setAnimationPhase(rotation)
        } else {
          setShowCompanionView(false)
        }
        
        requestAnimationFrame(animate)
      }
      animate()
    }
    
    // 延迟启动动画
    const animationTimer = setTimeout(() => {
      startMonumentValleyAnimation()
    }, 1500)
    
    // 鼠标跟随效果和视角转换
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
      
      // 计算视角转换（纪念碑谷效果）
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2
      const rotateY = (e.clientX - centerX) / centerX * 15 // 最大15度
      const rotateX = -(e.clientY - centerY) / centerY * 10 // 最大10度
      setPerspective({ rotateX, rotateY })
      
      // 当鼠标移动到边缘时，显示对方视角
      if (Math.abs(rotateY) > 8) {
        setShowCompanionView(true)
      } else {
        setShowCompanionView(false)
      }
    }
    
    // 滚动视差效果
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('scroll', handleScroll)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(animationTimer)
    }
  }, [])

  const createAIRoadmap = async () => {
    if (!topic || !supabase) return
    setGenerating(true)
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/generate-roadmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}` // 添加 Authorization 头
        },
        body: JSON.stringify({ topic, category })
      })
      
      const result = await res.json()
      if (!res.ok) {
        // 提供更友好的错误消息
        const errorMsg = result.error || '生成路线图失败，请稍后重试'
        throw new Error(errorMsg)
      }

      // Navigate to the new roadmap
      if (result.roadmapId) {
        router.push(`/roadmap/${result.roadmapId}`);
      }
        
    } catch (e: any) {
      alert("灵感碰撞失败：" + e.message);
      setGenerating(false);
    }
  }

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-[#1A1A1A] text-[#DCD7C9] font-literary transition-colors duration-1000 relative overflow-hidden selection:bg-[#8E9775] selection:text-black"
      style={{
        perspective: '1000px',
        perspectiveOrigin: '50% 50%',
      }}
    >
      {/* 鼠标跟随光晕效果 */}
      <div 
        className="fixed pointer-events-none z-0 w-96 h-96 rounded-full opacity-10 blur-3xl transition-all duration-700 ease-out"
        style={{
          background: 'radial-gradient(circle, rgba(142,151,117,0.3) 0%, transparent 70%)',
          left: `${mousePosition.x - 192}px`,
          top: `${mousePosition.y - 192}px`,
          transform: 'translate(-50%, -50%)',
        }}
      />
      
      {/* 背景装饰粒子 */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-10"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              background: '#8E9775',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${15 + Math.random() * 10}s infinite ease-in-out`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>
      
      <nav className="fixed top-0 w-full p-8 z-50 bg-[#1A1A1A]/90 backdrop-blur-lg border-b border-[#2C2C2C]">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-[#DCD7C9] font-light text-xl md:text-2xl tracking-wider hover:text-[#8E9775] transition-colors font-elegant italic" style={{ fontWeight: 300, letterSpacing: '0.1em' }}>Around the Fire / <span className="font-chinese-handwriting not-italic">烤火</span></Link>
          <div className="flex items-center gap-3">
            {currentUser ? (
              <>
                <Link 
                  href={`/user/${currentUser.id}`}
                  className="flex items-center gap-2 border border-[#2C2C2C] px-4 py-2 md:px-5 md:py-2.5 rounded-full hover:bg-[#DCD7C9] hover:text-black transition-all text-xs md:text-sm text-[#DCD7C9] font-literary"
                  style={{ fontWeight: 300, letterSpacing: '0.05em' }}
                >
                  <User size={13} className="md:w-4 md:h-4 opacity-70" />
                  <span>
                    {userProfile?.nickname || userProfile?.username || currentUser.email?.split('@')[0] || 'User'}
                  </span>
                </Link>
                <Link href="/dashboard" className="border border-[#2C2C2C] px-5 py-2 md:px-7 md:py-2.5 rounded-full hover:bg-[#DCD7C9] hover:text-black transition-all text-xs md:text-sm tracking-widest uppercase text-[#DCD7C9] font-literary" style={{ fontWeight: 300 }}>Dashboard</Link>
              </>
            ) : (
              <Link href="/login" className="border border-[#2C2C2C] px-5 py-2 md:px-7 md:py-2.5 rounded-full hover:bg-[#DCD7C9] hover:text-black transition-all text-xs md:text-sm tracking-widest uppercase text-[#DCD7C9] font-literary" style={{ fontWeight: 300 }}>Login</Link>
            )}
          </div>
        </div>
      </nav>

      {/* 纪念碑谷风格的几何视错觉动画 */}
      <div 
        className="fixed inset-0 pointer-events-none z-5"
        style={{
          transform: `perspective(2000px) rotateX(${perspective.rotateX}deg) rotateY(${perspective.rotateY}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* 纪念碑谷风格的几何建筑 */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64" style={{ transformStyle: 'preserve-3d' }}>
          {/* 主几何体 */}
          <div 
            className="absolute inset-0"
            style={{
              transform: `perspective(1000px) rotateY(${geometryRotation * 57.3}deg) rotateX(${geometryRotation * 28.6}deg)`,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* 正面 */}
            <div 
              className="absolute w-full h-full bg-gradient-to-br from-[#FD8A6B]/20 to-[#FD8A6B]/5 border-2 border-[#FD8A6B]/30"
              style={{
                transform: 'translateZ(64px)',
                clipPath: 'polygon(0% 0%, 100% 0%, 80% 100%, 20% 100%)',
              }}
            />
            {/* 顶面 */}
            <div 
              className="absolute w-full h-full bg-gradient-to-br from-[#FD8A6B]/30 to-[#FD8A6B]/10 border-2 border-[#FD8A6B]/40"
              style={{
                transform: 'rotateX(90deg) translateZ(64px)',
                clipPath: 'polygon(0% 0%, 100% 0%, 80% 100%, 20% 100%)',
              }}
            />
            {/* 右侧面 */}
            <div 
              className="absolute w-full h-full bg-gradient-to-br from-[#FD8A6B]/15 to-[#FD8A6B]/5 border-2 border-[#FD8A6B]/25"
              style={{
                transform: 'rotateY(90deg) translateZ(64px)',
                clipPath: 'polygon(0% 0%, 100% 0%, 80% 100%, 20% 100%)',
              }}
            />
          </div>
        </div>

        {/* 第二个几何体 - 视错觉路径 */}
        <div className="absolute bottom-1/3 left-1/4 w-48 h-48" style={{ transformStyle: 'preserve-3d' }}>
          <div 
            className="absolute inset-0"
            style={{
              transform: `perspective(1000px) rotateY(${-geometryRotation * 57.3}deg) rotateX(${-geometryRotation * 28.6}deg)`,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* 不可能的楼梯结构 */}
            <div 
              className="absolute w-full h-full bg-gradient-to-br from-[#FD8A6B]/15 to-transparent border border-[#FD8A6B]/20"
              style={{
                transform: `translateZ(${Math.sin(geometryRotation) * 40}px)`,
                clipPath: showCompanionView ? 'polygon(0% 0%, 100% 0%, 100% 50%, 0% 100%)' : 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
                transition: 'clip-path 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
            <div 
              className="absolute w-full h-full bg-gradient-to-br from-transparent to-[#FD8A6B]/15 border border-[#FD8A6B]/20"
              style={{
                transform: `translateZ(${Math.cos(geometryRotation) * 40}px) rotateY(90deg)`,
                clipPath: showCompanionView ? 'polygon(0% 50%, 100% 0%, 100% 100%, 0% 100%)' : 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
                transition: 'clip-path 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </div>
        </div>

        {/* 第三个几何体 - 浮动方块 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32" style={{ transformStyle: 'preserve-3d' }}>
          <div 
            className="absolute inset-0"
            style={{
              transform: `perspective(1000px) rotateY(${geometryRotation * 114.6}deg) rotateX(${geometryRotation * 57.3}deg)`,
              transformStyle: 'preserve-3d',
            }}
          >
            {[...Array(6)].map((_, i) => {
              const transforms = [
                'translateZ(16px)',
                'translateZ(-16px) rotateY(180deg)',
                'translateY(-16px) rotateX(90deg)',
                'translateY(16px) rotateX(-90deg)',
                'translateX(-16px) rotateY(-90deg)',
                'translateX(16px) rotateY(90deg)',
              ]
              return (
                <div
                  key={i}
                  className="absolute w-full h-full bg-gradient-to-br from-[#FD8A6B]/20 to-[#FD8A6B]/5 border border-[#FD8A6B]/30"
                  style={{
                    transform: transforms[i],
                    opacity: showCompanionView ? 0.8 : 0.4,
                    transition: 'opacity 0.6s ease-out',
                  }}
                />
              )
            })}
          </div>
        </div>

        {/* 视错觉路径线 - 只在对方视角时显示 */}
        {showCompanionView && (
          <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.4 }} viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FD8A6B" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#FD8A6B" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#FD8A6B" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={`M 25 25 
                  L ${50 + Math.sin(geometryRotation) * 5} ${50 + Math.cos(geometryRotation) * 3}
                  L 75 75`}
              fill="none"
              stroke="url(#pathGradient)"
              strokeWidth="0.3"
              strokeDasharray="1,0.5"
              style={{
                animation: 'drawPath 2s ease-out',
              }}
            />
          </svg>
        )}
      </div>

      <main className="pt-40 md:pt-52 px-8 md:px-12 max-w-6xl mx-auto relative z-10">
        <header 
          ref={headerRef}
          className="mb-24 md:mb-32 text-center"
          style={{
            transform: `translateY(${scrollY * 0.2}px)`,
            opacity: Math.max(0, 1 - scrollY / 400),
            transition: 'opacity 0.5s ease-out',
          }}
        >
          {/* 装饰性页码 */}
          <div className="absolute top-0 left-0 text-[#2C2C2C] text-[10px] font-mono tracking-widest opacity-40 font-literary">
            — 01 —
          </div>
          
          <h1 
            className={`text-7xl md:text-8xl lg:text-9xl font-light italic mb-8 md:mb-12 leading-[1.1] font-elegant transition-all duration-1500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
            style={{ 
              letterSpacing: '0.08em',
              color: '#FD8A6B',
              fontWeight: 300,
              transform: showCompanionView ? `perspective(1000px) rotateY(${perspective.rotateY * 0.2}deg) scale(1.02)` : 'none',
              textShadow: '0 2px 20px rgba(253, 138, 107, 0.15)',
            }}
          >
            Around the Fire
          </h1>
          
          {/* 装饰分隔线 */}
          <div className="divider-literary text-[#FD8A6B]" style={{ opacity: 0.4 }} />
          
          <h2 
            className={`text-5xl md:text-6xl lg:text-7xl font-light mb-6 md:mb-8 leading-[1.2] font-chinese-handwriting transition-all duration-1500 delay-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
            style={{ 
              letterSpacing: '0.12em',
              color: '#FD8A6B',
              fontWeight: 400,
              transform: showCompanionView ? `perspective(1000px) rotateY(${perspective.rotateY * 0.15}deg) scale(1.02)` : 'none',
            }}
          >
            烤火
          </h2>
          
          <p 
            className={`text-[#666] text-sm md:text-base tracking-[0.4em] md:tracking-[0.5em] uppercase mt-10 font-literary opacity-60 transition-all duration-1500 delay-500 italic ${
              isVisible ? 'opacity-60 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
            style={{ fontWeight: 300 }}
          >
            解构媒介边界，重塑知识景观
          </p>
        </header>

        {/* 使用指南 */}
        <div className="mb-32 md:mb-40 border-t border-[#2C2C2C] pt-20 md:pt-24">
          <div className="mb-16 text-center">
            {/* 装饰性页码 */}
            <div className="text-[#2C2C2C] text-[10px] font-mono tracking-widest opacity-40 font-literary mb-6">
              — 02 —
            </div>
            <h2 className="text-3xl md:text-4xl font-light mb-6 text-[#8E9775] font-elegant italic" style={{ letterSpacing: '0.06em', fontWeight: 300 }}>
              如何使用 <span className="font-chinese-handwriting not-italic">Around the Fire</span> / <span className="font-chinese-handwriting">烤火</span>
            </h2>
            <div className="divider-literary text-[#FD8A6B]" style={{ opacity: 0.3 }} />
            <p className="text-[#666] text-sm md:text-base font-literary italic opacity-60 mt-8 max-w-2xl mx-auto leading-relaxed" style={{ fontWeight: 300 }}>
              学习不是为了终点，而是为了在独一无二的路径上寻找同路人
            </p>
          </div>

          <div className="mt-20 md:mt-24 space-y-24 md:space-y-32">
              {/* 第一步：创建路径 */}
              <div 
                className="group"
                style={{
                  transform: `perspective(800px) rotateY(${perspective.rotateY * 0.15}deg) rotateX(${perspective.rotateX * 0.1}deg)`,
                  transformStyle: 'preserve-3d',
                }}
              >
                <div className="max-w-3xl mx-auto space-y-8">
                  <div className="flex items-baseline gap-4 mb-10">
                    <div className="w-12 h-12 rounded-full bg-[#1E1E1E] border border-[#2C2C2C] flex items-center justify-center text-[#8E9775] text-sm font-mono shadow-sm opacity-50" style={{ fontFamily: 'var(--font-eb-garamond)', fontWeight: 300 }}>01</div>
                    <h3 className="text-3xl md:text-4xl font-light text-[#8E9775] font-elegant italic" style={{ letterSpacing: '0.05em', fontWeight: 300 }}>
                      <span className="font-chinese-handwriting not-italic">创建你的学习路径</span>
                    </h3>
                  </div>
                  <div className="pl-16">
                    <p className="text-[#DCD7C9] text-lg md:text-xl font-literary leading-relaxed" style={{ fontWeight: 300 }}>
                      点击右下角的 <span className="text-[#DCD7C9] font-bold">+</span> 按钮，选择媒介类型（书籍/电影/音乐/课程），输入你想探索的主题。
                      <br /><br />
                      AI 将为你生成一个 <span className="text-[#DCD7C9] font-bold">90天</span> 的学习路径，包含 <span className="text-[#DCD7C9] font-bold">3个Phase</span>（月度目标）和 <span className="text-[#DCD7C9] font-bold">12个Milestone</span>（周度目标）。
                    </p>
                    <div className="mt-10 p-8 bg-[#1E1E1E] border-l-4 border-[#8E9775]/40 rounded-r-lg">
                      <p className="text-[#666] text-base font-literary italic opacity-85 leading-relaxed" style={{ fontWeight: 300 }}>
                        💡 提示：你可以拥有 <span className="text-[#DCD7C9] font-bold">2次休耕权</span>，当学习节奏放缓时，AI 会自动为你生成支线灵感任务。
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 第二步：Fork路径 */}
              <div className="group">
                <div className="max-w-3xl mx-auto space-y-8">
                  <div className="flex items-baseline gap-4 mb-10">
                    <div className="w-12 h-12 rounded-full bg-[#1E1E1E] border border-[#2C2C2C] flex items-center justify-center text-[#8E9775] text-sm font-mono opacity-50" style={{ fontFamily: 'var(--font-eb-garamond)', fontWeight: 300 }}>02</div>
                    <h3 className="text-3xl md:text-4xl font-light text-[#8E9775] font-elegant italic" style={{ letterSpacing: '0.05em', fontWeight: 300 }}>
                      Fork <span className="font-chinese-handwriting not-italic">他人的路径</span>
                    </h3>
                  </div>
                  <div className="pl-16">
                    <p className="text-[#DCD7C9] text-lg md:text-xl font-literary leading-relaxed" style={{ fontWeight: 300 }}>
                      浏览公开的学习路径，如果发现感兴趣的主题，点击 <span className="text-[#DCD7C9] font-bold">Fork This Path</span> 按钮。
                      <br /><br />
                      你可以基于他人的路径进行个性化调整，系统会记录路径的"血缘树"，显示其来源。
                    </p>
                    <div className="mt-10 p-8 bg-[#1E1E1E] border-l-4 border-[#8E9775]/40 rounded-r-lg">
                      <p className="text-[#666] text-base font-literary italic opacity-85 leading-relaxed" style={{ fontWeight: 300 }}>
                        🌳 每个路径都会清晰显示其"血缘树"：Forked from @UserA / Optimized by @UserB
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 第三步：寻找搭子 */}
              <div 
                className="group"
                style={{
                  transform: `perspective(800px) rotateY(${-perspective.rotateY * 0.1}deg) rotateX(${perspective.rotateX * 0.08}deg)`,
                  transformStyle: 'preserve-3d',
                }}
              >
                <div className="max-w-3xl mx-auto space-y-8">
                  <div className="flex items-baseline gap-4 mb-10">
                    <div className="w-12 h-12 rounded-full bg-[#1E1E1E] border border-[#2C2C2C] flex items-center justify-center text-[#8E9775] text-sm font-mono opacity-50" style={{ fontFamily: 'var(--font-eb-garamond)', fontWeight: 300 }}>03</div>
                    <h3 className="text-3xl md:text-4xl font-light text-[#8E9775] font-elegant italic" style={{ letterSpacing: '0.05em', fontWeight: 300 }}>
                      <span className="font-chinese-handwriting not-italic">寻找唯一的同路人</span>
                    </h3>
                  </div>
                  <div className="pl-16">
                    <p className="text-[#DCD7C9] text-lg md:text-xl font-literary leading-relaxed" style={{ fontWeight: 300 }}>
                      在学习路径页面，点击 <span className="text-[#DCD7C9] font-bold">寻找搭子</span> 按钮。
                      <br /><br />
                      AI 会根据路径相似度和学习性格进行匹配，找到最适合的共学伙伴。
                      匹配成功后，双方确认即可开启 <span className="text-[#DCD7C9] font-bold">90天共学契约</span>。
                    </p>
                    <div className="mt-10 p-8 bg-[#1E1E1E] border-l-4 border-[#8E9775]/40 rounded-r-lg">
                      <p className="text-[#666] text-base font-literary italic opacity-85 leading-relaxed" style={{ fontWeight: 300 }}>
                        ⚖️ 重要：全系统内，同一时间只能拥有一位活跃搭子。这种"排他性"设计旨在对抗快餐式社交，鼓励深度交换思想。
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 第四步：破茧交互 */}
              <div className="group">
                <div className="max-w-3xl mx-auto space-y-8">
                  <div className="flex items-baseline gap-4 mb-10">
                    <div className="w-12 h-12 rounded-full bg-[#1E1E1E] border border-[#2C2C2C] flex items-center justify-center text-[#8E9775] text-sm font-mono opacity-50" style={{ fontFamily: 'var(--font-eb-garamond)', fontWeight: 300 }}>04</div>
                    <h3 className="text-3xl md:text-4xl font-light text-[#8E9775] font-elegant italic" style={{ letterSpacing: '0.05em', fontWeight: 300 }}>
                      <span className="font-chinese-handwriting not-italic">破茧交互机制</span>
                    </h3>
                  </div>
                  <div className="pl-16 space-y-8">
                    {/* 盲盒记录卡片 */}
                    <div className="relative p-8 bg-[#1E1E1E] border-l-4 border-[#8E9775] rounded-r-lg border border-[#2C2C2C]">
                      <div className="absolute top-4 right-4 text-[#8E9775] text-[10px] font-mono opacity-40" style={{ fontFamily: 'var(--font-eb-garamond)' }}>
                        Day 1-6
                      </div>
                      <h4 className="text-[#8E9775] font-elegant italic text-xl mb-4" style={{ fontWeight: 300, letterSpacing: '0.03em' }}>
                        <span className="font-chinese-handwriting not-italic">盲盒记录</span>
                      </h4>
                      <p className="text-[#DCD7C9] text-base font-literary leading-relaxed" style={{ fontWeight: 300 }}>
                        每日提交笔记，但只能看到自己的内容。对搭子仅可见：已打卡状态、Commit 字数、心情坐标（气泡大小代表字数）。
                      </p>
                    </div>

                    {/* 每日低语卡片 */}
                    <div className="relative p-8 bg-[#1E1E1E] border-l-4 border-[#8E9775]/50 rounded-r-lg border border-[#2C2C2C]">
                      <div className="absolute top-4 right-4 text-[#8E9775] text-[10px] font-mono opacity-40" style={{ fontFamily: 'var(--font-eb-garamond)' }}>
                        Daily
                      </div>
                      <h4 className="text-[#8E9775] font-elegant italic text-xl mb-4" style={{ fontWeight: 300, letterSpacing: '0.03em' }}>
                        <span className="font-chinese-handwriting not-italic">每日低语</span>
                        <span className="text-sm ml-2 opacity-60 font-literary not-italic">Daily Whisper</span>
                      </h4>
                      <p className="text-[#DCD7C9] text-base font-literary leading-relaxed" style={{ fontWeight: 300 }}>
                        每日打卡前，必须给搭子发送一句话（鼓励、摘抄或提问）。这是解锁对方今日状态的"钥匙"。
                      </p>
                    </div>

                    {/* 破茧时刻卡片 */}
                    <div className="relative p-8 bg-[#1E1E1E] border-l-4 border-[#2C2C2C] rounded-r-lg border border-[#2C2C2C]">
                      <div className="absolute top-4 right-4 text-[#666] text-[10px] font-mono opacity-40" style={{ fontFamily: 'var(--font-eb-garamond)' }}>
                        Day 7
                      </div>
                      <h4 className="text-[#8E9775] font-elegant italic text-xl mb-4" style={{ fontWeight: 300, letterSpacing: '0.03em' }}>
                        <span className="font-chinese-handwriting not-italic">破茧时刻</span>
                      </h4>
                      <p className="text-[#DCD7C9] text-base font-literary leading-relaxed" style={{ fontWeight: 300 }}>
                        每周日晚 20:00，系统自动同步过去 7 天的完整档案。解锁后，双方可在对方笔记的"留白处"进行侧批评论。
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 第五步：档案对开页 */}
              <div className="group">
                <div className="max-w-3xl mx-auto space-y-8">
                  <div className="flex items-baseline gap-4 mb-10">
                    <div className="w-12 h-12 rounded-full bg-[#1E1E1E] border border-[#2C2C2C] flex items-center justify-center text-[#8E9775] text-sm font-mono opacity-50" style={{ fontFamily: 'var(--font-eb-garamond)', fontWeight: 300 }}>05</div>
                    <h3 className="text-3xl md:text-4xl font-light text-[#8E9775] font-elegant italic" style={{ letterSpacing: '0.05em', fontWeight: 300 }}>
                      <span className="font-chinese-handwriting not-italic">拟物化档案室</span>
                    </h3>
                  </div>
                  <div className="pl-16">
                    <p className="text-[#DCD7C9] text-lg md:text-xl font-literary leading-relaxed" style={{ fontWeight: 300 }}>
                      所有的 Commit 以"对开页"形式呈现：<span className="text-[#DCD7C9] font-bold">左页是我的思考</span>，<span className="text-[#DCD7C9] font-bold">右页是搭子的见解</span>。
                      <br /><br />
                      使用衬线字体模拟铅字印刷，带有唯一编号和精确的时间戳。
                    </p>
                    <div className="mt-10 p-8 bg-[#1E1E1E] border-l-4 border-[#2C2C2C] rounded-r-lg">
                      <p className="text-[#666] text-base font-literary italic opacity-85 leading-relaxed" style={{ fontWeight: 300 }}>
                        🌊 地理共振：当唯一搭子在 5km 范围内时，界面会产生水波纹式的视觉反馈，传达"吾道不孤"的静谧陪伴。
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 第六步：结项仪式 */}
              <div className="group">
                <div className="max-w-3xl mx-auto space-y-8">
                  <div className="flex items-baseline gap-4 mb-10">
                    <div className="w-12 h-12 rounded-full bg-[#1E1E1E] border border-[#2C2C2C] flex items-center justify-center text-[#8E9775] text-sm font-mono opacity-50" style={{ fontFamily: 'var(--font-eb-garamond)', fontWeight: 300 }}>06</div>
                    <h3 className="text-3xl md:text-4xl font-light text-[#8E9775] font-elegant italic" style={{ letterSpacing: '0.05em', fontWeight: 300 }}>
                      <span className="font-chinese-handwriting not-italic">结项仪式</span>
                    </h3>
                  </div>
                  <div className="pl-16">
                    <p className="text-[#DCD7C9] text-lg md:text-xl font-literary leading-relaxed" style={{ fontWeight: 300 }}>
                      90 天结束后，AI 会自动将双方的对话、笔记、低语编纂成一本精美的 <span className="text-[#DCD7C9] font-bold">《共学白皮书》</span>。
                      <br /><br />
                      你可以选择：
                    </p>
                    <ul className="mt-8 space-y-4 text-[#DCD7C9] text-lg font-literary" style={{ fontWeight: 300 }}>
                      <li className="flex items-start gap-4">
                        <span className="text-[#8E9775] mt-1 text-xl">•</span>
                        <span><span className="text-[#DCD7C9] font-bold">存证</span>：放入私人档案库</span>
                      </li>
                      <li className="flex items-start gap-4">
                        <span className="text-[#8E9775] mt-1 text-xl">•</span>
                        <span><span className="text-[#DCD7C9] font-bold">公开</span>：在公共"美术馆"展出，接受他人"献花"</span>
                      </li>
                    </ul>
                    <div className="mt-10 p-8 bg-[#1E1E1E] border-l-4 border-[#8E9775]/40 rounded-r-lg">
                      <p className="text-[#666] text-base font-literary italic opacity-85 leading-relaxed" style={{ fontWeight: 300 }}>
                        🏅 完成契约后，你将获得一枚带有唯一编号和双方 ID 的虚拟"金石印章"。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
          </div>
        </div>

        {/* 总结 */}
        <div className="mt-32 pt-20 border-t border-[#2C2C2C] text-center">
          <div className="text-[#2C2C2C] text-[10px] font-mono tracking-widest opacity-40 font-literary mb-8">
            — 03 —
          </div>
          <div className="divider-literary text-[#FD8A6B]" style={{ opacity: 0.3 }} />
          <p className="text-[#DCD7C9] text-base md:text-lg font-literary leading-relaxed max-w-3xl mx-auto mt-12 italic" style={{ fontWeight: 300 }}>
            这就是一个找学习搭子的网站。
            <br className="hidden md:block" />
            创建学习路径或 Fork 他人的路径，找到搭子后一起学习 90 天。
            <br className="hidden md:block" />
            前 6 天只显示打卡状态，第 7 天解锁完整内容，保持神秘感的同时避免进度压力。
            <br className="hidden md:block" />
            90 天后生成"白皮书"，可保存或公开分享。
          </p>
          <div className="mt-12 flex items-center justify-center gap-3 text-[#666] text-sm opacity-70 font-literary" style={{ fontWeight: 300, letterSpacing: '0.1em' }}>
            <MapPin size={14} className="opacity-60" />
            <span>开始你的学习之旅</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-16 pb-32">
          {roadmaps.map((r, index) => (
            <div 
              key={r.id} 
              className="group block border-b border-[#2C2C2C] pb-10 hover:border-[#8E9775]/30 transition-all duration-1000 relative"
              style={{
                animation: `fadeInUp 0.8s ease-out ${index * 0.15}s both`,
                transform: `perspective(600px) rotateY(${perspective.rotateY * 0.08}deg) rotateX(${perspective.rotateX * 0.06}deg)`,
                transformStyle: 'preserve-3d',
              }}
            >
              {/* 隐藏的"同伴视角" - 只有特定角度才能看到 */}
              <div 
                className="absolute -right-4 top-1/2 -translate-y-1/2 w-32 p-3 bg-[#1E1E1E] border border-[#2C2C2C] rounded-lg shadow-md opacity-0 transition-opacity duration-700 pointer-events-none z-10"
                style={{
                  opacity: Math.abs(perspective.rotateY) > 6 && Math.abs(perspective.rotateY) < 15 ? 0.8 : 0,
                  transform: `translateZ(50px) rotateY(${-perspective.rotateY * 0.3}deg)`,
                }}
              >
                <p className="text-[#666] text-[10px] font-chinese-handwriting text-center" style={{ fontWeight: 300 }}>
                  <span className="opacity-70">同伴可能</span>
                  <br />
                  <span className="opacity-90">看到不同的路径</span>
                </p>
              </div>
              <Link href={`/roadmap/${r.id}`} className="block">
                <div className="flex justify-between items-baseline">
                  <div className="space-y-5">
                    <div className="flex items-center gap-4">
                      <span className="text-[9px] text-[#666] border border-[#2C2C2C] bg-[#1E1E1E] px-3 py-1 rounded-full uppercase tracking-widest font-literary opacity-70" style={{ fontWeight: 300 }}>{r.category}</span>
                      <h2 className="text-3xl md:text-4xl font-light group-hover:italic transition-all text-[#FD8A6B] font-elegant italic" style={{ letterSpacing: '0.03em', fontWeight: 300 }}>{r.title}</h2>
                    </div>
                    <p className="text-[#666] text-sm font-literary italic line-clamp-2 opacity-80 leading-relaxed" style={{ fontWeight: 300 }}>{r.description}</p>
                  </div>
                  <span className="text-[#8E9775] opacity-0 group-hover:opacity-50 transition-all text-2xl" style={{ transition: 'opacity 0.6s ease-out' }}>→</span>
                </div>
              </Link>
              {r.user_id && (
                <div className="mt-6 pt-5 border-t border-[#2C2C2C]">
                  <Link 
                    href={`/user/${r.user_id}`}
                    className="text-[10px] text-[#666] hover:text-[#8E9775] transition-colors uppercase tracking-widest flex items-center gap-2 font-literary opacity-70"
                    style={{ fontWeight: 300 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <User size={11} className="opacity-60" />
                    <span>{r.profiles?.username || r.user_id.slice(0, 8)}</span>
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      <button 
        onClick={() => setIsInputOpen(true)}
        className="fixed bottom-16 right-16 w-20 h-20 bg-[#1E1E1E] border border-[#2C2C2C] text-[#DCD7C9] rounded-full flex items-center justify-center shadow-sm hover:scale-105 hover:bg-[#DCD7C9] hover:text-black transition-all z-40 hover:shadow-md group"
        style={{
          animation: 'pulse 3s ease-in-out infinite',
          transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <Plus size={28} strokeWidth={1.5} className="group-hover:scale-110 transition-transform duration-500" />
      </button>

      {isInputOpen && (
        <div className="fixed inset-0 z-[100] bg-[#1A1A1A] backdrop-blur-3xl flex items-center justify-center p-8 animate-in fade-in zoom-in duration-700">
          <button onClick={() => setIsInputOpen(false)} className="absolute top-12 right-12 text-[#666] hover:text-[#8E9775] transition-colors" style={{ transition: 'color 0.5s ease-out' }}>
            <X size={28} strokeWidth={1.5} />
          </button>
          
          <div className="max-w-5xl w-full text-center space-y-16">
            <div>
              <p className="text-[#666] text-[11px] tracking-[0.5em] uppercase opacity-60 italic font-literary mb-4" style={{ fontWeight: 300 }}>Identify Medium & Muse</p>
              <div className="divider-literary text-[#FD8A6B]" style={{ opacity: 0.3, margin: '0 auto' }} />
              <p className="text-[#666] text-sm tracking-[0.3em] uppercase opacity-70 font-chinese-handwriting mt-4" style={{ fontWeight: 300 }}>媒介与灵感</p>
            </div>
            
            <div className="flex justify-center gap-12 md:gap-20">
              {[
                { id: 'book', icon: Book, label: 'Reading' },
                { id: 'film', icon: Film, label: 'Cinema' },
                { id: 'music', icon: Music, label: 'Sound' },
                { id: 'course', icon: GraduationCap, label: 'Mastery' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCategory(item.id as any)}
                  className={`flex flex-col items-center gap-5 transition-all duration-800 ${category === item.id ? 'opacity-100 scale-105' : 'opacity-35 hover:opacity-55'}`}
                  style={{ transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
                >
                  <div className={`p-6 rounded-full border-2 transition-all duration-700 ${category === item.id ? 'bg-[#1E1E1E] border-[#8E9775] text-[#8E9775] shadow-sm' : 'border-[#2C2C2C] text-[#666]'}`}>
                    <item.icon size={22} strokeWidth={1.5} />
                  </div>
                  <span className="text-[10px] tracking-[0.2em] uppercase font-literary text-[#666] opacity-80" style={{ fontWeight: 300 }}>{item.label}</span>
                </button>
              ))}
            </div>

            <div className="relative pt-12">
              <input 
                autoFocus
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createAIRoadmap()}
                placeholder="在此输入你要探索的主题..."
                className="w-full bg-transparent border-b-2 border-[#2C2C2C] py-10 text-4xl md:text-6xl font-light italic text-center outline-none focus:border-[#8E9775]/50 transition-all placeholder:text-[#666]/40 text-[#DCD7C9] font-literary"
                style={{ fontWeight: 300, letterSpacing: '0.02em' }}
              />
            </div>

            <button 
              onClick={createAIRoadmap}
              disabled={generating || !topic}
              className="mt-16 text-sm tracking-[0.3em] uppercase text-[#666] hover:text-[#8E9775] transition-all disabled:opacity-20 flex items-center gap-4 mx-auto font-literary"
              style={{ fontWeight: 300, transition: 'all 0.6s ease-out' }}
            >
              {generating ? <Loader2 className="animate-spin" size={18} /> : null}
              {generating ? "AI Is Curating..." : "Begin Deep Research"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}