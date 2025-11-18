import { useState, useEffect } from 'react';
import { FileText, Link as LinkIcon, File, Plus, X, ExternalLink, Trash2, Edit2, Save } from 'lucide-react';
import { createContent, getContentByTheme, deleteContent, updateContent, getFileUrl, ContentType } from '../lib/contentService';
import { StudyContent } from '../lib/supabase';

interface StudyContentManagerProps {
  theme: string;
  onClose: () => void;
}

export function StudyContentManager({ theme, onClose }: StudyContentManagerProps) {
  const [contents, setContents] = useState<StudyContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [contentType, setContentType] = useState<ContentType>('note');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    loadContent();
  }, [theme]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const data = await getContentByTheme(theme);
      setContents(data || []);
    } catch (err) {
      console.error('Erro ao carregar conteúdo:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar conteúdo');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await createContent({
        theme,
        content_type: contentType,
        title,
        content: contentType !== 'pdf' ? content : undefined,
        file: contentType === 'pdf' ? file || undefined : undefined,
      });
      
      setTitle('');
      setContent('');
      setFile(null);
      setShowAddForm(false);
      await loadContent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar conteúdo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este conteúdo?')) return;

    try {
      await deleteContent(id);
      await loadContent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir conteúdo');
    }
  };

  const handleEdit = (item: StudyContent) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditContent(item.content || '');
  };

  const handleSaveEdit = async (id: string) => {
    try {
      await updateContent(id, {
        title: editTitle,
        content: editContent,
      });
      setEditingId(null);
      await loadContent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar conteúdo');
    }
  };

  const handleDownloadPdf = async (item: StudyContent) => {
    if (!item.file_path) return;
    
    try {
      const url = await getFileUrl(item.file_path);
      window.open(url, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao abrir arquivo');
    }
  };

  const getContentIcon = (type: ContentType) => {
    switch (type) {
      case 'note':
        return <FileText className="w-5 h-5" />;
      case 'link':
        return <LinkIcon className="w-5 h-5" />;
      case 'pdf':
        return <File className="w-5 h-5" />;
    }
  };

  const getContentColor = (type: ContentType) => {
    switch (type) {
      case 'note':
        return 'bg-blue-100 text-blue-600';
      case 'link':
        return 'bg-green-100 text-green-600';
      case 'pdf':
        return 'bg-purple-100 text-purple-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto my-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="bg-indigo-500 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 truncate">Conteúdo de Estudo</h2>
              <p className="text-xs sm:text-sm text-gray-600 truncate">{theme}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm touch-manipulation"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Adicionar</span>
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
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm whitespace-pre-line">
              {error}
            </div>
          )}

          {showAddForm && (
            <div className="mb-6 bg-slate-50 border border-slate-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Adicionar Conteúdo</h3>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setTitle('');
                    setContent('');
                    setFile(null);
                    setError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Conteúdo
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    {(['note', 'link', 'pdf'] as ContentType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setContentType(type);
                          setContent('');
                          setFile(null);
                        }}
                        className={`flex-1 px-3 sm:px-4 py-2 rounded-lg border-2 font-medium transition-colors text-sm sm:text-base touch-manipulation ${
                          contentType === type
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {type === 'note' && 'Anotação'}
                        {type === 'link' && 'Link'}
                        {type === 'pdf' && 'PDF'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Ex: Resumo sobre funções quadráticas"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {contentType === 'note' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Anotação
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                      rows={6}
                      placeholder="Digite suas anotações..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                )}

                {contentType === 'link' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL do Artigo
                    </label>
                    <input
                      type="url"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                      placeholder="https://exemplo.com/artigo"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}

                {contentType === 'pdf' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Arquivo PDF
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {file && (
                      <p className="mt-2 text-sm text-gray-600">
                        Arquivo selecionado: {file.name}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setTitle('');
                      setContent('');
                      setFile(null);
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors touch-manipulation text-sm sm:text-base"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-sm sm:text-base"
                  >
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-gray-600">Carregando...</div>
          ) : contents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Nenhum conteúdo adicionado ainda</p>
              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  Adicionar Primeiro Conteúdo
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {contents.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-5 hover:bg-gray-50 transition-colors"
                >
                  {editingId === item.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      {item.content_type === 'note' && (
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(item.id)}
                          className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 flex items-center gap-1"
                        >
                          <Save className="w-4 h-4" />
                          Salvar
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${getContentColor(item.content_type)}`}>
                            {getContentIcon(item.content_type)}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800 mb-1">{item.title}</h4>
                            <p className="text-xs text-gray-500">
                              {new Date(item.created_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.content_type === 'note' && (
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {item.content_type === 'note' && item.content && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-3">
                          <p className="text-gray-700 whitespace-pre-wrap">{item.content}</p>
                        </div>
                      )}

                      {item.content_type === 'link' && item.content && (
                        <a
                          href={item.content}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-3"
                        >
                          <ExternalLink className="w-4 h-4" />
                          {item.content}
                        </a>
                      )}

                      {item.content_type === 'pdf' && item.file_name && (
                        <button
                          onClick={() => handleDownloadPdf(item)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium mb-3"
                        >
                          <File className="w-4 h-4" />
                          Abrir PDF: {item.file_name}
                        </button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

