'use client';

import React, { useState, useEffect } from 'react';
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
  Edit3,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { authService } from '@/lib/auth';

interface SubQuestion {
  _id?: string;
  subQuestionNumber: number;
  subQuestionType?: 'multiple-choice' | 'fill-blank' | 'true-false' | 'short-answer';
  type?: 'multiple-choice' | 'fill-blank' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer?: any;
  points: number;
  explanation?: string;
}

interface Question {
  _id: string;
  testId: string;
  questionNumber: number;
  type: 'reading' | 'listening' | 'writing' | 'speaking' | 'full' | 'full-test';
  subType: 'multiple-choice' | 'fill-blank' | 'matching' | 'short-answer' | 'composite' | 'true-false';
  question: string;
  instructionText?: string;
  passage?: string;
  audioFile?: {
    url: string;
    publicId?: string;
    originalName?: string;
    format?: string;
    bytes?: number;
    duration?: number;
  };
  imageFile?: {
    url: string;
    publicId?: string;
    originalName?: string;
    format?: string;
    bytes?: number;
    width?: number;
    height?: number;
  };
  options: string[];
  correctAnswer?: any;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  wordLimit?: number;
  blanksCount?: number;
  section?: number;
  isComposite: boolean;
  hasSubQuestions: boolean;
  allowSubQuestions: boolean;
  subQuestions: SubQuestion[];
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  isActive: boolean;
  isAutoGraded?: boolean;
  markingType?: 'auto' | 'manual';
  createdAt: string;
  updatedAt: string;
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

export default function EditQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.id as string;
  const questionId = params.questionId as string;
  const { toast } = useToast();

  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Media state
  const [newAudioFile, setNewAudioFile] = useState<File | null>(null);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);

  const fetchQuestion = async () => {
    try {
      setLoading(true);
      const data = await authService.apiRequest(`/questions/${questionId}`);
      console.log('Question data:', data);
      setQuestion(data);
    } catch (error) {
      console.error('Failed to fetch question:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu câu hỏi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (questionId) {
      fetchQuestion();
    }
  }, [questionId]);

  const handleQuestionChange = (field: keyof Question, value: any) => {
    if (!question) return;
    setQuestion(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  const handleSubTypeChange = (subType: 'multiple-choice' | 'fill-blank' | 'matching' | 'short-answer' | 'composite') => {
    if (!question) return;
    const isComposite = subType === 'composite';
    setQuestion(prev => prev ? ({
      ...prev,
      subType,
      isComposite,
      hasSubQuestions: isComposite,
      allowSubQuestions: isComposite,
      subQuestions: isComposite ? prev.subQuestions || [] : [],
    }) : null);
  };

  const handleAddSubQuestion = () => {
    if (!question) return;
    const newSubQuestion: SubQuestion = {
      subQuestionNumber: (question.subQuestions?.length || 0) + 1,
      subQuestionType: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      points: 1,
      explanation: ''
    };
    setQuestion(prev => prev ? ({
      ...prev,
      subQuestions: [...(prev.subQuestions || []), newSubQuestion]
    }) : null);
  };

  const handleUpdateSubQuestion = (index: number, field: keyof SubQuestion, value: any) => {
    if (!question) return;
    setQuestion(prev => prev ? ({
      ...prev,
      subQuestions: prev.subQuestions?.map((sq, i) => {
        if (i !== index) return sq;
        if (field === 'subQuestionType' || field === 'type') {
          const newType = value as SubQuestion['subQuestionType'];
          if (newType === 'multiple-choice' || newType === 'true-false') {
            return {
              ...sq,
              subQuestionType: newType,
              type: newType,
              options: newType === 'true-false' ? ['True', 'False', 'Not Given'] : (sq.options?.length ? sq.options : ['', '', '', '']),
              correctAnswer: ''
            };
          } else {
            return { ...sq, subQuestionType: newType, type: newType, options: undefined, correctAnswer: '' };
          }
        }
        return { ...sq, [field]: value };
      }) || []
    }) : null);
  };

  const handleRemoveSubQuestion = (index: number) => {
    if (!question) return;
    setQuestion(prev => prev ? ({
      ...prev,
      subQuestions: prev.subQuestions?.filter((_, i) => i !== index).map((sq, i) => ({
        ...sq,
        subQuestionNumber: i + 1
      })) || []
    }) : null);
  };

  const handleAddTag = () => {
    if (!question || !tagInput.trim() || question.tags.includes(tagInput.trim())) return;
    setQuestion(prev => prev ? ({ ...prev, tags: [...prev.tags, tagInput.trim()] }) : null);
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!question) return;
    setQuestion(prev => prev ? ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }) : null);
  };

  const handleAddOption = () => {
    if (!question) return;
    setQuestion(prev => prev ? ({ ...prev, options: [...(prev.options || []), ''] }) : null);
  };

  const handleOptionChange = (index: number, value: string) => {
    if (!question) return;
    setQuestion(prev => prev ? ({
      ...prev,
      options: prev.options?.map((opt, i) => i === index ? value : opt) || []
    }) : null);
  };

  const handleRemoveOption = (index: number) => {
    if (!question) return;
    setQuestion(prev => prev ? ({ ...prev, options: prev.options?.filter((_, i) => i !== index) || [] }) : null);
  };

  const calculateTotalSubPoints = () => {
    if (!question?.subQuestions || question.subQuestions.length === 0) return 0;
    return question.subQuestions.reduce((sum, subQ) => sum + (subQ.points || 0), 0);
  };

  const validateQuestion = () => {
    if (!question) return false;
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
    if (!question || !validateQuestion()) return;

    setSaving(true);
    try {
      const questionData = {
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

      const hasNewFiles = newAudioFile || newImageFile;
      let response;

      if (hasNewFiles) {
        const formData = new FormData();
        formData.append('question', JSON.stringify(questionData));
        if (newAudioFile) formData.append('audioFile', newAudioFile);
        if (newImageFile) formData.append('imageFile', newImageFile);
        response = await authService.apiRequest(`/questions/${questionId}`, {
          method: 'PUT',
          body: formData
        });
      } else {
        response = await authService.apiRequest(`/questions/${questionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(questionData)
        });
      }

      toast({ title: "Thành công!", description: "Câu hỏi đã được cập nhật", variant: "default" });
      await fetchQuestion();
      setEditMode(false);
      setNewAudioFile(null);
      setNewImageFile(null);
    } catch (error: any) {
      toast({
        title: "Lỗi cập nhật",
        description: error.message || 'Có lỗi xảy ra khi cập nhật câu hỏi',
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 pb-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-primary"></div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Loading Question</h3>
                <p className="text-sm text-muted-foreground">Please wait...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 pb-6">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">Không tìm thấy câu hỏi</p>
              <Button onClick={() => router.push(`/dashboard/tests/${testId}`)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                <h1 className="text-xl font-semibold">Question #{question.questionNumber}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {getTypeIcon(question.type)}
                  <span className="capitalize">{question.type}</span>
                  <span>•</span>
                  <span className="capitalize">{question.subType}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {editMode ? (
                <>
                  <Button variant="outline" onClick={() => {
                    setEditMode(false);
                    fetchQuestion();
                    setNewAudioFile(null);
                    setNewImageFile(null);
                  }}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSaveQuestion} disabled={saving} size="lg">
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button onClick={() => setEditMode(true)} size="lg">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Mode
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {editMode ? (
                        <div className="flex items-center gap-2 flex-wrap w-full">
                          <Input
                            type="number"
                            min="1"
                            value={question.questionNumber}
                            onChange={(e) => handleQuestionChange('questionNumber', parseInt(e.target.value) || 1)}
                            className="w-20"
                          />
                          <Select value={question.subType} onValueChange={handleSubTypeChange}>
                            <SelectTrigger className="w-48">
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
                          <Select
                            value={question.difficulty}
                            onValueChange={(value: 'easy' | 'medium' | 'hard') => handleQuestionChange('difficulty', value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            min="1"
                            value={question.points}
                            onChange={(e) => handleQuestionChange('points', parseInt(e.target.value) || 1)}
                            className="w-24"
                            placeholder="Points"
                          />
                          {question.section && (
                            <Select
                              value={question.section?.toString() || ''}
                              onValueChange={(value) => handleQuestionChange('section', parseInt(value) || undefined)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Section" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">Section 1</SelectItem>
                                <SelectItem value="2">Section 2</SelectItem>
                                <SelectItem value="3">Section 3</SelectItem>
                                <SelectItem value="4">Section 4</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      ) : (
                        <>
                          <Badge variant="outline">Question #{question.questionNumber}</Badge>
                          <Badge variant="outline" className="capitalize">{question.type}</Badge>
                          <Badge className={getDifficultyColor(question.difficulty)}>{question.difficulty}</Badge>
                          <Badge variant="secondary">{question.points} {question.points === 1 ? 'point' : 'points'}</Badge>
                          {question.section && <Badge variant="outline">Section {question.section}</Badge>}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Instruction Text */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">Instructions {editMode && <span className="text-muted-foreground font-normal">(optional)</span>}</Label>
                  {editMode ? (
                    <Textarea
                      placeholder="Enter instructions..."
                      value={question.instructionText || ''}
                      onChange={(e) => handleQuestionChange('instructionText', e.target.value)}
                      rows={2}
                      className="bg-white"
                    />
                  ) : question.instructionText ? (
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{question.instructionText}</p>
                    </div>
                  ) : null}
                </div>

                {/* Passage */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-gray-700" />
                    <Label className="text-sm font-semibold text-gray-700">Reading Passage {editMode && <span className="text-muted-foreground font-normal">(optional)</span>}</Label>
                  </div>
                  {editMode ? (
                    <Textarea
                      placeholder="Enter passage..."
                      value={question.passage || ''}
                      onChange={(e) => handleQuestionChange('passage', e.target.value)}
                      rows={6}
                      className="font-mono text-sm bg-white"
                    />
                  ) : question.passage ? (
                    <div className="p-4 bg-white rounded-lg border">
                      <div className="prose prose-sm max-w-none">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{question.passage}</p>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Audio */}
                {(question.audioFile?.url || editMode) && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-5 w-5 text-gray-700" />
                      <Label className="text-sm font-semibold text-gray-700">Audio</Label>
                    </div>
                    {question.audioFile?.url && (
                      <AudioPlayer
                        src={question.audioFile.url}
                        title={question.audioFile.originalName || 'Question Audio'}
                        showDownload={false}
                        className="w-full"
                      />
                    )}
                    {editMode && (
                      <div className="border-2 border-dashed rounded-lg p-4">
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => setNewAudioFile(e.target.files?.[0] || null)}
                          className="hidden"
                          id="new-audio"
                        />
                        <label htmlFor="new-audio" className="cursor-pointer block text-center">
                          <Volume2 className="h-6 w-6 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">
                            {newAudioFile ? newAudioFile.name : 'Click to upload new audio'}
                          </p>
                        </label>
                        {newAudioFile && (
                          <Button variant="ghost" size="sm" onClick={() => setNewAudioFile(null)} className="mt-2 w-full text-red-600">
                            <X className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Image */}
                {(question.imageFile?.url || editMode) && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-gray-700" />
                      <Label className="text-sm font-semibold text-gray-700">Image</Label>
                    </div>
                    {question.imageFile?.url && (
                      <div className="rounded-lg border overflow-hidden">
                        <img
                          src={question.imageFile.url}
                          alt={question.imageFile.originalName || 'Question image'}
                          className="w-full h-auto max-h-96 object-contain"
                        />
                      </div>
                    )}
                    {editMode && (
                      <div className="border-2 border-dashed rounded-lg p-4">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setNewImageFile(e.target.files?.[0] || null)}
                          className="hidden"
                          id="new-image"
                        />
                        <label htmlFor="new-image" className="cursor-pointer block text-center">
                          <ImageIcon className="h-6 w-6 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">
                            {newImageFile ? newImageFile.name : 'Click to upload new image'}
                          </p>
                        </label>
                        {newImageFile && (
                          <Button variant="ghost" size="sm" onClick={() => setNewImageFile(null)} className="mt-2 w-full text-red-600">
                            <X className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Question Text */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold text-gray-900">Question *</Label>
                  {editMode ? (
                    <Textarea
                      placeholder="Enter question text..."
                      value={question.question}
                      onChange={(e) => handleQuestionChange('question', e.target.value)}
                      rows={4}
                      className="bg-white"
                    />
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{question.question}</p>
                  )}
                </div>

                {/* Options for Multiple Choice */}
                {question.subType === 'multiple-choice' && (
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700">Options</Label>
                    {editMode ? (
                      <div className="space-y-3">
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
                    ) : (
                      <RadioGroup value={question.correctAnswer}>
                        <div className="space-y-2">
                          {question.options.map((option, index) => (
                            <div
                              key={index}
                              className={`flex items-center space-x-3 p-3 rounded-lg border ${option === question.correctAnswer ? 'bg-green-50 border-green-200' : 'bg-white'
                                }`}
                            >
                              <RadioGroupItem value={option} id={`option-${index}`} disabled />
                              <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-sm">
                                <span className="font-semibold mr-2">{String.fromCharCode(65 + index)}.</span>
                                {option}
                              </Label>
                              {option === question.correctAnswer && (
                                <Badge variant="default" className="bg-green-600">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Correct
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    )}
                  </div>
                )}

                {/* Sub Questions */}
                {(question.hasSubQuestions || question.subType === 'composite') && (
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold text-gray-900">
                        Sub Questions ({question.subQuestions?.length || 0})
                      </Label>
                      {editMode && (
                        <Button variant="outline" size="sm" onClick={handleAddSubQuestion}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Sub-Question
                        </Button>
                      )}
                    </div>
                    <div className="space-y-4">
                      {question.subQuestions?.map((subQ, subIndex) => {
                        const subType = subQ.subQuestionType || subQ.type;
                        return (
                          <div key={subQ._id || subIndex} className="p-4 bg-white rounded-lg border">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {editMode ? (
                                    <>
                                      <Badge variant="outline" className="text-xs">#{subQ.subQuestionNumber}</Badge>
                                      <Select
                                        value={subType || 'multiple-choice'}
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
                                      />
                                    </>
                                  ) : (
                                    <>
                                      <Badge variant="outline" className="text-xs">#{subQ.subQuestionNumber}</Badge>
                                      <Badge variant="secondary" className="text-xs">
                                        {subQ.points} {subQ.points === 1 ? 'point' : 'points'}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs capitalize">{subType}</Badge>
                                    </>
                                  )}
                                </div>
                                {editMode && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveSubQuestion(subIndex)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>

                              {editMode ? (
                                <Textarea
                                  placeholder="Enter sub-question text..."
                                  value={subQ.question}
                                  onChange={(e) => handleUpdateSubQuestion(subIndex, 'question', e.target.value)}
                                  rows={2}
                                  className="text-sm"
                                />
                              ) : (
                                <p className="text-sm">{subQ.question}</p>
                              )}

                              {subType === 'multiple-choice' && subQ.options && subQ.options.length > 0 && (
                                <div className="space-y-2">
                                  {editMode ? (
                                    <>
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
                                      <div className="pt-2">
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
                                    </>
                                  ) : (
                                    <RadioGroup value={subQ.correctAnswer}>
                                      <div className="space-y-2">
                                        {subQ.options.map((option, optIndex) => (
                                          <div
                                            key={optIndex}
                                            className={`flex items-center space-x-3 p-2 rounded border text-sm ${option === subQ.correctAnswer ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                                              }`}
                                          >
                                            <RadioGroupItem value={option} id={`sub-${subIndex}-opt-${optIndex}`} disabled />
                                            <Label htmlFor={`sub-${subIndex}-opt-${optIndex}`} className="flex-1 cursor-pointer text-xs">
                                              <span className="font-semibold mr-2">{String.fromCharCode(65 + optIndex)}.</span>
                                              {option}
                                            </Label>
                                            {option === subQ.correctAnswer && (
                                              <Badge variant="default" className="bg-green-600 text-xs">
                                                <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                                                Correct
                                              </Badge>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </RadioGroup>
                                  )}
                                </div>
                              )}

                              {subType === 'true-false' && (
                                <div className="space-y-2">
                                  {editMode ? (
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
                                  ) : (
                                    <RadioGroup value={subQ.correctAnswer}>
                                      {['True', 'False', 'Not Given'].map((option) => (
                                        <div
                                          key={option}
                                          className={`flex items-center space-x-3 p-2 rounded border text-sm ${option === subQ.correctAnswer ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                                            }`}
                                        >
                                          <RadioGroupItem value={option} id={`sub-${subIndex}-${option}`} disabled />
                                          <Label htmlFor={`sub-${subIndex}-${option}`} className="flex-1 text-xs">{option}</Label>
                                          {option === subQ.correctAnswer && (
                                            <Badge variant="default" className="bg-green-600 text-xs">
                                              <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                                              Correct
                                            </Badge>
                                          )}
                                        </div>
                                      ))}
                                    </RadioGroup>
                                  )}
                                </div>
                              )}

                              {(subType === 'fill-blank' || subType === 'short-answer') && (
                                editMode ? (
                                  <Input
                                    placeholder="Enter correct answer..."
                                    value={subQ.correctAnswer || ''}
                                    onChange={(e) => handleUpdateSubQuestion(subIndex, 'correctAnswer', e.target.value)}
                                    className="text-sm"
                                  />
                                ) : subQ.correctAnswer ? (
                                  <div className="p-3 bg-green-50 border border-green-200 rounded">
                                    <Label className="text-xs font-medium text-green-700 mb-1 block">Correct Answer</Label>
                                    <p className="text-sm font-medium">{subQ.correctAnswer}</p>
                                  </div>
                                ) : null
                              )}

                              {editMode ? (
                                <Input
                                  placeholder="Explanation (optional)..."
                                  value={subQ.explanation || ''}
                                  onChange={(e) => handleUpdateSubQuestion(subIndex, 'explanation', e.target.value)}
                                  className="text-xs"
                                />
                              ) : subQ.explanation ? (
                                <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                                  <Label className="text-xs font-medium text-blue-700 mb-1 block">Explanation</Label>
                                  <p className="text-xs text-blue-900">{subQ.explanation}</p>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tags */}
            <Card>
              <CardHeader>
                <Label className="text-base font-semibold">Tags</Label>
              </CardHeader>
              <CardContent className="space-y-4">
                {editMode && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    />
                    <Button onClick={handleAddTag} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {question.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      {editMode && (
                        <button onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-red-600">
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                  {question.tags.length === 0 && !editMode && (
                    <p className="text-sm text-muted-foreground">No tags</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Validation for Composite */}
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

            {/* Info */}
            <Card>
              <CardHeader>
                <Label className="text-base font-semibold">Info</Label>
              </CardHeader>
              <CardContent>
                <div className="text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={question.isActive ? 'default' : 'secondary'} className="text-xs">
                      {question.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created By:</span>
                    <span>{question.createdBy.firstName} {question.createdBy.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{new Date(question.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Updated:</span>
                    <span>{new Date(question.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
