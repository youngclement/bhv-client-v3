'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Edit2, Trash2, Save, X, BookOpen, Volume2, PenTool } from 'lucide-react';
import { authService } from '@/lib/auth';

interface Question {
  _id: string;
  type: 'reading' | 'listening' | 'writing';
  subType: string;
  question: string;
  passage?: string;
  audioUrl?: string;
  options?: string[];
  correctAnswer?: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Form editing state uses a CSV string for `tags` to simplify input handling
type EditQuestion = Partial<Omit<Question, 'tags'>> & { tags: string };

const subTypes = {
  reading: ['multiple-choice', 'fill-blank', 'true-false', 'matching'],
  listening: ['multiple-choice', 'fill-blank', 'short-answer'],
  writing: ['task1', 'task2'],
};

export default function QuestionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<EditQuestion>({ tags: '' });

  useEffect(() => {
    if (params.id) {
      fetchQuestion(params.id as string);
    }
  }, [params.id]);

  const fetchQuestion = async (id: string) => {
    try {
      const data = await authService.apiRequest(`/questions/${id}`);
      setQuestion(data);
      setEditData({
        ...data,
        tags: Array.isArray(data.tags) ? data.tags.join(', ') : '',
      });
    } catch (error) {
      console.error('Failed to fetch question:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!question) return;

    setSaving(true);
    try {
      const updateData = {
        ...editData,
        tags: (editData.tags || '')
          .split(',')
          .map((tag: string) => tag.trim())
          .filter(Boolean),
      };

      await authService.apiRequest(`/questions/${question._id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      await fetchQuestion(question._id);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update question:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!question) return;

    try {
      await authService.apiRequest(`/questions/${question._id}`, {
        method: 'DELETE',
      });
      router.push('/dashboard/questions');
    } catch (error) {
      console.error('Failed to delete question:', error);
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
      case 'reading': return <BookOpen className="h-5 w-5" />;
      case 'listening': return <Volume2 className="h-5 w-5" />;
      case 'writing': return <PenTool className="h-5 w-5" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading question...</p>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Question not found</p>
        <Button onClick={() => router.push('/dashboard/questions')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Questions
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/questions')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Questions
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Question Details</h2>
            <p className="text-muted-foreground">View and manage question information</p>
          </div>
        </div>

        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Question</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this question? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getTypeIcon(question.type)}
                  <div>
                    <CardTitle className="capitalize">{question.type} Question</CardTitle>
                    <CardDescription>
                      {question.subType?.replace('-', ' ') || 'N/A'} • {question.points} points
                    </CardDescription>
                  </div>
                </div>
                <Badge className={getDifficultyColor(question.difficulty)} variant="outline">
                  {question.difficulty}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ScrollArea className="max-h-[70vh] pr-4">
                <div className="space-y-6 pr-4">
                  {isEditing ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Question Type</Label>
                          <Select
                            value={editData.type}
                            onValueChange={(value: any) => setEditData({ ...editData, type: value, subType: '' })}
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

                        <div className="space-y-2">
                          <Label>Sub Type</Label>
                          <Select
                            value={editData.subType}
                            onValueChange={(value) => setEditData({ ...editData, subType: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {editData.type && subTypes[editData.type as keyof typeof subTypes].map(subType => (
                                <SelectItem key={subType} value={subType}>
                                  {subType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {editData.type === 'reading' && (
                        <div className="space-y-2">
                          <Label>Passage</Label>
                          <Textarea
                            value={editData.passage || ''}
                            onChange={(e) => setEditData({ ...editData, passage: e.target.value })}
                            rows={4}
                          />
                        </div>
                      )}

                      {editData.type === 'listening' && (
                        <div className="space-y-2">
                          <Label>Audio URL</Label>
                          <Input
                            value={editData.audioUrl || ''}
                            onChange={(e) => setEditData({ ...editData, audioUrl: e.target.value })}
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Question</Label>
                        <Textarea
                          value={editData.question || ''}
                          onChange={(e) => setEditData({ ...editData, question: e.target.value })}
                          rows={3}
                        />
                      </div>

                      {editData.type === 'reading' && editData.subType === 'multiple-choice' && (
                        <div className="space-y-2">
                          <Label>Options</Label>
                          {(editData.options || ['', '', '', '']).map((option, index) => (
                            <Input
                              key={index}
                              placeholder={`Option ${index + 1}`}
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...(editData.options || ['', '', '', ''])];
                                newOptions[index] = e.target.value;
                                setEditData({ ...editData, options: newOptions });
                              }}
                            />
                          ))}
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Correct Answer</Label>
                        <Input
                          value={editData.correctAnswer || ''}
                          onChange={(e) => setEditData({ ...editData, correctAnswer: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Points</Label>
                          <Input
                            type="number"
                            min="1"
                            value={editData.points || 1}
                            onChange={(e) => setEditData({ ...editData, points: parseInt(e.target.value) })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Difficulty</Label>
                          <Select
                            value={editData.difficulty}
                            onValueChange={(value: any) => setEditData({ ...editData, difficulty: value })}
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

                        <div className="space-y-2">
                          <Label>Tags</Label>
                          <Input
                            placeholder="comma, separated, tags"
                            value={editData.tags || ''}
                            onChange={(e) => setEditData({ ...editData, tags: e.target.value })}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {question.passage && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Passage</Label>
                          <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm leading-relaxed">{question.passage}</p>
                          </div>
                        </div>
                      )}

                      {question.audioUrl && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Audio</Label>
                          <div className="p-4 bg-muted rounded-lg">
                            <audio controls className="w-full">
                              <source src={question.audioUrl} type="audio/mpeg" />
                              Your browser does not support the audio element.
                            </audio>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Question</Label>
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-sm leading-relaxed">{question.question}</p>
                        </div>
                      </div>

                      {question.options && question.options.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Options</Label>
                          <div className="space-y-2">
                            {question.options.map((option, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                                  {String.fromCharCode(65 + index)}
                                </span>
                                <span className="text-sm">{option}</span>
                                {option === question.correctAnswer && (
                                  <Badge variant="secondary" className="text-xs">Correct</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {question.correctAnswer && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Correct Answer</Label>
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-800">{question.correctAnswer}</p>
                          </div>
                        </div>
                      )}

                      {question.tags && question.tags.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Tags</Label>
                          <div className="flex flex-wrap gap-2">
                            {question.tags.map((tag) => (
                              <Badge key={tag} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Question Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Type</Label>
                <div className="flex items-center gap-2">
                  {getTypeIcon(question.type)}
                  <span className="capitalize">{question.type}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Sub Type</Label>
                <p className="text-sm capitalize">{question.subType?.replace('-', ' ') || 'N/A'}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Difficulty</Label>
                <Badge className={getDifficultyColor(question.difficulty)} variant="outline">
                  {question.difficulty}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Points</Label>
                <p className="text-sm">{question.points}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Created By</Label>
                <p className="text-sm">{question.createdBy.firstName} {question.createdBy.lastName}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Created</Label>
                <p className="text-sm">{new Date(question.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Last Updated</Label>
                <p className="text-sm">{new Date(question.updatedAt).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}