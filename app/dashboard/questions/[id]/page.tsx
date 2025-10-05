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
import { ArrowLeft, Edit2, Trash2, Save, X, BookOpen, Volume2, PenTool, Upload, File as FileIcon } from 'lucide-react';
import { authService } from '@/lib/auth';
import { AudioPlayer } from '@/components/ui/audio-player';

interface Question {
  _id: string;
  type: 'reading' | 'listening' | 'writing';
  subType: string;
  question: string;
  passage?: string;
  audioUrl?: string;
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
  options?: string[];
  correctAnswer?: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  section?: number;
  wordLimit?: number;
  blanksCount?: number;
  instructionText?: string;
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
  reading: ['multiple-choice', 'fill-blank', 'true-false', 'matching', 'short-answer', 'sentence-completion', 'summary-completion'],
  listening: [
    'listening-multiple-choice',
    'form-completion',
    'note-completion',
    'table-completion',
    'flowchart-completion',
    'sentence-completion',
    'summary-completion',
    'diagram-labelling',
    'map-labelling',
    'plan-labelling',
    'listening-matching',
    'listening-short-answer',
    'pick-from-list'
  ],
  writing: ['task1', 'task2', 'essay'],
};

export default function QuestionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<EditQuestion>({ tags: '' });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

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
      const tags = (editData.tags || '')
        .split(',')
        .map((tag: string) => tag.trim())
        .filter(Boolean);

      // Clean and filter data based on question type - only send core required fields
      const questionDataToSend: any = {
        type: editData.type,
        subType: editData.subType,
        question: editData.question,
        points: editData.points,
        difficulty: editData.difficulty,
      };

      // Only add tags if they exist and are not empty
      if (tags && tags.length > 0) {
        questionDataToSend.tags = tags;
      }

      // Add type-specific fields
      if (editData.type === 'reading' && editData.passage?.trim()) {
        questionDataToSend.passage = editData.passage.trim();
      }

      if (editData.type === 'listening') {
        if (editData.section) {
          questionDataToSend.section = editData.section;
        }
        if (editData.wordLimit && editData.wordLimit > 0) {
          questionDataToSend.wordLimit = editData.wordLimit;
        }
      }

      if (editData.type === 'writing') {
        if (editData.wordLimit && editData.wordLimit > 0) {
          questionDataToSend.wordLimit = editData.wordLimit;
        }
      }

      // Add options for multiple choice questions
      if (editData.options && editData.options.some(opt => opt.trim())) {
        const filteredOptions = editData.options.filter(opt => opt.trim());
        if (filteredOptions.length > 0) {
          questionDataToSend.options = filteredOptions;
        }
      }

      // Add correct answer if provided
      if (editData.correctAnswer?.trim()) {
        questionDataToSend.correctAnswer = editData.correctAnswer.trim();
      }

      // Always send as FormData for consistency with create endpoint
      const formData = new FormData();
      
      // Add each field individually instead of as JSON string
      Object.entries(questionDataToSend).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          // Handle arrays (like options, tags)
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });
      
      // Add files if they exist
      if (audioFile) {
        formData.append('audioFile', audioFile);
      }
      if (imageFile) {
        formData.append('imageFile', imageFile);
      }

      console.log('Updating question with FormData:', {
        questionData: questionDataToSend,
        hasAudio: !!audioFile,
        hasImage: !!imageFile
      });

      // Use fetch directly for FormData to match create endpoint
      const response = await fetch(`http://localhost:8000/api/questions/${question._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      await fetchQuestion(question._id);
      setIsEditing(false);
      setAudioFile(null);
      setImageFile(null);
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
                        <div className="space-y-4">
                          {/* Current Audio */}
                          {question.audioFile?.url && !audioFile && (
                            <div className="space-y-2">
                              <Label className="text-sm font-medium flex items-center gap-2">
                                <Volume2 className="h-4 w-4" />
                                Current Audio
                              </Label>
                              <AudioPlayer
                                src={question.audioFile.url}
                                title={question.audioFile.originalName || 'Question Audio'}
                                showDownload={false}
                                className="w-full"
                              />
                              <p className="text-xs text-muted-foreground">
                                {question.audioFile.originalName} • {Math.round(question.audioFile.bytes! / 1024)}KB
                              </p>
                            </div>
                          )}

                          {/* Upload New Audio */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Upload New Audio File</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="file"
                                accept="audio/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setAudioFile(file);
                                  }
                                }}
                                className="flex-1"
                              />
                              {audioFile && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setAudioFile(null)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            {audioFile && (
                              <div className="flex items-center gap-2 text-sm text-green-600">
                                <FileIcon className="h-4 w-4" />
                                <span>New file selected: {audioFile.name}</span>
                              </div>
                            )}
                          </div>

                          {/* Section & Word Limit for listening completion types */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Section (1-4)</Label>
                              <Input
                                type="number"
                                min="1"
                                max="4"
                                value={editData.section || 1}
                                onChange={(e) => setEditData({ ...editData, section: parseInt(e.target.value) })}
                              />
                            </div>
                            {(editData.subType?.includes('completion') || editData.subType === 'listening-short-answer') && (
                              <div className="space-y-2">
                                <Label>Word Limit (1-5)</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  max="5"
                                  value={editData.wordLimit || 2}
                                  onChange={(e) => setEditData({ ...editData, wordLimit: parseInt(e.target.value) })}
                                />
                              </div>
                            )}
                          </div>
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

                      {/* Audio for Listening Questions */}
                      {question.type === 'listening' && question.audioFile?.url && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Volume2 className="h-5 w-5 text-purple-600" />
                            <Label className="text-sm font-semibold">Question Audio</Label>
                            {question.section && (
                              <Badge variant="outline" className="border-purple-300 text-purple-700">
                                Section {question.section}
                              </Badge>
                            )}
                          </div>
                          <AudioPlayer
                            src={question.audioFile.url}
                            title={question.audioFile.originalName || 'Question Audio'}
                            showDownload={false}
                            className="w-full"
                          />
                          <div className="text-xs text-muted-foreground">
                            {question.audioFile.originalName} • 
                            {question.audioFile.duration && ` ${Math.round(question.audioFile.duration)}s • `}
                            {Math.round(question.audioFile.bytes! / 1024)}KB
                          </div>
                        </div>
                      )}

                      {/* Image for Questions with imageFile */}
                      {question.imageFile?.url && (
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">Reference Image</Label>
                          <div className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                            <img
                              src={question.imageFile.url}
                              alt={question.imageFile.originalName || 'Question image'}
                              className="w-full h-auto max-h-96 object-contain"
                            />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {question.imageFile.originalName} • 
                            {question.imageFile.width}×{question.imageFile.height} • 
                            {Math.round(question.imageFile.bytes! / 1024)}KB
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Question</Label>
                        <div className="p-4 bg-muted rounded-lg space-y-2">
                          <p className="text-sm leading-relaxed">{question.question}</p>
                          {question.instructionText && (
                            <p className="text-xs text-muted-foreground italic border-l-2 border-blue-300 pl-2">
                              {question.instructionText}
                            </p>
                          )}
                        </div>
                        {/* Word Limit & Blanks Count */}
                        {(question.wordLimit || question.blanksCount) && (
                          <div className="flex flex-wrap gap-2">
                            {question.wordLimit && (
                              <Badge variant="outline" className="border-blue-300 text-blue-700">
                                Word Limit: {question.wordLimit}
                                {question.wordLimit <= 5 && (
                                  <span className="ml-1 text-xs">
                                    ({question.wordLimit === 1 ? 'ONE WORD ONLY' : 
                                      question.wordLimit === 2 ? 'TWO WORDS' :
                                      question.wordLimit === 3 ? 'THREE WORDS' :
                                      question.wordLimit === 4 ? 'FOUR WORDS' :
                                      'FIVE WORDS'})
                                  </span>
                                )}
                              </Badge>
                            )}
                            {question.blanksCount && (
                              <Badge variant="outline" className="border-green-300 text-green-700">
                                Blanks: {question.blanksCount}
                              </Badge>
                            )}
                          </div>
                        )}
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