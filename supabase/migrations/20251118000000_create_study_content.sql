/*
  # Study Content System

  1. New Table
    - `study_content`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `theme` (text) - Tema associado ao conteúdo
      - `content_type` (text) - Tipo: 'note', 'link', 'pdf'
      - `title` (text) - Título do conteúdo
      - `content` (text) - Conteúdo (anotações ou URL para links)
      - `file_path` (text) - Caminho do arquivo PDF no storage (se aplicável)
      - `file_name` (text) - Nome original do arquivo (se aplicável)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on table
    - Add policies for authenticated users to manage their own data

  3. Storage
    - Create bucket 'study-content' for PDF files
    - Add policies for authenticated users to upload/download their own files
*/

CREATE TABLE IF NOT EXISTS study_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  theme text NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('note', 'link', 'pdf')),
  title text NOT NULL,
  content text,
  file_path text,
  file_name text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE study_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own study content"
  ON study_content FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study content"
  ON study_content FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study content"
  ON study_content FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own study content"
  ON study_content FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_study_content_user_id ON study_content(user_id);
CREATE INDEX IF NOT EXISTS idx_study_content_theme ON study_content(theme);
CREATE INDEX IF NOT EXISTS idx_study_content_type ON study_content(content_type);

-- Create storage bucket for PDF files
-- Note: Bucket creation via SQL may require service_role permissions
-- If this fails, create the bucket manually in Supabase Dashboard:
-- Storage > New bucket > Name: study-content > Public: No > Create bucket
DO $$
BEGIN
  -- Try to create bucket if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'study-content'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('study-content', 'study-content', false, 52428800, ARRAY['application/pdf'])
    ON CONFLICT (id) DO NOTHING;
  END IF;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Não foi possível criar o bucket automaticamente. Crie manualmente no painel do Supabase.';
  WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao criar bucket: %. Crie manualmente no painel do Supabase.', SQLERRM;
END $$;

-- Storage policies for study-content bucket
CREATE POLICY "Users can upload own study content files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'study-content' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own study content files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'study-content' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own study content files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'study-content' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Alternative storage policies using split_part (if storage.foldername doesn't work)
-- Uncomment these and comment the ones above if needed:
/*
DROP POLICY IF EXISTS "Users can upload own study content files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own study content files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own study content files" ON storage.objects;

CREATE POLICY "Users can upload own study content files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'study-content' AND
    split_part(name, '/', 1) = auth.uid()::text
  );

CREATE POLICY "Users can view own study content files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'study-content' AND
    split_part(name, '/', 1) = auth.uid()::text
  );

CREATE POLICY "Users can delete own study content files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'study-content' AND
    split_part(name, '/', 1) = auth.uid()::text
  );
*/

