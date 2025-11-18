/*
  # Manual Bucket Creation Script
  
  Se a migração automática não criar o bucket, execute este script manualmente
  ou crie o bucket pelo painel do Supabase:
  
  Opção 1: Via Painel do Supabase
  1. Acesse https://app.supabase.com
  2. Selecione seu projeto
  3. Vá em Storage (menu lateral)
  4. Clique em "New bucket"
  5. Nome: study-content
  6. Público: Não (desmarcado)
  7. File size limit: 50 MB (ou o valor desejado)
  8. Allowed MIME types: application/pdf
  9. Clique em "Create bucket"
  
  Opção 2: Via SQL Editor
  Execute este script no SQL Editor do Supabase (requer permissões de service_role)
*/

-- Criar bucket (requer permissões elevadas)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('study-content', 'study-content', false, 52428800, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Verificar se o bucket foi criado
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'study-content';

