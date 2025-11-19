import { supabase, StudyContent } from './supabase';

export type ContentType = 'note' | 'link' | 'pdf';

export interface CreateContentInput {
  theme: string;
  content_type: ContentType;
  title: string;
  content?: string;
  file?: File;
}

export const createContent = async (input: CreateContentInput): Promise<StudyContent> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  let filePath: string | null = null;
  let fileName: string | null = null;

  // Se for PDF, verificar bucket e fazer upload do arquivo
  if (input.content_type === 'pdf' && input.file) {
    const fileExt = input.file.name.split('.').pop();
    const fileNameWithExt = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePathInStorage = `${user.id}/${fileNameWithExt}`;

    const { error: uploadError } = await supabase.storage
      .from('study-content')
      .upload(filePathInStorage, input.file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('not found')) {
        throw new Error(
          'Bucket de storage não encontrado. Por favor, crie o bucket "study-content" no painel do Supabase:\n' +
          '1. Acesse Storage no painel do Supabase\n' +
          '2. Clique em "New bucket"\n' +
          '3. Nome: study-content\n' +
          '4. Público: Não\n' +
          '5. Clique em "Create bucket"'
        );
      }
      throw new Error(`Erro ao fazer upload do arquivo: ${uploadError.message}`);
    }

    filePath = filePathInStorage;
    fileName = input.file.name;
  }

  // Validar conteúdo baseado no tipo
  if (input.content_type === 'link' && !input.content) {
    throw new Error('URL é obrigatória para links');
  }

  if (input.content_type === 'note' && !input.content) {
    throw new Error('Conteúdo é obrigatório para anotações');
  }

  const { data, error } = await supabase
    .from('study_content')
    .insert({
      user_id: user.id,
      theme: input.theme,
      content_type: input.content_type,
      title: input.title,
      content: input.content || null,
      file_path: filePath,
      file_name: fileName,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getContentByTheme = async (theme: string): Promise<StudyContent[]> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('study_content')
    .select('*')
    .eq('user_id', user.id)
    .eq('theme', theme)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getAllContent = async (): Promise<StudyContent[]> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('study_content')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const updateContent = async (
  id: string,
  updates: Partial<Pick<StudyContent, 'title' | 'content'>>
): Promise<StudyContent> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('study_content')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteContent = async (id: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Buscar o conteúdo para verificar se tem arquivo
  const { data: content, error: fetchError } = await supabase
    .from('study_content')
    .select('file_path')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError) throw fetchError;

  // Se tiver arquivo, deletar do storage
  if (content?.file_path) {
    const { error: deleteFileError } = await supabase.storage
      .from('study-content')
      .remove([content.file_path]);

    if (deleteFileError) {
      console.error('Erro ao deletar arquivo:', deleteFileError);
      // Continuar mesmo se houver erro ao deletar o arquivo
    }
  }

  // Deletar o registro
  const { error } = await supabase
    .from('study_content')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
};

export const getFileUrl = async (filePath: string): Promise<string> => {
  const { data, error } = await supabase.storage
    .from('study-content')
    .createSignedUrl(filePath, 3600); // URL válida por 1 hora

  if (error) throw error;
  return data.signedUrl;
};

