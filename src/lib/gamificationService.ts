import { supabase, UserPoints, StudyStreak, UserBadge, PointsHistory } from './supabase';

export type BadgeType =
  | 'first_session'
  | '10_sessions'
  | '50_sessions'
  | '100_sessions'
  | '5_reviews'
  | '10_reviews'
  | '25_reviews'
  | '5_themes'
  | '10_themes'
  | 'streak_7'
  | 'streak_30'
  | 'streak_100'
  | 'perfect_session'
  | 'improvement';

export interface BadgeDefinition {
  type: BadgeType;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const BADGE_DEFINITIONS: Record<BadgeType, BadgeDefinition> = {
  first_session: {
    type: 'first_session',
    name: 'Primeiro Passo',
    description: 'Complete sua primeira sessão de estudo',
    icon: '🎯',
    color: 'bg-blue-500',
  },
  '10_sessions': {
    type: '10_sessions',
    name: 'Dedicação',
    description: 'Complete 10 sessões de estudo',
    icon: '📚',
    color: 'bg-green-500',
  },
  '50_sessions': {
    type: '50_sessions',
    name: 'Persistência',
    description: 'Complete 50 sessões de estudo',
    icon: '🔥',
    color: 'bg-orange-500',
  },
  '100_sessions': {
    type: '100_sessions',
    name: 'Mestre',
    description: 'Complete 100 sessões de estudo',
    icon: '👑',
    color: 'bg-purple-500',
  },
  '5_reviews': {
    type: '5_reviews',
    name: 'Revisor',
    description: 'Complete 5 revisões',
    icon: '🔄',
    color: 'bg-blue-500',
  },
  '10_reviews': {
    type: '10_reviews',
    name: 'Revisor Experiente',
    description: 'Complete 10 revisões',
    icon: '⭐',
    color: 'bg-yellow-500',
  },
  '25_reviews': {
    type: '25_reviews',
    name: 'Mestre da Revisão',
    description: 'Complete 25 revisões',
    icon: '🏆',
    color: 'bg-red-500',
  },
  '5_themes': {
    type: '5_themes',
    name: 'Explorador',
    description: 'Domine 5 temas diferentes',
    icon: '🌍',
    color: 'bg-indigo-500',
  },
  '10_themes': {
    type: '10_themes',
    name: 'Polímata',
    description: 'Domine 10 temas diferentes',
    icon: '🧠',
    color: 'bg-pink-500',
  },
  streak_7: {
    type: 'streak_7',
    name: 'Semana de Fogo',
    description: '7 dias consecutivos de estudo',
    icon: '🔥',
    color: 'bg-orange-500',
  },
  streak_30: {
    type: 'streak_30',
    name: 'Mês de Dedicação',
    description: '30 dias consecutivos de estudo',
    icon: '💪',
    color: 'bg-red-500',
  },
  streak_100: {
    type: 'streak_100',
    name: 'Lenda',
    description: '100 dias consecutivos de estudo',
    icon: '🌟',
    color: 'bg-purple-500',
  },
  perfect_session: {
    type: 'perfect_session',
    name: 'Perfeição',
    description: 'Sessão com 100% de acertos',
    icon: '✨',
    color: 'bg-yellow-500',
  },
  improvement: {
    type: 'improvement',
    name: 'Evolução',
    description: 'Melhoria significativa de desempenho',
    icon: '📈',
    color: 'bg-green-500',
  },
};

// Obter pontos do usuário
export const getUserPoints = async (): Promise<UserPoints | null> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('user_points')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  // Se não existir, criar registro inicial
  if (!data) {
    const { data: newData, error: insertError } = await supabase
      .from('user_points')
      .insert({ user_id: user.id, points: 0 })
      .select()
      .single();

    if (insertError) throw insertError;
    return newData;
  }

  return data;
};

// Adicionar pontos
export const addPoints = async (
  points: number,
  source: string,
  sourceId?: string,
  description?: string
): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Atualizar ou criar registro de pontos
  const { data: existingPoints, error: fetchError } = await supabase
    .from('user_points')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  // Se houver erro diferente de "não encontrado", lançar
  if (fetchError && fetchError.code !== 'PGRST116') {
    throw new Error(`Erro ao buscar pontos: ${fetchError.message}`);
  }

  if (existingPoints) {
    const { error: updateError } = await supabase
      .from('user_points')
      .update({
        points: existingPoints.points + points,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (updateError) {
      throw new Error(`Erro ao atualizar pontos: ${updateError.message}`);
    }
  } else {
    const { error: insertError } = await supabase
      .from('user_points')
      .insert({
        user_id: user.id,
        points: points,
      });

    if (insertError) {
      throw new Error(`Erro ao criar registro de pontos: ${insertError.message}`);
    }
  }

  // Registrar no histórico
  const { error: historyError } = await supabase
    .from('points_history')
    .insert({
      user_id: user.id,
      points: points,
      source: source,
      source_id: sourceId || null,
      description: description || null,
    });

  if (historyError) {
    throw new Error(`Erro ao registrar histórico de pontos: ${historyError.message}`);
  }
};

// Obter streak do usuário
export const getUserStreak = async (): Promise<StudyStreak | null> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('study_streaks')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  // Se não existir, criar registro inicial
  if (!data) {
    const { data: newData, error: insertError } = await supabase
      .from('study_streaks')
      .insert({
        user_id: user.id,
        current_streak: 0,
        longest_streak: 0,
        last_study_date: null,
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return newData;
  }

  return data;
};

// Atualizar streak após sessão de estudo
export const updateStreak = async (studyDate: string): Promise<StudyStreak> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const streak = await getUserStreak();
  const today = new Date(studyDate);
  today.setHours(0, 0, 0, 0);

  let newStreak = 1;
  let longestStreak = streak?.longest_streak || 0;

  if (streak?.last_study_date) {
    const lastDate = new Date(streak.last_study_date);
    lastDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Mesmo dia, manter streak
      newStreak = streak.current_streak;
    } else if (diffDays === 1) {
      // Dia consecutivo, incrementar
      newStreak = streak.current_streak + 1;
    }
    // Se diffDays > 1, streak quebrado, começar do 1
  }

  if (newStreak > longestStreak) {
    longestStreak = newStreak;
  }

  const { data, error } = await supabase
    .from('study_streaks')
    .upsert({
      user_id: user.id,
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_study_date: studyDate,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Obter badges do usuário
export const getUserBadges = async (): Promise<UserBadge[]> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('user_badges')
    .select('*')
    .eq('user_id', user.id)
    .order('earned_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Verificar e conceder badge
export const checkAndAwardBadge = async (badgeType: BadgeType, metadata?: Record<string, any>): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Verificar se já possui o badge
  const { data: existing, error: checkError } = await supabase
    .from('user_badges')
    .select('*')
    .eq('user_id', user.id)
    .eq('badge_type', badgeType)
    .maybeSingle();

  // Se houver erro diferente de "não encontrado", lançar
  if (checkError && checkError.code !== 'PGRST116') {
    throw checkError;
  }

  if (existing) {
    return false; // Já possui o badge
  }

  // Conceder badge
  const { error: insertError } = await supabase
    .from('user_badges')
    .insert({
      user_id: user.id,
      badge_type: badgeType,
      metadata: metadata || {},
    });

  if (insertError) {
    // Se for erro de duplicata, significa que foi concedido entre a verificação e a inserção
    if (insertError.code === '23505') {
      return false;
    }
    throw insertError;
  }

  // Adicionar pontos por badge
  try {
    await addPoints(50, 'badge', undefined, `Badge: ${BADGE_DEFINITIONS[badgeType].name}`);
  } catch (pointsError) {
    console.error('Erro ao adicionar pontos do badge:', pointsError);
    // Não falhar se houver erro ao adicionar pontos
  }

  return true; // Badge concedido
};

// Verificar badges baseados em estatísticas
export const checkBadgesForStats = async (stats: {
  totalSessions: number;
  totalReviews: number;
  totalThemes: number;
  currentStreak: number;
  hasPerfectSession: boolean;
}): Promise<BadgeType[]> => {
  const newBadges: BadgeType[] = [];

  // Badges de sessões
  if (stats.totalSessions === 1) {
    const awarded = await checkAndAwardBadge('first_session');
    if (awarded) newBadges.push('first_session');
  }
  if (stats.totalSessions >= 10) {
    const awarded = await checkAndAwardBadge('10_sessions');
    if (awarded) newBadges.push('10_sessions');
  }
  if (stats.totalSessions >= 50) {
    const awarded = await checkAndAwardBadge('50_sessions');
    if (awarded) newBadges.push('50_sessions');
  }
  if (stats.totalSessions >= 100) {
    const awarded = await checkAndAwardBadge('100_sessions');
    if (awarded) newBadges.push('100_sessions');
  }

  // Badges de revisões
  if (stats.totalReviews >= 5) {
    const awarded = await checkAndAwardBadge('5_reviews');
    if (awarded) newBadges.push('5_reviews');
  }
  if (stats.totalReviews >= 10) {
    const awarded = await checkAndAwardBadge('10_reviews');
    if (awarded) newBadges.push('10_reviews');
  }
  if (stats.totalReviews >= 25) {
    const awarded = await checkAndAwardBadge('25_reviews');
    if (awarded) newBadges.push('25_reviews');
  }

  // Badges de temas
  if (stats.totalThemes >= 5) {
    const awarded = await checkAndAwardBadge('5_themes');
    if (awarded) newBadges.push('5_themes');
  }
  if (stats.totalThemes >= 10) {
    const awarded = await checkAndAwardBadge('10_themes');
    if (awarded) newBadges.push('10_themes');
  }

  // Badges de streak
  if (stats.currentStreak >= 7) {
    const awarded = await checkAndAwardBadge('streak_7');
    if (awarded) newBadges.push('streak_7');
  }
  if (stats.currentStreak >= 30) {
    const awarded = await checkAndAwardBadge('streak_30');
    if (awarded) newBadges.push('streak_30');
  }
  if (stats.currentStreak >= 100) {
    const awarded = await checkAndAwardBadge('streak_100');
    if (awarded) newBadges.push('streak_100');
  }

  // Badge de sessão perfeita
  if (stats.hasPerfectSession) {
    const awarded = await checkAndAwardBadge('perfect_session');
    if (awarded) newBadges.push('perfect_session');
  }

  return newBadges;
};

// Obter histórico de pontos
export const getPointsHistory = async (limit: number = 20): Promise<PointsHistory[]> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('points_history')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

