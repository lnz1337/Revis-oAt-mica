/*
  # Gamification System

  1. New Tables
    - `user_points`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `points` (integer) - Total de pontos acumulados
      - `updated_at` (timestamptz)
    
    - `study_streaks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `current_streak` (integer) - Dias consecutivos atuais
      - `longest_streak` (integer) - Maior sequência já alcançada
      - `last_study_date` (date) - Última data de estudo
      - `updated_at` (timestamptz)
    
    - `user_badges`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `badge_type` (text) - Tipo do badge
      - `earned_at` (timestamptz) - Quando foi conquistado
      - `metadata` (jsonb) - Dados adicionais do badge
    
    - `points_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `points` (integer) - Pontos ganhos/perdidos
      - `source` (text) - Origem dos pontos (study_session, review, etc)
      - `source_id` (uuid) - ID da origem
      - `created_at` (timestamptz)

  2. Badge Types
    - 'first_session' - Primeira sessão de estudo
    - '10_sessions' - 10 sessões completadas
    - '50_sessions' - 50 sessões completadas
    - '100_sessions' - 100 sessões completadas
    - '5_reviews' - 5 revisões concluídas
    - '10_reviews' - 10 revisões concluídas
    - '25_reviews' - 25 revisões concluídas
    - '5_themes' - Dominou 5 temas
    - '10_themes' - Dominou 10 temas
    - 'streak_7' - 7 dias consecutivos
    - 'streak_30' - 30 dias consecutivos
    - 'streak_100' - 100 dias consecutivos
    - 'perfect_session' - Sessão com 100% de acertos
    - 'improvement' - Melhoria significativa de desempenho

  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

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

-- Habilitar RLS
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_study_streaks_user_id ON study_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_type ON user_badges(badge_type);
CREATE INDEX IF NOT EXISTS idx_points_history_user_id ON points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_points_history_created_at ON points_history(created_at DESC);

