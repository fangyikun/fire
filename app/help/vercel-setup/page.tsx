'use client'

import Link from 'next/link'
import { ArrowLeft, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react'

export default function VercelSetupHelp() {
  return (
    <div className="min-h-screen bg-[#1A1A1A] text-[#DCD7C9] font-serif p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm opacity-50 hover:opacity-100 transition-opacity mb-8">
          <ArrowLeft size={16} /> 返回登录
        </Link>

        <h1 className="text-5xl font-light italic mb-4">Vercel 环境变量配置指南</h1>
        <p className="text-[#666] mb-12">解决 "Supabase 环境变量未设置" 错误</p>

        <div className="space-y-8">
          {/* 步骤 1 */}
          <div className="border border-[#2C2C2C] p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#8E9775] flex items-center justify-center text-black font-bold">1</div>
              <h2 className="text-2xl font-light">登录 Vercel Dashboard</h2>
            </div>
            <div className="ml-11 space-y-2">
              <p className="text-[#BBB]">访问 <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-[#8E9775] hover:underline inline-flex items-center gap-1">vercel.com <ExternalLink size={12} /></a> 并登录你的账号</p>
              <p className="text-sm text-[#666]">如果你还没有账号，可以使用 GitHub 账号快速注册</p>
            </div>
          </div>

          {/* 步骤 2 */}
          <div className="border border-[#2C2C2C] p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#8E9775] flex items-center justify-center text-black font-bold">2</div>
              <h2 className="text-2xl font-light">选择你的项目</h2>
            </div>
            <div className="ml-11 space-y-2">
              <p className="text-[#BBB]">在 Dashboard 中找到并点击项目 <code className="bg-[#2C2C2C] px-2 py-1 rounded text-sm">fire</code></p>
              <p className="text-sm text-[#666]">如果项目名称不同，请选择对应的项目</p>
            </div>
          </div>

          {/* 步骤 3 */}
          <div className="border border-[#2C2C2C] p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#8E9775] flex items-center justify-center text-black font-bold">3</div>
              <h2 className="text-2xl font-light">进入环境变量设置</h2>
            </div>
            <div className="ml-11 space-y-2">
              <p className="text-[#BBB]">点击顶部的 <strong>Settings</strong> 标签</p>
              <p className="text-[#BBB]">在左侧菜单中找到并点击 <strong>Environment Variables</strong></p>
            </div>
          </div>

          {/* 步骤 4 */}
          <div className="border border-[#2C2C2C] p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#8E9775] flex items-center justify-center text-black font-bold">4</div>
              <h2 className="text-2xl font-light">添加环境变量</h2>
            </div>
            <div className="ml-11 space-y-4">
              <p className="text-[#BBB]">点击 <strong>Add New</strong> 按钮，添加以下两个变量：</p>
              
              <div className="bg-[#222] p-4 rounded border border-[#333]">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 size={16} className="text-[#8E9775]" />
                      <code className="text-sm font-mono">NEXT_PUBLIC_SUPABASE_URL</code>
                    </div>
                    <div className="ml-6 text-sm text-[#666]">
                      值: <code className="bg-[#2C2C2C] px-2 py-1 rounded">https://ysnyxesbkycpcptdjqhh.supabase.co</code>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 size={16} className="text-[#8E9775]" />
                      <code className="text-sm font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
                    </div>
                    <div className="ml-6 text-sm text-[#666]">
                      值: <code className="bg-[#2C2C2C] px-2 py-1 rounded">sb_publishable_zKTqjOZnMYrKZDU2gw1nDQ_oNeL_-Qj</code>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-yellow-500 mt-0.5" />
                  <div className="text-sm">
                    <strong className="text-yellow-500">重要：</strong> 添加每个变量时，必须勾选以下所有环境：
                    <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
                      <li>Production</li>
                      <li>Preview</li>
                      <li>Development</li>
                    </ul>
                    或者直接勾选 "Apply to all environments"
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 步骤 5 */}
          <div className="border border-[#2C2C2C] p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#8E9775] flex items-center justify-center text-black font-bold">5</div>
              <h2 className="text-2xl font-light">重新部署项目</h2>
            </div>
            <div className="ml-11 space-y-2">
              <p className="text-[#BBB]">环境变量配置后，<strong>必须重新部署</strong>才能生效</p>
              <div className="bg-[#222] p-4 rounded border border-[#333] mt-4">
                <p className="text-sm mb-2">方法 1：在 Vercel Dashboard 中重新部署</p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-[#666] ml-2">
                  <li>点击顶部的 <strong>Deployments</strong> 标签</li>
                  <li>找到最新的部署记录</li>
                  <li>点击右侧的 <strong>...</strong> 菜单</li>
                  <li>选择 <strong>Redeploy</strong></li>
                </ol>
              </div>
              <div className="bg-[#222] p-4 rounded border border-[#333] mt-4">
                <p className="text-sm mb-2">方法 2：推送代码到 GitHub（自动触发）</p>
                <p className="text-sm text-[#666] ml-2">推送任何代码更改到 GitHub，Vercel 会自动重新部署</p>
              </div>
            </div>
          </div>

          {/* 步骤 6 */}
          <div className="border border-[#2C2C2C] p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#8E9775] flex items-center justify-center text-black font-bold">6</div>
              <h2 className="text-2xl font-light">验证配置</h2>
            </div>
            <div className="ml-11 space-y-2">
              <p className="text-[#BBB]">部署完成后：</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-[#666] ml-2">
                <li>等待部署完成（通常需要 1-2 分钟）</li>
                <li>访问 <Link href="/debug/env" className="text-[#8E9775] hover:underline">诊断页面</Link> 检查环境变量状态</li>
                <li>如果看到绿色勾选，说明配置成功</li>
                <li>返回登录页面重试注册</li>
              </ul>
            </div>
          </div>

          {/* 常见问题 */}
          <div className="border border-[#2C2C2C] p-6 rounded-lg mt-12">
            <h2 className="text-2xl font-light mb-6">常见问题</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg mb-2">Q: 我已经添加了环境变量，为什么还是报错？</h3>
                <p className="text-sm text-[#666] ml-4">A: 环境变量更改后必须重新部署才能生效。请按照步骤 5 重新部署项目。</p>
              </div>
              <div>
                <h3 className="text-lg mb-2">Q: 如何确认环境变量是否正确配置？</h3>
                <p className="text-sm text-[#666] ml-4">A: 访问 <Link href="/debug/env" className="text-[#8E9775] hover:underline">诊断页面</Link>，如果看到绿色勾选，说明配置正确。</p>
              </div>
              <div>
                <h3 className="text-lg mb-2">Q: 变量名必须完全一样吗？</h3>
                <p className="text-sm text-[#666] ml-4">A: 是的，变量名必须完全一致，区分大小写。确保没有多余的空格或下划线。</p>
              </div>
              <div>
                <h3 className="text-lg mb-2">Q: 需要为所有环境都添加吗？</h3>
                <p className="text-sm text-[#666] ml-4">A: 是的，建议为 Production、Preview、Development 三个环境都添加，以确保在所有情况下都能正常工作。</p>
              </div>
            </div>
          </div>

          {/* 快速链接 */}
          <div className="flex gap-4 mt-8">
            <Link 
              href="/login" 
              className="px-6 py-3 border border-[#8E9775] text-[#8E9775] rounded hover:bg-[#8E9775] hover:text-black transition-all"
            >
              返回登录
            </Link>
            <Link 
              href="/debug/env" 
              className="px-6 py-3 bg-[#8E9775] text-black rounded hover:bg-[#DCD7C9] transition-all"
            >
              检查环境变量
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
