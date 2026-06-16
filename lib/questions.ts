import fs from 'fs';
import path from 'path';
import type { QuestionBank } from '@/types/game';

const questionBankFile = path.join(process.cwd(), 'data', 'questions.json');

let questionBank: QuestionBank = loadQuestionBank();
let questionBankMtimeMs = getFileMtime();

function getFileMtime(): number {
  return fs.statSync(questionBankFile).mtimeMs;
}

function loadQuestionBank(): QuestionBank {
  const raw = fs.readFileSync(questionBankFile, 'utf8');
  return JSON.parse(raw) as QuestionBank;
}

export function saveQuestionsToFile(bank: QuestionBank): void {
  fs.writeFileSync(questionBankFile, JSON.stringify(bank, null, 2), 'utf8');
  questionBank = bank;
  questionBankMtimeMs = getFileMtime();
}

export function refreshQuestionBank(): QuestionBank {
  const fileMtimeMs = getFileMtime();
  if (fileMtimeMs !== questionBankMtimeMs) {
    questionBank = loadQuestionBank();
    questionBankMtimeMs = fileMtimeMs;
  }
  return questionBank;
}

export function getQuestionBank(): QuestionBank {
  return questionBank;
}

export function setQuestionBank(bank: QuestionBank): void {
  questionBank = bank;
}
