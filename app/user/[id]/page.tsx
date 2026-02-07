'use client'

import { useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, BookOpen, GitFork, Clock } from 'lucide-react'
import CalendarHeatmap from 'react-calendar-heatmap'
import 'react-calendar-heatmap/dist/styles.css'
import { subYears } from 'date-fns'

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userRoadmaps, setUserRoadmaps] = useState<any[]>([])
  const [heatmapData, setHeatmapData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = useMemo(() => {
    if (typeof window === 'undefined') return null
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    return supabaseUrl && supabaseAnonKey 
      ? createBrowserClient(supabaseUrl, supabaseAnonKey)
      : null
  }, [])

  useEffect(() => {
    async function loadUserData() {
      if (!supabase || !params.id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // 获取用户 profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username, nickname, bio, created_at')
          .eq('id', params.id)
          .maybeSingle()

        setUserProfile(profile)

        // 获取用户的公开路线图
        const { data: roadmaps } = await supabase
          .from('roadmaps')
          .select('id, title, description, category, created_at, is_public')
          .eq('user_id', params.id)
          .eq('is_public', true)
          .order('created_at', { ascending: false })

        setUserRoadmaps(roadmaps || [])

        // 获取用户活跃度数据（公开数据）
        try {
          const { data: activityData } = await supabase
            .from('user_activity')
            .select('activity_date, count')
            .eq('user_id', params.id)
            .gte('activity_date', subYears(new Date(), 1).toISOString().split('T')[0])
            .order('activity_date', { ascending: true })

          const formattedData = activityData?.map(item => {
            let dateStr = item.activity_date;
            if (dateStr instanceof Date) {
              dateStr = dateStr.toISOString().split('T')[0];
            } else if (typeof dateStr === 'string' && dateStr.includes('T')) {
              dateStr = dateStr.split('T')[0];
            }
            return {
              date: dateStr,
              count: Number(item.count) || 0
            };
          }) || [];
          setHeatmapData(formattedData)
        } catch (activityErr) {
          console.warn('获取活跃度数据失败:', activityErr)
          setHeatmapData([])
        }
      } catch (err: any) {
        console.error('加载用户数据失败:', err)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [supabase, params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center text-[#8E9775] font-serif uppercase tracking-[0.5em] animate-pulse italic">
        Loading Profile...
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] text-[#DCD7C9] font-serif p-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-sm opacity-50 hover:opacity-100 transition-opacity mb-8">
            <ArrowLeft size={16} /> 返回首页
          </Link>
          <div className="text-center py-20">
            <p className="text-[#666] text-lg italic">用户不存在或未公开</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-[#DCD7C9] font-serif p-8 md:p-20">
      <div className="max-w-4xl mx-auto">
        {/* 导航 */}
        <nav className="mb-12">
          <Link href="/" className="inline-flex items-center gap-2 text-sm opacity-50 hover:opacity-100 transition-opacity">
            <ArrowLeft size={16} /> 返回首页
          </Link>
        </nav>

        {/* 用户信息 */}
        <header className="mb-16 pb-12 border-b border-[#2C2C2C]">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 rounded-full bg-[#1E1E1E] border border-[#2C2C2C] flex items-center justify-center">
              <User size={32} className="text-[#8E9775] opacity-50" />
            </div>
            <div>
              <h1 className="text-4xl font-light italic mb-2">
                {userProfile.nickname || userProfile.username || 'User'}
              </h1>
              {userProfile.username && (
                <p className="text-[#666] text-sm">@{userProfile.username}</p>
              )}
            </div>
          </div>
          {userProfile.bio && (
            <p className="text-[#666] text-sm italic leading-relaxed max-w-2xl">
              {userProfile.bio}
            </p>
          )}
        </header>

        {/* 活跃度热力图 */}
        {heatmapData.length > 0 && (
          <section className="mb-16 pb-12 border-b border-[#2C2C2C]">
            <div className="flex items-center gap-4 text-[#8E9775] mb-6">
              <Clock size={16} className="opacity-50" />
              <h2 className="text-xl font-light italic">活动热力图</h2>
            </div>
            <div className="border border-[#2C2C2C] p-6 rounded-lg bg-[#1E1E1E] overflow-x-auto">
              <div className="min-w-[800px]">
                <CalendarHeatmap
                  startDate={subYears(new Date(), 1)}
                  endDate={new Date()}
                  values={heatmapData}
                  classForValue={(value: any) => {
                    if (!value || value.count === undefined) return 'color-empty'
                    if (value.count === 0) return 'color-scale-0'
                    if (value.count <= 2) return 'color-scale-1'
                    if (value.count <= 4) return 'color-scale-2'
                    return 'color-scale-3'
                  }}
                  showWeekdayLabels={true}
                  showOutOfRangeDays={false}
                />
              </div>
            </div>
          </section>
        )}

        {/* 公开路线图 */}
        <section>
          <h2 className="text-2xl font-light italic mb-8 text-[#8E9775]">
            公开的学习路径
          </h2>
          
          {userRoadmaps.length === 0 ? (
            <div className="border border-[#2C2C2C] border-dashed rounded-lg p-12 text-center">
              <BookOpen className="w-12 h-12 text-[#2C2C2C] mx-auto mb-4" />
              <p className="text-[#666] italic">暂无公开的学习路径</p>
            </div>
          ) : (
            <div className="space-y-6">
              {userRoadmaps.map((roadmap) => (
                <Link
                  key={roadmap.id}
                  href={`/roadmap/${roadmap.id}`}
                  className="block border border-[#2C2C2C] p-6 rounded-lg hover:border-[#8E9775]/30 transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-[9px] text-[#666] border border-[#2C2C2C] bg-[#1E1E1E] px-2 py-1 rounded uppercase tracking-widest">
                          {roadmap.category}
                        </span>
                        {roadmap.forked_from_id && (
                          <span className="text-[9px] text-[#8E9775] flex items-center gap-1">
                            <GitFork size={10} />
                            Forked
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-light italic mb-2 group-hover:text-[#8E9775] transition-colors">
                        {roadmap.title}
                      </h3>
                      <p className="text-[#666] text-sm italic line-clamp-2">
                        {roadmap.description}
                      </p>
                      <p className="text-[#666] text-xs mt-4 opacity-50">
                        {new Date(roadmap.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-[#8E9775] opacity-0 group-hover:opacity-50 transition-opacity">
                      →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
