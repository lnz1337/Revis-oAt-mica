# Instruções para Criar o Bucket de Storage

Se você recebeu o erro "Bucket not found" ao tentar fazer upload de um PDF, siga estas instruções:

## Opção 1: Criar pelo Painel do Supabase (Recomendado)

1. Acesse o painel do Supabase: https://app.supabase.com
2. Selecione seu projeto
3. No menu lateral, clique em **Storage**
4. Clique no botão **"New bucket"** (ou "Novo bucket")
5. Preencha os campos:
   - **Name**: `study-content` (exatamente este nome)
   - **Public bucket**: **Desmarcado** (não público)
   - **File size limit**: `50 MB` (ou o valor desejado)
   - **Allowed MIME types**: `application/pdf` (opcional, mas recomendado)
6. Clique em **"Create bucket"**

## Opção 2: Criar via SQL Editor

Se você tem acesso ao SQL Editor com permissões adequadas:

1. Acesse o SQL Editor no painel do Supabase
2. Execute o seguinte comando:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('study-content', 'study-content', false, 52428800, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;
```

## Verificar se o Bucket foi Criado

Após criar o bucket, você pode verificar se ele existe:

1. Vá em **Storage** no painel do Supabase
2. Você deve ver o bucket `study-content` na lista
3. Clique nele para verificar as configurações

## Configurar Políticas de Segurança

As políticas de segurança já devem estar configuradas pela migração SQL. Se não estiverem, você pode criar manualmente no painel:

1. Vá em **Storage** > **Policies**
2. Selecione o bucket `study-content`
3. Crie as seguintes políticas:

### Política de Upload (INSERT)
- Nome: "Users can upload own study content files"
- Operação: INSERT
- Target roles: authenticated
- USING expression: `bucket_id = 'study-content' AND split_part(name, '/', 1) = auth.uid()::text`

### Política de Visualização (SELECT)
- Nome: "Users can view own study content files"
- Operação: SELECT
- Target roles: authenticated
- USING expression: `bucket_id = 'study-content' AND split_part(name, '/', 1) = auth.uid()::text`

### Política de Exclusão (DELETE)
- Nome: "Users can delete own study content files"
- Operação: DELETE
- Target roles: authenticated
- USING expression: `bucket_id = 'study-content' AND split_part(name, '/', 1) = auth.uid()::text`

## Após Criar o Bucket

Depois de criar o bucket, tente fazer upload de um PDF novamente. O erro não deve mais aparecer.

