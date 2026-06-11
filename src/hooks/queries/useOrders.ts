import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { Order } from '../../types';

export const orderKeys = {
  all: ['orders'] as const,
  list: () => [...orderKeys.all, 'list'] as const,
  detail: (id: string) => [...orderKeys.all, 'detail', id] as const,
};

export function useOrders() {
  return useQuery({
    queryKey: orderKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, issuing_office:issuing_office_id(*), issuing_user:issuing_user_id(username, party:party_id(first_name, last_name)), order_type:order_type_id(*)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Order[];
    },
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, issuing_office:issuing_office_id(*), issuing_user:issuing_user_id(username, party:party_id(*)), order_type:order_type_id(*)')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Order;
    },
    enabled: !!id,
  });
}
