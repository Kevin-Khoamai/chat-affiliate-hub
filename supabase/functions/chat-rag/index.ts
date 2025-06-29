
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query, context } = await req.json()
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Get relevant campaign and academy data based on query
    const [campaignsResponse, academyResponse] = await Promise.all([
      supabase.from('campaigns').select('*'),
      supabase.from('academy').select('*')
    ])

    const campaigns = campaignsResponse.data || []
    const academy = academyResponse.data || []

    // Simple keyword matching for RAG (in production, use vector embeddings)
    let relevantData = { campaigns: [], academy: [] }
    const lowerQuery = query.toLowerCase()

    // Filter relevant campaigns
    if (lowerQuery.includes('campaign') || lowerQuery.includes('commission')) {
      relevantData.campaigns = campaigns
    }

    // Filter relevant academy content
    if (lowerQuery.includes('learn') || lowerQuery.includes('tutorial') || lowerQuery.includes('academy')) {
      relevantData.academy = academy
    }

    // Generate response based on relevant data
    let response = ""
    
    if (relevantData.campaigns.length > 0) {
      response += `**Available Campaigns:**\n`
      relevantData.campaigns.forEach(campaign => {
        response += `• ${campaign.name}: ${campaign.commission_rate}% commission\n`
      })
      response += `\n`
    }

    if (relevantData.academy.length > 0) {
      response += `**Academy Resources:**\n`
      relevantData.academy.forEach(content => {
        response += `• ${content.title}: ${content.content?.substring(0, 100)}...\n`
      })
    }

    if (!response) {
      response = "I can help you with campaign information, commission rates, and academy resources. What would you like to know?"
    }

    return new Response(
      JSON.stringify({ 
        response,
        relevantData,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
