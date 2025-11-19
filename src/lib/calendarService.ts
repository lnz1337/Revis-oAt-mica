import { supabase } from './supabase';

interface CalendarEvent {
    summary: string;
    description: string;
    startTime: string; // ISO string
    endTime: string; // ISO string
}

export const createGoogleCalendarEvent = async (event: CalendarEvent) => {
    const { data: { session } } = await supabase.auth.getSession();

    console.log('Tentando criar evento no Google Calendar...');
    console.log('Sessão encontrada:', !!session);
    console.log('Token do provider encontrado:', !!session?.provider_token);

    if (!session) {
        console.error('Erro: Usuário não autenticado');
        throw new Error('Usuário não autenticado');
    }

    if (!session.provider_token) {
        console.error('Erro: Token do Google não encontrado');
        throw new Error('Token do Google não encontrado. Por favor, faça login novamente com o Google.');
    }

    const eventData = {
        summary: event.summary,
        description: event.description,
        start: {
            dateTime: event.startTime,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
            dateTime: event.endTime,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'email', minutes: 24 * 60 },
                { method: 'popup', minutes: 30 },
            ],
        },
    };

    try {
        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.provider_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Erro detalhado da API do Google:', errorData);
            throw new Error(`Erro na API do Google Calendar: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        console.log('Evento criado com sucesso:', data);
        return data;
    } catch (error) {
        console.error('Erro ao criar evento no Google Calendar:', error);
        throw error;
    }
};
