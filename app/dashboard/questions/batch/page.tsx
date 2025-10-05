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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  File,
  Music,
  Image,
  Save,
  Copy,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { authService } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface BatchQuestion {
  id: string;
  type: 'listening';
  subType: string;
  question: string;
  correctAnswer: string | string[];
  options?: string[];
  points: number;
  blanksCount?: number;
  wordLimit?: number;
  audioTimestamp?: {
    start: number;
    end: number;
  };
  useSharedAudio: boolean;
  useSharedImage: boolean;
}

interface SharedMetadata {
  section: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  instructionText: string;
}

interface UploadProgress {
  uploadId: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  message?: string;
}

export default function BatchCreatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Shared files
  const [sharedAudioFile, setSharedAudioFile] = useState<File | null>(null);
  const [sharedImageFile, setSharedImageFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  
  // Questions and metadata
  const [questions, setQuestions] = useState<BatchQuestion[]>([]);
  const [sharedMetadata, setSharedMetadata] = useState<SharedMetadata>({
    section: '1',
    difficulty: 'medium',
    tags: [],
    instructionText: ''
  });
  
  const [tagInput, setTagInput] = useState('');
  const [activeTab, setActiveTab] = useState('setup');

  // Listening question types từ backend
  const listeningTypes = [
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
  ];

  const addQuestion = () => {
    const newQuestion: BatchQuestion = {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'listening',
      subType: 'listening-multiple-choice',
      question: '',
      correctAnswer: '',
      options: ['', '', '', ''],
      points: 1,
      useSharedAudio: !!sharedAudioFile,
      useSharedImage: !!sharedImageFile
    };
    setQuestions(prev => [...prev, newQuestion]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, field: keyof BatchQuestion, value: any) => {
    setQuestions(prev =>
      prev.map(q =>
        q.id === id ? { ...q, [field]: value } : q
      )
    );
  };

  const duplicateQuestion = (id: string) => {
    const question = questions.find(q => q.id === id);
    if (question) {
      const duplicated = {
        ...question,
        id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        question: question.question + ' (Copy)'
      };
      setQuestions(prev => [...prev, duplicated]);
    }
  };

  const needsOptions = (subType: string) => {
    return subType === 'listening-multiple-choice' || 
           subType === 'listening-matching' ||
           subType === 'pick-from-list';
  };

  const isCompletionType = (subType: string) => {
    return [
      'form-completion',
      'note-completion', 
      'table-completion',
      'flowchart-completion',
      'sentence-completion',
      'summary-completion'
    ].includes(subType);
  };

  const needsImage = (subType: string) => {
    return [
      'diagram-labelling',
      'map-labelling',
      'plan-labelling'
    ].includes(subType);
  };

  const handleFileUpload = async (file: File, type: 'audio' | 'image') => {
    if (type === 'audio') {
      setSharedAudioFile(file);
      // Update all questions to use shared audio
      setQuestions(prev => 
        prev.map(q => ({ ...q, useSharedAudio: true }))
      );
    } else {
      setSharedImageFile(file);
      // Update all questions to use shared image
      setQuestions(prev => 
        prev.map(q => ({ ...q, useSharedImage: true }))
      );
    }
  };

  const trackUploadProgress = (uploadId: string) => {
    const eventSource = new EventSource(`/api/upload/progress/${uploadId}`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setUploadProgress({
        uploadId,
        progress: data.progress,
        status: data.status,
        message: data.message
      });
      
      if (data.status === 'completed' || data.status === 'error') {
        eventSource.close();
        if (data.status === 'completed') {
          setSuccess('Batch creation completed successfully!');
        }
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setUploadProgress(prev => prev ? { ...prev, status: 'error', message: 'Connection lost' } : null);
    };
  };

  const handleSubmit = async () => {
    if (questions.length === 0) {
      setError('Please add at least one question');
      return;
    }

    if (questions.length > 50) {
      setError('Maximum 50 questions per batch');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Start progress tracking
      trackUploadProgress(uploadId);
      
      const formData = new FormData();
      
      // Add shared files
      if (sharedAudioFile) {
        formData.append('audioFile', sharedAudioFile);
      }
      if (sharedImageFile) {
        formData.append('imageFile', sharedImageFile);
      }
      
      // Add questions data
      formData.append('questions', JSON.stringify(questions));
      formData.append('sharedMetadata', JSON.stringify(sharedMetadata));
      formData.append('uploadId', uploadId);
      
      const response = await fetch(`http://localhost:8000/api/batch-questions/batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Batch creation failed');
      }

      const result = await response.json();
      setSuccess(`Created ${result.results.created} out of ${result.results.total} questions successfully!`);
      
      if (result.results.failed > 0) {
        console.warn('Some questions failed:', result.results.errors);
      }

    } catch (err) {
      setError('Failed to create batch questions. Please try again.');
      console.error('Batch creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !sharedMetadata.tags.includes(tagInput.trim())) {
      setSharedMetadata(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setSharedMetadata(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const getSubTypeDisplayName = (subType: string) => {
    const names: Record<string, string> = {
      'listening-multiple-choice': 'Multiple Choice',
      'form-completion': 'Form Completion',
      'note-completion': 'Note Completion',
      'table-completion': 'Table Completion',
      'flowchart-completion': 'Flowchart Completion',
      'sentence-completion': 'Sentence Completion',
      'summary-completion': 'Summary Completion',
      'diagram-labelling': 'Diagram Labelling',
      'map-labelling': 'Map Labelling',
      'plan-labelling': 'Plan Labelling',
      'listening-matching': 'Matching',
      'listening-short-answer': 'Short Answer',
      'pick-from-list': 'Pick from List'
    };
    return names[subType] || subType;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Zap className="h-8 w-8 text-primary" />
              Batch Create Questions
            </h1>
            <p className="text-muted-foreground">Create multiple IELTS listening questions efficiently</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {questions.length}/50 questions
        </Badge>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-green-600">{success}</AlertDescription>
        </Alert>
      )}

      {/* Upload Progress */}
      {uploadProgress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upload Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">{uploadProgress.status}</span>
              <span className="text-sm font-medium">{uploadProgress.progress}%</span>
            </div>
            <Progress value={uploadProgress.progress} className="h-2" />
            {uploadProgress.message && (
              <p className="text-xs text-muted-foreground">{uploadProgress.message}</p>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="files">Shared Files</TabsTrigger>
          <TabsTrigger value="questions">Questions ({questions.length})</TabsTrigger>
          <TabsTrigger value="review">Review & Create</TabsTrigger>
        </TabsList>

        {/* Setup Tab */}
        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shared Metadata</CardTitle>
              <CardDescription>
                Common settings that will be applied to all questions in this batch
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>IELTS Section</Label>
                  <Select 
                    value={sharedMetadata.section} 
                    onValueChange={(value) => setSharedMetadata(prev => ({ ...prev, section: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Section 1 - Social & Daily Life</SelectItem>
                      <SelectItem value="2">Section 2 - Social & Educational</SelectItem>
                      <SelectItem value="3">Section 3 - Academic Discussion</SelectItem>
                      <SelectItem value="4">Section 4 - Academic Lecture</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Difficulty Level</Label>
                  <Select 
                    value={sharedMetadata.difficulty} 
                    onValueChange={(value) => setSharedMetadata(prev => ({ ...prev, difficulty: value as any }))}
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
              </div>

              <div className="space-y-2">
                <Label>Instruction Text</Label>
                <Textarea
                  placeholder="General instructions for this batch of questions..."
                  value={sharedMetadata.instructionText}
                  onChange={(e) => setSharedMetadata(prev => ({ ...prev, instructionText: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button type="button" onClick={addTag} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {sharedMetadata.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {sharedMetadata.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shared Files Tab */}
        <TabsContent value="files" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Shared Audio */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Shared Audio File
                </CardTitle>
                <CardDescription>
                  Upload one audio file to be used by all listening questions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!sharedAudioFile ? (
                  <div
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => document.getElementById('audio-upload')?.click()}
                  >
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium mb-1">Upload audio file</p>
                    <p className="text-xs text-muted-foreground">
                      MP3, WAV, M4A, MP4, AAC, OGG, WebM, MOV (max 50MB)
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                    <Music className="h-5 w-5 text-blue-500" />
                    <div className="flex-1">
                      <p className="font-medium">{sharedAudioFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(sharedAudioFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSharedAudioFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <input
                  id="audio-upload"
                  type="file"
                  accept=".mp3,.wav,.m4a,.mp4,.aac,.ogg,.webm,.mov"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'audio')}
                  className="hidden"
                />
              </CardContent>
            </Card>

            {/* Shared Image */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Shared Image File
                </CardTitle>
                <CardDescription>
                  Upload image for diagram/map/plan labelling questions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!sharedImageFile ? (
                  <div
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium mb-1">Upload image file</p>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG, GIF, WebP (max 10MB)
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                    <Image className="h-5 w-5 text-green-500" />
                    <div className="flex-1">
                      <p className="font-medium">{sharedImageFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(sharedImageFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSharedImageFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <input
                  id="image-upload"
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.webp,.svg"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'image')}
                  className="hidden"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Questions Tab */}
        <TabsContent value="questions" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Questions</h3>
            <Button onClick={addQuestion} className="gap-2" disabled={questions.length >= 50}>
              <Plus className="h-4 w-4" />
              Add Question
            </Button>
          </div>

          {questions.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">No questions added yet</p>
              <Button onClick={addQuestion} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Question
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <Card key={question.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        Question {index + 1} - {getSubTypeDisplayName(question.subType)}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => duplicateQuestion(question.id)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(question.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Question Type</Label>
                        <Select
                          value={question.subType}
                          onValueChange={(value) => updateQuestion(question.id, 'subType', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {listeningTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {getSubTypeDisplayName(type)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Points</Label>
                        <Input
                          type="number"
                          min="1"
                          value={question.points}
                          onChange={(e) => updateQuestion(question.id, 'points', parseInt(e.target.value) || 1)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Question Text</Label>
                      <Textarea
                        placeholder="Enter the question..."
                        value={question.question}
                        onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                        rows={2}
                      />
                    </div>

                    {/* Options for multiple choice */}
                    {needsOptions(question.subType) && (
                      <div className="space-y-2">
                        <Label>Options</Label>
                        {question.options?.map((option, optIndex) => (
                          <Input
                            key={optIndex}
                            placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...(question.options || [])];
                              newOptions[optIndex] = e.target.value;
                              updateQuestion(question.id, 'options', newOptions);
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Completion settings */}
                    {isCompletionType(question.subType) && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Number of Blanks</Label>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            value={question.blanksCount || 1}
                            onChange={(e) => updateQuestion(question.id, 'blanksCount', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Word Limit per Blank</Label>
                          <Input
                            type="number"
                            min="1"
                            max="5"
                            value={question.wordLimit || 2}
                            onChange={(e) => updateQuestion(question.id, 'wordLimit', parseInt(e.target.value) || 2)}
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Correct Answer</Label>
                      <Input
                        placeholder={
                          isCompletionType(question.subType) 
                            ? "Enter answers separated by commas: answer1, answer2, answer3"
                            : "Enter the correct answer"
                        }
                        value={Array.isArray(question.correctAnswer) 
                          ? question.correctAnswer.join(', ') 
                          : question.correctAnswer
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          updateQuestion(
                            question.id, 
                            'correctAnswer',
                            isCompletionType(question.subType) 
                              ? value.split(',').map(s => s.trim()).filter(Boolean)
                              : value
                          );
                        }}
                      />
                    </div>

                    {/* Audio timestamp */}
                    {question.useSharedAudio && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Start Time (seconds)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={question.audioTimestamp?.start || 0}
                            onChange={(e) => updateQuestion(question.id, 'audioTimestamp', {
                              ...question.audioTimestamp,
                              start: parseInt(e.target.value) || 0
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>End Time (seconds)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={question.audioTimestamp?.end || 30}
                            onChange={(e) => updateQuestion(question.id, 'audioTimestamp', {
                              ...question.audioTimestamp,
                              end: parseInt(e.target.value) || 30
                            })}
                          />
                        </div>
                      </div>
                    )}

                    {/* File usage indicators */}
                    <div className="flex items-center gap-4 pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <Music className={`h-4 w-4 ${question.useSharedAudio ? 'text-blue-500' : 'text-muted-foreground'}`} />
                        <span className="text-sm">Uses shared audio</span>
                      </div>
                      {needsImage(question.subType) && (
                        <div className="flex items-center gap-2">
                          <Image className={`h-4 w-4 ${question.useSharedImage ? 'text-green-500' : 'text-muted-foreground'}`} />
                          <span className="text-sm">Uses shared image</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Review Tab */}
        <TabsContent value="review" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Review & Create Batch</CardTitle>
              <CardDescription>
                Review your batch settings before creating all questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Batch Summary</h4>
                    <div className="text-sm space-y-1">
                      <p>Questions: <span className="font-medium">{questions.length}</span></p>
                      <p>Section: <span className="font-medium">{sharedMetadata.section}</span></p>
                      <p>Difficulty: <span className="font-medium capitalize">{sharedMetadata.difficulty}</span></p>
                      <p>Shared Audio: <span className="font-medium">{sharedAudioFile ? '✓' : '✗'}</span></p>
                      <p>Shared Image: <span className="font-medium">{sharedImageFile ? '✓' : '✗'}</span></p>
                    </div>
                  </div>

                  {sharedMetadata.tags.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-1">
                        {sharedMetadata.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Question Types</h4>
                    <div className="text-sm space-y-1">
                      {Array.from(new Set(questions.map(q => q.subType))).map(type => (
                        <div key={type} className="flex justify-between">
                          <span>{getSubTypeDisplayName(type)}</span>
                          <span className="font-medium">
                            {questions.filter(q => q.subType === type).length}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Ready to create {questions.length} questions?</p>
                  <p className="text-sm text-muted-foreground">
                    This action will create all questions with shared files and metadata.
                  </p>
                </div>
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading || questions.length === 0}
                  className="gap-2"
                  size="lg"
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'Creating...' : 'Create Batch'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}