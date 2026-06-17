'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ExternalLink, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/ui/number-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemedShell } from '@/components/layout/ThemedShell';
import { useThemeOptions } from '@/hooks/useActiveTheme';
import { useAdminSocket } from '@/hooks/useAdminSocket';
import { Locales, type AppLocale } from '@/i18n/routing';
import { normalizeThemeId, type ThemeId } from '@/lib/themes';
import type { Question } from '@/types/game';

const LocaleLabels: Record<AppLocale, string> = {
  nl: 'NL',
  en: 'EN',
  fr: 'FR',
  de: 'DE',
};

export function AdminDashboard() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const tToast = useTranslations('toast');
  const tErrors = useTranslations('errors');
  const themeOptions = useThemeOptions();
  const {
    authenticated,
    loginError,
    rooms,
    questionBank,
    settings,
    questionLocale,
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
  } = useAdminSocket();

  const [password, setPassword] = useState('');
  const [theme, setTheme] = useState<ThemeId>('desert');
  const [minPlayers, setMinPlayers] = useState(4);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [questionsPerRound, setQuestionsPerRound] = useState(10);
  const [openCats, setOpenCats] = useState<Set<string>>(new Set());

  const summary = useMemo(() => {
    const roomValues = Object.values(rooms);
    return {
      rooms: roomValues.length,
      players: roomValues.reduce((sum, r) => sum + r.playerCount, 0),
      categories: Object.keys(questionBank).length,
      questions: Object.values(questionBank).reduce((sum, q) => sum + q.length, 0),
    };
  }, [rooms, questionBank]);

  useEffect(() => {
    if (!settings) return;
    setTheme(normalizeThemeId(settings.theme));
    setMinPlayers(settings.minPlayers);
    setMaxPlayers(settings.maxPlayers);
    setQuestionsPerRound(settings.questionsPerRound);
  }, [settings]);

  const handleLogin = () => login(password, locale);

  const handleSaveSettings = () => {
    if (minPlayers > maxPlayers) {
      toast.error(tToast('minGreaterThanMax'));
      return;
    }
    saveSettings({ theme, minPlayers, maxPlayers, questionsPerRound });
    toast.success(t('settingsSaved'));
  };

  const promptQuestion = (category: string) => {
    const q = prompt(t('promptQuestion'));
    if (!q) return;
    const o1 = prompt(t('promptCorrect'));
    const o2 = prompt(t('promptWrong2'));
    const o3 = prompt(t('promptWrong3'));
    const o4 = prompt(t('promptWrong4'));
    if (q && o1 && o2 && o3 && o4) {
      const questionObj: Question = { q, options: [o1, o2, o3, o4], answer: 0 };
      addQuestion(category, questionObj);
    }
  };

  if (!authenticated) {
    return (
      <ThemedShell showHero={false} maxWidth="sm">
        <div className="flex min-h-[60vh] items-center">
          <Card className="glass-card w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t('loginTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminPass">{t('password')}</Label>
                <Input
                  id="adminPass"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              {loginError && (
                <p className="text-sm text-destructive">{tErrors('wrongPassword')}</p>
              )}
              <Button className="theme-cta w-full" onClick={handleLogin}>
                {t('login')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </ThemedShell>
    );
  }

  return (
    <ThemedShell
      title={t('title')}
      subtitle={t('subtitle')}
      maxWidth="lg"
      actions={
        <Button variant="outline" asChild>
          <Link href="/" target="_blank">
            <ExternalLink className="h-4 w-4" />
            {t('playerScreen')}
          </Link>
        </Button>
      }
    >
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [t('statRooms'), summary.rooms],
          [t('statRacers'), summary.players],
          [t('statCategories'), summary.categories],
          [t('statQuestions'), summary.questions],
        ].map(([label, value]) => (
          <Card key={label as string} className="glass-card">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-2xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">{t('tabSettings')}</TabsTrigger>
          <TabsTrigger value="rooms">{t('tabRooms')}</TabsTrigger>
          <TabsTrigger value="cms">{t('tabCms')}</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>{t('globalSettings')}</CardTitle>
              <CardDescription>{t('globalSettingsDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:max-w-md">
              <div className="space-y-2">
                <Label>{tCommon('theme')}</Label>
                <Select value={theme} onValueChange={(v) => setTheme(v as ThemeId)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent variant="borderless">
                    {themeOptions.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{tCommon('minPlayers')}</Label>
                  <NumberInput min={1} max={20} value={minPlayers} onChange={setMinPlayers} />
                </div>
                <div className="space-y-2">
                  <Label>{tCommon('maxPlayers')}</Label>
                  <NumberInput min={1} max={20} value={maxPlayers} onChange={setMaxPlayers} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{tCommon('questionsPerRound')}</Label>
                <NumberInput
                  min={1}
                  max={100}
                  value={questionsPerRound}
                  onChange={setQuestionsPerRound}
                />
              </div>
              <Button className="theme-cta" onClick={handleSaveSettings}>
                {tCommon('save')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rooms" className="mt-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>{t('activeRooms')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.keys(rooms).length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('noActiveRooms')}</p>
              ) : (
                Object.entries(rooms).map(([name, room]) => (
                  <div
                    key={name}
                    className="flex flex-col gap-3 rounded-md border bg-muted p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">{name}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('roomPlayers', { count: room.playerCount, status: room.status })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {room.status === 'waiting' && (
                        <Button size="sm" variant="secondary" onClick={() => forceStart(name)}>
                          {t('forceStart')}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm(t('closeRoomConfirm', { name }))) deleteRoom(name);
                        }}
                      >
                        {t('closeRoom')}
                      </Button>
                    </div>
                  </div>
                ))
              )}
              <Separator />
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm(t('resetLeaderboardConfirm'))) resetLeaderboard();
                }}
              >
                {t('resetLeaderboard')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cms" className="mt-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>{t('questionBank')}</CardTitle>
                <CardDescription>{t('questionBankDescription')}</CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t('questionBankLocale')}</Label>
                  <Select
                    value={questionLocale}
                    onValueChange={(v) => setQuestionBankLocale(v as AppLocale)}
                  >
                    <SelectTrigger className="w-[5.5rem]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Locales.map((item) => (
                        <SelectItem key={item} value={item}>
                          {LocaleLabels[item]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  size="sm"
                  className="mt-5 sm:mt-0"
                  onClick={() => {
                    const name = prompt(t('newCategoryPrompt'));
                    if (name) addCategory(name);
                  }}
                >
                  {t('addCategory')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(questionBank).map(([category, questions]) => {
                const isOpen = openCats.has(category);
                return (
                  <div key={category} className="rounded-md border bg-muted">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-4 py-3 text-left"
                      onClick={() =>
                        setOpenCats((prev) => {
                          const next = new Set(prev);
                          if (next.has(category)) next.delete(category);
                          else next.add(category);
                          return next;
                        })
                      }
                    >
                      <span className="font-medium">
                        {category}{' '}
                        <Badge variant="secondary" className="ml-2">
                          {questions.length}
                        </Badge>
                      </span>
                      <span className="text-muted-foreground">{isOpen ? '−' : '+'}</span>
                    </button>
                    {isOpen && (
                      <div className="space-y-2 border-t px-4 py-3">
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => promptQuestion(category)}>
                            {t('addQuestion')}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (confirm(t('deleteCategoryConfirm', { name: category })))
                                deleteCategory(category);
                            }}
                          >
                            {t('deleteCategory')}
                          </Button>
                        </div>
                        <ul className="space-y-2">
                          {questions.map((q, index) => (
                            <li
                              key={index}
                              className="flex items-start justify-between gap-3 rounded border px-3 py-2 text-sm"
                            >
                              <span>{q.q}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  if (confirm(t('deleteQuestionConfirm')))
                                    deleteQuestion(category, index);
                                }}
                              >
                                {tCommon('delete')}
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ThemedShell>
  );
}
