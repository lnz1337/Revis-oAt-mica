import { useState, useEffect } from 'react';
import { TrendingUp, X, Calendar, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { getThemeHistory } from '../lib/studyService';
import { StudySession } from '../lib/supabase';

interface ThemeHistoryProps {
  theme: string;
  onClose: () => void;
  onViewContent?: (theme: string) => void;
}

export function ThemeHistory({ theme, onClose, onViewContent }: ThemeHistoryProps) {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await getThemeHistory(theme);
        setSessions(data || []);
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [theme]);

  const stats = sessions.length > 0 ? {
    totalSessions: sessions.length,
    averageAccuracy: sessions.reduce((sum, s) => sum + s.accuracy_percentage, 0) / sessions.length,
    bestAccuracy: Math.max(...sessions.map(s => s.accuracy_percentage)),
    worstAccuracy: Math.min(...sessions.map(s => s.accuracy_percentage)),
    totalQuestions: sessions.reduce((sum, s) => sum + s.total_questions, 0),
    totalCorrect: sessions.reduce((sum, s) => sum + s.correct_questions, 0),
  } : null;

  const getProgressTrend = () => {
    if (sessions.length < 2) return null;
    const recent = sessions.slice(0, 3);
    const older = sessions.slice(3, 6);
    if (older.length === 0) return null;

    const recentAvg = recent.reduce((sum, s) => sum + s.accuracy_percentage, 0) / recent.length;
    const olderAvg = older.reduce((sum, s) => sum + s.accuracy_percentage, 0) / older.length;

    return recentAvg - olderAvg;
  };

  const trend = getProgressTrend();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto my-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="bg-green-500 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 truncate">{theme}</h2>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Histórico de desempenho</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {onViewContent && (
              <button
                onClick={() => {
                  onClose();
                  onViewContent(theme);
                }}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm touch-manipulation"
              >
                <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Conteúdo</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 touch-manipulation"
              aria-label="Fechar"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-600">Carregando...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma sessão encontrada</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-blue-700 font-medium mb-1">Total de Sessões</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-900">{stats?.totalSessions}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-green-700 font-medium mb-1">Média Geral</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-900">
                    {stats?.averageAccuracy.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-purple-700 font-medium mb-1">Melhor Resultado</p>
                  <p className="text-2xl sm:text-3xl font-bold text-purple-900">
                    {stats?.bestAccuracy.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-orange-700 font-medium mb-1">Total de Questões</p>
                  <p className="text-2xl sm:text-3xl font-bold text-orange-900">
                    {stats?.totalQuestions}
                  </p>
                </div>
              </div>

              {trend !== null && (
                <div className={`mb-6 p-4 rounded-lg border ${
                  trend > 0
                    ? 'bg-green-50 border-green-200'
                    : trend < 0
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-3">
                    {trend > 0 ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-orange-600" />
                    )}
                    <div>
                      <p className={`font-semibold ${
                        trend > 0 ? 'text-green-800' : trend < 0 ? 'text-orange-800' : 'text-gray-800'
                      }`}>
                        {trend > 0 ? 'Tendência de melhora!' : 'Necessita atenção'}
                      </p>
                      <p className="text-sm text-gray-700">
                        {trend > 0
                          ? `Suas últimas sessões estão ${trend.toFixed(1)}% melhores que as anteriores`
                          : `Suas últimas sessões estão ${Math.abs(trend).toFixed(1)}% abaixo das anteriores`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <h3 className="text-lg font-bold text-gray-800 mb-4">Histórico de Sessões</h3>
              <div className="space-y-3">
                {sessions.map((session, index) => (
                  <div
                    key={session.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0 mb-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                          #{sessions.length - index}
                        </div>
                        <div>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                            <span className="text-xs sm:text-sm font-medium text-gray-700">
                              {new Date(session.session_date).toLocaleDateString('pt-BR', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className={`text-2xl sm:text-3xl font-bold ${
                        session.accuracy_percentage >= 60 ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {session.accuracy_percentage.toFixed(0)}%
                      </div>
                    </div>
                    <p className="text-sm sm:text-base text-gray-700 mb-2 break-words">{session.content}</p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                      <span>{session.correct_questions}/{session.total_questions} questões corretas</span>
                      <span className="hidden sm:inline">•</span>
                      <span>
                        {session.accuracy_percentage >= 60 ? 'Revisão em 15 dias' : 'Revisão em 5 dias'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Análise de Progresso</h4>
                <div className="space-y-1 text-sm text-gray-700">
                  <p>• Taxa de acerto total: {stats?.totalCorrect}/{stats?.totalQuestions} ({((stats?.totalCorrect || 0) / (stats?.totalQuestions || 1) * 100).toFixed(1)}%)</p>
                  <p>• Melhor desempenho: {stats?.bestAccuracy.toFixed(1)}%</p>
                  <p>• Desempenho mais baixo: {stats?.worstAccuracy.toFixed(1)}%</p>
                  <p>• Variação: {((stats?.bestAccuracy || 0) - (stats?.worstAccuracy || 0)).toFixed(1)}%</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
