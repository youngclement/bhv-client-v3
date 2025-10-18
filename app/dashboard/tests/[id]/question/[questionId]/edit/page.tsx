'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
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
  Download,
  Play,
  Pause
} from 'lucide-react';
import { authService } from '@/lib/auth';

// Backend: SubQuestions interface
interface SubQuestion {
  _id?: string;
  subQuestionNumber: number;
  type?: 'multiple-choice' | 'fill-blank' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer?: any;
  points: number;
  explanation?: string;
  audioTimestamp?: {
    start: number;
    end: number;
  };
}

// Backend: Main Question interface
interface Question {
  _id: string;
  testId: string;
  questionNumber: number;
  type: 'reading' | 'listening' | 'writing' | 'speaking' | 'full-test';
  subType: 'multiple-choice' | 'fill-blank' | 'matching' | 'short-answer' | 'composite';
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

export default function EditQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.id as string;
  const questionId = params.questionId as string;
  const { toast } = useToast();

  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tagInput, setTagInput] = useState('');

  // Media state
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [newAudioFile, setNewAudioFile] = useState<File | null>(null);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [audioInstance, setAudioInstance] = useState<HTMLAudioElement | null>(null);

  // Helper function to calculate total sub-questions points
  const calculateTotalSubPoints = () => {
    if (!question?.subQuestions || question.subQuestions.length === 0) return 0;
    return question.subQuestions.reduce((sum, subQ) => sum + (subQ.points || 0), 0);
  };

  // Fetch question data
  const fetchQuestion = async () => {
    try {
      setLoading(true);
      const data = await authService.apiRequest(`/questions/${questionId}`);
      console.log('Question data:', data);
      setQuestion(data);
    } catch (error) {
      console.error('Failed to fetch question:', error);
      setError('Không thể tải dữ liệu câu hỏi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (questionId) {
      fetchQuestion();
    }
  }, [questionId]);

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioInstance) {
        audioInstance.pause();
        audioInstance.currentTime = 0;
      }
    };
  }, [audioInstance]);

  // Handle form changes
  const handleQuestionChange = (field: keyof Question, value: any) => {
    if (!question) return;
    setQuestion(prev => prev ? ({
      ...prev,
      [field]: value
    }) : null);
  };

  const handleSubTypeChange = (subType: 'multiple-choice' | 'fill-blank' | 'matching' | 'short-answer' | 'composite') => {
    if (!question) return;
    
    const isComposite = subType === 'composite';
    const isAutoGraded = subType !== 'short-answer';
    const markingType = isAutoGraded ? 'auto' : 'manual';
    
    setQuestion(prev => prev ? ({
      ...prev,
      subType,
      isComposite,
      hasSubQuestions: isComposite,
      allowSubQuestions: isComposite,
      subQuestions: isComposite ? prev.subQuestions || [] : [],
      isAutoGraded,
      markingType
    }) : null);
  };

  // Sub-question handlers
  const handleAddSubQuestion = () => {
    if (!question) return;
    
    const newSubQuestion: SubQuestion = {
      subQuestionNumber: (question.subQuestions?.length || 0) + 1,
      type: 'multiple-choice',
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
        
        // Handle type change
        if (field === 'type') {
          const newType = value as SubQuestion['type'];
          if (newType === 'multiple-choice' || newType === 'true-false') {
            return {
              ...sq,
              type: newType,
              options: newType === 'true-false' 
                ? ['True', 'False'] 
                : (sq.options?.length ? sq.options : ['', '', '', '']),
              correctAnswer: ''
            };
          } else {
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

  // Tag handlers
  const handleAddTag = () => {
    if (!question || !tagInput.trim() || question.tags.includes(tagInput.trim())) return;
    
    setQuestion(prev => prev ? ({
      ...prev,
      tags: [...prev.tags, tagInput.trim()]
    }) : null);
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!question) return;
    
    setQuestion(prev => prev ? ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }) : null);
  };

  // Options handlers
  const handleAddOption = () => {
    if (!question) return;
    
    setQuestion(prev => prev ? ({
      ...prev,
      options: [...(prev.options || []), '']
    }) : null);
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
    
    setQuestion(prev => prev ? ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index) || []
    }) : null);
  };

  // Validation
  const validateQuestion = () => {
    if (!question) return false;

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

    // Validate composite questions
    if (question.isComposite && question.subQuestions) {
      if (question.subQuestions.length === 0) {
        const errorMsg = 'Vui lòng thêm ít nhất 1 câu hỏi con cho composite question';
        setError(errorMsg);
        toast({
          title: "Lỗi validation",
          description: errorMsg,
          variant: "destructive",
        });
        return false;
      }
      
      // Kiểm tra tổng điểm của sub-questions phải bằng điểm của câu hỏi chính
      const totalSubPoints = question.subQuestions.reduce((sum, subQ) => sum + (subQ.points || 0), 0);
      if (totalSubPoints !== question.points) {
        const errorMsg = `Tổng điểm của các câu hỏi con (${totalSubPoints}) phải bằng điểm của câu hỏi chính (${question.points})`;
        setError(errorMsg);
        toast({
          title: "Lỗi điểm số",
          description: errorMsg,
          variant: "destructive",
        });
        return false;
      }
      
      for (let i = 0; i < question.subQuestions.length; i++) {
        const subQ = question.subQuestions[i];
        if (!subQ.question.trim()) {
          const errorMsg = `Vui lòng nhập nội dung cho câu hỏi con ${i + 1}`;
          setError(errorMsg);
          toast({
            title: "Lỗi validation",
            description: errorMsg,
            variant: "destructive",
          });
          return false;
        }
        if (subQ.points < 1) {
          const errorMsg = `Điểm số cho câu hỏi con ${i + 1} phải lớn hơn 0`;
          setError(errorMsg);
          toast({
            title: "Lỗi validation",
            description: errorMsg,
            variant: "destructive",
          });
          return false;
        }
      }
    }
    
    return true;
  };

  // Save question
  const handleSaveQuestion = async () => {
    if (!question || !validateQuestion()) return;

    setSaving(true);
    setError('');
    setSuccess('');

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
        isAutoGraded: question.isAutoGraded,
        markingType: question.markingType,
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

      // Check if we have new files to upload
      const hasNewFiles = newAudioFile || newImageFile;
      
      let response;
      if (hasNewFiles) {
        // Use FormData for file uploads
        const formData = new FormData();
        formData.append('question', JSON.stringify(questionData));  
        
        if (newAudioFile) {
          formData.append('audioFile', newAudioFile);
        }
        if (newImageFile) {
          formData.append('imageFile', newImageFile);
        }

        response = await authService.apiRequest(`/questions/${questionId}`, {
          method: 'PUT',
          body: formData
        });
      } else {
        // Use JSON for text-only updates
        response = await authService.apiRequest(`/questions/${questionId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(questionData)
        });
      }

      setSuccess('Câu hỏi đã được cập nhật thành công!');
      toast({
        title: "Thành công!",
        description: "Câu hỏi đã được cập nhật thành công!",
        variant: "default",
      });
      
      // Refresh question data
      await fetchQuestion();
      
      // Redirect back after delay
      setTimeout(() => {
        router.push(`/dashboard/tests/${testId}`);
      }, 2000);

    } catch (error: any) {
      const errorMsg = error.message || 'Có lỗi xảy ra khi cập nhật câu hỏi';
      setError(errorMsg);
      toast({
        title: "Lỗi cập nhật",
        description: errorMsg,
        variant: "destructive",
      });
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Đang tải câu hỏi...</p>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Không tìm thấy câu hỏi</p>
        <Button onClick={() => router.push(`/dashboard/tests/${testId}`)} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Chỉnh Sửa Câu Hỏi #{question.questionNumber}</h1>
          <p className="text-gray-600">Cập nhật thông tin câu hỏi</p>
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
                Thông tin loại câu hỏi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Loại chính</Label>
                  <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted">
                    {getTypeIcon(question.type)}
                    <span className="capitalize font-medium">{question.type}</span>
                  </div>
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

                <div className="space-y-2">
                  <Label htmlFor="questionNumber">Số thứ tự câu hỏi *</Label>
                  <Input
                    id="questionNumber"
                    type="number"
                    min="1"
                    placeholder="1, 2, 3..."
                    value={question.questionNumber}
                    onChange={(e) => handleQuestionChange('questionNumber', parseInt(e.target.value) || 1)}
                    className="font-semibold"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Question Content */}
          <Card>
            <CardHeader>
              <CardTitle>Nội Dung Câu Hỏi</CardTitle>
              <CardDescription>
                Chỉnh sửa nội dung câu hỏi và thông tin liên quan
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

              <div className="space-y-2">
                <Label htmlFor="passage">Đoạn văn / Passage (tùy chọn)</Label>
                <Textarea
                  id="passage"
                  placeholder="Nhập đoạn văn đọc hiểu, transcript listening, hoặc nội dung tham khảo..."
                  value={question.passage || ''}
                  onChange={(e) => handleQuestionChange('passage', e.target.value)}
                  rows={6}
                  className="resize-none font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Đoạn văn sẽ được hiển thị cho học sinh trước câu hỏi. Phù hợp cho Reading, Listening transcript, hoặc Writing prompts.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Multiple Choice Options */}
          {question.subType.includes('multiple-choice') && (
            <Card>
              <CardHeader>
                <CardTitle>Các Lựa Chọn</CardTitle>
                <CardDescription>
                  Chỉnh sửa các lựa chọn cho câu hỏi trắc nghiệm
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

          {/* Sub-Questions */}
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
                  Chỉnh sửa các câu hỏi con cho composite question
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={handleAddSubQuestion}
                    disabled={question.subQuestions && question.subQuestions.length >= 20}
                    className="w-full max-w-md"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm Câu Hỏi Con
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
                          {/* Sub-question type */}
                          <div className="space-y-2">
                            <Label>Loại câu hỏi con</Label>
                            <Select
                              value={subQ.type || 'multiple-choice'}
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

                          {/* Sub-question options */}
                          {(subQ.type === 'multiple-choice' || subQ.type === 'true-false') && subQ.options && (
                            <div className="space-y-2">
                              <Label>
                                {subQ.type === 'true-false' ? 'Các lựa chọn (True/False)' : 'Các lựa chọn'}
                              </Label>
                              <div className="space-y-2">
                                {subQ.options.map((option, optIndex) => (
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
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Correct answer */}
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
                Quản lý file âm thanh và hình ảnh
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Audio File */}
              {question.audioFile && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    File âm thanh hiện tại
                  </Label>
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Volume2 className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{question.audioFile.originalName}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(question.audioFile.bytes || 0)} • {formatDuration(question.audioFile.duration || 0)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(question.audioFile?.url, '_blank')}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Tải xuống
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (audioPlaying && audioInstance) {
                              // Pause current audio
                              audioInstance.pause();
                              setAudioPlaying(false);
                            } else {
                              // Stop any existing audio first
                              if (audioInstance) {
                                audioInstance.pause();
                                audioInstance.currentTime = 0;
                              }
                              
                              // Create new audio instance
                              const newAudio = new Audio(question.audioFile?.url);
                              setAudioInstance(newAudio);
                              
                              newAudio.play().then(() => {
                                setAudioPlaying(true);
                              }).catch((error) => {
                                console.error('Error playing audio:', error);
                              });
                              
                              // Handle audio end
                              newAudio.onended = () => {
                                setAudioPlaying(false);
                                setAudioInstance(null);
                              };
                            }
                          }}
                        >
                          {audioPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Current Image File */}
              {question.imageFile && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Hình ảnh hiện tại
                  </Label>
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <img
                          src={question.imageFile.url}
                          alt={question.imageFile.originalName}
                          className="w-20 h-20 object-cover rounded-lg border"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{question.imageFile.originalName}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(question.imageFile.bytes || 0)} • {question.imageFile.width}x{question.imageFile.height}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(question.imageFile?.url, '_blank')}
                          className="mt-2"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Tải xuống
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload New Files */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* New Audio Upload */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Cập nhật file âm thanh
                  </Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setNewAudioFile(file);
                        }
                      }}
                      className="hidden"
                      id="new-audio-upload"
                    />
                    <label htmlFor="new-audio-upload" className="cursor-pointer">
                      <Volume2 className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        {newAudioFile ? newAudioFile.name : 'Chọn file âm thanh mới'}
                      </p>
                    </label>
                    {newAudioFile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setNewAudioFile(null)}
                        className="mt-2 text-red-600"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Xóa
                      </Button>
                    )}
                  </div>
                </div>

                {/* New Image Upload */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Cập nhật hình ảnh
                  </Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setNewImageFile(file);
                        }
                      }}
                      className="hidden"
                      id="new-image-upload"
                    />
                    <label htmlFor="new-image-upload" className="cursor-pointer">
                      <ImageIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        {newImageFile ? newImageFile.name : 'Chọn hình ảnh mới'}
                      </p>
                    </label>
                    {newImageFile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setNewImageFile(null)}
                        className="mt-2 text-red-600"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Xóa
                      </Button>
                    )}
                  </div>
                </div>
              </div>
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
                    onValueChange={(value: 'easy' | 'medium' | 'hard') => handleQuestionChange('difficulty', value)}
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
                  {question.isComposite && question.subQuestions && question.subQuestions.length > 0 && (
                    <div className="text-sm mt-2">
                      <div className={`flex items-center gap-2 ${calculateTotalSubPoints() === question.points ? 'text-green-600' : 'text-red-600'}`}>
                        <span>Tổng điểm sub-questions: {calculateTotalSubPoints()}</span>
                        {calculateTotalSubPoints() === question.points ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                      </div>
                      {calculateTotalSubPoints() !== question.points && (
                        <div className="text-xs text-red-500 mt-1">
                          ⚠️ Tổng điểm sub-questions phải bằng điểm câu hỏi chính!
                        </div>
                      )}
                    </div>
                  )}
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
                  Quản lý tags phân loại câu hỏi
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

            {/* Question Info */}
            <Card>
              <CardHeader>
                <CardTitle>Thông Tin</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID:</span>
                    <span className="font-mono text-xs">{question._id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Số thứ tự:</span>
                    <span>#{question.questionNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trạng thái:</span>
                    <Badge variant={question.isActive ? 'default' : 'secondary'}>
                      {question.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tạo bởi:</span>
                    <span>{question.createdBy.firstName} {question.createdBy.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ngày tạo:</span>
                    <span>{new Date(question.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cập nhật:</span>
                    <span>{new Date(question.updatedAt).toLocaleDateString('vi-VN')}</span>
                  </div>
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
                      Cập Nhật Câu Hỏi
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