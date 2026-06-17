'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import type { SocketErrorPayload } from '@/types/game';

export function useSocketErrorMessage() {
  const t = useTranslations('errors');

  return useCallback((payload: SocketErrorPayload): string => {
    switch (payload.code) {
      case 'raceInProgress':
        return t('raceInProgress');
      case 'roomFull':
        return t('roomFull', { max: payload.max ?? 0 });
      case 'wrongAnswer':
        return t('wrongAnswer');
      case 'roomClosedByAdmin':
        return t('roomClosedByAdmin');
      default:
        return t('raceInProgress');
    }
  }, [t]);
}
