/*
  # Study Sessions and Reviews System

  1. New Tables
    - `study_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `theme` (text) - Nome do tema/matéria
      - `content` (text) - Conteúdo específico abordado
      - `total_questions` (integer) - Total de questões realizadas
      - `correct_questions` (integer) - Questões corretas
      - `accuracy_percentage` (numeric) - Porcentagem de acertos (calculada)
      - `session_date` (date) - Data da sessão
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `scheduled_reviews`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `study_session_id` (uuid, references study_sessions)
      - `theme` (text) - Nome do tema para referência rápida
      - `review_date` (date) - Data agendada para revisão
      - `is_completed` (boolean) - Se a revisão foi realizada
      - `was_rescheduled` (boolean) - Se foi reagendada manualmente
      - `created_at` (timestamptz)
      - `completed_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
    
  3. Important Notes
    - Sistema calcula automaticamente porcentagem de acertos
    - Agendamento automático baseado em desempenho (< 60% = 5 dias, ≥ 60% = 15 dias)
    - Histórico completo mantido para análise de progresso
*/

CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  theme text NOT NULL,
  content text NOT NULL,
  total_questions integer NOT NULL CHECK (total_questions > 0),
  correct_questions integer NOT NULL CHECK (correct_questions >= 0 AND correct_questions <= total_questions),
  accuracy_percentage numeric GENERATED ALWAYS AS (
    CASE 
      WHEN total_questions > 0 THEN (correct_questions::numeric / total_questions::numeric * 100)
      ELSE 0
    END
  ) STORED,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS scheduled_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  study_session_id uuid REFERENCES study_sessions(id) ON DELETE CASCADE NOT NULL,
  theme text NOT NULL,
  review_date date NOT NULL,
  is_completed boolean DEFAULT false NOT NULL,
  was_rescheduled boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz
);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own study sessions"
  ON study_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study sessions"
  ON study_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study sessions"
  ON study_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own study sessions"
  ON study_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own scheduled reviews"
  ON scheduled_reviews FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scheduled reviews"
  ON scheduled_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scheduled reviews"
  ON scheduled_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scheduled reviews"
  ON scheduled_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_theme ON study_sessions(theme);
CREATE INDEX IF NOT EXISTS idx_study_sessions_session_date ON study_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_reviews_user_id ON scheduled_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reviews_review_date ON scheduled_reviews(review_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_reviews_is_completed ON scheduled_reviews(is_completed);
