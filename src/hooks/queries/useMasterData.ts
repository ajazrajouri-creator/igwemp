import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { MasterDataCategory, MasterDataItem } from '../../types';

export const masterDataKeys = {
  all: ['master_data'] as const,
  categories: () => [...masterDataKeys.all, 'categories'] as const,
  items: (categoryCode: string) => [...masterDataKeys.all, 'items', categoryCode] as const,
};

export function useMasterDataCategories() {
  return useQuery({
    queryKey: masterDataKeys.categories(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('master_data_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as MasterDataCategory[];
    },
  });
}

export function useMasterDataItems(categoryCode: string | null) {
  return useQuery({
    queryKey: masterDataKeys.items(categoryCode!),
    queryFn: async () => {
      // First get the category ID
      const { data: category, error: catError } = await supabase
        .from('master_data_categories')
        .select('id')
        .eq('code', categoryCode)
        .single();
        
      if (catError) throw catError;
      if (!category) return [];

      // Then get the items
      const { data, error } = await supabase
        .from('master_data_items')
        .select('*, parent:parent_item_id(*)')
        .eq('category_id', category.id)
        .order('sort_order');
      
      if (error) throw error;
      return data as MasterDataItem[];
    },
    enabled: !!categoryCode,
  });
}
