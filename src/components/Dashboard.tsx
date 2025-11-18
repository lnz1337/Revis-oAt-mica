import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, BookOpen, Plus, FileText, Trophy, Trash2 } from 'lucide-react';
import { getStudySessions, deleteTheme } from '../lib/studyService';
import { StudySession } from '../lib/supabase';
import { getUserPoints, getUserStreak } from '../lib/gamificationService';

interface DashboardProps {
  onNewSession: () => void;
  onViewReviews: () => void;
  onViewHistory: (theme: string) => void;
  onViewContent: (theme: string) => void;
  onViewGamification: () => void;
}

export function Dashboard({ onNewSession, onViewReviews, onViewHistory, onViewContent, onViewGamification }: DashboardProps) {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<number | null>(null);
  const [streak, setStreak] = useState<number | null>(null);

  const loadSessions = async () => {
    try {
      const data = await getStudySessions();
      setSessions(data || []);
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
    loadGamification();
  }, []);

  const loadGamification = async () => {
    try {
      const [pointsData, streakData] = await Promise.all([
        getUserPoints(),
        getUserStreak(),
      ]);
      setPoints(pointsData?.points || 0);
      setStreak(streakData?.current_streak || 0);
    } catch (error) {
      console.error('Erro ao carregar gamificação:', error);
    }
  };

  const handleDeleteTheme = async (theme: string) => {
    const themeStats = sessions.filter(s => s.theme === theme);
    const sessionCount = themeStats.length;
    
    const confirmMessage = `Tem certeza que deseja excluir o tema "${theme}"?\n\n` +
      `Isso irá deletar:\n` +
      `• ${sessionCount} sessão${sessionCount !== 1 ? 'ões' : ''} de estudo\n` +
      `• Todas as revisões agendadas relacionadas\n\n` +
      `Esta ação não pode ser desfeita.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await deleteTheme(theme);
      await loadSessions();
      await loadGamification();
    } catch (error) {
      console.error('Erro ao deletar tema:', error);
      alert('Erro ao deletar tema. Por favor, tente novamente.');
    }
  };

  const themeStats = sessions.reduce((acc, session) => {
    if (!acc[session.theme]) {
      acc[session.theme] = {
        count: 0,
        totalAccuracy: 0,
        lastSession: session.session_date,
        lowestAccuracy: 100,
      };
    }
    acc[session.theme].count++;
    acc[session.theme].totalAccuracy += session.accuracy_percentage;
    acc[session.theme].lowestAccuracy = Math.min(
      acc[session.theme].lowestAccuracy,
      session.accuracy_percentage
    );
    if (session.session_date > acc[session.theme].lastSession) {
      acc[session.theme].lastSession = session.session_date;
    }
    return acc;
  }, {} as Record<string, { count: number; totalAccuracy: number; lastSession: string; lowestAccuracy: number }>);

  const overallStats = {
    totalSessions: sessions.length,
    averageAccuracy: sessions.length > 0
      ? sessions.reduce((sum, s) => sum + s.accuracy_percentage, 0) / sessions.length
      : 0,
    uniqueThemes: Object.keys(themeStats).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-gray-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-1 sm:mb-2">Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-600">Acompanhe seu progresso e revisões agendadas</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={onViewGamification}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-xl font-medium hover:from-yellow-500 hover:to-orange-500 transition-colors shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
              {points !== null && points > 0 && (
                <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs sm:text-sm">
                  {points} pts
                </span>
              )}
              {streak !== null && streak > 0 && (
                <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs sm:text-sm flex items-center gap-1">
                  🔥 {streak}
                </span>
              )}
            </button>
            <button
              onClick={onViewReviews}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition-colors shadow-sm flex items-center justify-center gap-2 border border-blue-200 text-sm sm:text-base"
            >
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Revisões Agendadas</span>
              <span className="sm:hidden">Revisões</span>
            </button>
            <button
              onClick={onNewSession}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              Nova Sessão
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-100 p-2 sm:p-3 rounded-lg">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total de Sessões</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-800">{overallStats.totalSessions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-green-100 p-2 sm:p-3 rounded-lg">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Média de Acertos</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-800">
                  {overallStats.averageAccuracy.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-purple-100 p-2 sm:p-3 rounded-lg">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Temas Estudados</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-800">{overallStats.uniqueThemes}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Temas Estudados</h2>
          {Object.keys(themeStats).length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-sm sm:text-base text-gray-600 mb-4">Nenhuma sessão de estudo registrada ainda</p>
              <button
                onClick={onNewSession}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors text-sm sm:text-base"
              >
                Registrar Primeira Sessão
              </button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {Object.entries(themeStats)
                .sort((a, b) => b[1].lastSession.localeCompare(a[1].lastSession))
                .map(([theme, stats]) => {
                  const avgAccuracy = stats.totalAccuracy / stats.count;
                  const isLowPerformance = stats.lowestAccuracy < 60;

                  return (
                    <div
                      key={theme}
                      className="border border-gray-200 rounded-lg p-4 sm:p-5 hover:border-blue-300 hover:shadow-md transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-800 break-words">{theme}</h3>
                            {isLowPerformance && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded whitespace-nowrap">
                                Atenção
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-600">
                            <span>{stats.count} sessões</span>
                            <span>Média: {avgAccuracy.toFixed(1)}%</span>
                            <span className="break-words">Última: {new Date(stats.lastSession).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <div className={`text-2xl sm:text-3xl font-bold ${
                            avgAccuracy >= 60 ? 'text-green-600' : 'text-orange-600'
                          }`}>
                            {avgAccuracy.toFixed(0)}%
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => onViewHistory(theme)}
                            className="flex-1 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors text-sm touch-manipulation"
                          >
                            Ver Histórico
                          </button>
                          <button
                            onClick={() => onViewContent(theme)}
                            className="flex-1 px-4 py-2.5 bg-indigo-50 text-indigo-600 rounded-lg font-medium hover:bg-indigo-100 transition-colors text-sm flex items-center justify-center gap-2 touch-manipulation"
                          >
                            <FileText className="w-4 h-4" />
                            Conteúdo
                          </button>
                        </div>
                        <button
                          onClick={() => handleDeleteTheme(theme)}
                          className="w-full px-4 py-2.5 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors text-sm flex items-center justify-center gap-2 touch-manipulation border border-red-200"
                          title="Excluir tema"
                        >
                          <Trash2 className="w-4 h-4" />
                          Excluir Tema
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mt-4 sm:mt-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Histórico Recente</h2>
          {sessions.length === 0 ? (
            <p className="text-sm sm:text-base text-gray-600 text-center py-6 sm:py-8">Nenhuma sessão registrada</p>
          ) : (
            <div className="space-y-3">
              {sessions.slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 text-sm sm:text-base break-words">{session.theme}</h4>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{session.content}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(session.session_date).toLocaleDateString('pt-BR')} •{' '}
                        {session.correct_questions}/{session.total_questions} questões corretas
                      </p>
                    </div>
                    <div className={`text-xl sm:text-2xl font-bold ${
                      session.accuracy_percentage >= 60 ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {session.accuracy_percentage.toFixed(0)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
