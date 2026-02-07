'use client'

export default function EnvDebugPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
  const hasGeminiKey = !!process.env.GEMINI_API_KEY

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-[#DCD7C9] font-serif p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-light italic mb-8">Environment Variables Debug</h1>
        
        <div className="space-y-6">
          <div className="border border-[#2C2C2C] p-6 rounded-lg">
            <h2 className="text-xl mb-4">Client-Side Variables (NEXT_PUBLIC_*)</h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-3 h-3 rounded-full ${supabaseUrl ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="font-mono text-sm">NEXT_PUBLIC_SUPABASE_URL</span>
                </div>
                {supabaseUrl ? (
                  <div className="ml-5 text-xs text-[#666] font-mono break-all">
                    {supabaseUrl.substring(0, 30)}...
                  </div>
                ) : (
                  <div className="ml-5 text-red-400 text-sm">❌ Missing</div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-3 h-3 rounded-full ${supabaseAnonKey ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="font-mono text-sm">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
                </div>
                {supabaseAnonKey ? (
                  <div className="ml-5 text-xs text-[#666] font-mono break-all">
                    {supabaseAnonKey.substring(0, 20)}...
                  </div>
                ) : (
                  <div className="ml-5 text-red-400 text-sm">❌ Missing</div>
                )}
              </div>
            </div>
          </div>

          <div className="border border-[#2C2C2C] p-6 rounded-lg">
            <h2 className="text-xl mb-4">Server-Side Variables</h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-3 h-3 rounded-full ${hasServiceKey ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="font-mono text-sm">SUPABASE_SERVICE_ROLE_KEY</span>
                </div>
                <div className="ml-5 text-xs text-[#666]">
                  {hasServiceKey ? '✅ Present (hidden for security)' : '⚠️ Not visible on client (expected)'}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-3 h-3 rounded-full ${hasGeminiKey ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="font-mono text-sm">GEMINI_API_KEY</span>
                </div>
                <div className="ml-5 text-xs text-[#666]">
                  {hasGeminiKey ? '✅ Present (hidden for security)' : '⚠️ Not visible on client (expected)'}
                </div>
              </div>
            </div>
          </div>

          <div className="border border-[#2C2C2C] p-6 rounded-lg">
            <h2 className="text-xl mb-4">Status</h2>
            {supabaseUrl && supabaseAnonKey ? (
              <div className="text-green-400 text-lg">
                ✅ Supabase client can be initialized
              </div>
            ) : (
              <div className="text-red-400 text-lg">
                ❌ Supabase client cannot be initialized
                <div className="mt-4 text-sm text-[#666]">
                  <p className="mb-2">To fix this:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>Go to Vercel Dashboard → Your Project → Settings → Environment Variables</li>
                    <li>Add <code className="bg-[#2C2C2C] px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code></li>
                    <li>Add <code className="bg-[#2C2C2C] px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
                    <li>Make sure to select Production, Preview, and Development environments</li>
                    <li>Redeploy your project</li>
                  </ol>
                </div>
              </div>
            )}
          </div>

          <div className="border border-[#2C2C2C] p-6 rounded-lg">
            <h2 className="text-xl mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-[#8E9775] text-black rounded hover:bg-[#DCD7C9] transition-colors"
              >
                Refresh Page
              </button>
              <div className="text-xs text-[#666] mt-4">
                <p>Note: This page helps diagnose environment variable issues.</p>
                <p>After configuring variables in Vercel, you must redeploy for changes to take effect.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
