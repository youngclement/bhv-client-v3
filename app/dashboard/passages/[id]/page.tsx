'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
import { ArrowLeft, Edit2, Trash2, Save, X, BookOpen, Volume2, Clock, FileText, Plus } from 'lucide-react';
import { authService } from '@/lib/auth';

interface Question {
  _id: string;
  number: number;
  type: string;
  prompt?: string;
  options?: string[];
  paragraphRef?: string;
  answer?: string;
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
  points?: number;
  // For rendering legacy object questions and editing question IDs, allow union
  questions?: any;
  sections?: Section[]; // legacy
  questionSections?: {
    _id?: string;
    title: string;
    instructions?: string;
    questionType: string;
    questionRange: string;
    questions: Array<{
      _id: string;
      type: string; // reading
      subType: string; // e.g. yes-no-not-given
      question: string;
      options?: string[];
      correctAnswer?: string;
      points?: number;
      paragraphRef?: string;
      questionNumber?: number;
      difficulty?: string;
      tags?: string[];
    }>;
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
      // Map embedded question.answer -> correctAnswer for editing UI
      const mapped = {
        ...data,
        sections: Array.isArray(data.sections)
          ? data.sections.map((s: any) => ({
            ...s,
            questions: (s.questions || []).map((q: any) => ({
              ...q,
              correctAnswer: q.correctAnswer ?? q.answer,
            })),
          }))
          : data.sections,
      };
      setEditData(mapped);
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
      // Only send fields allowed by backend Joi schema
      const buildUpdatePayload = (data: Partial<Passage>) => {
        const payload: any = {};
        if (data.title !== undefined) payload.title = data.title;
        if (data.content !== undefined) payload.content = data.content;
        if (data.type !== undefined) payload.type = data.type;
        if (data.audioUrl !== undefined) payload.audioUrl = data.audioUrl;
        if (data.duration !== undefined) payload.duration = data.duration;
        if (data.points !== undefined) payload.points = data.points;
        // Drop manual question IDs input entirely per request
        if (Array.isArray(data.sections)) {
          payload.sections = data.sections.map((s) => ({
            name: s.name,
            instructions: s.instructions,
            range: s.range ? { start: s.range.start, end: s.range.end } : undefined,
            questions: (s.questions || []).map((q: any) => ({
              number: q.number,
              type: q.type,
              prompt: q.prompt,
              // Only keep options for types that use them; trim and drop empties
              ...(q.type === 'multiple-choice' || q.type === 'matching-headings'
                ? { options: (q.options || []).map((o: string) => (o || '').trim()).filter((o: string) => o.length > 0) }
                : {}),
              // Only include paragraphRef for matching-information and when non-empty
              ...(q.type === 'matching-information' && (q.paragraphRef || '').trim().length > 0
                ? { paragraphRef: (q.paragraphRef || '').trim() }
                : {}),
              // Do not send answer; backend maps correctAnswer → answer
              correctAnswer: q.correctAnswer,
              points: q.points,
            })),
          }));
        }
        return payload;
      };

      const payload = buildUpdatePayload(editData);

      await authService.apiRequest(`/passages/${passage._id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
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

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Points (total)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={editData.points ?? ''}
                          onChange={(e) => setEditData({ ...editData, points: e.target.value === '' ? undefined : Math.max(0, parseInt(e.target.value) || 0) })}
                        />
                      </div>
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
                    {/* Sections Editor */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Sections</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newSection: Section = {
                              name: '',
                              instructions: '',
                              range: { start: (editData.sections?.[editData.sections.length - 1]?.range.end || 0) + 1, end: (editData.sections?.[editData.sections.length - 1]?.range.end || 0) + 5 },
                              questions: []
                            };
                            setEditData({ ...editData, sections: [...(editData.sections || []), newSection] });
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add Section
                        </Button>
                      </div>

                      <Accordion type="multiple" defaultValue={(editData.sections || []).map((_, i) => String(i))} className="w-full">
                        {(editData.sections || []).map((section, sectionIndex) => {
                          const key = String(sectionIndex);
                          return (
                            <AccordionItem key={key} value={key}>
                              <AccordionTrigger>
                                <div className="w-full flex items-start justify-between pr-2">
                                  <div className="flex-1 min-w-0">
                                    <Input
                                      className="w-full"
                                      placeholder={`Section ${sectionIndex + 1} name`}
                                      value={section.name}
                                      onChange={(e) => {
                                        const sections = [...(editData.sections || [])];
                                        sections[sectionIndex] = { ...sections[sectionIndex], name: e.target.value };
                                        setEditData({ ...editData, sections });
                                      }}
                                    />
                                    <Textarea
                                      className="mt-2 w-full"
                                      placeholder="Instructions"
                                      rows={2}
                                      value={section.instructions || ''}
                                      onChange={(e) => {
                                        const sections = [...(editData.sections || [])];
                                        sections[sectionIndex] = { ...sections[sectionIndex], instructions: e.target.value };
                                        setEditData({ ...editData, sections });
                                      }}
                                    />
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground">Start</span>
                                      <Input
                                        type="number"
                                        min="1"
                                        className="w-20"
                                        value={section.range?.start ?? 1}
                                        onChange={(e) => {
                                          const start = parseInt(e.target.value) || 1;
                                          const sections = [...(editData.sections || [])];
                                          sections[sectionIndex] = { ...sections[sectionIndex], range: { ...(section.range || { start: 1, end: 1 }), start } } as Section;
                                          setEditData({ ...editData, sections });
                                        }}
                                      />
                                      <span className="text-xs text-muted-foreground">End</span>
                                      <Input
                                        type="number"
                                        min="1"
                                        className="w-20"
                                        value={section.range?.end ?? 1}
                                        onChange={(e) => {
                                          const end = parseInt(e.target.value) || 1;
                                          const sections = [...(editData.sections || [])];
                                          sections[sectionIndex] = { ...sections[sectionIndex], range: { ...(section.range || { start: 1, end: 1 }), end } } as Section;
                                          setEditData({ ...editData, sections });
                                        }}
                                      />
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        const sections = (editData.sections || []).filter((_, i) => i !== sectionIndex);
                                        setEditData({ ...editData, sections });
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="rounded-md border">
                                  <div className="p-3 flex items-center justify-between">
                                    <Label className="text-sm">Questions</Label>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const defaultOptions = (section.questions?.[section.questions.length - 1]?.type || 'multiple-choice') === 'matching-headings'
                                          ? ['A', 'B', 'C', 'D', 'E', 'F', 'G']
                                          : ['', '', '', ''];
                                        const newQ: Question = {
                                          _id: `${Date.now()}` as any,
                                          number: (section.questions?.[section.questions.length - 1]?.number || 0) + 1,
                                          type: 'multiple-choice',
                                          prompt: '',
                                          options: defaultOptions,
                                          // leave undefined by default; include only for matching-information
                                          points: 1,
                                        } as any;
                                        const sections = [...(editData.sections || [])];
                                        const qs = [...(sections[sectionIndex].questions || []), newQ];
                                        sections[sectionIndex] = { ...(sections[sectionIndex] as Section), questions: qs };
                                        setEditData({ ...editData, sections });
                                      }}
                                    >
                                      <Plus className="h-4 w-4 mr-1" /> Add Question
                                    </Button>
                                  </div>

                                  <div className="p-3 grid gap-3">
                                    {(section.questions || []).map((q, questionIndex) => (
                                      <Card key={q._id || questionIndex} className="p-3">
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1 grid gap-3">
                                            <div className="grid grid-cols-6 gap-3">
                                              <div>
                                                <Label className="text-xs">No</Label>
                                                <Input
                                                  type="number"
                                                  min="1"
                                                  value={q.number}
                                                  onChange={(e) => {
                                                    const sections = [...(editData.sections || [])];
                                                    const questions = [...(sections[sectionIndex].questions || [])];
                                                    questions[questionIndex] = { ...questions[questionIndex], number: parseInt(e.target.value) || 1 } as any;
                                                    sections[sectionIndex] = { ...(sections[sectionIndex] as Section), questions };
                                                    setEditData({ ...editData, sections });
                                                  }}
                                                />
                                              </div>
                                              <div className="col-span-2">
                                                <Label className="text-xs">Type</Label>
                                                <Select
                                                  value={q.type}
                                                  onValueChange={(value: any) => {
                                                    const sections = [...(editData.sections || [])];
                                                    const questions = [...(sections[sectionIndex].questions || [])];
                                                    questions[questionIndex] = { ...questions[questionIndex], type: value } as any;
                                                    sections[sectionIndex] = { ...(sections[sectionIndex] as Section), questions };
                                                    setEditData({ ...editData, sections });
                                                  }}
                                                >
                                                  <SelectTrigger>
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="true-false-not-given">True/False/Not Given</SelectItem>
                                                    <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                                                    <SelectItem value="matching-information">Matching Information</SelectItem>
                                                    <SelectItem value="matching-headings">Matching Headings</SelectItem>
                                                    <SelectItem value="sentence-completion">Sentence Completion</SelectItem>
                                                    <SelectItem value="summary-completion">Summary Completion</SelectItem>
                                                    <SelectItem value="short-answer">Short Answer</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                              <div>
                                                <Label className="text-xs">Points</Label>
                                                <Input
                                                  type="number"
                                                  min="0"
                                                  value={q.points ?? 0}
                                                  onChange={(e) => {
                                                    const sections = [...(editData.sections || [])];
                                                    const questions = [...(sections[sectionIndex].questions || [])];
                                                    questions[questionIndex] = { ...questions[questionIndex], points: Math.max(0, parseInt(e.target.value) || 0) } as any;
                                                    sections[sectionIndex] = { ...(sections[sectionIndex] as Section), questions };
                                                    setEditData({ ...editData, sections });
                                                  }}
                                                />
                                              </div>
                                              {q.type === 'matching-information' && (
                                                <div>
                                                  <Label className="text-xs">Paragraph Ref</Label>
                                                  <Input
                                                    placeholder="A/B/C"
                                                    value={q.paragraphRef || ''}
                                                    onChange={(e) => {
                                                      const sections = [...(editData.sections || [])];
                                                      const questions = [...(sections[sectionIndex].questions || [])];
                                                      questions[questionIndex] = { ...questions[questionIndex], paragraphRef: e.target.value } as any;
                                                      sections[sectionIndex] = { ...(sections[sectionIndex] as Section), questions };
                                                      setEditData({ ...editData, sections });
                                                    }}
                                                  />
                                                </div>
                                              )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                              <div>
                                                <Label className="text-xs">Correct Answer</Label>
                                                <Input
                                                  placeholder="Correct Answer"
                                                  value={(q as any).correctAnswer || ''}
                                                  onChange={(e) => {
                                                    const sections = [...(editData.sections || [])];
                                                    const questions = [...(sections[sectionIndex].questions || [])];
                                                    questions[questionIndex] = { ...questions[questionIndex], correctAnswer: e.target.value } as any;
                                                    sections[sectionIndex] = { ...(sections[sectionIndex] as Section), questions };
                                                    setEditData({ ...editData, sections });
                                                  }}
                                                />
                                              </div>
                                            </div>

                                            <div>
                                              <Label className="text-xs">Prompt</Label>
                                              <Textarea
                                                rows={3}
                                                value={q.prompt || ''}
                                                onChange={(e) => {
                                                  const sections = [...(editData.sections || [])];
                                                  const questions = [...(sections[sectionIndex].questions || [])];
                                                  questions[questionIndex] = { ...questions[questionIndex], prompt: e.target.value } as any;
                                                  sections[sectionIndex] = { ...(sections[sectionIndex] as Section), questions };
                                                  setEditData({ ...editData, sections });
                                                }}
                                              />
                                            </div>

                                            <div>
                                              <Label className="text-xs">Options</Label>
                                              {(q.type === 'multiple-choice' || q.type === 'matching-headings') ? (
                                                <div className="grid grid-cols-2 gap-2">
                                                  {((q.options || (q.type === 'multiple-choice' ? ['', '', '', ''] : ['', '', '', '', '']))).map((opt: string, optIndex: number) => (
                                                    <Input
                                                      key={`opt-${optIndex}`}
                                                      placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                                                      value={opt}
                                                      onChange={(e) => {
                                                        const sections = [...(editData.sections || [])];
                                                        const questions = [...(sections[sectionIndex].questions || [])];
                                                        const options = [...(questions[questionIndex].options || (q.type === 'multiple-choice' ? ['', '', '', ''] : ['', '', '', '', '']))];
                                                        options[optIndex] = e.target.value;
                                                        questions[questionIndex] = { ...questions[questionIndex], options } as any;
                                                        sections[sectionIndex] = { ...(sections[sectionIndex] as Section), questions };
                                                        setEditData({ ...editData, sections });
                                                      }}
                                                    />
                                                  ))}
                                                </div>
                                              ) : (
                                                <div className="text-xs text-muted-foreground">N/A for this type</div>
                                              )}
                                            </div>
                                          </div>
                                          <div className="pl-3">
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              onClick={() => {
                                                const sections = [...(editData.sections || [])];
                                                const questions = [...(sections[sectionIndex].questions || [])];
                                                questions.splice(questionIndex, 1);
                                                sections[sectionIndex] = { ...(sections[sectionIndex] as Section), questions };
                                                setEditData({ ...editData, sections });
                                              }}
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      </Card>
                                    ))}
                                    {(!section.questions || section.questions.length === 0) && (
                                      <div className="text-center text-sm text-muted-foreground py-6">No questions</div>
                                    )}
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    </div>
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
                      <Label className="text-sm font-medium">Associated Questions ({
                        passage.questionSections?.reduce((acc, s) => acc + (s.questions?.length || 0), 0)
                        || passage.sections?.reduce((acc, section) => acc + section.questions.length, 0)
                        || passage.questions?.length || 0
                      })</Label>
                      {passage.questionSections && passage.questionSections?.length > 0 ? (
                        <Accordion type="multiple" defaultValue={(passage.questionSections || []).map((s, i) => String(i))} className="w-full">
                          {passage.questionSections?.map((section, sectionIndex) => {
                            const key = String(sectionIndex);
                            return (
                              <AccordionItem key={key} value={key}>
                                <AccordionTrigger>
                                  <div className="w-full flex items-center justify-between pr-2">
                                    <div>
                                      <h4 className="font-medium">{section.title}</h4>
                                      {section.instructions && (
                                        <p className="text-sm text-muted-foreground mt-1">{section.instructions}</p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline">Questions {section.questionRange}</Badge>
                                      <Badge variant="secondary" className="capitalize">{section.questionType?.replace(/-/g, ' ')}</Badge>
                                      <Badge variant="outline">{section.questions?.length || 0} qs</Badge>
                                    </div>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="rounded-md border">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead className="w-[60px]">No</TableHead>
                                          <TableHead>Type</TableHead>
                                          <TableHead>Prompt</TableHead>
                                          <TableHead>Answer</TableHead>
                                          <TableHead>Points</TableHead>
                                          <TableHead>Paragraph Ref</TableHead>
                                          <TableHead>Options</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {(section.questions || []).map((q, idx) => {
                                          const correct = (q.correctAnswer || '').toString().trim();
                                          const isMCQ = Array.isArray(q.options) && q.options.length > 0;
                                          return (
                                            <TableRow key={q._id || idx}>
                                              <TableCell>{q.questionNumber ?? ''}</TableCell>
                                              <TableCell>
                                                <Badge variant="secondary" className="capitalize text-xs">
                                                  {(q.subType || section.questionType || '').replace(/-/g, ' ')}
                                                </Badge>
                                              </TableCell>
                                              <TableCell className="max-w-[420px] whitespace-pre-wrap">{q.question}</TableCell>
                                              <TableCell>
                                                {correct ? <Badge variant="outline" className="text-xs">{correct}</Badge> : '-'}
                                              </TableCell>
                                              <TableCell>{typeof q.points === 'number' ? q.points : '-'}</TableCell>
                                              <TableCell>{q.paragraphRef || '-'}</TableCell>
                                              <TableCell className="text-xs">
                                                {isMCQ ? (
                                                  <div className="flex flex-wrap gap-1">
                                                    {(q.options || []).map((opt, i) => {
                                                      const letter = String.fromCharCode(65 + i);
                                                      const isCorrect = correct === letter || correct === opt;
                                                      return (
                                                        <Badge key={`${q._id || idx}-opt-${i}`} variant={isCorrect ? 'default' : 'outline'}>
                                                          {letter}. {opt}
                                                        </Badge>
                                                      );
                                                    })}
                                                  </div>
                                                ) : (
                                                  '-'
                                                )}
                                              </TableCell>
                                            </TableRow>
                                          );
                                        })}
                                        {(!section.questions || section.questions.length === 0) && (
                                          <TableRow>
                                            <TableCell colSpan={7} className="text-center text-muted-foreground">No questions</TableCell>
                                          </TableRow>
                                        )}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            );
                          })}
                        </Accordion>
                      ) : passage.sections && passage.sections?.length > 0 ? (
                        <Accordion type="multiple" defaultValue={(passage.sections || []).map((s, i) => String(i))} className="w-full">
                          {passage.sections?.map((section, sectionIndex) => {
                            const key = String(sectionIndex);
                            const uniqueTypes = Array.from(new Set(section.questions.map(q => q.type))).slice(0, 4);
                            return (
                              <AccordionItem key={section._id || key} value={key}>
                                <AccordionTrigger>
                                  <div className="w-full flex items-center justify-between pr-2">
                                    <div>
                                      <h4 className="font-medium">{section.name || `Section ${sectionIndex + 1}`}</h4>
                                      {section.instructions && (
                                        <p className="text-sm text-muted-foreground mt-1">{section.instructions}</p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline">Questions {section.range.start}-{section.range.end}</Badge>
                                      <Badge variant="outline">{section.questions.length} qs</Badge>
                                      {uniqueTypes.map((t) => (
                                        <Badge key={`${sectionIndex}-${t}`} variant="secondary" className="capitalize">
                                          {t.replace(/-/g, ' ')}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="rounded-md border">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead className="w-[60px]">No</TableHead>
                                          <TableHead>Type</TableHead>
                                          <TableHead>Prompt</TableHead>
                                          <TableHead>Answer</TableHead>
                                          <TableHead>Points</TableHead>
                                          <TableHead>Paragraph Ref</TableHead>
                                          <TableHead>Options</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {section.questions.map((q, idx) => {
                                          const answer = (q as any).answer as string | undefined;
                                          const isMCQ = Array.isArray(q.options) && q.options.length > 0;
                                          return (
                                            <TableRow key={q._id || idx}>
                                              <TableCell>{q.number}</TableCell>
                                              <TableCell>
                                                <Badge variant="secondary" className="capitalize text-xs">
                                                  {q.type.replace(/-/g, ' ')}
                                                </Badge>
                                              </TableCell>
                                              <TableCell className="max-w-[420px] whitespace-pre-wrap">{q.prompt || '-'}</TableCell>
                                              <TableCell>
                                                {answer ? <Badge variant="outline" className="text-xs">{answer}</Badge> : '-'}
                                              </TableCell>
                                              <TableCell>{typeof q.points === 'number' ? q.points : '-'}</TableCell>
                                              <TableCell>{q.paragraphRef || '-'}</TableCell>
                                              <TableCell className="text-xs">
                                                {isMCQ ? (
                                                  <div className="flex flex-wrap gap-1">
                                                    {(q.options || []).map((opt, i) => {
                                                      const letter = String.fromCharCode(65 + i);
                                                      const isCorrect = (answer || '').toUpperCase() === letter || (answer || '') === opt;
                                                      return (
                                                        <Badge key={`${q._id || idx}-opt-${i}`} variant={isCorrect ? 'default' : 'outline'}>
                                                          {letter}. {opt}
                                                        </Badge>
                                                      );
                                                    })}
                                                  </div>
                                                ) : (
                                                  '-'
                                                )}
                                              </TableCell>
                                            </TableRow>
                                          );
                                        })}
                                        {section.questions.length === 0 && (
                                          <TableRow>
                                            <TableCell colSpan={7} className="text-center text-muted-foreground">No questions</TableCell>
                                          </TableRow>
                                        )}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            );
                          })}
                        </Accordion>
                      ) : passage.questions && (passage.questions as any[]).length > 0 ? (
                        <div className="space-y-3">
                          {(passage.questions as any[]).map((question: any, index: number) => (
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
                <Label className="text-sm font-medium">ID</Label>
                <p className="text-sm font-mono break-all">{passage._id}</p>
              </div>

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