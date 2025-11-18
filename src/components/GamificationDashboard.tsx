import { useState, useEffect } from 'react';
import { Trophy, Flame, Star, Award, TrendingUp, X } from 'lucide-react';
import {
  getUserPoints,
  getUserStreak,
  getUserBadges,
  getPointsHistory,
  BADGE_DEFINITIONS,
  BadgeType,
} from '../lib/gamificationService';
import { UserPoints, StudyStreak, UserBadge, PointsHistory } from '../lib/supabase';

interface GamificationDashboardProps {
  onClose: () => void;
}

export function GamificationDashboard({ onClose }: GamificationDashboardProps) {
  const [points, setPoints] = useState<UserPoints | null>(null);
  const [streak, setStreak] = useState<StudyStreak | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [history, setHistory] = useState<PointsHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBadges, setShowBadges] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pointsData, streakData, badgesData, historyData] = await Promise.all([
        getUserPoints(),
        getUserStreak(),
        getUserBadges(),
        getPointsHistory(10),
      ]);

      setPoints(pointsData);
      setStreak(streakData);
      setBadges(badgesData);
      setHistory(historyData);
    } catch (error) {
      console.error('Erro ao carregar dados de gamificação:', error);
    } finally {
      setLoading(false);
    }
  };

  const earnedBadgeTypes = new Set(badges.map(b => b.badge_type));
  const allBadges = Object.values(BADGE_DEFINITIONS);

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      study_session: 'Sessão de Estudo',
      review: 'Revisão',
      badge: 'Badge',
      streak: 'Streak',
    };
    return labels[source] || source;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-12 text-center text-gray-600">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500 p-2 rounded-lg">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Gamificação</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Pontos e Streak */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Star className="w-6 h-6 text-yellow-600" />
                <h3 className="text-lg font-semibold text-gray-800">Pontos</h3>
              </div>
              <p className="text-4xl font-bold text-yellow-700">
                {points?.points || 0}
              </p>
              <p className="text-sm text-gray-600 mt-2">Total acumulado</p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Flame className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-800">Sequência</h3>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold text-red-700">
                  {streak?.current_streak || 0}
                </p>
                <p className="text-sm text-gray-600">dias</p>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Melhor: {streak?.longest_streak || 0} dias
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-800">Badges</h3>
              </div>
              <button
                onClick={() => setShowBadges(!showBadges)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {showBadges ? 'Ocultar' : 'Ver Todos'}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {badges.slice(0, showBadges ? badges.length : 4).map((badge) => {
                const definition = BADGE_DEFINITIONS[badge.badge_type as BadgeType];
                if (!definition) return null;

                return (
                  <div
                    key={badge.id}
                    className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-4 text-center"
                  >
                    <div className="text-4xl mb-2">{definition.icon}</div>
                    <p className="text-xs font-semibold text-gray-800 mb-1">
                      {definition.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(badge.earned_at).toLocaleDateString('pt-BR', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                );
              })}
            </div>

            {showBadges && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Todas as Conquistas ({badges.length}/{allBadges.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {allBadges.map((badgeDef) => {
                    const earned = earnedBadgeTypes.has(badgeDef.type);
                    return (
                      <div
                        key={badgeDef.type}
                        className={`border rounded-lg p-3 flex items-center gap-3 ${
                          earned
                            ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200'
                            : 'bg-gray-50 border-gray-200 opacity-60'
                        }`}
                      >
                        <div className="text-2xl">{badgeDef.icon}</div>
                        <div className="flex-1">
                          <p className={`text-sm font-semibold ${earned ? 'text-gray-800' : 'text-gray-500'}`}>
                            {badgeDef.name}
                          </p>
                          <p className={`text-xs ${earned ? 'text-gray-600' : 'text-gray-400'}`}>
                            {badgeDef.description}
                          </p>
                        </div>
                        {earned && (
                          <div className="text-green-600">
                            <Award className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Histórico de Pontos */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">Histórico Recente</h3>
            </div>
            {history.length === 0 ? (
              <p className="text-gray-600 text-center py-4">Nenhum histórico ainda</p>
            ) : (
              <div className="space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {item.description || getSourceLabel(item.source)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(item.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className={`text-lg font-bold ${
                      item.points > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.points > 0 ? '+' : ''}{item.points}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

