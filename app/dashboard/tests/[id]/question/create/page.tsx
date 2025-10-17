'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
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
} from 'lucide-react';
import { authService } from '@/lib/auth';

// Backend: SubQuestions DO NOT have subType field
interface SubQuestion {
  subQuestionNumber: number;
  type: 'multiple-choice' | 'fill-blank' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer?: any; // Schema.Types.Mixed
  points: number;
  explanation?: string;
  audioTimestamp?: {
    start: number;
    end: number;
  };
}

// Backend: Main interface matching API schema
interface Question {
  testId?: string;
  questionNumber?: number;
  type: 'reading' | 'listening' | 'writing' | 'speaking' | 'full-test';
  subType: 'multiple-choice' | 'fill-blank' | 'matching' | 'short-answer' | 'composite'; // Only 5 types
  question: string;
  instructionText?: string;
  passage?: string;
  audioFile?: File | null;
  imageFile?: File | null;
  options?: string[];
  correctAnswer?: any; // Schema.Types.Mixed
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
  createdBy?: string;
  isActive?: boolean;
  isAutoGraded?: boolean; // Backend: Auto-grading flag
  markingType?: 'auto' | 'manual'; // Backend: Marking type
}

// Backend: Only 5 supported question types
const questionTypes = {
  reading: [
    { value: 'multiple-choice' as const, label: 'Multiple Choice' },
    { value: 'fill-blank' as const, label: 'Fill in the Blank' },
    { value: 'matching' as const, label: 'Matching' },
    { value: 'short-answer' as const, label: 'Short Answer' },
    { value: 'composite' as const, label: 'Composite Question (có sub-questions)' },
  ],
  listening: [
    { value: 'multiple-choice' as const, label: 'Multiple Choice' },
    { value: 'fill-blank' as const, label: 'Fill in the Blank' },
    { value: 'matching' as const, label: 'Matching' },
    { value: 'short-answer' as const, label: 'Short Answer' },
    { value: 'composite' as const, label: 'Composite Question (có sub-questions)' },
  ],
  writing: [
    { value: 'multiple-choice' as const, label: 'Multiple Choice' },
    { value: 'fill-blank' as const, label: 'Fill in the Blank' },
    { value: 'matching' as const, label: 'Matching' },
    { value: 'short-answer' as const, label: 'Short Answer' },
    { value: 'composite' as const, label: 'Composite Question (có sub-questions)' },
  ],
  speaking: [
    { value: 'multiple-choice' as const, label: 'Multiple Choice' },
    { value: 'fill-blank' as const, label: 'Fill in the Blank' },
    { value: 'matching' as const, label: 'Matching' },
    { value: 'short-answer' as const, label: 'Short Answer' },
    { value: 'composite' as const, label: 'Composite Question (có sub-questions)' },
  ],
  'full-test': [
    { value: 'multiple-choice' as const, label: 'Multiple Choice' },
    { value: 'fill-blank' as const, label: 'Fill in the Blank' },
    { value: 'matching' as const, label: 'Matching' },
    { value: 'short-answer' as const, label: 'Short Answer' },
    { value: 'composite' as const, label: 'Composite Question (có sub-questions)' },
  ],
};

export default function CreateTestQuestionsPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.id as string;

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
    isAutoGraded: true, // Default to auto-graded
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

  const handleTypeChange = (type: 'reading' | 'listening' | 'writing' | 'speaking' | 'full-test') => {
    setQuestion(prev => ({
      ...prev,
      type,
      subType: questionTypes[type][0].value
    }));
  };

  const handleSubTypeChange = (subType: 'multiple-choice' | 'fill-blank' | 'matching' | 'short-answer' | 'composite') => {
    const isComposite = subType === 'composite';
    // Backend: Determine if auto-graded based on subType
    const isAutoGraded = subType !== 'short-answer'; // short-answer requires manual grading
    const markingType = isAutoGraded ? 'auto' : 'manual';
    
    setQuestion(prev => ({
      ...prev,
      subType,
      isComposite,
      hasSubQuestions: isComposite,
      allowSubQuestions: isComposite,
      subQuestions: isComposite ? prev.subQuestions || [] : [],
      isAutoGraded,
      markingType
    }));
  };

  const handleAddSubQuestion = () => {
    // Backend: SubQuestions DO NOT have subType field
    const newSubQuestion: SubQuestion = {
      subQuestionNumber: (question.subQuestions?.length || 0) + 1,
      type: 'multiple-choice', // Default type
      question: '',
      options: ['', '', '', ''], // For multiple-choice options
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
        
        // Handle type change - reset options accordingly
        if (field === 'type') {
          const newType = value as SubQuestion['type'];
          if (newType === 'multiple-choice' || newType === 'true-false') {
            // Initialize options for multiple-choice or true-false
            return {
              ...sq,
              type: newType,
              options: newType === 'true-false' 
                ? ['True', 'False'] 
                : (sq.options?.length ? sq.options : ['', '', '', '']),
              correctAnswer: ''
            };
          } else {
            // For fill-blank or short-answer, remove options
            return {
              ...sq,
              type: newType,
              options: undefined,
              correctAnswer: ''
            };
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

  const sanitizeOptions = (options?: string[]) =>
    (options || []).map(opt => opt.trim()).filter(opt => opt.length > 0);

  const normalizeCorrectAnswer = (answer: any) =>
    typeof answer === 'string' ? answer.trim() : answer;

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
    if (question.subType === 'fill-blank' && !question.blanksCount) {
      setError('Vui lòng nhập số lượng chỗ trống');
      return false;
    }
    if (question.subType.includes('multiple-choice')) {
      const validOptions = sanitizeOptions(question.options);
      if (validOptions.length < 2) {
        setError('Vui lòng thêm ít nhất 2 lựa chọn cho câu hỏi trắc nghiệm');
        return false;
      }
      const normalizedAnswer = normalizeCorrectAnswer(question.correctAnswer);
      if (!normalizedAnswer || !validOptions.includes(normalizedAnswer)) {
        setError('Vui lòng chọn đáp án đúng cho câu hỏi trắc nghiệm');
        return false;
      }
    }
    
    // Validate composite questions
    if (question.isComposite) {
      if (!question.subQuestions || question.subQuestions.length === 0) {
        setError('Vui lòng thêm ít nhất 1 câu hỏi con cho composite question');
        return false;
      }
      
      if (question.subQuestions.length > 20) {
        setError('Tối đa chỉ được 20 câu hỏi con');
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
        // Backend: SubQuestions don't have subType, but we validate options if present
        if (subQ.options && subQ.options.length > 0) {
          const validSubOptions = sanitizeOptions(subQ.options);
          if (validSubOptions.length < 2) {
            setError(`Vui lòng thêm ít nhất 2 lựa chọn cho câu hỏi con ${i + 1}`);
            return false;
          }
          const normalizedSubAnswer = normalizeCorrectAnswer(subQ.correctAnswer);
          if (!normalizedSubAnswer || !validSubOptions.includes(normalizedSubAnswer)) {
            setError(`Vui lòng chọn đáp án đúng cho câu hỏi con ${i + 1}`);
            return false;
          }
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
      // Backend: API expects 'type'
      const questionData = {
        testId: question.testId,
        type: question.type,
        subType: question.subType,
        question: question.question,
        points: question.points,
        hasSubQuestions: question.hasSubQuestions || false,
        allowSubQuestions: question.allowSubQuestions || false,
        subQuestions: question.subQuestions || [],
        isAutoGraded: question.isAutoGraded,
        markingType: question.markingType,
        // Optional fields
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

      // Check if we have files to upload
      const hasFiles = question.audioFile || question.imageFile;
      
      let response;
      if (hasFiles) {
        // Use FormData for file uploads
        const formData = new FormData();
        formData.append('question', JSON.stringify(questionData));  
        
        if (question.audioFile) {
          formData.append('audioFile', question.audioFile);
        }
        if (question.imageFile) {
          formData.append('imageFile', question.imageFile);
        }

        response = await authService.apiRequest('/questions', {
          method: 'POST',
          body: formData
        });
      } else {
        // Use JSON for text-only questions
        response = await authService.apiRequest('/questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(questionData)
        });
      }

      setSuccess('Câu hỏi đã được tạo thành công!');
      
      // Reset form
      setQuestion({
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
        isAutoGraded: true,
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

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/tests/${testId}`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tạo Câu Hỏi Mới</h1>
          <p className="text-gray-600">Thêm câu hỏi vào bài test</p>
        </div>
      </div>

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

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Main Form */}
        <div className="lg:col-span-3 space-y-6">
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
                    <SelectValue />
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
          {(question.isComposite || question.subType === 'composite') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Câu Hỏi Con (Sub-Questions)
                  {question.subQuestions && question.subQuestions.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {question.subQuestions.length} câu hỏi
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Thêm các câu hỏi con cho composite question. Mỗi câu hỏi con sẽ có điểm số riêng. (Tối đa 20 câu hỏi con)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Sub-Question Button */}
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={handleAddSubQuestion}
                    disabled={question.subQuestions && question.subQuestions.length >= 20}
                    className="w-full max-w-md"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm Câu Hỏi Con
                    {question.subQuestions && question.subQuestions.length >= 20 && (
                      <span className="ml-2 text-xs">(Đã đạt giới hạn 20)</span>
                    )}
                  </Button>
                </div>

                {question.subQuestions && question.subQuestions.length > 0 && (
                  <div className="space-y-4">
                    {question.subQuestions.map((subQ, index) => (
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
                          {/* Backend: SubQuestions don't have subType field */}
                          <div className="space-y-2">
                            <Label>Loại câu hỏi con</Label>
                            <Select
                              value={subQ.type}
                              onValueChange={(value) => handleUpdateSubQuestion(index, 'type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn loại câu hỏi con" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                                <SelectItem value="fill-blank">Fill in the Blank</SelectItem>
                                <SelectItem value="true-false">True/False</SelectItem>
                                <SelectItem value="short-answer">Short Answer</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

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

                          {/* Backend: SubQuestions can have options (for multiple-choice or true-false) */}
                          {(subQ.type === 'multiple-choice' || subQ.type === 'true-false') && (
                            <div className="space-y-2">
                              <Label>
                                {subQ.type === 'true-false' ? 'Các lựa chọn (True/False)' : 'Các lựa chọn'}
                              </Label>
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
                                      disabled={subQ.type === 'true-false'}
                                    />
                                    {subQ.type === 'multiple-choice' && subQ.options && subQ.options.length > 2 && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          const newOptions = subQ.options?.filter((_, i) => i !== optIndex);
                                          handleUpdateSubQuestion(index, 'options', newOptions);
                                        }}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                ))}
                                {subQ.type === 'multiple-choice' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const newOptions = [...(subQ.options || []), ''];
                                      handleUpdateSubQuestion(index, 'options', newOptions);
                                    }}
                                    className="w-full"
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Thêm lựa chọn
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Correct answer selection */}
                          <div className="space-y-2">
                            <Label>Đáp án đúng</Label>
                            {(subQ.type === 'multiple-choice' || subQ.type === 'true-false') && subQ.options && subQ.options.length > 0 ? (
                              <Select
                                value={subQ.correctAnswer || ''}
                                onValueChange={(value) => handleUpdateSubQuestion(index, 'correctAnswer', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Chọn đáp án đúng" />
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
                            ) : (
                              <Input
                                placeholder={
                                  subQ.type === 'fill-blank' 
                                    ? 'Nhập từ/cụm từ đúng...' 
                                    : 'Nhập đáp án đúng...'
                                }
                                value={subQ.correctAnswer || ''}
                                onChange={(e) => handleUpdateSubQuestion(index, 'correctAnswer', e.target.value)}
                              />
                            )}
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
                  </div>
                )}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Audio Upload */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    File âm thanh
                  </Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleQuestionChange('audioFile', file);
                        }
                      }}
                      className="hidden"
                      id="audio-upload"
                    />
                    <label htmlFor="audio-upload" className="cursor-pointer">
                      <Volume2 className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        {question.audioFile ? question.audioFile.name : 'Chọn file âm thanh'}
                      </p>
                    </label>
                    {question.audioFile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuestionChange('audioFile', null)}
                        className="mt-2 text-red-600"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Xóa
                      </Button>
                    )}
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    File hình ảnh
                  </Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleQuestionChange('imageFile', file);
                        }
                      }}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <ImageIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        {question.imageFile ? question.imageFile.name : 'Chọn file hình ảnh'}
                      </p>
                    </label>
                    {question.imageFile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuestionChange('imageFile', null)}
                        className="mt-2 text-red-600"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Xóa
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* File Info */}
              {(question.audioFile || question.imageFile) && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Thông tin file:</h4>
                  <div className="space-y-1 text-sm text-blue-700">
                    {question.audioFile && (
                      <p>• Âm thanh: {question.audioFile.name} ({(question.audioFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                    )}
                    {question.imageFile && (
                      <p>• Hình ảnh: {question.imageFile.name} ({(question.imageFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
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

                {question.subType === 'fill-blank' && (
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
  );
}
