import fs from 'fs';
import path from 'path';
import type { AppLocale } from '@/i18n/routing';
import { Locales } from '@/i18n/routing';
import type { QuestionBank } from '@/types/game';

const questionBanks = new Map<string, QuestionBank>();
const questionBankMtimes = new Map<string, number>();

function QuestionBankFile(locale: string): string {
  return path.join(process.cwd(), 'data', 'questions', `${locale}.json`);
}

function NormalizeQuestionLocale(locale: string): AppLocale {
  return Locales.includes(locale as AppLocale) ? (locale as AppLocale) : 'nl';
}

function GetFileMtime(locale: AppLocale): number {
  return fs.statSync(QuestionBankFile(locale)).mtimeMs;
}

function LoadQuestionBank(locale: AppLocale): QuestionBank {
  const raw = fs.readFileSync(QuestionBankFile(locale), 'utf8');
  return JSON.parse(raw) as QuestionBank;
}

export function saveQuestionsToFile(bank: QuestionBank, locale = 'nl'): void {
  const resolvedLocale = NormalizeQuestionLocale(locale);
  fs.writeFileSync(QuestionBankFile(resolvedLocale), JSON.stringify(bank, null, 2), 'utf8');
  questionBanks.set(resolvedLocale, bank);
  questionBankMtimes.set(resolvedLocale, GetFileMtime(resolvedLocale));
}

export function refreshQuestionBank(locale = 'nl'): QuestionBank {
  const resolvedLocale = NormalizeQuestionLocale(locale);
  const fileMtimeMs = GetFileMtime(resolvedLocale);
  if (fileMtimeMs !== questionBankMtimes.get(resolvedLocale) || !questionBanks.has(resolvedLocale)) {
    const bank = LoadQuestionBank(resolvedLocale);
    questionBanks.set(resolvedLocale, bank);
    questionBankMtimes.set(resolvedLocale, fileMtimeMs);
  }
  return questionBanks.get(resolvedLocale)!;
}

export function getQuestionBank(locale = 'nl'): QuestionBank {
  const resolvedLocale = NormalizeQuestionLocale(locale);
  if (!questionBanks.has(resolvedLocale)) {
    return refreshQuestionBank(resolvedLocale);
  }
  return questionBanks.get(resolvedLocale)!;
}

export function setQuestionBank(bank: QuestionBank, locale = 'nl'): void {
  const resolvedLocale = NormalizeQuestionLocale(locale);
  questionBanks.set(resolvedLocale, bank);
}
