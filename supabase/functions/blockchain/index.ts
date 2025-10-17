import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    if (path === 'blocks') {
      if (req.method === 'GET') {
        const limit = url.searchParams.get('limit') || '10';
        const { data, error } = await supabaseClient
          .from('blocks')
          .select('*')
          .order('block_number', { ascending: false })
          .limit(parseInt(limit));

        if (error) throw error;

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (req.method === 'POST') {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const body = await req.json();
        const { data: latestBlock } = await supabaseClient
          .from('blocks')
          .select('block_number, hash')
          .order('block_number', { ascending: false })
          .limit(1)
          .single();

        const newBlockNumber = (latestBlock?.block_number ?? 0) + 1;
        const previousHash = latestBlock?.hash ?? '0'.repeat(64);
        const hash = await generateHash(`${newBlockNumber}${previousHash}${Date.now()}`);

        const { data, error } = await supabaseClient
          .from('blocks')
          .insert({
            block_number: newBlockNumber,
            previous_hash: previousHash,
            hash: hash,
            data: body.data || {},
            nonce: body.nonce || 0,
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify(data), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (path === 'transactions') {
      if (req.method === 'GET') {
        const address = url.searchParams.get('address');
        let query = supabaseClient.from('transactions').select('*').order('created_at', { ascending: false });

        if (address) {
          query = query.or(`from_address.eq.${address},to_address.eq.${address}`);
        }

        const { data, error } = await query.limit(50);
        if (error) throw error;

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (req.method === 'POST') {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const body = await req.json();
        const txHash = await generateHash(`${body.from_address}${body.to_address}${body.amount}${Date.now()}`);

        const { data, error } = await supabaseClient
          .from('transactions')
          .insert({
            from_address: body.from_address,
            to_address: body.to_address,
            amount: body.amount,
            fee: body.fee || 0,
            tx_hash: txHash,
            status: 'pending',
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify(data), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (path === 'wallets') {
      if (req.method === 'GET') {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
        
        if (userError) throw userError;

        const { data, error } = await supabaseClient
          .from('wallets')
          .select('*')
          .eq('user_id', userData.user.id);

        if (error) throw error;

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (req.method === 'POST') {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
        
        if (userError) throw userError;

        const address = '0x' + Array.from({ length: 40 }, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('');

        const { data, error } = await supabaseClient
          .from('wallets')
          .insert({
            user_id: userData.user.id,
            address: address,
            balance: 0,
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify(data), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
