
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
    const { message, userId, groupId, encrypt = false } = await req.json()
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    let processedContent = message.content
    let contentHash = ''

    // Generate content hash for blockchain verification
    if (message.content) {
      const encoder = new TextEncoder()
      const data = encoder.encode(message.content)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      contentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    }

    // TODO: Add encryption logic here if needed
    if (encrypt) {
      // Implement encryption logic
      console.log('Encryption requested but not implemented yet')
    }

    // Store message in database
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: userId,
        group_id: groupId,
        content: processedContent,
        content_hash: contentHash,
        encrypted: encrypt
      })
      .select()
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({ 
        message: data,
        hash: contentHash,
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
