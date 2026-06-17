'use client';

import { useTranslations } from 'next-intl';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Question } from '@/types/game';

interface QuizPanelProps {
  question: Question | null;
  locked: boolean;
  selectedAnswer: number | null;
  showAnswerFeedback: boolean;
  error: string | null;
  onAnswer: (index: number) => void;
}

export function QuizPanel({
  question,
  locked,
  selectedAnswer,
  showAnswerFeedback,
  error,
  onAnswer,
}: QuizPanelProps) {
  const t = useTranslations('game');

  return (
    <Card className="glass-card">
      <CardHeader className="space-y-2">
        <CardTitle className="text-lg font-medium leading-snug">
          {question?.q ?? t('loadingQuestion')}
        </CardTitle>
        {error && showAnswerFeedback && <p className="text-sm text-red-400">{error}</p>}
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        {question?.options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrect = question.answer === index;
          const showWrong = showAnswerFeedback && isSelected && !isCorrect;
          const showCorrect = showAnswerFeedback && isCorrect;

          return (
            <Button
              key={index}
              variant="outline"
              className={cn(
                'h-auto min-h-11 justify-start whitespace-normal border-input bg-input px-4 py-3 text-left text-card-foreground hover:bg-muted',
                showWrong &&
                  'border-red-500/70 bg-red-500/15 text-red-100 hover:bg-red-500/15 hover:text-red-100',
                showCorrect &&
                  'border-green-500/70 bg-green-500/15 text-green-100 hover:bg-green-500/15 hover:text-green-100'
              )}
              disabled={locked || !question}
              onClick={() => onAnswer(index)}
            >
              <span className="flex w-full items-center gap-2.5">
                {showWrong && <X className="h-4 w-4 shrink-0 text-red-400" aria-hidden />}
                {showCorrect && (
                  <Check className="h-4 w-4 shrink-0 text-green-400" aria-hidden />
                )}
                <span>{option}</span>
              </span>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
