import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DocResource {
  id: string;
  title: string;
  short_description: string;
  category: string;
  doc_type: string;
  url_view: string | null;
  url_download: string | null;
  status: string;
  version: string;
  release_channel: string;
  change_summary: string | null;
  supersedes_doc_id: string | null;
  owner: string | null;
  reviewer: string | null;
  approved_by: string | null;
  approval_date: string | null;
  created_at: string;
  updated_at: string;
  visibility: string;
  allowed_roles: string[];
  search_keywords: string[];
  content_index: string;
  is_pinned: boolean;
}

export function useDocsResources() {
  return useQuery({
    queryKey: ['docs-resources'],
    queryFn: async (): Promise<DocResource[]> => {
      const { data, error } = await supabase
        .from('docs_resources')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as DocResource[];
    },
  });
}
