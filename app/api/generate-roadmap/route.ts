import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js'; // Import createClient from supabase-js
// Removed: import { cookies } from 'next/headers'; // No longer needed for this approach

// 支持的 AI 提供商类型
type AIProvider = 'gemini' | 'groq' | 'openrouter' | 'deepseek' | 'huggingface';

export async function POST(req: Request) {
  // 优先使用 Gemini（默认），如果用户指定了其他提供商则使用指定的
  const preferredProvider: AIProvider = (process.env.AI_PROVIDER as AIProvider) || 'gemini';
  
  // 检查 Gemini API Key（优先使用）
  const geminiApiKey = process.env.GEMINI_API_KEY;
  
  // 根据提供商获取对应的 API Key
  let apiKey: string | undefined;
  let apiUrl: string;
  let modelName: string;
  let provider: AIProvider;
  
  // 如果指定了 Gemini 且有 key，设置 Gemini 为提供商
  // 实际的智能回退会在调用 API 时进行
  if (preferredProvider === 'gemini' && geminiApiKey) {
    provider = 'gemini';
    apiKey = geminiApiKey;
    
    // 如果用户指定了模型，使用指定的；否则使用默认
    const userSpecifiedModel = process.env.GEMINI_MODEL;
    const defaultModel = userSpecifiedModel || 'gemini-1.5-flash';
    apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${defaultModel}:generateContent?key=${geminiApiKey}`;
    modelName = defaultModel;
  } else {
    // 否则使用指定的提供商
    provider = preferredProvider;
    
    switch (provider) {
      case 'groq':
        apiKey = process.env.GROQ_API_KEY;
        apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
        modelName = 'llama-3.3-70b-versatile';
        break;
      case 'openrouter':
        apiKey = process.env.OPENROUTER_API_KEY;
        apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
        modelName = 'meta-llama/llama-3.1-70b-instruct:free';
        break;
      case 'deepseek':
        apiKey = process.env.DEEPSEEK_API_KEY;
        apiUrl = 'https://api.deepseek.com/v1/chat/completions';
        modelName = 'deepseek-chat';
        break;
      case 'huggingface':
        apiKey = process.env.HUGGINGFACE_API_KEY;
        apiUrl = `https://api-inference.huggingface.co/models/meta-llama/Llama-3.1-70B-Instruct`;
        modelName = 'meta-llama/Llama-3.1-70B-Instruct';
        break;
      case 'gemini':
      default:
        apiKey = geminiApiKey;
        const geminiModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
        apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;
        modelName = geminiModel;
        break;
    }
  }
  
  // 检查 API Key
  if (!apiKey) {
    if (provider === 'gemini') {
      return NextResponse.json({ 
        error: 'Gemini API Key 未配置。请在环境变量中设置 GEMINI_API_KEY' 
      }, { status: 500 });
    } else {
      return NextResponse.json({ 
        error: `${provider.toUpperCase()} API Key 未配置。请在环境变量中设置 ${provider.toUpperCase()}_API_KEY，或使用 Gemini（设置 GEMINI_API_KEY）` 
      }, { status: 500 });
    }
  }

  // Initialize Supabase client for the backend
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for backend operations
  );

  try {
    const { topic, category } = await req.json();

    // Authenticate user on the backend using access_token from header
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split(' ')[1]; // Expecting "Bearer YOUR_ACCESS_TOKEN"

    if (!token) {
      console.error("Authorization token missing.");
      return NextResponse.json({ error: "未登录或缺少认证令牌" }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("用户认证失败或会话无效:", authError?.message);
      return NextResponse.json({ error: "未登录或会话无效" }, { status: 401 });
    }
    console.log("后端 API 检测到已登录用户:", user.id); // 新增日志
    const mediumLogic = {
      book: "侧重文本解构、论点梳理与延伸阅读。节点命名格式：『Chapter: 标题』。",
      film: "侧重镜头语言、叙事结构与导演风格分析。节点命名格式：『Scene: 标题』。",
      music: "侧重听感体验、创作背景与乐理动机。节点命名格式：『Track: 标题』。",
      course: "侧重知识体系递进、实操练习与技能掌握。节点命名格式：『Module: 标题』。"
    };

    // ✅ 系统指令：注入你的“温艺人”与“软件工程”背景
    const systemPrompt = `
      你是一位拥有极高智商、清冷文艺品味的女性策展人。
      你的目标是为女性深度用户生成知识学习路径。
      
      主题: "${topic}"
      媒介类型: "${category}"
      
      要求：
      1. 逻辑必须严密，语言要具有诗意且理智。
      2. ${mediumLogic[category as keyof typeof mediumLogic] || ""}
      3. 生成一个90天的学习路径，包含：
         - 3个Phase（月度目标，每个Phase约30天）
         - 12个Milestone（周度目标，每个Phase包含4个Milestone）
         - 每个Milestone包含2-3个具体的学习节点
      4. 路径应该是弹性的，允许用户有2次"休耕权"（Sabbatical）来调整节奏。
      
      输出格式必须是纯 JSON，不得包含任何 Markdown 标签或解释文字：
      {
        "title": "符合主题的优雅标题",
        "description": "一句富有洞见的主题描述",
        "phases": [
          {
            "phase_number": 1,
            "title": "Phase 1标题",
            "description": "Phase 1描述",
            "milestones": [
              {
                "milestone_number": 1,
                "title": "Milestone 1标题",
                "description": "Milestone 1描述",
                "nodes": [
                  { "title": "节点标题", "description": "具体任务描述", "type": "${category}", "order_index": 1 }
                ]
              }
            ]
          }
        ]
      }
    `;

    // 根据不同的提供商构建请求
    let response: Response;
    let data: any;
    let rawText: string = ''; // 初始化为空字符串，确保类型安全
    
    if (provider === 'gemini') {
      // Gemini API 格式 - 智能回退机制
      const payload = {
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
        }
      };
      
      // Gemini 模型优先级列表（按配额和可用性排序）
      // 即使用户指定了模型，如果配额用完也会自动尝试其他模型
      const userSpecifiedModel = process.env.GEMINI_MODEL;
      const defaultModels = [
        'gemini-1.5-flash',      // 配额高，速度快，推荐
        'gemini-2.5-flash-lite',  // 轻量级，配额较高
        'gemini-2.5-flash',       // 最新版本，但配额低
        'gemini-2.0-flash',       // 备选版本
        'gemini-1.5-pro',         // 功能强，但可能配额低
        'gemini-pro'              // 经典版本
      ];
      
      // 如果用户指定了模型，优先尝试用户指定的，然后尝试其他模型
      const geminiModels = userSpecifiedModel 
        ? [userSpecifiedModel, ...defaultModels.filter(m => m !== userSpecifiedModel)]
        : defaultModels;
      
      // 智能尝试不同的 Gemini 模型
      let lastError: any = null;
      let lastErrorModel = '';
      let success = false;
      
      for (const model of geminiModels) {
        try {
          const modelUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          
          console.log(`🔄 尝试 Gemini 模型: ${model}`);
          
          response = await fetch(modelUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          
          // 检查响应状态
          const responseText = await response.text();
          let responseData: any;
          
          try {
            responseData = JSON.parse(responseText);
          } catch (parseErr) {
            console.error(`❌ Gemini ${model} 响应解析失败:`, responseText.substring(0, 200));
            lastError = { error: { message: `响应格式错误: ${responseText.substring(0, 100)}` } };
            lastErrorModel = model;
            continue;
          }
          
          data = responseData;
          
          if (response.ok) {
            // 成功！使用这个模型
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
              console.log(`✅ 成功使用 Gemini 模型: ${model}`);
              rawText = data.candidates[0].content.parts[0].text;
              success = true;
              break;
            } else {
              console.error(`❌ Gemini ${model} 响应格式异常:`, JSON.stringify(data).substring(0, 200));
              lastError = { error: { message: '响应格式异常，缺少 candidates 数据' } };
              lastErrorModel = model;
              continue;
            }
          } else {
            // 检查错误类型
            const errorMsg = data.error?.message || data.error || JSON.stringify(data).substring(0, 200);
            console.error(`❌ Gemini ${model} 调用失败:`, errorMsg);
            
            if (errorMsg.includes('quota') || errorMsg.includes('Quota exceeded') || errorMsg.includes('rate limit') || errorMsg.includes('429') || errorMsg.includes('free_tier')) {
              console.log(`⚠️ Gemini ${model} 配额已用完（${errorMsg}），尝试下一个模型...`);
              lastError = data;
              lastErrorModel = model;
              continue; // 尝试下一个模型
            } else if (errorMsg.includes('not found') || errorMsg.includes('404') || errorMsg.includes('Model not found') || errorMsg.includes('Invalid model')) {
              console.log(`⚠️ Gemini ${model} 模型不存在，尝试下一个模型...`);
              lastError = data;
              lastErrorModel = model;
              continue; // 尝试下一个模型
            } else if (errorMsg.includes('location') || errorMsg.includes('not supported') || errorMsg.includes('403')) {
              // 地理限制，也尝试下一个
              console.log(`⚠️ Gemini ${model} 地区不支持，尝试下一个模型...`);
              lastError = data;
              lastErrorModel = model;
              continue;
            } else if (errorMsg.includes('API key') || errorMsg.includes('Invalid API key') || errorMsg.includes('401')) {
              // API Key 错误，不应该继续尝试
              console.error(`❌ API Key 无效，停止尝试`);
              return NextResponse.json({ 
                error: `模型调用异常: API Key 无效或已过期。请检查 GEMINI_API_KEY 环境变量。` 
              }, { status: 401 });
            } else {
              // 其他错误，也尝试下一个
              console.log(`⚠️ Gemini ${model} 调用失败: ${errorMsg}，尝试下一个模型...`);
              lastError = data;
              lastErrorModel = model;
              continue;
            }
          }
        } catch (err: any) {
          console.error(`❌ Gemini ${model} 请求异常:`, err.message);
          lastError = { error: { message: err.message }, raw: err };
          lastErrorModel = model;
          continue;
        }
      }
      
      if (!success) {
        // 所有 Gemini 模型都失败了
        const errorDetails = lastError?.error?.message || lastError?.message || JSON.stringify(lastError).substring(0, 200) || '所有 Gemini 模型都不可用';
        const triedModels = geminiModels.join(', ');
        console.error(`❌ 所有 Gemini 模型都失败。最后尝试的模型: ${lastErrorModel}，错误: ${errorDetails}`);
        
        return NextResponse.json({ 
          error: `模型调用异常: ${errorDetails}。已尝试所有 Gemini 模型（${triedModels}）。最后失败的模型: ${lastErrorModel}。请检查 API Key 是否正确，或配置其他 AI 提供商（Groq、OpenRouter 等）。` 
        }, { status: 500 });
      }
    } else if (provider === 'huggingface') {
      // Hugging Face API 格式（不同）
      response = await fetch(apiUrl, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          inputs: systemPrompt,
          parameters: {
            return_full_text: false,
            max_new_tokens: 2000
          }
        })
      });
      
      data = await response.json();
      
      if (!response.ok) {
        throw new Error(`模型调用异常: ${data.error || '未知错误'}`);
      }
      
      // Hugging Face 返回格式是数组
      rawText = Array.isArray(data) ? data[0]?.generated_text : data.generated_text;
    } else {
      // OpenAI 兼容格式 (Groq, OpenRouter, DeepSeek)
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      };
      
      // OpenRouter 需要额外的头部
      if (provider === 'openrouter') {
        headers["HTTP-Referer"] = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        headers["X-Title"] = "Around the Fire";
      }
      
      response = await fetch(apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: modelName,
          messages: [
            {
              role: "system",
              content: "你是一位拥有极高智商、清冷文艺品味的女性策展人。你的目标是为女性深度用户生成知识学习路径。输出格式必须是纯 JSON，不得包含任何 Markdown 标签或解释文字。"
            },
            {
              role: "user",
              content: systemPrompt
            }
          ],
          response_format: { type: "json_object" }, // 强制 JSON 格式
          temperature: 0.7,
          max_tokens: 2000
        })
      });
      
      data = await response.json();
      
      if (!response.ok) {
        console.error(`${provider.toUpperCase()} API 报错:`, data);
        const errorMessage = data.error?.message || data.error || '未知错误';
        
        if (errorMessage.includes('quota') || errorMessage.includes('rate limit') || errorMessage.includes('429')) {
          return NextResponse.json({ 
            error: `模型调用异常: API 配额已用完或达到速率限制。请稍后再试，或检查您的 API 配额。` 
          }, { status: 429 });
        }
        
        throw new Error(`模型调用异常: ${errorMessage}`);
      }
      
      // OpenAI 兼容格式返回
      rawText = data.choices[0].message.content;
    }
    
    // 处理可能的 JSON 嵌套或多余字符
    let aiData;
    try {
      aiData = JSON.parse(rawText.replace(/```json|```/g, '').trim());
      console.log(`${provider.toUpperCase()} API 返回的解析数据: `, aiData);
    } catch (parseError) {
      console.error("JSON 解析失败，原始文本:", rawText);
      throw new Error("模型返回格式非有效 JSON");
    }

    // 2. 存入主表 (Roadmap)
    console.log("尝试插入 Roadmap 主表...", { title: aiData.title, description: aiData.description, user_id: user.id, category: category }); // 新增日志
    const { data: roadmap, error: roadmapError } = await supabase
      .from('roadmaps')
      .insert([{ 
        title: aiData.title, 
        description: aiData.description, 
        user_id: user.id, // Use user.id from backend auth
        category: category,
        is_public: false, // 默认私有，用户可以选择公开
        root_id: null, // 原始roadmap没有root_id
        forked_from_id: null // 新创建的roadmap没有fork来源
      }])
      .select().single();

    if (roadmapError) {
      console.error("Roadmap 主表插入失败:", roadmapError); // 新增日志
      throw roadmapError;
    }
    console.log("Roadmap 主表插入成功，ID:", roadmap.id); // 新增日志

    // 记录用户活跃度
    const today = new Date().toISOString().split('T')[0]; // 获取 YYYY-MM-DD 格式的日期
    const { error: activityError } = await supabase
      .from('user_activity')
      .upsert(
        { user_id: user.id, activity_date: today, count: 1 },
        { onConflict: 'user_id, activity_date', ignoreDuplicates: false }
      )
      .select('count') // Upsert 总是需要返回一些数据
      .single();
    
    if (activityError) {
      console.error("记录用户活跃度失败:", activityError);
    } else {
      console.log("用户活跃度记录成功或更新！");
    }

    // 3. 存入子表 (Roadmap Nodes) - 支持Phase和Milestone结构
    if (roadmap) {
      let globalOrderIndex = 1;
      
      if (aiData.phases && Array.isArray(aiData.phases)) {
        // 新格式：包含phases和milestones
        console.log("尝试插入 Phase/Milestone 结构...", aiData.phases.length, "个Phase");
        
        const nodesToInsert: any[] = [];
        
        aiData.phases.forEach((phase: any) => {
          if (phase.milestones && Array.isArray(phase.milestones)) {
            phase.milestones.forEach((milestone: any) => {
              if (milestone.nodes && Array.isArray(milestone.nodes)) {
                milestone.nodes.forEach((node: any) => {
                  nodesToInsert.push({
                    roadmap_id: roadmap.id,
                    title: node.title,
                    description: node.description,
                    type: category,
                    order_index: globalOrderIndex++,
                    phase_number: phase.phase_number || null,
                    milestone_number: milestone.milestone_number || null,
                    metadata: {
                      phase_title: phase.title,
                      phase_description: phase.description,
                      milestone_title: milestone.title,
                      milestone_description: milestone.description
                    }
                  });
                });
              }
            });
          }
        });
        
        if (nodesToInsert.length > 0) {
          const { error: nodeError } = await supabase.from('roadmap_nodes').insert(nodesToInsert);
          
          if (nodeError) {
            console.error("子表存入失败!!", nodeError);
            throw nodeError;
          }
          console.log("Roadmap Nodes 子表插入成功！共", nodesToInsert.length, "个节点");
        }
      } else if (aiData.nodes && Array.isArray(aiData.nodes)) {
        // 兼容旧格式：直接是nodes数组
        console.log("尝试插入旧格式节点...", aiData.nodes.length, "个节点");
        const nodesToInsert = aiData.nodes.map((n: any, index: number) => ({
          roadmap_id: roadmap.id,
          title: n.title,
          description: n.description,
          type: category,
          order_index: n.order_index ?? index + 1
        }));
        
        const { error: nodeError } = await supabase.from('roadmap_nodes').insert(nodesToInsert);
        
        if (nodeError) {
          console.error("子表存入失败!!", nodeError);
          throw nodeError;
        }
        console.log("Roadmap Nodes 子表插入成功！");
      }
    }

    // Return the generated roadmap ID
    console.log("后端 API 成功返回 roadmapId:", roadmap?.id); // 新增日志
    return NextResponse.json({ roadmapId: roadmap?.id });

  } catch (error: any) {
    console.error("❌ 失败:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}