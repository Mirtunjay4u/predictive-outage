
-- Enums for docs_resources
CREATE TYPE public.doc_category AS ENUM ('Technical', 'Operational', 'Governance', 'Roadmap', 'Glossary', 'ReleaseNotes');
CREATE TYPE public.doc_type AS ENUM ('Page', 'PDF', 'ExternalLink');
CREATE TYPE public.doc_status AS ENUM ('Draft', 'Approved', 'Deprecated', 'Archived');
CREATE TYPE public.doc_release_channel AS ENUM ('Stable', 'Beta', 'Internal');
CREATE TYPE public.doc_visibility AS ENUM ('PublicDemo', 'InternalOnly', 'Restricted');

-- Main table
CREATE TABLE public.docs_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  short_description text NOT NULL DEFAULT '',
  category public.doc_category NOT NULL DEFAULT 'Technical',
  doc_type public.doc_type NOT NULL DEFAULT 'Page',
  url_view text,
  url_download text,
  status public.doc_status NOT NULL DEFAULT 'Draft',

  -- Versioning
  version text NOT NULL DEFAULT 'v1.0.0',
  release_channel public.doc_release_channel NOT NULL DEFAULT 'Stable',
  change_summary text,
  supersedes_doc_id uuid REFERENCES public.docs_resources(id),

  -- Governance
  owner text,
  reviewer text,
  approved_by text,
  approval_date timestamptz,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Access
  visibility public.doc_visibility NOT NULL DEFAULT 'PublicDemo',
  allowed_roles text[] NOT NULL DEFAULT ARRAY['Executive','CTO','Operator','Engineer','Admin','Viewer'],

  -- Search
  search_keywords text[] NOT NULL DEFAULT '{}',
  content_index text NOT NULL DEFAULT '',

  -- Pinned
  is_pinned boolean NOT NULL DEFAULT false
);

-- RLS
ALTER TABLE public.docs_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on docs_resources"
  ON public.docs_resources FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on docs_resources"
  ON public.docs_resources FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on docs_resources"
  ON public.docs_resources FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete on docs_resources"
  ON public.docs_resources FOR DELETE
  USING (true);

-- Updated_at trigger
CREATE TRIGGER update_docs_resources_updated_at
  BEFORE UPDATE ON public.docs_resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Full-text search index
CREATE INDEX idx_docs_resources_search ON public.docs_resources
  USING GIN (to_tsvector('english', title || ' ' || short_description || ' ' || content_index));
