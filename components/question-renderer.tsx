'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { AudioPlayer } from '@/components/ui/audio-player';
import { Volume2, ImageIcon, FileText } from 'lucide-react';
import Image from 'next/image';

interface Question {
  _id: string;
  type: 'reading' | 'listening' | 'writing';
  subType: string;
  question: string;
  passage?: string;
  audioUrl?: string;
  audioFile?: {
    url: string;
    publicId: string;
    originalName: string;
    format: string;
    bytes: number;
    duration?: number;
  };
  imageFile?: {
    url: string;
    publicId: string;
    originalName: string;
    format: string;
    bytes: number;
    width: number;
    height: number;
  };
  options?: string[];
  correctAnswer?: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  instructionText?: string;
  wordLimit?: number;
  blanksCount?: number;
  section?: number;
}

interface QuestionRendererProps {
  question: Question;
  questionIndex: number;
  answer: string;
  onAnswerChange: (answer: string) => void;
}

export function QuestionRenderer({ question, questionIndex, answer, onAnswerChange }: QuestionRendererProps) {
  const [fillBlankAnswers, setFillBlankAnswers] = useState<string[]>(() => {
    if (question.subType === 'fill-blank' && answer) {
      try {
        return JSON.parse(answer);
      } catch {
        return Array(question.blanksCount || 1).fill('');
      }
    }
    return Array(question.blanksCount || 1).fill('');
  });

  const handleFillBlankChange = (index: number, value: string) => {
    const newAnswers = [...fillBlankAnswers];
    newAnswers[index] = value;
    setFillBlankAnswers(newAnswers);
    onAnswerChange(JSON.stringify(newAnswers));
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'reading': return '📖';
      case 'listening': return '🎧';
      case 'writing': return '✍️';
      default: return '❓';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Question Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getQuestionTypeIcon(question.type)}</span>
          <Badge variant="outline" className={getDifficultyColor(question.difficulty)}>
            {question.difficulty}
          </Badge>
          <Badge variant="secondary">
            {question.subType.replace('-', ' ')}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {question.points} point{question.points > 1 ? 's' : ''}
          </span>
        </div>
        
        {question.section && (
          <Badge variant="outline">
            Section {question.section}
          </Badge>
        )}
      </div>

      {/* Tags */}
      {question.tags && question.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {question.tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Detailed Instructions for Writing */}
      {question.instructionText && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Instructions</Label>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {question.instructionText}
            </p>
          </div>
        </div>
      )}

      {/* Image for Reading/Writing Task 1 */}
      {question.imageFile && (
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            {question.type === 'writing' ? 'Chart/Graph to Analyze' : 'Reference Image'}
          </Label>
          <div className="border rounded-lg overflow-hidden bg-white">
            <Image
              src={question.imageFile.url}
              alt={question.imageFile.originalName}
              width={question.imageFile.width}
              height={question.imageFile.height}
              className="w-full h-auto max-h-96 object-contain"
            />
            <div className="p-2 text-xs text-muted-foreground bg-gray-50">
              {question.imageFile.originalName} • {question.imageFile.width}×{question.imageFile.height} • {Math.round(question.imageFile.bytes / 1024)}KB
            </div>
          </div>
        </div>
      )}

      {/* Audio for Listening Questions */}
      {(question.audioFile || question.audioUrl) && question.type === 'listening' && (
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Listening Audio
          </Label>
          <AudioPlayer 
            src={question.audioFile?.url || question.audioUrl || ''}
            title={question.audioFile?.originalName || `Question ${questionIndex + 1} Audio`}
            showDownload={false}
            className="border-2 border-blue-200"
          />
          {question.audioFile && (
            <div className="text-xs text-muted-foreground p-2 bg-blue-50 rounded">
              {question.audioFile.originalName} • {question.audioFile.duration ? `${Math.round(question.audioFile.duration)}s` : ''} • {Math.round(question.audioFile.bytes / 1024)}KB
            </div>
          )}
          <div className="text-xs text-muted-foreground p-2 bg-blue-50 rounded">
            💡 You can replay the audio multiple times. Listen carefully before answering.
          </div>
        </div>
      )}

      {/* Passage for Reading */}
      {question.passage && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Reading Passage</Label>
          <div className="p-4 bg-muted rounded-lg border">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {question.passage}
            </p>
          </div>
        </div>
      )}

      {/* Question Text */}
      <div className="space-y-2">
        <Label className="text-base font-semibold">Question {questionIndex + 1}</Label>
        <div className="p-4 bg-white rounded-lg border-l-4 border-primary">
          <p className="text-base leading-relaxed whitespace-pre-wrap">
            {question.question}
          </p>
        </div>
      </div>

      {/* Writing Word Limit */}
      {question.type === 'writing' && question.wordLimit && (
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-center gap-2 text-amber-800">
            <FileText className="h-4 w-4" />
            <span className="font-medium">Word Limit: {question.wordLimit} words</span>
          </div>
        </div>
      )}

      {/* Answer Section */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Your Answer</Label>
        
        {/* Multiple Choice */}
        {(question.subType.includes('multiple-choice') || question.options) && question.options && (
          <RadioGroup value={answer} onValueChange={onAnswerChange}>
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        )}

        {/* True/False/Not Given */}
        {question.subType.includes('true-false') && (
          <RadioGroup value={answer} onValueChange={onAnswerChange}>
            <div className="space-y-3">
              {['True', 'False', 'Not Given'].map((option) => (
                <div key={option} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                  <RadioGroupItem value={option} id={option} />
                  <Label htmlFor={option} className="flex-1 cursor-pointer font-medium">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        )}

        {/* Fill in the Blank */}
        {question.subType === 'fill-blank' && (
          <div className="space-y-3">
            {Array.from({ length: question.blanksCount || 1 }).map((_, index) => (
              <div key={index} className="space-y-1">
                <Label htmlFor={`blank-${index}`} className="text-sm">
                  Blank {index + 1}
                </Label>
                <Input
                  id={`blank-${index}`}
                  placeholder={`Enter answer for blank ${index + 1}...`}
                  value={fillBlankAnswers[index] || ''}
                  onChange={(e) => handleFillBlankChange(index, e.target.value)}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        )}

        {/* Short Answer */}
        {question.subType === 'short-answer' && (
          <Input
            placeholder="Enter your short answer..."
            value={answer}
            onChange={(e) => onAnswerChange(e.target.value)}
            className="w-full"
          />
        )}

        {/* Writing Tasks (Essay, Task1, Task2) */}
        {(question.type === 'writing' && ['essay', 'task1', 'task2'].includes(question.subType)) && (
          <div className="space-y-2">
            <Textarea
              placeholder={
                question.subType === 'task1' 
                  ? "Describe the chart/graph/diagram in detail. Identify key trends, comparisons, and notable features..."
                  : question.subType === 'task2'
                  ? "Present your argument with clear introduction, body paragraphs with examples, and conclusion..."
                  : "Write your essay here..."
              }
              value={answer}
              onChange={(e) => onAnswerChange(e.target.value)}
              rows={12}
              className="w-full resize-none"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Word count: {answer ? answer.split(/\s+/).filter(word => word.length > 0).length : 0} words</span>
              {question.wordLimit && (
                <span className={answer && answer.split(/\s+/).filter(word => word.length > 0).length > question.wordLimit ? 'text-red-600' : ''}>
                  Target: {question.wordLimit} words
                </span>
              )}
            </div>
          </div>
        )}

        {/* Matching */}
        {question.subType === 'matching' && (
          <Textarea
            placeholder="Enter your matching answers (e.g., 1-A, 2-B, 3-C)..."
            value={answer}
            onChange={(e) => onAnswerChange(e.target.value)}
            rows={4}
            className="w-full"
          />
        )}

        {/* Default Text Area for other types */}
        {!question.options && 
         !question.subType.includes('true-false') && 
         !question.subType.includes('multiple-choice') && 
         !['fill-blank', 'short-answer', 'essay', 'task1', 'task2', 'matching'].includes(question.subType) && (
          <Textarea
            placeholder="Enter your answer..."
            value={answer}
            onChange={(e) => onAnswerChange(e.target.value)}
            rows={4}
            className="w-full"
          />
        )}
      </div>
    </div>
  );
}