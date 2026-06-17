'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { applyTheme } from '@/lib/apply-theme';
import { normalizeThemeId } from '@/lib/themes';
import { createSocket, type GameSocket } from '@/lib/socket/client';
import type { AppLocale } from '@/i18n/routing';
import type { AdminData, QuestionBank, SafeRooms } from '@/types/game';

export function useAdminSocket() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [rooms, setRooms] = useState<SafeRooms>({});
  const [questionBank, setQuestionBank] = useState<QuestionBank>({});
  const [settings, setSettings] = useState<AdminData['settings'] | null>(null);
  const [questionLocale, setQuestionLocale] = useState<AppLocale>('nl');
  const openCategoriesRef = useRef(new Set<string>());
  const socketRef = useRef<GameSocket | null>(null);

  useEffect(() => {
    const socket = createSocket();
    socketRef.current = socket;

    socket.on('adminError', () => setLoginError('wrongPassword'));
    socket.on('adminData', (data) => {
      setAuthenticated(true);
      setLoginError('');
      setRooms(data.rooms || {});
      if (data.questionBank) setQuestionBank(data.questionBank);
      if (data.settings) setSettings(data.settings);
      if (data.questionLocale) setQuestionLocale(data.questionLocale as AppLocale);
    });

    return () => {
      socket.disconnect();
      socket.removeAllListeners();
    };
  }, []);

  const login = (password: string, locale: AppLocale) => {
    setLoginError('');
    const socket = socketRef.current;
    if (!socket) return;

    const attempt = () => socket.emit('adminLogin', password, locale);

    if (socket.connected) {
      attempt();
      return;
    }

    socket.once('connect', attempt);
    socket.connect();
  };

  const setQuestionBankLocale = (locale: AppLocale) => {
    setQuestionLocale(locale);
    socketRef.current?.emit('adminSetQuestionLocale', locale);
  };

  const saveSettings = (payload: NonNullable<AdminData['settings']>) => {
    socketRef.current?.emit('adminUpdateSettings', payload);
    setSettings(payload);
    if (payload.theme) applyTheme(normalizeThemeId(payload.theme));
  };

  const forceStart = (roomName: string) => socketRef.current?.emit('adminForceStart', roomName);
  const deleteRoom = (roomName: string) => socketRef.current?.emit('adminDeleteRoom', roomName);
  const resetLeaderboard = () => socketRef.current?.emit('adminResetLeaderboard');
  const addCategory = (name: string) => socketRef.current?.emit('adminAddCategory', name);
  const deleteCategory = (name: string) => socketRef.current?.emit('adminDeleteCategory', name);
  const addQuestion = (category: string, questionObj: QuestionBank[string][number]) =>
    socketRef.current?.emit('adminAddQuestion', { category, questionObj });
  const deleteQuestion = (category: string, index: number) =>
    socketRef.current?.emit('adminDeleteQuestion', { category, index });

  return {
    authenticated,
    loginError,
    rooms,
    questionBank,
    settings,
    questionLocale,
    openCategoriesRef,
    login,
    setQuestionBankLocale,
    saveSettings,
    forceStart,
    deleteRoom,
    resetLeaderboard,
    addCategory,
    deleteCategory,
    addQuestion,
    deleteQuestion,
  };
}
