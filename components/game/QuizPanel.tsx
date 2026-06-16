'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Question } from '@/types/game';

interface QuizPanelProps {
  question: Question | null;
  locked: boolean;
  error: string | null;
  onAnswer: (index: number) => void;
}

export function QuizPanel({ question, locked, error, onAnswer }: QuizPanelProps) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg font-medium leading-snug">
          {error ? error : question?.q ?? 'Vraag laden...'}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        {question?.options.map((option, index) => (
          <Button
            key={index}
            variant="outline"
            className="h-auto min-h-11 justify-start whitespace-normal border-input bg-input px-4 py-3 text-left text-card-foreground hover:bg-muted"
            disabled={locked || !question}
            onClick={() => onAnswer(index)}
          >
            {option}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
