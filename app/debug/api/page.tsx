'use client'

import { useState } from 'react'
import { useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function ApiDebugPage() {
  const [testResults, setTestResults] = useState<any>({})
  const [testing, setTesting] = useState(false)

  const supabase = useMemo(() => {
    if (typeof window === 'undefined') return null
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    return supabaseUrl && supabaseAnonKey 
      ? createBrowserClient(supabaseUrl, supabaseAnonKey)
      : null
  }, [])

  const testApi = async (endpoint: string, name: string) => {
    setTesting(true)
    try {
      if (!supabase) {
        setTestResults((prev: any) => ({
          ...prev,
          [name]: { error: 'Supabase client not initialized' }
        }))
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setTestResults((prev: any) => ({
          ...prev,
          [name]: { error: 'Not logged in' }
        }))
        return
      }

      const res = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })

      const text = await res.text()
      let data
      try {
        data = text ? JSON.parse(text) : null
      } catch {
        data = { raw: text }
      }

      setTestResults((prev: any) => ({
        ...prev,
        [name]: {
          status: res.status,
          ok: res.ok,
          data: data,
          error: res.ok ? null : (data.error || res.statusText)
        }
      }))
    } catch (err: any) {
      setTestResults((prev: any) => ({
        ...prev,
        [name]: { error: err.message }
      }))
    } finally {
      setTesting(false)
    }
  }

  const testAll = async () => {
    await testApi('/api/user-roadmaps', 'user-roadmaps')
    await testApi('/api/user-notes-count', 'user-notes-count')
    await testApi('/api/user-activity-heatmap', 'user-activity-heatmap')
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-[#DCD7C9] font-serif p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-light italic mb-8">API 诊断工具</h1>
        
        <div className="space-y-6">
          <div className="border border-[#2C2C2C] p-6 rounded-lg">
            <h2 className="text-xl mb-4">环境信息</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-[#666]">环境:</span>{' '}
                <span className="font-mono">{process.env.NODE_ENV || 'unknown'}</span>
              </div>
              <div>
                <span className="text-[#666]">Supabase URL:</span>{' '}
                <span className="font-mono text-xs">
                  {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
                </span>
              </div>
              <div>
                <span className="text-[#666]">Supabase Key:</span>{' '}
                <span className="font-mono text-xs">
                  {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
                </span>
              </div>
            </div>
          </div>

          <div className="border border-[#2C2C2C] p-6 rounded-lg">
            <h2 className="text-xl mb-4">API 测试</h2>
            <div className="space-y-4">
              <button
                onClick={testAll}
                disabled={testing || !supabase}
                className="px-6 py-3 bg-[#8E9775] text-black rounded hover:bg-[#DCD7C9] transition-colors disabled:opacity-50"
              >
                {testing ? '测试中...' : '测试所有 API'}
              </button>

              <div className="space-y-4 mt-6">
                {Object.entries(testResults).map(([name, result]: [string, any]) => (
                  <div key={name} className="border border-[#2C2C2C] p-4 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-3 h-3 rounded-full ${result.ok ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="font-mono">{name}</span>
                      {result.status && (
                        <span className="text-xs text-[#666]">({result.status})</span>
                      )}
                    </div>
                    {result.error ? (
                      <div className="text-red-400 text-sm ml-5">{result.error}</div>
                    ) : result.data ? (
                      <div className="text-sm text-[#666] ml-5">
                        <pre className="whitespace-pre-wrap break-all">
                          {JSON.stringify(result.data, null, 2).substring(0, 200)}
                          {JSON.stringify(result.data).length > 200 ? '...' : ''}
                        </pre>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border border-[#2C2C2C] p-6 rounded-lg">
            <h2 className="text-xl mb-4">常见问题</h2>
            <div className="space-y-2 text-sm text-[#666]">
              <p><strong>本地正常但 Vercel 报错？</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>检查 Vercel Dashboard 中的环境变量是否已配置</li>
                <li>确认环境变量已应用到 Production 环境</li>
                <li>环境变量更改后必须重新部署</li>
                <li>检查 Vercel 部署日志中的错误信息</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
