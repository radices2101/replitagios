import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const blockchainAPI = {
  async getBlocks(limit = 10) {
    const { data, error } = await supabase
      .from('blocks')
      .select('*')
      .order('block_number', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async getTransactions(address = null) {
    let query = supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (address) {
      query = query.or(`from_address.eq.${address},to_address.eq.${address}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getWallets() {
    const { data, error } = await supabase
      .from('wallets')
      .select('*');

    if (error) throw error;
    return data;
  },

  async createWallet() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const apiUrl = `${supabaseUrl}/functions/v1/blockchain/wallets`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create wallet');
    }

    return await response.json();
  }
};
