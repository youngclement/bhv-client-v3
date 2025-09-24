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
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit2, Trash2, Save, X, BookOpen, Volume2, Clock, FileText } from 'lucide-react';
import { authService } from '@/lib/auth';

interface Question {
  _id: string;
  number: number;
  type: string;
  prompt?: string;
  options?: string[];
  paragraphRef?: string;
  points: number;
}

interface Section {
  _id?: string;
  name: string;
  instructions?: string;
  range: {
    start: number;
    end: number;
  };
  questions: Question[];
}

interface Passage {
  _id: string;
  title: string;
  content: string;
  type: 'reading' | 'listening';
  audioUrl?: string;
  duration?: number;
  questions?: Question[]; // legacy
  sections?: Section[]; // legacy
  questionSections?: {
    _id?: string;
    title: string;
    instructions?: string;
    questionType: string;
    questionRange: string;
    questions: string[];
  }[];
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

const passageTypes = [
  { value: 'reading', label: 'Reading', icon: BookOpen },
  { value: 'listening', label: 'Listening', icon: Volume2 },
];

export default function PassageDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [passage, setPassage] = useState<Passage | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<Passage>>({});

  useEffect(() => {
    if (params.id) {
      fetchPassage(params.id as string);
    }
  }, [params.id]);

  const fetchPassage = async (id: string) => {
    try {
      const data = await authService.apiRequest(`/passages/${id}`);
      setPassage(data);
      setEditData(data);
    } catch (error) {
      console.error('Failed to fetch passage:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!passage) return;

    setSaving(true);
    try {
      await authService.apiRequest(`/passages/${passage._id}`, {
        method: 'PUT',
        body: JSON.stringify(editData),
      });

      await fetchPassage(passage._id);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update passage:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!passage) return;

    try {
      await authService.apiRequest(`/passages/${passage._id}`, {
        method: 'DELETE',
      });
      router.push('/dashboard/passages');
    } catch (error) {
      console.error('Failed to delete passage:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reading': return <BookOpen className="h-5 w-5" />;
      case 'listening': return <Volume2 className="h-5 w-5" />;
      default: return null;
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

  const formatDuration = (minutes: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading passage...</p>
        </div>
      </div>
    );
  }

  if (!passage) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Passage not found</p>
        <Button onClick={() => router.push('/dashboard/passages')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Passages
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
            onClick={() => router.push('/dashboard/passages')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Passages
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Passage Details</h2>
            <p className="text-muted-foreground">View and manage passage information</p>
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
                    <AlertDialogTitle>Delete Passage</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this passage? This action cannot be undone.
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
                  {getTypeIcon(passage.type)}
                  <div>
                    <CardTitle>{passage.title}</CardTitle>
                    <CardDescription>
                      {passage.type.charAt(0).toUpperCase() + passage.type.slice(1)} Passage
                      {passage.duration && ` • ${formatDuration(passage.duration)}`}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 pr-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label>Passage Title</Label>
                      <Input
                        value={editData.title || ''}
                        onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Passage Type</Label>
                      <Select
                        value={editData.type}
                        onValueChange={(value: any) => setEditData({ ...editData, type: value })}
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

                    <div className="space-y-2">
                      <Label>Passage Content</Label>
                      <Textarea
                        value={editData.content || ''}
                        onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                        rows={6}
                      />
                    </div>

                    {editData.type === 'listening' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Audio URL</Label>
                          <Input
                            value={editData.audioUrl || ''}
                            onChange={(e) => setEditData({ ...editData, audioUrl: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Duration (minutes)</Label>
                          <Input
                            type="number"
                            min="1"
                            value={editData.duration || 0}
                            onChange={(e) => setEditData({ ...editData, duration: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Content</Label>
                      <div className="bg-muted rounded-lg">
                        <ScrollArea className="max-h-[60vh] p-4 pr-6">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{passage.content}</p>
                        </ScrollArea>
                      </div>
                    </div>

                    {passage.audioUrl && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Audio</Label>
                        <div className="p-4 bg-muted rounded-lg">
                          <audio controls className="w-full">
                            <source src={passage.audioUrl} type="audio/mpeg" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Associated Questions ({(passage.questionSections?.reduce((acc, s) => acc + (s.questions?.length || 0), 0)) || passage.questions?.length || 0})</Label>
                      {passage.questionSections && passage.questionSections?.length > 0 ? (
                        <div className="space-y-3">
                          {passage.questionSections?.map((section, sectionIndex) => (
                            <div key={section._id || sectionIndex} className="border rounded-lg">
                              <div className="p-4 bg-muted/30">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-medium">{section.title}</h4>
                                    {section.instructions && (
                                      <p className="text-sm text-muted-foreground mt-1">{section.instructions}</p>
                                    )}
                                  </div>
                                  <Badge variant="outline">
                                    Questions {section.questionRange}
                                  </Badge>
                                </div>
                              </div>
                              <div className="p-4 text-sm text-muted-foreground">
                                {section.questions && section.questions.length > 0 ? (
                                  <div>{section.questions.length} question IDs</div>
                                ) : (
                                  <div>No questions linked in this section</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : passage.sections && passage.sections?.length > 0 ? (
                        <div className="space-y-3">
                          {passage.sections?.map((section, sectionIndex) => (
                            <div key={section._id || sectionIndex} className="border rounded-lg">
                              <div className="p-4 bg-muted/30">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-medium">{section.name}</h4>
                                    {section.instructions && (
                                      <p className="text-sm text-muted-foreground mt-1">{section.instructions}</p>
                                    )}
                                  </div>
                                  <Badge variant="outline">
                                    Questions {section.range.start}-{section.range.end}
                                  </Badge>
                                </div>
                              </div>

                              <div className="p-4 space-y-3">
                                {section.questions.map((question, questionIndex) => (
                                  <div key={question._id || questionIndex} className="p-3 bg-accent/20 rounded border">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Badge variant="outline" className="text-xs">
                                            Q{question.number}
                                          </Badge>
                                          <Badge variant="secondary" className="text-xs">
                                            {question.type.replace('-', ' ')}
                                          </Badge>
                                          {question.paragraphRef && (
                                            <Badge variant="outline" className="text-xs">
                                              Paragraph {question.paragraphRef}
                                            </Badge>
                                          )}
                                        </div>
                                        {question.prompt && (
                                          <p className="text-sm font-medium mb-1">{question.prompt}</p>
                                        )}
                                        {question.options && question.options.length > 0 && (
                                          <div className="text-xs text-muted-foreground">
                                            Options: {question.options.join(', ')}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}

                                {section.questions.length === 0 && (
                                  <div className="text-center py-4 text-muted-foreground text-sm">
                                    No questions in this section
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : passage.questions && passage.questions.length > 0 ? (
                        <div className="space-y-3">
                          {passage.questions.map((question, index) => (
                            <div key={question._id} className="p-4 border rounded-lg">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline" className="text-xs">
                                      {question.type}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs">
                                      {question.points} pts
                                    </Badge>
                                  </div>
                                  <p className="text-sm font-medium mb-1">{question.prompt}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No questions or sections associated with this passage
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Passage Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Type</Label>
                <div className="flex items-center gap-2">
                  {getTypeIcon(passage.type)}
                  <span className="capitalize">{passage.type}</span>
                </div>
              </div>

              {passage.duration && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Duration</Label>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formatDuration(passage.duration)}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium">Questions</Label>
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {passage.sections?.reduce((acc, section) => acc + section.questions.length, 0) || passage.questions?.length || 0} questions
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Created By</Label>
                <p className="text-sm">{passage.createdBy.firstName} {passage.createdBy.lastName}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Created</Label>
                <p className="text-sm">{new Date(passage.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Last Updated</Label>
                <p className="text-sm">{new Date(passage.updatedAt).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}