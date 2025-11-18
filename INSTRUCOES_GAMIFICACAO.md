# Instruções para Criar as Tabelas de Gamificação

O erro que você está vendo indica que as tabelas de gamificação não foram criadas no banco de dados Supabase. Siga estas instruções para criar as tabelas:

## Passo a Passo

1. **Acesse o Painel do Supabase**
   - Vá para https://app.supabase.com
   - Faça login e selecione seu projeto

2. **Abra o SQL Editor**
   - No menu lateral, clique em **SQL Editor**
   - Clique em **New query** (Nova consulta)

3. **Cole e Execute o Script SQL**

   Cole o seguinte script completo no editor:

```sql
-- Tabela de pontos do usuário
CREATE TABLE IF NOT EXISTS user_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  points integer DEFAULT 0 NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Tabela de streaks (sequências consecutivas)
CREATE TABLE IF NOT EXISTS study_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_streak integer DEFAULT 0 NOT NULL,
  longest_streak integer DEFAULT 0 NOT NULL,
  last_study_date date,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Tabela de badges conquistados
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_type text NOT NULL,
  earned_at timestamptz DEFAULT now() NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE(user_id, badge_type)
);

-- Histórico de pontos
CREATE TABLE IF NOT EXISTS points_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  points integer NOT NULL,
  source text NOT NULL,
  source_id uuid,
  description text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;

-- Políticas para user_points
CREATE POLICY "Users can view own points"
  ON user_points FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own points"
  ON user_points FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own points"
  ON user_points FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Políticas para study_streaks
CREATE POLICY "Users can view own streaks"
  ON study_streaks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks"
  ON study_streaks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own streaks"
  ON study_streaks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Políticas para user_badges
CREATE POLICY "Users can view own badges"
  ON user_badges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges"
  ON user_badges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Políticas para points_history
CREATE POLICY "Users can view own points history"
  ON points_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own points history"
  ON points_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_study_streaks_user_id ON study_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_type ON user_badges(badge_type);
CREATE INDEX IF NOT EXISTS idx_points_history_user_id ON points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_points_history_created_at ON points_history(created_at DESC);
```

4. **Execute o Script**
   - Clique no botão **Run** (ou pressione Ctrl+Enter)
   - Aguarde a confirmação de sucesso

5. **Verificar se as Tabelas Foram Criadas**
   - No menu lateral, vá em **Table Editor**
   - Você deve ver as seguintes tabelas:
     - `user_points`
     - `study_streaks`
     - `user_badges`
     - `points_history`

## Após Criar as Tabelas

1. **Recarregue a aplicação** no navegador
2. **Tente completar uma revisão novamente**
3. **Verifique o console** - os erros devem ter desaparecido
4. **Verifique o Dashboard** - os pontos e streak devem aparecer

## Se Ainda Houver Problemas

Se após executar o script ainda houver erros:

1. Verifique se todas as políticas foram criadas:
   - Vá em **Authentication** > **Policies** no painel do Supabase
   - Ou execute: `SELECT * FROM pg_policies WHERE tablename IN ('user_points', 'study_streaks', 'user_badges', 'points_history');`

2. Verifique se o RLS está habilitado:
   - Execute: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('user_points', 'study_streaks', 'user_badges', 'points_history');`

3. Se houver erros de permissão, certifique-se de estar logado como administrador do projeto no Supabase.

