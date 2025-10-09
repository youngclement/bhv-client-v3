'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Edit2,
  Volume2,
  Image as ImageIcon,
  FileText,
  BookOpen,
  PenTool,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react';
import { authService } from '@/lib/auth';
import { AudioUpload } from '@/components/ui/file-upload';
import { ImageUpload } from '@/components/ui/file-upload';

interface SubQuestion {
  subQuestionNumber: number;
  question: string;
  options?: string[];
  correctAnswer?: string;
  points: number;
  explanation?: string;
  audioTimestamp?: {
    start: number;
    end: number;
  };
}

interface Question {
  type: 'reading' | 'listening' | 'writing';
  subType: string;
  question: string;
  instructionText?: string;
  passage?: string;
  audioFile?: File | null;
  imageFile?: File | null;
  options?: string[];
  correctAnswer?: string;
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
}

const questionTypes = {
  reading: [
    { value: 'multiple-choice', label: 'Multiple Choice' },
    { value: 'true-false-not-given', label: 'True/False/Not Given' },
    { value: 'yes-no-not-given', label: 'Yes/No/Not Given' },
    { value: 'matching-headings', label: 'Matching Headings' },
    { value: 'matching-information', label: 'Matching Information' },
    { value: 'sentence-completion', label: 'Sentence Completion' },
    { value: 'summary-completion', label: 'Summary Completion' },
    { value: 'short-answer', label: 'Short Answer' },
  ],
  listening: [
    { value: 'listening-multiple-choice', label: 'Multiple Choice' },
    { value: 'form-completion', label: 'Form Completion' },
    { value: 'note-completion', label: 'Note Completion' },
    { value: 'table-completion', label: 'Table Completion' },
    { value: 'flowchart-completion', label: 'Flowchart Completion' },
    { value: 'sentence-completion', label: 'Sentence Completion' },
    { value: 'summary-completion', label: 'Summary Completion' },
    { value: 'diagram-labelling', label: 'Diagram Labelling' },
    { value: 'map-labelling', label: 'Map Labelling' },
    { value: 'plan-labelling', label: 'Plan Labelling' },
    { value: 'listening-matching', label: 'Matching' },
    { value: 'listening-short-answer', label: 'Short Answer' },
    { value: 'pick-from-list', label: 'Pick from List' },
  ],
  writing: [
    { value: 'task1', label: 'Task 1 (Academic/General)' },
    { value: 'task2', label: 'Task 2 (Essay)' },
    { value: 'essay', label: 'General Essay' },
  ],
};

export default function CreateTestQuestionsPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.id as string;

  const [question, setQuestion] = useState<Question>({
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
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tagInput, setTagInput] = useState('');

  // Handle form changes
  const handleQuestionChange = (field: keyof Question, value: any) => {
    setQuestion(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTypeChange = (type: 'reading' | 'listening' | 'writing') => {
    setQuestion(prev => ({
      ...prev,
      type,
      subType: questionTypes[type][0].value
    }));
  };

  const handleSubTypeChange = (subType: string) => {
    const isComposite = subType === 'composite';
    setQuestion(prev => ({
      ...prev,
      subType,
      isComposite,
      hasSubQuestions: isComposite,
      allowSubQuestions: isComposite,
      subQuestions: isComposite ? prev.subQuestions || [] : []
    }));
  };

  const handleAddSubQuestion = () => {
    const newSubQuestion: SubQuestion = {
      subQuestionNumber: (question.subQuestions?.length || 0) + 1,
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
      subQuestions: prev.subQuestions?.map((sq, i) => 
        i === index ? { ...sq, [field]: value } : sq
      ) || []
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
    if (tagInput.trim() && !question.tags.includes(tagInput.trim())) {
      setQuestion(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setQuestion(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleAddOption = () => {
    setQuestion(prev => ({
      ...prev,
      options: [...(prev.options || []), '']
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    setQuestion(prev => ({
      ...prev,
      options: prev.options?.map((opt, i) => i === index ? value : opt) || []
    }));
  };

  const handleRemoveOption = (index: number) => {
    setQuestion(prev => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index) || []
    }));
  };

  const validateQuestion = () => {
    if (!question.question.trim()) {
      setError('Vui lòng nhập nội dung câu hỏi');
      return false;
    }
    if (!question.subType) {
      setError('Vui lòng chọn loại câu hỏi');
      return false;
    }
    if (question.points < 1) {
      setError('Điểm số phải lớn hơn 0');
      return false;
    }
    if (question.type === 'writing' && !question.wordLimit) {
      setError('Vui lòng nhập giới hạn từ cho câu hỏi Writing');
      return false;
    }
    if (question.subType.includes('completion') && !question.blanksCount) {
      setError('Vui lòng nhập số lượng chỗ trống');
      return false;
    }
    if (question.subType.includes('multiple-choice') && (!question.options || question.options.length < 2)) {
      setError('Vui lòng thêm ít nhất 2 lựa chọn cho câu hỏi trắc nghiệm');
      return false;
    }
    
    // Validate composite questions
    if (question.isComposite) {
      if (!question.subQuestions || question.subQuestions.length === 0) {
        setError('Vui lòng thêm ít nhất 1 câu hỏi con cho composite question');
        return false;
      }
      
      for (let i = 0; i < question.subQuestions.length; i++) {
        const subQ = question.subQuestions[i];
        if (!subQ.question.trim()) {
          setError(`Vui lòng nhập nội dung cho câu hỏi con ${i + 1}`);
          return false;
        }
        if (subQ.points < 1) {
          setError(`Điểm số cho câu hỏi con ${i + 1} phải lớn hơn 0`);
          return false;
        }
      }
    }
    
    return true;
  };

  const handleSaveQuestion = async () => {
    if (!validateQuestion()) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      
      // Add question data
      const questionData = {
        type: question.type,
        subType: question.subType,
        question: question.question,
        instructionText: question.instructionText,
        passage: question.passage,
        points: question.points,
        difficulty: question.difficulty,
        tags: question.tags,
        wordLimit: question.wordLimit,
        blanksCount: question.blanksCount,
        section: question.section,
        options: question.options,
        correctAnswer: question.correctAnswer,
        isComposite: question.isComposite,
        hasSubQuestions: question.hasSubQuestions,
        allowSubQuestions: question.allowSubQuestions,
        subQuestions: question.subQuestions,
      };

      formData.append('question', JSON.stringify(questionData));

      // Add files if present
      if (question.audioFile) {
        formData.append('audioFile', question.audioFile);
      }
      if (question.imageFile) {
        formData.append('imageFile', question.imageFile);
      }

      const response = await authService.apiRequest('/questions', {
        method: 'POST',
        body: formData
      });

      setSuccess('Câu hỏi đã được tạo thành công!');
      
      // Reset form
      setQuestion({
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
      });

      // Redirect to test builder after a short delay
      setTimeout(() => {
        router.push(`/dashboard/tests/${testId}`);
      }, 2000);

    } catch (error: any) {
      setError(error.message || 'Có lỗi xảy ra khi tạo câu hỏi');
    } finally {
      setSaving(false);
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/dashboard/tests/${testId}`)}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </Button>
              <div className="border-l border-slate-300 pl-3">
                <h1 className="text-lg font-semibold text-slate-900">Tạo Câu Hỏi Mới</h1>
                <p className="text-sm text-slate-500">Thêm câu hỏi vào bài test</p>
          </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800">{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-4 lg:grid-cols-3">
          {/* Main Form */}
          <div className="xl:col-span-3 lg:col-span-2 space-y-6">
            {/* Question Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getTypeIcon(question.type)}
                  Loại Câu Hỏi
                </CardTitle>
                <CardDescription>
                  Chọn loại câu hỏi phù hợp với bài test IELTS
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(questionTypes).map(([type, subtypes]) => (
                    <Button
                      key={type}
                      variant={question.type === type ? "default" : "outline"}
                      onClick={() => handleTypeChange(type as any)}
                      className="h-auto p-4 flex flex-col items-center gap-2"
                    >
                      {getTypeIcon(type)}
                      <span className="capitalize font-medium">{type}</span>
                    </Button>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Loại câu hỏi cụ thể</Label>
                  <Select
                    value={question.subType}
                    onValueChange={handleSubTypeChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại câu hỏi" />
                    </SelectTrigger>
                    <SelectContent>
                      {questionTypes[question.type].map((subtype) => (
                        <SelectItem key={subtype.value} value={subtype.value}>
                          {subtype.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
        </div>
              </CardContent>
            </Card>

            {/* Question Content */}
            <Card>
              <CardHeader>
                <CardTitle>Nội Dung Câu Hỏi</CardTitle>
                <CardDescription>
                  Nhập nội dung câu hỏi và các thông tin liên quan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="instruction">Hướng dẫn (tùy chọn)</Label>
                  <Textarea
                    id="instruction"
                    placeholder="Nhập hướng dẫn cho câu hỏi..."
                    value={question.instructionText || ''}
                    onChange={(e) => handleQuestionChange('instructionText', e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="question">Nội dung câu hỏi *</Label>
                  <Textarea
                    id="question"
                    placeholder="Nhập nội dung câu hỏi..."
                    value={question.question}
                    onChange={(e) => handleQuestionChange('question', e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                {question.type === 'reading' && (
                  <div className="space-y-2">
                    <Label htmlFor="passage">Đoạn văn (tùy chọn)</Label>
                    <Textarea
                      id="passage"
                      placeholder="Nhập đoạn văn cho câu hỏi Reading..."
                      value={question.passage || ''}
                      onChange={(e) => handleQuestionChange('passage', e.target.value)}
                      rows={6}
                      className="resize-none"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Multiple Choice Options */}
            {question.subType.includes('multiple-choice') && (
              <Card>
                <CardHeader>
                  <CardTitle>Các Lựa Chọn</CardTitle>
                  <CardDescription>
                    Thêm các lựa chọn cho câu hỏi trắc nghiệm
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {question.options?.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                        {String.fromCharCode(65 + index)}
                      </div>
                      <Input
                        placeholder={`Lựa chọn ${String.fromCharCode(65 + index)}`}
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveOption(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <Button
                    variant="outline"
                    onClick={handleAddOption}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm lựa chọn
                  </Button>

                  <div className="space-y-2">
                    <Label>Đáp án đúng</Label>
                    <Select
                      value={question.correctAnswer || ''}
                      onValueChange={(value) => handleQuestionChange('correctAnswer', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn đáp án đúng" />
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
                </CardContent>
              </Card>
            )}

            {/* Composite Questions */}
            {question.isComposite && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Câu Hỏi Con (Sub-Questions)
                  </CardTitle>
                  <CardDescription>
                    Thêm các câu hỏi con cho composite question
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                  {question.subQuestions?.map((subQ, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            Câu hỏi con {subQ.subQuestionNumber}
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSubQuestion(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Nội dung câu hỏi con</Label>
                          <Textarea
                            placeholder="Nhập nội dung câu hỏi con..."
                            value={subQ.question}
                            onChange={(e) => handleUpdateSubQuestion(index, 'question', e.target.value)}
                            rows={2}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Điểm số</Label>
                            <Input
                              type="number"
                              min="1"
                              value={subQ.points}
                              onChange={(e) => handleUpdateSubQuestion(index, 'points', parseInt(e.target.value) || 1)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Giải thích (tùy chọn)</Label>
                            <Input
                              placeholder="Giải thích đáp án..."
                              value={subQ.explanation || ''}
                              onChange={(e) => handleUpdateSubQuestion(index, 'explanation', e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Sub-question options */}
                        <div className="space-y-2">
                          <Label>Các lựa chọn (nếu có)</Label>
                          <div className="space-y-2">
                            {subQ.options?.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                                  {String.fromCharCode(65 + optIndex)}
                                </div>
                                <Input
                                  placeholder={`Lựa chọn ${String.fromCharCode(65 + optIndex)}`}
                                  value={option}
                                  onChange={(e) => {
                                    const newOptions = [...(subQ.options || [])];
                                    newOptions[optIndex] = e.target.value;
                                    handleUpdateSubQuestion(index, 'options', newOptions);
                                  }}
                                  className="flex-1"
                                />
                              </div>
                            ))}
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Đáp án đúng</Label>
                            <Input
                              placeholder="Nhập đáp án đúng..."
                              value={subQ.correctAnswer || ''}
                              onChange={(e) => handleUpdateSubQuestion(index, 'correctAnswer', e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Audio timestamp for listening */}
                        {question.type === 'listening' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Thời gian bắt đầu (giây)</Label>
                              <Input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={subQ.audioTimestamp?.start || ''}
                                onChange={(e) => handleUpdateSubQuestion(index, 'audioTimestamp', {
                                  ...subQ.audioTimestamp,
                                  start: parseInt(e.target.value) || 0
                                })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Thời gian kết thúc (giây)</Label>
                              <Input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={subQ.audioTimestamp?.end || ''}
                                onChange={(e) => handleUpdateSubQuestion(index, 'audioTimestamp', {
                                  ...subQ.audioTimestamp,
                                  end: parseInt(e.target.value) || 0
                                })}
                              />
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  <Button
                    variant="outline"
                    onClick={handleAddSubQuestion}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm Câu Hỏi Con
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Media Files */}
            <Card>
              <CardHeader>
                <CardTitle>Tệp Đa Phương Tiện</CardTitle>
                <CardDescription>
                  Thêm file âm thanh hoặc hình ảnh cho câu hỏi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="audio" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="audio" className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4" />
                      Âm thanh
                    </TabsTrigger>
                    <TabsTrigger value="image" className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Hình ảnh
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="audio">
                    <AudioUpload
                      value=""
                      onChange={() => {}}
                      onFileChange={(file) => handleQuestionChange('audioFile', file)}
                      selectedFile={question.audioFile}
                    />
                  </TabsContent>
                  
                  <TabsContent value="image">
                    <ImageUpload
                      value=""
                      onChange={() => {}}
                      onFileChange={(file) => handleQuestionChange('imageFile', file)}
                      selectedFile={question.imageFile}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-1 lg:col-span-1 space-y-6">
            <div className="sticky top-24 space-y-6">
            {/* Question Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Cài Đặt Câu Hỏi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Độ khó</Label>
                  <Select
                    value={question.difficulty}
                    onValueChange={(value) => handleQuestionChange('difficulty', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Dễ</SelectItem>
                      <SelectItem value="medium">Trung bình</SelectItem>
                      <SelectItem value="hard">Khó</SelectItem>
                    </SelectContent>
                  </Select>
              </div>

                <div className="space-y-2">
                  <Label htmlFor="points">Điểm số</Label>
                  <Input
                    id="points"
                    type="number"
                    min="1"
                    value={question.points}
                    onChange={(e) => handleQuestionChange('points', parseInt(e.target.value) || 1)}
                  />
            </div>

                {question.type === 'writing' && (
                  <div className="space-y-2">
                    <Label htmlFor="wordLimit">Giới hạn từ</Label>
                    <Input
                      id="wordLimit"
                      type="number"
                      min="50"
                      placeholder="Ví dụ: 250"
                      value={question.wordLimit || ''}
                      onChange={(e) => handleQuestionChange('wordLimit', parseInt(e.target.value) || undefined)}
              />
            </div>
                )}

                {question.subType.includes('completion') && (
                  <div className="space-y-2">
                    <Label htmlFor="blanksCount">Số chỗ trống</Label>
                    <Input
                      id="blanksCount"
                type="number"
                      min="1"
                      placeholder="Ví dụ: 3"
                      value={question.blanksCount || ''}
                      onChange={(e) => handleQuestionChange('blanksCount', parseInt(e.target.value) || undefined)}
              />
            </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="section">Section IELTS</Label>
                  <Select
                    value={question.section?.toString() || ''}
                    onValueChange={(value) => handleQuestionChange('section', parseInt(value) || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn section" />
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
                <CardTitle>Tags</CardTitle>
                <CardDescription>
                  Thêm tags để phân loại câu hỏi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nhập tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    className="flex-1"
                  />
                  <Button onClick={handleAddTag} size="sm" className="shrink-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {question.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
            </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <Card>
              <CardContent className="pt-6">
                <Button
                  onClick={handleSaveQuestion}
                  disabled={saving}
                  className="w-full"
                  size="lg"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Lưu Câu Hỏi
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
