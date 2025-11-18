import { useState, useEffect } from 'react';
import { Calendar, Check, Clock, X, Edit3, FileText } from 'lucide-react';
import { getScheduledReviews, completeReview, rescheduleReview } from '../lib/studyService';
import { ScheduledReview } from '../lib/supabase';

interface ScheduledReviewsViewProps {
  onClose: () => void;
  onRefresh: () => void;
  onViewContent?: (theme: string) => void;
}

export function ScheduledReviewsView({ onClose, onRefresh, onViewContent }: ScheduledReviewsViewProps) {
  const [reviews, setReviews] = useState<ScheduledReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState('');

  const loadReviews = async () => {
    try {
      const data = await getScheduledReviews();
      setReviews(data || []);
    } catch (error) {
      console.error('Erro ao carregar revisões:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleComplete = async (reviewId: string) => {
    try {
      await completeReview(reviewId);
      await loadReviews();
      onRefresh();
    } catch (error) {
      console.error('Erro ao completar revisão:', error);
    }
  };

  const handleReschedule = async (reviewId: string) => {
    if (!newDate) return;
    try {
      await rescheduleReview(reviewId, newDate);
      setEditingId(null);
      setNewDate('');
      await loadReviews();
      onRefresh();
    } catch (error) {
      console.error('Erro ao reagendar:', error);
    }
  };

  const getUrgencyLevel = (reviewDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const review = new Date(reviewDate);
    review.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((review.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'Atrasada', color: 'text-red-600 bg-red-50 border-red-200' };
    if (diffDays === 0) return { label: 'Hoje', color: 'text-orange-600 bg-orange-50 border-orange-200' };
    if (diffDays <= 3) return { label: 'Em breve', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
    return { label: 'Agendada', color: 'text-blue-600 bg-blue-50 border-blue-200' };
  };

  const groupedReviews = reviews.reduce((acc, review) => {
    const date = review.review_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(review);
    return acc;
  }, {} as Record<string, ScheduledReview[]>);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto my-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="bg-blue-500 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 truncate">Revisões Agendadas</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-2 p-1 touch-manipulation"
            aria-label="Fechar"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-600">Carregando...</div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma revisão agendada</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedReviews)
                .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                .map(([date, dateReviews]) => {
                  const formattedDate = new Date(date).toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  });

                  return (
                    <div key={date}>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3 capitalize">
                        {formattedDate}
                      </h3>
                      <div className="space-y-3">
                        {dateReviews.map((review) => {
                          const urgency = getUrgencyLevel(review.review_date);
                          const isEditing = editingId === review.id;

                          return (
                            <div
                              key={review.id}
                              className={`border rounded-lg p-4 ${urgency.color}`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-semibold text-gray-800">{review.theme}</h4>
                                    <span className="px-2 py-1 text-xs font-medium rounded bg-white bg-opacity-50">
                                      {urgency.label}
                                    </span>
                                    {review.was_rescheduled && (
                                      <span className="px-2 py-1 text-xs font-medium rounded bg-gray-200 text-gray-700">
                                        Reagendada
                                      </span>
                                    )}
                                  </div>
                                  {isEditing ? (
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-3">
                                      <input
                                        type="date"
                                        value={newDate}
                                        onChange={(e) => setNewDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm touch-manipulation"
                                      />
                                      <button
                                        onClick={() => handleReschedule(review.id)}
                                        className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 touch-manipulation"
                                      >
                                        Salvar
                                      </button>
                                      <button
                                        onClick={() => setEditingId(null)}
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 touch-manipulation"
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  ) : (
                                    <p className="text-xs sm:text-sm text-gray-600">
                                      Data da revisão: {new Date(review.review_date).toLocaleDateString('pt-BR')}
                                    </p>
                                  )}
                                </div>
                                {!isEditing && (
                                  <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                                    {onViewContent && (
                                      <button
                                        onClick={() => {
                                          onClose();
                                          onViewContent(review.theme);
                                        }}
                                        className="p-2 sm:p-2.5 text-gray-600 hover:text-indigo-600 transition-colors touch-manipulation"
                                        title="Ver conteúdo de estudo"
                                        aria-label="Ver conteúdo"
                                      >
                                        <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        setEditingId(review.id);
                                        setNewDate(review.review_date);
                                      }}
                                      className="p-2 sm:p-2.5 text-gray-600 hover:text-blue-600 transition-colors touch-manipulation"
                                      title="Reagendar"
                                      aria-label="Reagendar"
                                    >
                                      <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </button>
                                    <button
                                      onClick={() => handleComplete(review.id)}
                                      className="p-2 sm:p-2.5 text-gray-600 hover:text-green-600 transition-colors touch-manipulation"
                                      title="Marcar como completa"
                                      aria-label="Completar"
                                    >
                                      <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {reviews.length > 0 && (
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{reviews.length} revisões pendentes</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
