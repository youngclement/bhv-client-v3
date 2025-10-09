'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, ArrowLeft, Save, Plus, X, Trash2 } from 'lucide-react';
import { authService } from '@/lib/auth';
import Image from 'next/image';

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

export default function EditQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.id as string;
  const questionId = params.questionId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [question, setQuestion] = useState<any>(null);
  const [tagInput, setTagInput] = useState('');

  const fetchQuestion = useCallback(async () => {
    try {
      const data = await authService.apiRequest(`/questions/${questionId}`);
      setQuestion(data);
      setTagInput(data.tags?.join(', ') || '');
    } catch (error) {
      console.error('Failed to load question:', error);
    } finally {
      setLoading(false);
    }
  }, [questionId]);

  useEffect(() => {
    if (questionId) fetchQuestion();
  }, [questionId, fetchQuestion]);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Prepare updated question data
      const updatedQuestion = {
        ...question,
        tags: tagInput.split(',').map(tag => tag.trim()).filter(Boolean)
      };

      await authService.apiRequest(`/questions/${questionId}`, {
        method: 'PUT',
        body: JSON.stringify(updatedQuestion),
      });
      
      alert('Question updated successfully!');
      router.push(`/dashboard/tests/${testId}/question`);
    } catch (error) {
      console.error('Failed to update question:', error);
      alert('Error updating question. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddOption = () => {
    if (!question.options) {
      setQuestion({ ...question, options: [''] });
    } else {
      setQuestion({ ...question, options: [...question.options, ''] });
    }
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = question.options.filter((_: any, i: number) => i !== index);
    setQuestion({ ...question, options: newOptions });
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
    
    setQuestion({ 
      ...question, 
      subQuestions: [...(question.subQuestions || []), newSubQuestion],
      isComposite: true,
      hasSubQuestions: true,
      allowSubQuestions: true
    });
  };

  const handleUpdateSubQuestion = (index: number, field: keyof SubQuestion, value: any) => {
    setQuestion({
      ...question,
      subQuestions: question.subQuestions?.map((sq, i) => 
        i === index ? { ...sq, [field]: value } : sq
      ) || []
    });
  };

  const handleRemoveSubQuestion = (index: number) => {
    setQuestion({
      ...question,
      subQuestions: question.subQuestions?.filter((_, i) => i !== index).map((sq, i) => ({
        ...sq,
        subQuestionNumber: i + 1
      })) || []
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...question.options];
    newOptions[index] = value;
    setQuestion({ ...question, options: newOptions });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Question not found.</p>
        <Button onClick={() => router.push(`/dashboard/tests/${testId}/question`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push(`/dashboard/tests/${testId}/question`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Questions
        </Button>
        <h2 className="text-2xl font-bold">Edit Question</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Question Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Question Type</Label>
              <Select
                value={question.type}
                onValueChange={(value) => setQuestion({ ...question, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reading">Reading</SelectItem>
                  <SelectItem value="listening">Listening</SelectItem>
                  <SelectItem value="writing">Writing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Sub Type</Label>
              <Input
                value={question.subType || ''}
                onChange={(e) => setQuestion({ ...question, subType: e.target.value })}
                placeholder="e.g., multiple-choice, true-false"
              />
            </div>
          </div>

          <div>
            <Label>Question Text</Label>
            <Textarea
              rows={3}
              value={question.question || ''}
              onChange={(e) => setQuestion({ ...question, question: e.target.value })}
            />
          </div>

          <div>
            <Label>Instruction Text</Label>
            <Textarea
              rows={2}
              value={question.instructionText || ''}
              onChange={(e) => setQuestion({ ...question, instructionText: e.target.value })}
            />
          </div>

          {question.type === 'reading' && (
            <div>
              <Label>Reading Passage</Label>
              <Textarea
                rows={5}
                value={question.passage || ''}
                onChange={(e) => setQuestion({ ...question, passage: e.target.value })}
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Section</Label>
              <Select
                value={question.section?.toString() || '1'}
                onValueChange={(value) => setQuestion({ ...question, section: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Section 1</SelectItem>
                  <SelectItem value="2">Section 2</SelectItem>
                  <SelectItem value="3">Section 3</SelectItem>
                  <SelectItem value="4">Section 4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Difficulty</Label>
              <Select
                value={question.difficulty}
                onValueChange={(value) => setQuestion({ ...question, difficulty: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Points</Label>
              <Input
                type="number"
                min={1}
                value={question.points}
                onChange={(e) =>
                  setQuestion({ ...question, points: parseInt(e.target.value) || 1 })
                }
              />
            </div>
          </div>

          {question.subType?.includes('multiple-choice') && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Options</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddOption}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </Button>
              </div>
              <div className="space-y-2">
                {question.options?.map((opt: string, i: number) => (
                  <div key={i} className="flex gap-2 items-center">
                    <span className="w-6 text-sm font-medium">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    <Input
                      value={opt}
                      onChange={(e) => handleOptionChange(i, e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveOption(i)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="mt-3">
                <Label>Correct Answer</Label>
                <Select
                  value={question.correctAnswer}
                  onValueChange={(value) => setQuestion({ ...question, correctAnswer: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select correct answer" />
                  </SelectTrigger>
                  <SelectContent>
                    {question.options?.map((opt: string, i: number) =>
                      opt.trim() ? (
                        <SelectItem key={i} value={opt}>
                          {String.fromCharCode(65 + i)}: {opt}
                        </SelectItem>
                      ) : null
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {!question.subType?.includes('multiple-choice') && question.type !== 'writing' && (
            <div>
              <Label>Correct Answer</Label>
              <Input
                value={question.correctAnswer || ''}
                onChange={(e) => setQuestion({ ...question, correctAnswer: e.target.value })}
              />
            </div>
          )}

          {/* Composite Questions */}
          {question.isComposite && question.subQuestions && question.subQuestions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base font-medium">Câu Hỏi Con (Sub-Questions)</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddSubQuestion}>
                  <Plus className="h-4 w-4 mr-1" />
                  Thêm Câu Hỏi Con
                </Button>
              </div>
              
              <div className="space-y-4">
                {question.subQuestions.map((subQ, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Câu hỏi con {subQ.subQuestionNumber}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSubQuestion(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm">Nội dung câu hỏi con</Label>
                        <Textarea
                          rows={2}
                          value={subQ.question}
                          onChange={(e) => handleUpdateSubQuestion(index, 'question', e.target.value)}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm">Điểm số</Label>
                          <Input
                            type="number"
                            min={1}
                            value={subQ.points}
                            onChange={(e) => handleUpdateSubQuestion(index, 'points', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Giải thích</Label>
                          <Input
                            value={subQ.explanation || ''}
                            onChange={(e) => handleUpdateSubQuestion(index, 'explanation', e.target.value)}
                            placeholder="Giải thích đáp án..."
                          />
                        </div>
                      </div>
                      
                      {/* Sub-question options */}
                      {subQ.options && subQ.options.length > 0 && (
                        <div>
                          <Label className="text-sm">Các lựa chọn</Label>
                          <div className="space-y-2 mt-1">
                            {subQ.options.map((opt, optIndex) => (
                              <div key={optIndex} className="flex gap-2">
                                <span className="w-6 text-sm font-medium">
                                  {String.fromCharCode(65 + optIndex)}.
                                </span>
                                <Input
                                  value={opt}
                                  onChange={(e) => {
                                    const newOptions = [...subQ.options];
                                    newOptions[optIndex] = e.target.value;
                                    handleUpdateSubQuestion(index, 'options', newOptions);
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          
                          <div className="mt-2">
                            <Label className="text-sm">Đáp án đúng</Label>
                            <Input
                              value={subQ.correctAnswer || ''}
                              onChange={(e) => handleUpdateSubQuestion(index, 'correctAnswer', e.target.value)}
                              placeholder="Nhập đáp án đúng..."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Sub-Questions button for non-composite questions */}
          {!question.isComposite && (
            <div>
              <Label className="text-base font-medium">Composite Questions</Label>
              <p className="text-sm text-gray-600 mb-2">
                Chuyển câu hỏi này thành composite question để thêm câu hỏi con
              </p>
              <Button type="button" variant="outline" onClick={handleAddSubQuestion}>
                <Plus className="h-4 w-4 mr-2" />
                Chuyển thành Composite Question
              </Button>
            </div>
          )}

          <div>
            <Label>Tags (comma separated)</Label>
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="e.g., reading, environment, academic"
            />
          </div>

          {/* Image Upload */}
          <div>
            <Label>Image</Label>
            <div className="mt-1 border border-dashed rounded-lg p-4 text-center">
              {question.imageFile ? (
                <div>
                  <Image
                    src={question.imageFile}
                    width={150}
                    height={150}
                    alt="question image"
                    className="mx-auto mb-2 rounded object-cover"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuestion({ ...question, imageFile: '' })}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const formData = new FormData();
                      formData.append('file', file);
                      formData.append('type', 'image');
                      const res = await fetch('/api/upload', { method: 'POST', body: formData });
                      const result = await res.json();
                      if (result.success) setQuestion({ ...question, imageFile: result.url });
                    }}
                  />
                  <label htmlFor="image-upload" className="cursor-pointer text-muted-foreground">
                    <Upload className="h-6 w-6 mx-auto mb-1" />
                    Click to upload image
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => router.push(`/dashboard/tests/${testId}/question`)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#004875] hover:bg-[#003a5c]">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
