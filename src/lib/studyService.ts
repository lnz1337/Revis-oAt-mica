import { supabase } from './supabase';
import { addPoints, updateStreak, checkBadgesForStats, checkAndAwardBadge } from './gamificationService';

export interface CreateStudySessionInput {
  theme: string;
  content: string;
  total_questions: number;
  correct_questions: number;
  session_date: string;
}

export const createStudySession = async (input: CreateStudySessionInput) => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data: session, error: sessionError } = await supabase
    .from('study_sessions')
    .insert({
      user_id: user.id,
      theme: input.theme,
      content: input.content,
      total_questions: input.total_questions,
      correct_questions: input.correct_questions,
      session_date: input.session_date,
    })
    .select()
    .single();

  if (sessionError) throw sessionError;

  const accuracyPercentage = (input.correct_questions / input.total_questions) * 100;
  const daysUntilReview = accuracyPercentage < 60 ? 5 : 15;

  const reviewDate = new Date(input.session_date);
  reviewDate.setDate(reviewDate.getDate() + daysUntilReview);

  const { error: reviewError } = await supabase
    .from('scheduled_reviews')
    .insert({
      user_id: user.id,
      study_session_id: session.id,
      theme: input.theme,
      review_date: reviewDate.toISOString().split('T')[0],
    });

  if (reviewError) throw reviewError;

  // Sistema de gamificação
  try {
    // Adicionar pontos por sessão (base + bônus por acurácia)
    const basePoints = 10;
    const accuracyBonus = Math.floor(accuracyPercentage / 10); // Bônus baseado na acurácia
    const totalPoints = basePoints + accuracyBonus;
    
    await addPoints(
      totalPoints,
      'study_session',
      session.id,
      `Sessão: ${input.theme} (${accuracyPercentage.toFixed(0)}% de acertos)`
    );

    // Atualizar streak
    await updateStreak(input.session_date);

    // Verificar se é sessão perfeita
    if (accuracyPercentage === 100) {
      await checkAndAwardBadge('perfect_session');
    }

    // Obter estatísticas para verificar badges
    const allSessions = await getStudySessions();
    const uniqueThemes = new Set(allSessions.map(s => s.theme));
    const completedReviews = await supabase
      .from('scheduled_reviews')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_completed', true);
    
    const streak = await supabase
      .from('study_streaks')
      .select('current_streak')
      .eq('user_id', user.id)
      .single();

    await checkBadgesForStats({
      totalSessions: allSessions.length,
      totalReviews: completedReviews.data?.length || 0,
      totalThemes: uniqueThemes.size,
      currentStreak: streak.data?.current_streak || 0,
      hasPerfectSession: allSessions.some(s => s.accuracy_percentage === 100),
    });
  } catch (gamificationError) {
    console.error('Erro no sistema de gamificação:', gamificationError);
    // Não falhar a criação da sessão se houver erro na gamificação
  }

  return session;
};

export const getStudySessions = async () => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('session_date', { ascending: false });

  if (error) throw error;
  return data;
};

export const getScheduledReviews = async () => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('scheduled_reviews')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_completed', false)
    .order('review_date', { ascending: true });

  if (error) throw error;
  return data;
};

export const completeReview = async (reviewId: string) => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Buscar dados da revisão antes de completar
  const { data: review, error: reviewFetchError } = await supabase
    .from('scheduled_reviews')
    .select('*')
    .eq('id', reviewId)
    .single();

  if (reviewFetchError) {
    throw new Error(`Erro ao buscar revisão: ${reviewFetchError.message}`);
  }

  const { error } = await supabase
    .from('scheduled_reviews')
    .update({
      is_completed: true,
      completed_at: new Date().toISOString(),
    })
    .eq('id', reviewId);

  if (error) throw error;

  // Sistema de gamificação
  try {
    console.log('Iniciando sistema de gamificação para revisão:', reviewId);
    
    // Adicionar pontos por revisão
    try {
      await addPoints(
        15,
        'review',
        reviewId,
        `Revisão: ${review?.theme || 'Tema'}`
      );
      console.log('Pontos adicionados com sucesso');
    } catch (pointsError) {
      console.error('Erro ao adicionar pontos:', pointsError);
      throw pointsError; // Re-throw para não continuar se pontos falharem
    }

    // Aguardar um pouco para garantir que o update foi processado
    await new Promise(resolve => setTimeout(resolve, 500));

    // Atualizar streak com a data de hoje (completar revisão também conta como atividade)
    try {
      const today = new Date().toISOString().split('T')[0];
      await updateStreak(today);
      console.log('Streak atualizado com sucesso');
    } catch (streakError) {
      console.error('Erro ao atualizar streak:', streakError);
      // Não falhar se streak der erro, mas logar
    }

    // Aguardar mais um pouco para garantir que tudo foi processado
    await new Promise(resolve => setTimeout(resolve, 300));

    // Obter estatísticas para verificar badges
    const allSessions = await getStudySessions();
    const uniqueThemes = new Set(allSessions.map(s => s.theme));
    
    // Buscar revisões completadas (incluindo a que acabou de ser completada)
    const { data: completedReviewsData, error: reviewsError } = await supabase
      .from('scheduled_reviews')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_completed', true);
    
    if (reviewsError) {
      console.error('Erro ao buscar revisões completadas:', reviewsError);
      throw new Error(`Erro ao buscar revisões: ${reviewsError.message}`);
    }
    
    const { data: streakData, error: streakError } = await supabase
      .from('study_streaks')
      .select('current_streak')
      .eq('user_id', user.id)
      .maybeSingle();

    if (streakError && streakError.code !== 'PGRST116') {
      console.error('Erro ao buscar streak:', streakError);
    }

    const totalReviews = completedReviewsData?.length || 0;
    
    console.log('Verificando badges com estatísticas:', {
      totalSessions: allSessions.length,
      totalReviews,
      totalThemes: uniqueThemes.size,
      currentStreak: streakData?.current_streak || 0,
    });

    try {
      const newBadges = await checkBadgesForStats({
        totalSessions: allSessions.length,
        totalReviews,
        totalThemes: uniqueThemes.size,
        currentStreak: streakData?.current_streak || 0,
        hasPerfectSession: allSessions.some(s => s.accuracy_percentage === 100),
      });

      if (newBadges.length > 0) {
        console.log('Novos badges conquistados:', newBadges);
      } else {
        console.log('Nenhum novo badge conquistado');
      }
    } catch (badgesError) {
      console.error('Erro ao verificar badges:', badgesError);
      // Não falhar se badges derem erro, mas logar
    }
  } catch (gamificationError) {
    console.error('Erro no sistema de gamificação:', gamificationError);
    // Logar o erro completo para debug
    if (gamificationError instanceof Error) {
      console.error('Detalhes do erro:', {
        message: gamificationError.message,
        stack: gamificationError.stack,
      });
    }
    // Não falhar a conclusão da revisão se houver erro na gamificação
    // mas vamos logar para debug
  }
};

export const rescheduleReview = async (reviewId: string, newDate: string) => {
  const { error } = await supabase
    .from('scheduled_reviews')
    .update({
      review_date: newDate,
      was_rescheduled: true,
    })
    .eq('id', reviewId);

  if (error) throw error;
};

export const getThemeHistory = async (theme: string) => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('theme', theme)
    .order('session_date', { ascending: false });

  if (error) throw error;
  return data;
};

export const deleteTheme = async (theme: string) => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Buscar todas as sessões do tema para obter os IDs
  const { data: sessions, error: sessionsError } = await supabase
    .from('study_sessions')
    .select('id')
    .eq('user_id', user.id)
    .eq('theme', theme);

  if (sessionsError) throw sessionsError;

  const sessionIds = sessions?.map(s => s.id) || [];

  // Deletar revisões agendadas relacionadas (as revisões são deletadas automaticamente por CASCADE,
  // mas vamos deletar explicitamente para garantir)
  if (sessionIds.length > 0) {
    const { error: reviewsError } = await supabase
      .from('scheduled_reviews')
      .delete()
      .eq('user_id', user.id)
      .eq('theme', theme);

    if (reviewsError) {
      console.error('Erro ao deletar revisões:', reviewsError);
      // Continuar mesmo se houver erro, pois o CASCADE deve deletar
    }
  }

  // Deletar todas as sessões do tema
  const { error: deleteError } = await supabase
    .from('study_sessions')
    .delete()
    .eq('user_id', user.id)
    .eq('theme', theme);

  if (deleteError) throw deleteError;

  // Nota: O conteúdo de estudo (study_content) não é deletado automaticamente,
  // pois pode ser útil manter mesmo após deletar as sessões
  // Se quiser deletar também, adicione aqui:
  // await supabase.from('study_content').delete().eq('user_id', user.id).eq('theme', theme);
};
