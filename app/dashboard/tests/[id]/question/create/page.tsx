'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { AudioPlayer } from '@/components/ui/audio-player';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Volume2,
  Image as ImageIcon,
  FileText,
  BookOpen,
  PenTool,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  CheckCircle2
} from 'lucide-react';
import { authService } from '@/lib/auth';

interface SubQuestion {
  subQuestionNumber: number;
  subQuestionType: 'multiple-choice' | 'fill-blank' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer?: any;
  points: number;
  explanation?: string;
}

interface Question {
  testId?: string;
  questionNumber?: number;
  type: 'reading' | 'listening' | 'writing' | 'speaking' | 'full' | 'full-test';
  subType: 'multiple-choice' | 'fill-blank' | 'matching' | 'short-answer' | 'composite' | 'true-false';
  question: string;
  instructionText?: string;
  passage?: string;
  audioFile?: File | null;
  imageFile?: File | null;
  options?: string[];
  correctAnswer?: any;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  wordLimit?: number;
  blanksCount?: number;
  section?: number;
  isComposite?: boolean;
  hasSubQuestions?: boolean;
  allowSubQuestions?: boolean;
  subQuestions?: SubQuestion[];
  isActive?: boolean;
}

const questionTypes = {
  reading: [
    { value: 'multiple-choice' as const, label: 'Multiple Choice' },
    { value: 'fill-blank' as const, label: 'Fill in the Blank' },
    { value: 'matching' as const, label: 'Matching' },
    { value: 'short-answer' as const, label: 'Short Answer' },
    { value: 'composite' as const, label: 'Composite Question' },
  ],
  listening: [
    { value: 'multiple-choice' as const, label: 'Multiple Choice' },
    { value: 'fill-blank' as const, label: 'Fill in the Blank' },
    { value: 'matching' as const, label: 'Matching' },
    { value: 'short-answer' as const, label: 'Short Answer' },
    { value: 'composite' as const, label: 'Composite Question' },
  ],
  writing: [
    { value: 'multiple-choice' as const, label: 'Multiple Choice' },
    { value: 'fill-blank' as const, label: 'Fill in the Blank' },
    { value: 'short-answer' as const, label: 'Short Answer' },
    { value: 'composite' as const, label: 'Composite Question' },
  ],
  speaking: [
    { value: 'short-answer' as const, label: 'Short Answer' },
  ],
  'full-test': [
    { value: 'multiple-choice' as const, label: 'Multiple Choice' },
    { value: 'fill-blank' as const, label: 'Fill in the Blank' },
    { value: 'matching' as const, label: 'Matching' },
    { value: 'short-answer' as const, label: 'Short Answer' },
    { value: 'composite' as const, label: 'Composite Question' },
  ],
  full: [
    { value: 'multiple-choice' as const, label: 'Multiple Choice' },
    { value: 'fill-blank' as const, label: 'Fill in the Blank' },
    { value: 'matching' as const, label: 'Matching' },
    { value: 'short-answer' as const, label: 'Short Answer' },
    { value: 'composite' as const, label: 'Composite Question' },
  ],
};

export default function CreateQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.id as string;
  const { toast } = useToast();

  const [question, setQuestion] = useState<Question>({
    testId: testId,
    type: 'reading',
    subType: 'multiple-choice',
    question: '',
    instructionText: '',
    points: 1,
    difficulty: 'medium',
    tags: [],
    options: ['', '', '', ''],
    isComposite: false,
    hasSubQuestions: false,
    allowSubQuestions: false,
    subQuestions: [],
    isActive: true,
    questionNumber: 1,
  });

  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleQuestionChange = (field: keyof Question, value: any) => {
    setQuestion(prev => ({ ...prev, [field]: value }));
  };

  const handleSubTypeChange = (subType: 'multiple-choice' | 'fill-blank' | 'matching' | 'short-answer' | 'composite') => {
    const isComposite = subType === 'composite';
    setQuestion(prev => ({
      ...prev,
      subType,
      isComposite,
      hasSubQuestions: isComposite,
      allowSubQuestions: isComposite,
      subQuestions: isComposite ? prev.subQuestions || [] : [],
    }));
  };

  const handleAddSubQuestion = () => {
    const newSubQuestion: SubQuestion = {
      subQuestionNumber: (question.subQuestions?.length || 0) + 1,
      subQuestionType: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      points: 1,
      explanation: ''
    };
    setQuestion(prev => ({
      ...prev,
      subQuestions: [...(prev.subQuestions || []), newSubQuestion]
    }));
  };

  const handleUpdateSubQuestion = (index: number, field: keyof SubQuestion, value: any) => {
    setQuestion(prev => ({
      ...prev,
      subQuestions: prev.subQuestions?.map((sq, i) => {
        if (i !== index) return sq;
        if (field === 'subQuestionType') {
          const newType = value as SubQuestion['subQuestionType'];
          if (newType === 'multiple-choice' || newType === 'true-false') {
            return {
              ...sq,
              subQuestionType: newType,
              options: newType === 'true-false' ? ['True', 'False', 'Not Given'] : (sq.options?.length ? sq.options : ['', '', '', '']),
              correctAnswer: ''
            };
          } else {
            return { ...sq, subQuestionType: newType, options: undefined, correctAnswer: '' };
          }
        }
        return { ...sq, [field]: value };
      }) || []
    }));
  };

  const handleRemoveSubQuestion = (index: number) => {
    setQuestion(prev => ({
      ...prev,
      subQuestions: prev.subQuestions?.filter((_, i) => i !== index).map((sq, i) => ({
        ...sq,
        subQuestionNumber: i + 1
      })) || []
    }));
  };

  const handleAddTag = () => {
    if (!tagInput.trim() || question.tags.includes(tagInput.trim())) return;
    setQuestion(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setQuestion(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  };

  const handleAddOption = () => {
    setQuestion(prev => ({ ...prev, options: [...(prev.options || []), ''] }));
  };

  const handleOptionChange = (index: number, value: string) => {
    setQuestion(prev => ({
      ...prev,
      options: prev.options?.map((opt, i) => i === index ? value : opt) || []
    }));
  };

  const handleRemoveOption = (index: number) => {
    setQuestion(prev => ({ ...prev, options: prev.options?.filter((_, i) => i !== index) || [] }));
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setQuestion(prev => ({ ...prev, audioFile: file }));
      setAudioPreview(URL.createObjectURL(file));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setQuestion(prev => ({ ...prev, imageFile: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const calculateTotalSubPoints = () => {
    if (!question?.subQuestions || question.subQuestions.length === 0) return 0;
    return question.subQuestions.reduce((sum, subQ) => sum + (subQ.points || 0), 0);
  };

  const validateQuestion = () => {
    if (!question.question.trim()) {
      toast({ title: "Lỗi", description: "Vui lòng nhập nội dung câu hỏi", variant: "destructive" });
      return false;
    }
    if (question.isComposite && question.subQuestions) {
      if (question.subQuestions.length === 0) {
        toast({ title: "Lỗi", description: "Vui lòng thêm ít nhất 1 câu hỏi con", variant: "destructive" });
        return false;
      }
      const totalSubPoints = calculateTotalSubPoints();
      if (totalSubPoints !== question.points) {
        toast({
          title: "Lỗi điểm số",
          description: `Tổng điểm của các câu hỏi con (${totalSubPoints}) phải bằng điểm của câu hỏi chính (${question.points})`,
          variant: "destructive"
        });
        return false;
      }
    }
    return true;
  };

  const handleSaveQuestion = async () => {
    if (!validateQuestion()) return;

    setSaving(true);
    try {
      const formData = new FormData();

      const questionData = {
        testId: testId,
        questionNumber: question.questionNumber,
        type: question.type,
        subType: question.subType,
        question: question.question,
        points: question.points,
        hasSubQuestions: question.hasSubQuestions,
        allowSubQuestions: question.allowSubQuestions,
        subQuestions: question.subQuestions,
        instructionText: question.instructionText,
        passage: question.passage,
        difficulty: question.difficulty,
        tags: question.tags,
        wordLimit: question.wordLimit,
        blanksCount: question.blanksCount,
        section: question.section,
        options: question.options,
        correctAnswer: question.correctAnswer,
        isActive: question.isActive,
      };

      formData.append('question', JSON.stringify(questionData));
      if (question.audioFile) formData.append('audioFile', question.audioFile);
      if (question.imageFile) formData.append('imageFile', question.imageFile);

      await authService.apiRequest(`/questions`, {
        method: 'POST',
        body: formData
      });

      toast({ title: "Thành công!", description: "Câu hỏi đã được tạo", variant: "default" });
      setTimeout(() => router.push(`/dashboard/tests/${testId}`), 1500);
    } catch (error: any) {
      toast({
        title: "Lỗi tạo câu hỏi",
        description: error.message || 'Có lỗi xảy ra',
        variant: "destructive"
      });
    } finally {
      setSaving(false);
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reading': return <BookOpen className="h-4 w-4" />;
      case 'listening': return <Volume2 className="h-4 w-4" />;
      case 'writing': return <PenTool className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/tests/${testId}`)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Create New Question</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {getTypeIcon(question.type)}
                  <span className="capitalize">{question.type}</span>
                  <span>•</span>
                  <span className="capitalize">{question.subType}</span>
                </div>
              </div>
            </div>

            <Button onClick={handleSaveQuestion} disabled={saving} size="lg">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Question
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Area */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="grid grid-cols-4 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Question #</Label>
                        <Input
                          type="number"
                          min="1"
                          value={question.questionNumber}
                          onChange={(e) => handleQuestionChange('questionNumber', parseInt(e.target.value) || 1)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Type</Label>
                        <Select value={question.subType} onValueChange={handleSubTypeChange}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {questionTypes[question.type]?.map((subtype) => (
                              <SelectItem key={subtype.value} value={subtype.value}>
                                {subtype.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Difficulty</Label>
                        <Select
                          value={question.difficulty}
                          onValueChange={(value: 'easy' | 'medium' | 'hard') => handleQuestionChange('difficulty', value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Points</Label>
                        <Input
                          type="number"
                          min="1"
                          value={question.points}
                          onChange={(e) => handleQuestionChange('points', parseInt(e.target.value) || 1)}
                          className="h-9"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Instructions */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Instructions <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Textarea
                    placeholder="Enter instructions for this question..."
                    value={question.instructionText || ''}
                    onChange={(e) => handleQuestionChange('instructionText', e.target.value)}
                    rows={2}
                    className="bg-white"
                  />
                </div>

                {/* Passage */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-gray-700" />
                    <Label className="text-sm font-semibold text-gray-700">
                      Reading Passage <span className="text-muted-foreground font-normal">(optional)</span>
                    </Label>
                  </div>
                  <Textarea
                    placeholder="Enter reading passage text..."
                    value={question.passage || ''}
                    onChange={(e) => handleQuestionChange('passage', e.target.value)}
                    rows={6}
                    className="font-mono text-sm bg-white"
                  />
                </div>

                {/* Audio Upload */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-gray-700" />
                    <Label className="text-sm font-semibold text-gray-700">Audio File <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  </div>
                  {audioPreview && (
                    <div className="mb-2">
                      <audio controls src={audioPreview} className="w-full" />
                    </div>
                  )}
                  <div className="border-2 border-dashed rounded-lg p-4">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioChange}
                      className="hidden"
                      id="audio-upload"
                    />
                    <label htmlFor="audio-upload" className="cursor-pointer block text-center">
                      <Volume2 className="h-6 w-6 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        {question.audioFile ? question.audioFile.name : 'Click to upload audio'}
                      </p>
                    </label>
                    {question.audioFile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setQuestion(prev => ({ ...prev, audioFile: null }));
                          setAudioPreview(null);
                        }}
                        className="mt-2 w-full text-red-600"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-gray-700" />
                    <Label className="text-sm font-semibold text-gray-700">Image <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  </div>
                  {imagePreview && (
                    <div className="mb-2">
                      <img src={imagePreview} alt="Preview" className="w-full h-auto max-h-96 object-contain rounded-lg border" />
                    </div>
                  )}
                  <div className="border-2 border-dashed rounded-lg p-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer block text-center">
                      <ImageIcon className="h-6 w-6 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        {question.imageFile ? question.imageFile.name : 'Click to upload image'}
                      </p>
                    </label>
                    {question.imageFile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setQuestion(prev => ({ ...prev, imageFile: null }));
                          setImagePreview(null);
                        }}
                        className="mt-2 w-full text-red-600"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>

                {/* Question Text */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-900">Question Text *</Label>
                  <Textarea
                    placeholder="Enter the main question text..."
                    value={question.question}
                    onChange={(e) => handleQuestionChange('question', e.target.value)}
                    rows={4}
                    className="bg-white"
                  />
                </div>

                {/* Options for Multiple Choice */}
                {question.subType === 'multiple-choice' && (
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700">Answer Options</Label>
                    {question.options?.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                          {String.fromCharCode(65 + index)}
                        </div>
                        <Input
                          placeholder={`Option ${String.fromCharCode(65 + index)}`}
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          className="flex-1"
                        />
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveOption(index)} className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" onClick={handleAddOption} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Option
                    </Button>
                    <div className="space-y-2 pt-2">
                      <Label>Correct Answer</Label>
                      <Select
                        value={question.correctAnswer || ''}
                        onValueChange={(value) => handleQuestionChange('correctAnswer', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select correct answer" />
                        </SelectTrigger>
                        <SelectContent>
                          {question.options?.map((option, index) =>
                            option.trim() ? (
                              <SelectItem key={index} value={option}>
                                {String.fromCharCode(65 + index)}. {option}
                              </SelectItem>
                            ) : null
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Sub Questions */}
                {(question.isComposite || question.subType === 'composite') && (
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold text-gray-900">
                        Sub Questions ({question.subQuestions?.length || 0})
                      </Label>
                      <Button variant="outline" size="sm" onClick={handleAddSubQuestion}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Sub-Question
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {question.subQuestions?.map((subQ, subIndex) => (
                        <div key={subIndex} className="p-4 bg-white rounded-lg border">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="text-xs">#{subQ.subQuestionNumber}</Badge>
                                <Select
                                  value={subQ.subQuestionType || 'multiple-choice'}
                                  onValueChange={(value) => handleUpdateSubQuestion(subIndex, 'subQuestionType', value)}
                                >
                                  <SelectTrigger className="w-40 h-7 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                                    <SelectItem value="fill-blank">Fill Blank</SelectItem>
                                    <SelectItem value="true-false">True/False</SelectItem>
                                    <SelectItem value="short-answer">Short Answer</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  type="number"
                                  min="1"
                                  value={subQ.points}
                                  onChange={(e) => handleUpdateSubQuestion(subIndex, 'points', parseInt(e.target.value) || 1)}
                                  className="w-16 h-7 text-xs"
                                  placeholder="pts"
                                />
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveSubQuestion(subIndex)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <Textarea
                              placeholder="Enter sub-question text..."
                              value={subQ.question}
                              onChange={(e) => handleUpdateSubQuestion(subIndex, 'question', e.target.value)}
                              rows={2}
                              className="text-sm"
                            />

                            {subQ.subQuestionType === 'multiple-choice' && subQ.options && subQ.options.length > 0 && (
                              <div className="space-y-2">
                                {subQ.options.map((option, optIndex) => (
                                  <div key={optIndex} className="flex items-center gap-2">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                                      {String.fromCharCode(65 + optIndex)}
                                    </div>
                                    <Input
                                      placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                                      value={option}
                                      onChange={(e) => {
                                        const newOptions = [...(subQ.options || [])];
                                        newOptions[optIndex] = e.target.value;
                                        handleUpdateSubQuestion(subIndex, 'options', newOptions);
                                      }}
                                      className="text-xs"
                                    />
                                  </div>
                                ))}
                                <Select
                                  value={subQ.correctAnswer || ''}
                                  onValueChange={(value) => handleUpdateSubQuestion(subIndex, 'correctAnswer', value)}
                                >
                                  <SelectTrigger className="text-xs">
                                    <SelectValue placeholder="Select correct answer" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {subQ.options?.map((option, optIndex) =>
                                      option.trim() ? (
                                        <SelectItem key={optIndex} value={option}>
                                          {String.fromCharCode(65 + optIndex)}. {option}
                                        </SelectItem>
                                      ) : null
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {subQ.subQuestionType === 'true-false' && (
                              <Select
                                value={subQ.correctAnswer || ''}
                                onValueChange={(value) => handleUpdateSubQuestion(subIndex, 'correctAnswer', value)}
                              >
                                <SelectTrigger className="text-xs">
                                  <SelectValue placeholder="Select correct answer" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="True">True</SelectItem>
                                  <SelectItem value="False">False</SelectItem>
                                  <SelectItem value="Not Given">Not Given</SelectItem>
                                </SelectContent>
                              </Select>
                            )}

                            {(subQ.subQuestionType === 'fill-blank' || subQ.subQuestionType === 'short-answer') && (
                              <Input
                                placeholder="Enter correct answer..."
                                value={subQ.correctAnswer || ''}
                                onChange={(e) => handleUpdateSubQuestion(subIndex, 'correctAnswer', e.target.value)}
                                className="text-sm"
                              />
                            )}

                            <Input
                              placeholder="Explanation (optional)..."
                              value={subQ.explanation || ''}
                              onChange={(e) => handleUpdateSubQuestion(subIndex, 'explanation', e.target.value)}
                              className="text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Additional Settings */}
            <Card>
              <CardHeader>
                <Label className="text-base font-semibold">Additional Settings</Label>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Section (optional)</Label>
                  <Select
                    value={question.section?.toString() || ''}
                    onValueChange={(value) => handleQuestionChange('section', value ? parseInt(value) : undefined)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Section 1</SelectItem>
                      <SelectItem value="2">Section 2</SelectItem>
                      <SelectItem value="3">Section 3</SelectItem>
                      <SelectItem value="4">Section 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <Label className="text-base font-semibold">Tags</Label>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    className="h-9"
                  />
                  <Button onClick={handleAddTag} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {question.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-red-600">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {question.tags.length === 0 && (
                    <p className="text-sm text-muted-foreground">No tags added</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Validation */}
            {question.isComposite && question.subQuestions && question.subQuestions.length > 0 && (
              <Card>
                <CardHeader>
                  <Label className="text-base font-semibold">Validation</Label>
                </CardHeader>
                <CardContent>
                  <div className={`p-3 rounded-lg ${calculateTotalSubPoints() === question.points ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center gap-2 text-sm">
                      {calculateTotalSubPoints() === question.points ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <div className={calculateTotalSubPoints() === question.points ? 'text-green-700' : 'text-red-700'}>
                        <div className="font-medium">Sub-points: {calculateTotalSubPoints()}/{question.points}</div>
                        {calculateTotalSubPoints() !== question.points && (
                          <div className="text-xs mt-1">Total must match main points</div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
