'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  BookOpen,
  Volume2,
  Save,
  Plus,
  Trash2,
  X,
  Eye,
  ListChecks,
  FileText
} from 'lucide-react';
import { authService } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface EmbeddedQuestion {
  _id?: string;
  number: number;
  type:
    | 'true-false-not-given'
    | 'multiple-choice'
    | 'matching-information'
    | 'matching-headings'
    | 'sentence-completion'
    | 'summary-completion'
    | 'short-answer';
  prompt?: string;
  options?: string[];
  points: number;
  paragraphRef?: string;
  correctAnswer?: string;
}

interface Section {
  _id?: string;
  name: string;
  instructions?: string;
  range: {
    start: number;
    end: number;
  };
  questions: EmbeddedQuestion[];
}

export default function CreatePassagePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState<'summary' | 'preview'>('summary');

  const [passage, setPassage] = useState({
    title: '',
    content: '',
    type: 'reading' as 'reading' | 'listening',
    audioUrl: '',
    sections: [] as Section[]
  });

  const passageTypes = [
    { value: 'reading', label: 'Reading', icon: BookOpen },
    { value: 'listening', label: 'Listening', icon: Volume2 }
  ];

  const questionTypeColors: Record<EmbeddedQuestion['type'], { text: string; badgeBg: string }> = {
    'multiple-choice': { text: 'text-blue-700', badgeBg: 'bg-blue-100' },
    'true-false-not-given': { text: 'text-green-700', badgeBg: 'bg-green-100' },
    'matching-information': { text: 'text-purple-700', badgeBg: 'bg-purple-100' },
    'matching-headings': { text: 'text-pink-700', badgeBg: 'bg-pink-100' },
    'sentence-completion': { text: 'text-orange-700', badgeBg: 'bg-orange-100' },
    'summary-completion': { text: 'text-yellow-700', badgeBg: 'bg-yellow-100' },
    'short-answer': { text: 'text-teal-700', badgeBg: 'bg-teal-100' }
  };

  const questionTypeLabels: Record<EmbeddedQuestion['type'], string> = {
    'multiple-choice': 'Multiple Choice',
    'true-false-not-given': 'True/False/Not Given',
    'matching-information': 'Matching Information',
    'matching-headings': 'Matching Headings',
    'sentence-completion': 'Sentence Completion',
    'summary-completion': 'Summary Completion',
    'short-answer': 'Short Answer'
  };

  const handleCreatePassage = async () => {
    try {
      setLoading(true);
      
      // Prepare payload - only include audioUrl for listening passages
      const payload: any = {
        title: passage.title,
        content: passage.content,
        type: passage.type,
        sections: passage.sections
      };
      
      // Only add audioUrl if type is listening and audioUrl is provided
      if (passage.type === 'listening' && passage.audioUrl) {
        payload.audioUrl = passage.audioUrl;
      }
      
      await authService.apiRequest('/passages', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      router.push('/dashboard/passages');
    } catch (error: any) {
      console.error('Failed to create passage:', error);
      alert(error.message || 'Failed to create passage');
    } finally {
      setLoading(false);
    }
  };

  const addSection = () => {
    setPassage({
      ...passage,
      sections: [
        ...passage.sections,
        {
          name: `Section ${passage.sections.length + 1}`,
          instructions: '',
          range: { start: 1, end: 5 },
          questions: []
        }
      ]
    });
  };

  const removeSection = (index: number) => {
    setPassage({
      ...passage,
      sections: passage.sections.filter((_, i) => i !== index)
    });
  };

  const updateSection = (index: number, updates: Partial<Section>) => {
    setPassage({
      ...passage,
      sections: passage.sections.map((section, i) =>
        i === index ? { ...section, ...updates } : section
      )
    });
  };

  const addQuestionToSection = (sectionIndex: number) => {
    const section = passage.sections[sectionIndex];
    const existingNumbers = (section.questions || []).map(q => q.number || 0);
    const lastNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : (section.range?.start || 1) - 1;
    const nextNumber = lastNumber + 1;

    const newQuestion: EmbeddedQuestion = {
      number: nextNumber,
      type: 'multiple-choice',
      prompt: '',
      options: ['', '', '', ''],
      points: 1,
      correctAnswer: ''
    };

    const updatedSections = [...passage.sections];
    updatedSections[sectionIndex].questions.push(newQuestion);
    setPassage({
      ...passage,
      sections: updatedSections
    });
  };

  const removeQuestionFromSection = (sectionIndex: number, questionIndex: number) => {
    const updatedSections = [...passage.sections];
    const section = updatedSections[sectionIndex];
    section.questions.splice(questionIndex, 1);
    const startNumber = section.range?.start || 1;
    section.questions = section.questions.map((q, idx) => ({ ...q, number: startNumber + idx }));
    updatedSections[sectionIndex] = section;
    setPassage({
      ...passage,
      sections: updatedSections
    });
  };

  const updateQuestion = (sectionIndex: number, questionIndex: number, question: EmbeddedQuestion) => {
    const updatedSections = [...passage.sections];
    updatedSections[sectionIndex].questions[questionIndex] = question;
    setPassage({
      ...passage,
      sections: updatedSections
    });
  };

  // ============================================
  // SAMPLE DATA FILLER - Xóa function này khi không cần nữa
  // ============================================
  const fillSampleData = () => {
    const samplePassage = {
      title: 'The Impact of Social Media on Modern Communication',
      content: `Social media has fundamentally transformed the way people communicate in the 21st century. Platforms like Facebook, Twitter, and Instagram have created new forms of interaction that blend personal and public communication in unprecedented ways.

The rise of social media has brought both benefits and challenges. On one hand, it has made it easier for people to stay connected with friends and family across vast distances. On the other hand, concerns have emerged about privacy, misinformation, and the psychological effects of constant connectivity.

Research suggests that while social media can enhance social connections, excessive use may lead to feelings of isolation and anxiety. The constant comparison with others' curated online personas can negatively impact self-esteem, particularly among young people.

Despite these concerns, social media continues to evolve and shape modern society. New platforms emerge regularly, each offering different features and appealing to different demographics. The challenge for users is to harness the benefits of social media while being mindful of its potential drawbacks.`,
      type: 'reading' as 'reading' | 'listening',
      audioUrl: '',
      sections: [
        {
          name: 'Questions 1-5: True/False/Not Given',
          instructions: 'Do the following statements agree with the information given in the passage?',
          range: { start: 1, end: 5 },
          questions: [
            {
              number: 1,
              type: 'true-false-not-given' as const,
              prompt: 'Social media has changed how people communicate in modern times.',
              points: 1,
              correctAnswer: 'True'
            },
            {
              number: 2,
              type: 'true-false-not-given' as const,
              prompt: 'All research shows that social media has only negative effects.',
              points: 1,
              correctAnswer: 'False'
            },
            {
              number: 3,
              type: 'true-false-not-given' as const,
              prompt: 'Young people are particularly affected by comparing themselves to others online.',
              points: 1,
              correctAnswer: 'True'
            },
            {
              number: 4,
              type: 'true-false-not-given' as const,
              prompt: 'Facebook is the most popular social media platform worldwide.',
              points: 1,
              correctAnswer: 'Not Given'
            },
            {
              number: 5,
              type: 'true-false-not-given' as const,
              prompt: 'Social media platforms are all designed for the same demographic.',
              points: 1,
              correctAnswer: 'False'
            }
          ]
        },
        {
          name: 'Questions 6-10: Multiple Choice',
          instructions: 'Choose the correct letter, A, B, C or D.',
          range: { start: 6, end: 10 },
          questions: [
            {
              number: 6,
              type: 'multiple-choice' as const,
              prompt: 'According to the passage, social media has:',
              options: [
                'Only positive effects on communication',
                'Transformed modern communication methods',
                'Replaced all traditional forms of communication',
                'No significant impact on society'
              ],
              points: 1,
              correctAnswer: 'B'
            },
            {
              number: 7,
              type: 'multiple-choice' as const,
              prompt: 'What is mentioned as a benefit of social media?',
              options: [
                'It guarantees happiness',
                'It eliminates all privacy concerns',
                'It helps people stay connected across distances',
                'It prevents misinformation'
              ],
              points: 1,
              correctAnswer: 'C'
            },
            {
              number: 8,
              type: 'multiple-choice' as const,
              prompt: 'The passage suggests that excessive social media use may lead to:',
              options: [
                'Better communication skills',
                'Increased productivity',
                'Feelings of isolation and anxiety',
                'More real-world friendships'
              ],
              points: 1,
              correctAnswer: 'C'
            },
            {
              number: 9,
              type: 'multiple-choice' as const,
              prompt: 'What challenge do users face according to the passage?',
              options: [
                'Finding new platforms',
                'Balancing benefits and drawbacks of social media',
                'Learning how to use technology',
                'Avoiding all social media platforms'
              ],
              points: 1,
              correctAnswer: 'B'
            },
            {
              number: 10,
              type: 'multiple-choice' as const,
              prompt: 'The passage mentions that new social media platforms:',
              options: [
                'Are all identical',
                'Only appeal to young people',
                'Emerge regularly with different features',
                'Have stopped appearing'
              ],
              points: 1,
              correctAnswer: 'C'
            }
          ]
        },
        {
          name: 'Questions 11-13: Sentence Completion',
          instructions: 'Complete the sentences below with NO MORE THAN TWO WORDS from the passage.',
          range: { start: 11, end: 13 },
          questions: [
            {
              number: 11,
              type: 'sentence-completion' as const,
              prompt: 'Social media platforms blend personal and ______ communication.',
              points: 1,
              correctAnswer: 'public'
            },
            {
              number: 12,
              type: 'sentence-completion' as const,
              prompt: 'Concerns about privacy, misinformation, and ______ have emerged.',
              points: 1,
              correctAnswer: 'psychological effects'
            },
            {
              number: 13,
              type: 'sentence-completion' as const,
              prompt: "Comparing with others' ______ can impact self-esteem negatively.",
              points: 1,
              correctAnswer: 'online personas'
            }
          ]
        }
      ]
    };

    setPassage(samplePassage);
  };
  // ============================================
  // END OF SAMPLE DATA FILLER
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard/passages')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Passages
            </Button>
            
            {/* SAMPLE DATA BUTTON - Xóa button này khi không cần nữa */}
            <Button
              variant="outline"
              onClick={fillSampleData}
              className="bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            >
              <FileText className="h-4 w-4 mr-2" />
              Fill Sample Data
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Create New Passage</h1>
          <p className="text-slate-600 mt-1">Create a new passage and add questions from your question bank</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content - Left */}
          <div className="lg:col-span-8 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Enter the passage details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Passage Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., The History of Photography"
                      value={passage.title}
                      onChange={(e) => setPassage({ ...passage, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Passage Type *</Label>
                    <Select 
                      value={passage.type} 
                      onValueChange={(value: any) => setPassage({ ...passage, type: value, sections: [] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {passageTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {passage.type === 'listening' && (
                  <div className="space-y-2">
                    <Label htmlFor="audioUrl">Audio URL (Optional)</Label>
                    <Input
                      id="audioUrl"
                      type="url"
                      placeholder="https://example.com/audio.mp3"
                      value={passage.audioUrl}
                      onChange={(e) => setPassage({ ...passage, audioUrl: e.target.value })}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="content">Passage Content *</Label>
                  <Textarea
                    id="content"
                    placeholder="Enter the passage content..."
                    value={passage.content}
                    onChange={(e) => setPassage({ ...passage, content: e.target.value })}
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500">
                    Characters: {passage.content.length}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Sections */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Question Sections</CardTitle>
                    <CardDescription>Organize questions into sections</CardDescription>
                  </div>
                  <Button onClick={addSection} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Section
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {passage.sections.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p>No sections added yet. Click "Add Section" to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {passage.sections.map((section, index) => {
                      const sectionColors = [
                        { number: 'bg-blue-600 text-white', title: 'text-blue-700' },
                        { number: 'bg-purple-600 text-white', title: 'text-purple-700' },
                        { number: 'bg-green-600 text-white', title: 'text-green-700' },
                        { number: 'bg-orange-600 text-white', title: 'text-orange-700' },
                        { number: 'bg-pink-600 text-white', title: 'text-pink-700' },
                        { number: 'bg-teal-600 text-white', title: 'text-teal-700' },
                      ];
                      const sectionColor = sectionColors[index % sectionColors.length];
                      
                      return (
                      <Card key={index} className="border-slate-200">
                        <CardHeader className="pb-3 bg-slate-50">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                              <span className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${sectionColor.number}`}>
                                {index + 1}
                              </span>
                              <span className={sectionColor.title}>Section {index + 1}</span>
                              {section.questions.length > 0 && (
                                <Badge variant="secondary" className="ml-2">
                                  {section.questions.length} questions
                                </Badge>
                              )}
                            </CardTitle>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSection(index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>Section Name</Label>
                              <Input
                                value={section.name}
                                onChange={(e) => updateSection(index, { name: e.target.value })}
                                placeholder="e.g., Part 1"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Question Range</Label>
                              <div className="flex gap-2">
                                <Input
                                  type="number"
                                  value={section.range.start}
                                  onChange={(e) => updateSection(index, {
                                    range: { ...section.range, start: parseInt(e.target.value) }
                                  })}
                                  placeholder="From"
                                  className="w-20"
                                />
                                <span className="flex items-center">-</span>
                                <Input
                                  type="number"
                                  value={section.range.end}
                                  onChange={(e) => updateSection(index, {
                                    range: { ...section.range, end: parseInt(e.target.value) }
                                  })}
                                  placeholder="To"
                                  className="w-20"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Instructions (Optional)</Label>
                            <Textarea
                              value={section.instructions}
                              onChange={(e) => updateSection(index, { instructions: e.target.value })}
                              placeholder="Enter section instructions..."
                              rows={2}
                            />
                          </div>

                          <Separator />

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label>Questions</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addQuestionToSection(index)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Question
                              </Button>
                            </div>

                            {section.questions.length === 0 ? (
                              <p className="text-sm text-slate-500 py-4">No questions added yet. Click "Add Question" to create one.</p>
                            ) : (
                              <div className="space-y-3">
                                {section.questions.map((question, questionIndex) => {
                                  const colorScheme = questionTypeColors[question.type];
                                  return (
                                  <Card key={questionIndex} className="p-3 bg-white border-slate-200">
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <span className={`text-sm font-semibold ${colorScheme.text}`}>Question {question.number}</span>
                                          <Badge variant="outline" className={`text-xs ${colorScheme.text} ${colorScheme.badgeBg} border-transparent`}>
                                            {questionTypeLabels[question.type]}
                                          </Badge>
                                        </div>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeQuestionFromSection(index, questionIndex)}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>

                                      <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                          <Label className="text-xs">Question Number</Label>
                                          <Input
                                            type="number"
                                            min="1"
                                            value={question.number}
                                            onChange={(e) => updateQuestion(index, questionIndex, {
                                              ...question,
                                              number: parseInt(e.target.value) || 1
                                            })}
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-xs">Question Type</Label>
                                          <Select
                                            value={question.type}
                                            onValueChange={(value) => updateQuestion(index, questionIndex, {
                                              ...question,
                                              type: value as EmbeddedQuestion['type']
                                            })}
                                          >
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="true-false-not-given">True/False/Not Given</SelectItem>
                                              <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                                              <SelectItem value="matching-information">Matching Information</SelectItem>
                                              <SelectItem value="matching-headings">Matching Headings</SelectItem>
                                              <SelectItem value="sentence-completion">Sentence Completion</SelectItem>
                                              <SelectItem value="summary-completion">Summary Completion</SelectItem>
                                              <SelectItem value="short-answer">Short Answer</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>

                                      <div className="space-y-1">
                                        <Label className="text-xs">Question Prompt</Label>
                                        <Textarea
                                          placeholder="Enter question prompt..."
                                          value={question.prompt || ''}
                                          onChange={(e) => updateQuestion(index, questionIndex, {
                                            ...question,
                                            prompt: e.target.value
                                          })}
                                          rows={2}
                                        />
                                      </div>

                                      {/* Multiple Choice Options */}
                                      {question.type === 'multiple-choice' && (
                                        <div className="space-y-2">
                                          <Label className="text-xs">Answer Options</Label>
                                          <div className="space-y-2">
                                            {(question.options || ['', '', '', '']).map((option, optionIndex) => (
                                              <div key={optionIndex} className="flex items-center gap-2">
                                                <span className="text-xs font-medium w-6">
                                                  {String.fromCharCode(65 + optionIndex)}:
                                                </span>
                                                <Input
                                                  placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                                                  value={option}
                                                  onChange={(e) => {
                                                    const newOptions = [...(question.options || ['', '', '', ''])];
                                                    newOptions[optionIndex] = e.target.value;
                                                    updateQuestion(index, questionIndex, {
                                                      ...question,
                                                      options: newOptions
                                                    });
                                                  }}
                                                />
                                              </div>
                                            ))}
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-xs">Correct Answer</Label>
                                            <Select
                                              value={question.correctAnswer || ''}
                                              onValueChange={(value) => updateQuestion(index, questionIndex, {
                                                ...question,
                                                correctAnswer: value
                                              })}
                                            >
                                              <SelectTrigger>
                                                <SelectValue placeholder="Select correct answer" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {['A', 'B', 'C', 'D'].map((letter, idx) => (
                                                  <SelectItem key={letter} value={letter}>
                                                    Option {letter}: {(question.options || ['', '', '', ''])[idx] || 'Empty'}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        </div>
                                      )}

                                      {/* True/False/Not Given */}
                                      {question.type === 'true-false-not-given' && (
                                        <div className="space-y-1">
                                          <Label className="text-xs">Correct Answer</Label>
                                          <Select
                                            value={question.correctAnswer || ''}
                                            onValueChange={(value) => updateQuestion(index, questionIndex, {
                                              ...question,
                                              correctAnswer: value
                                            })}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select correct answer" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="True">True</SelectItem>
                                              <SelectItem value="False">False</SelectItem>
                                              <SelectItem value="Not Given">Not Given</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      )}

                                      {/* Matching Information */}
                                      {question.type === 'matching-information' && (
                                        <div className="grid grid-cols-2 gap-3">
                                          <div className="space-y-1">
                                            <Label className="text-xs">Paragraph Reference</Label>
                                            <Input
                                              placeholder="e.g., A, B, C"
                                              value={question.paragraphRef || ''}
                                              onChange={(e) => updateQuestion(index, questionIndex, {
                                                ...question,
                                                paragraphRef: e.target.value
                                              })}
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-xs">Correct Answer</Label>
                                            <Select
                                              value={question.correctAnswer || ''}
                                              onValueChange={(value) => updateQuestion(index, questionIndex, {
                                                ...question,
                                                correctAnswer: value
                                              })}
                                            >
                                              <SelectTrigger>
                                                <SelectValue placeholder="Select paragraph" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((letter) => (
                                                  <SelectItem key={letter} value={letter}>
                                                    Paragraph {letter}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        </div>
                                      )}

                                      {/* Matching Headings */}
                                      {question.type === 'matching-headings' && (
                                        <div className="space-y-1">
                                          <Label className="text-xs">Heading Options</Label>
                                          {(question.options || ['', '', '', '', '']).map((option, optionIndex) => (
                                            <Input
                                              key={optionIndex}
                                              placeholder={`Heading ${optionIndex + 1}`}
                                              value={option}
                                              onChange={(e) => {
                                                const newOptions = [...(question.options || ['', '', '', '', ''])];
                                                newOptions[optionIndex] = e.target.value;
                                                updateQuestion(index, questionIndex, {
                                                  ...question,
                                                  options: newOptions
                                                });
                                              }}
                                            />
                                          ))}
                                          <div className="space-y-1 mt-2">
                                            <Label className="text-xs">Correct Answer</Label>
                                            <Input
                                              placeholder="Enter correct heading text"
                                              value={question.correctAnswer || ''}
                                              onChange={(e) => updateQuestion(index, questionIndex, {
                                                ...question,
                                                correctAnswer: e.target.value
                                              })}
                                            />
                                          </div>
                                        </div>
                                      )}

                                      {/* Sentence Completion */}
                                      {question.type === 'sentence-completion' && (
                                        <div className="space-y-1">
                                          <Label className="text-xs">Correct Answer</Label>
                                          <Input
                                            placeholder="Enter the word(s) that complete the sentence"
                                            value={question.correctAnswer || ''}
                                            onChange={(e) => updateQuestion(index, questionIndex, {
                                              ...question,
                                              correctAnswer: e.target.value
                                            })}
                                          />
                                          <div className="text-xs text-muted-foreground">
                                            Enter the exact word(s) that should fill the blank
                                          </div>
                                        </div>
                                      )}

                                      {/* Summary Completion */}
                                      {question.type === 'summary-completion' && (
                                        <div className="space-y-1">
                                          <Label className="text-xs">Correct Answer</Label>
                                          <Input
                                            placeholder="Enter the word(s) for the summary"
                                            value={question.correctAnswer || ''}
                                            onChange={(e) => updateQuestion(index, questionIndex, {
                                              ...question,
                                              correctAnswer: e.target.value
                                            })}
                                          />
                                        </div>
                                      )}

                                      {/* Short Answer */}
                                      {question.type === 'short-answer' && (
                                        <div className="space-y-1">
                                          <Label className="text-xs">Correct Answer</Label>
                                          <Input
                                            placeholder="Enter the short answer"
                                            value={question.correctAnswer || ''}
                                            onChange={(e) => updateQuestion(index, questionIndex, {
                                              ...question,
                                              correctAnswer: e.target.value
                                            })}
                                          />
                                          <div className="text-xs text-muted-foreground">
                                            Usually 1-3 words maximum
                                          </div>
                                        </div>
                                      )}

                                      {/* Points field for all question types */}
                                      <div className="space-y-1">
                                        <Label className="text-xs">Points</Label>
                                        <Input
                                          type="number"
                                          min="1"
                                          value={question.points || 1}
                                          onChange={(e) => updateQuestion(index, questionIndex, {
                                            ...question,
                                            points: parseInt(e.target.value) || 1
                                          })}
                                        />
                                      </div>
                                    </div>
                                  </Card>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Summary & Preview */}
          <div className="lg:col-span-4">
            <Card className="sticky top-6">
              <CardHeader className="pb-3">
                <Tabs value={previewMode} onValueChange={(v: any) => setPreviewMode(v)} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="summary" className="text-xs">
                      <ListChecks className="h-3 w-3 mr-1" />
                      Summary
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="text-xs">
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-200px)]">
                  {previewMode === 'summary' ? (
                    <div className="space-y-4">
                      {/* Title */}
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-slate-700">Passage Info</h3>
                        <div className="text-xs space-y-1">
                          <p className="flex items-center justify-between">
                            <span className="text-slate-500">Title:</span>
                            <span className="font-medium">{passage.title || 'Not set'}</span>
                          </p>
                          <p className="flex items-center justify-between">
                            <span className="text-slate-500">Type:</span>
                            <Badge variant="outline" className="text-xs">
                              {passage.type === 'reading' ? <BookOpen className="h-3 w-3 mr-1" /> : <Volume2 className="h-3 w-3 mr-1" />}
                              {passage.type}
                            </Badge>
                          </p>
                          <p className="flex items-center justify-between">
                            <span className="text-slate-500">Content:</span>
                            <span className="font-medium">{passage.content ? `${passage.content.length} chars` : '0 chars'}</span>
                          </p>
                        </div>
                      </div>

                      <Separator />

                      {/* Sections Summary */}
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                          <span>Sections</span>
                          <Badge variant="secondary">{passage.sections.length}</Badge>
                        </h3>
                        {passage.sections.length === 0 ? (
                          <p className="text-xs text-slate-500 italic">No sections added yet</p>
                        ) : (
                          <div className="space-y-2">
                            {passage.sections.map((section, index) => (
                              <Card key={index} className="p-2 bg-slate-50">
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-slate-700">
                                      {section.name || `Section ${index + 1}`}
                                    </span>
                                    <Badge variant="outline" className="text-[10px] h-5">
                                      Q{section.range.start}-{section.range.end}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {section.questions.map((q, qIndex) => {
                                      const color = questionTypeColors[q.type];
                                      return (
                                        <Badge 
                                          key={qIndex} 
                                          variant="secondary" 
                                          className={`text-[10px] h-5 ${color.badgeBg} ${color.text}`}
                                        >
                                          Q{q.number}
                                        </Badge>
                                      );
                                    })}
                                    {section.questions.length === 0 && (
                                      <span className="text-[10px] text-slate-400 italic">No questions</span>
                                    )}
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>

                      <Separator />

                      {/* Question Type Legend */}
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-slate-700">Question Types</h3>
                        <div className="space-y-1">
                          {Object.entries(questionTypeLabels).map(([type, label]) => {
                            const color = questionTypeColors[type as EmbeddedQuestion['type']];
                            const count = passage.sections.reduce((sum, s) => 
                              sum + s.questions.filter(q => q.type === type).length, 0
                            );
                            return (
                              <div key={type} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${color.badgeBg}`}></div>
                                  <span className={color.text}>{label}</span>
                                </div>
                                <Badge variant="outline" className="text-[10px] h-5">{count}</Badge>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <Separator />

                      {/* Stats */}
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-slate-700">Statistics</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <Card className="p-2 bg-blue-50 border-blue-200">
                            <p className="text-[10px] text-blue-600 font-medium">Total Questions</p>
                            <p className="text-xl font-bold text-blue-700">
                              {passage.sections.reduce((sum, s) => sum + s.questions.length, 0)}
                            </p>
                          </Card>
                          <Card className="p-2 bg-green-50 border-green-200">
                            <p className="text-[10px] text-green-600 font-medium">Total Points</p>
                            <p className="text-xl font-bold text-green-700">
                              {passage.sections.reduce((sum, s) => 
                                sum + s.questions.reduce((qSum, q) => qSum + (q.points || 0), 0), 0
                              )}
                            </p>
                          </Card>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Preview Mode */}
                      <div className="space-y-3">
                        <div className="bg-white border rounded-lg p-4">
                          <h2 className="text-lg font-bold text-slate-900 mb-2">
                            {passage.title || 'Untitled Passage'}
                          </h2>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline">
                              {passage.type === 'reading' ? <BookOpen className="h-3 w-3 mr-1" /> : <Volume2 className="h-3 w-3 mr-1" />}
                              {passage.type}
                            </Badge>
                            {passage.type === 'listening' && passage.audioUrl && (
                              <Badge variant="secondary" className="text-xs">
                                <Volume2 className="h-3 w-3 mr-1" />
                                Audio
                              </Badge>
                            )}
                          </div>
                          <div className="prose prose-sm max-w-none">
                            <p className="text-xs text-slate-600 whitespace-pre-wrap">
                              {passage.content || 'No content yet...'}
                            </p>
                          </div>
                        </div>

                        {passage.sections.map((section, sIndex) => (
                          <div key={sIndex} className="bg-white border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-sm font-semibold text-slate-800">
                                {section.name || `Section ${sIndex + 1}`}
                              </h3>
                              <Badge variant="outline" className="text-xs">
                                Questions {section.range.start}-{section.range.end}
                              </Badge>
                            </div>
                            {section.instructions && (
                              <p className="text-xs text-slate-600 italic mb-3">{section.instructions}</p>
                            )}
                            <div className="space-y-2">
                              {section.questions.map((q, qIndex) => {
                                const color = questionTypeColors[q.type];
                                return (
                                  <div key={qIndex} className="border border-slate-200 rounded p-2 bg-white">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                      <span className={`text-xs font-semibold ${color.text}`}>Q{q.number}</span>
                                      <Badge variant="outline" className={`text-[10px] h-4 ${color.text} ${color.badgeBg} border-transparent`}>
                                        {questionTypeLabels[q.type]}
                                      </Badge>
                                    </div>
                                    {q.prompt && (
                                      <p className="text-xs text-slate-700 mb-1">{q.prompt}</p>
                                    )}
                                    {q.type === 'multiple-choice' && q.options && (
                                      <div className="space-y-0.5 mt-1">
                                        {q.options.map((opt, oIndex) => (
                                          <div key={oIndex} className="text-[10px] text-slate-600 flex items-start gap-1">
                                            <span className="font-medium">{String.fromCharCode(65 + oIndex)}.</span>
                                            <span>{opt || '(empty)'}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    <div className="mt-1 flex items-center gap-2 text-[10px]">
                                      <span className="text-slate-500">Answer:</span>
                                      <span className="font-medium text-slate-700">{q.correctAnswer || 'Not set'}</span>
                                      <span className="text-slate-500">•</span>
                                      <span className="text-slate-500">{q.points}pt</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/passages')}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreatePassage}
            disabled={loading || !passage.title || !passage.content}
            className="bg-[#004875] hover:bg-[#003a5c]"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Creating...' : 'Create Passage'}
          </Button>
        </div>
      </div>
    </div>
  );
}
