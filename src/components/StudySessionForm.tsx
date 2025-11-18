import { useState } from 'react';
import { BookOpen, X } from 'lucide-react';
import { createStudySession } from '../lib/studyService';

interface StudySessionFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function StudySessionForm({ onClose, onSuccess }: StudySessionFormProps) {
  const [theme, setTheme] = useState('');
  const [content, setContent] = useState('');
  const [totalQuestions, setTotalQuestions] = useState('');
  const [correctQuestions, setCorrectQuestions] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accuracyPercentage = totalQuestions && correctQuestions
    ? ((parseInt(correctQuestions) / parseInt(totalQuestions)) * 100).toFixed(1)
    : null;

  // Função para formatar data no formato DD/MM/AAAA
  const formatDateToBrazilian = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createStudySession({
        theme,
        content,
        total_questions: parseInt(totalQuestions),
        correct_questions: parseInt(correctQuestions),
        session_date: sessionDate,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar sessão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto my-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="bg-blue-500 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 truncate">Nova Sessão de Estudo</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-2 p-1 touch-manipulation"
            aria-label="Fechar"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tema / Matéria
            </label>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              required
              placeholder="Ex: Matemática - Funções Quadráticas"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Conteúdo Específico
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={3}
              placeholder="Descreva o que foi estudado nesta sessão..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total de Questões
              </label>
              <input
                type="number"
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(e.target.value)}
                required
                min="1"
                placeholder="20"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Questões Corretas
              </label>
              <input
                type="number"
                value={correctQuestions}
                onChange={(e) => setCorrectQuestions(e.target.value)}
                required
                min="0"
                max={totalQuestions || undefined}
                placeholder="15"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {accuracyPercentage && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Taxa de Acerto
                </span>
                <span className={`text-2xl font-bold ${
                  parseFloat(accuracyPercentage) >= 60 ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {accuracyPercentage}%
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Revisão agendada para {parseFloat(accuracyPercentage) >= 60 ? '15 dias' : '5 dias'}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data da Sessão
            </label>
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  required
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                  style={{
                    colorScheme: 'light',
                  }}
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-blue-700 font-medium">Data selecionada:</span>
                  <span className="text-sm font-bold text-blue-900">
                    {formatDateToBrazilian(sessionDate)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                📅 Clique no campo acima para abrir o calendário • Formato: DD/MM/AAAA
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors touch-manipulation text-sm sm:text-base"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-sm sm:text-base"
            >
              {loading ? 'Salvando...' : 'Registrar Sessão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
