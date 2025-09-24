'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  BookOpen, 
  Volume2, 
  PenTool, 
  Play,
  Clock,
  FileText,
  Users
} from 'lucide-react';
import { authService } from '@/lib/auth';

interface Test {
  _id: string;
  title: string;
  description: string;
  type: 'reading' | 'listening' | 'writing' | 'mixed';
  duration: number;
  isActive: boolean;
  questions: any[];
  passages: any[];
  createdAt: string;
  updatedAt: string;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

const testTypes = [
  { value: 'reading', label: 'Reading', icon: BookOpen },
  { value: 'listening', label: 'Listening', icon: Volume2 },
  { value: 'writing', label: 'Writing', icon: PenTool },
  { value: 'mixed', label: 'Mixed', icon: Play },
];

export default function TestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<Test>>({});

  useEffect(() => {
    if (params.id) {
      fetchTest(params.id as string);
    }
  }, [params.id]);

  const fetchTest = async (id: string) => {
    try {
      const data = await authService.apiRequest(`/tests/${id}`);
      setTest(data);
      setEditData(data);
    } catch (error) {
      console.error('Failed to fetch test:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!test) return;
    
    setSaving(true);
    try {
      await authService.apiRequest(`/tests/${test._id}`, {
        method: 'PUT',
        body: JSON.stringify(editData),
      });

      await fetchTest(test._id);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update test:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!test) return;

    try {
      await authService.apiRequest(`/tests/${test._id}`, {
        method: 'DELETE',
      });
      router.push('/dashboard/tests');
    } catch (error) {
      console.error('Failed to delete test:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = testTypes.find(t => t.value === type);
    return typeConfig ? <typeConfig.icon className="h-5 w-5" /> : null;
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
          <p className="mt-2 text-sm text-muted-foreground">Loading test...</p>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Test not found</p>
        <Button onClick={() => router.push('/dashboard/tests')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tests
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
            onClick={() => router.push('/dashboard/tests')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tests
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Test Details</h2>
            <p className="text-muted-foreground">View and manage test information</p>
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
                    <AlertDialogTitle>Delete Test</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this test? This action cannot be undone.
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
                  {getTypeIcon(test.type)}
                  <div>
                    <CardTitle>{test.title}</CardTitle>
                    <CardDescription>
                      {test.type.charAt(0).toUpperCase() + test.type.slice(1)} Test • {formatDuration(test.duration)}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={test.isActive ? "default" : "secondary"}>
                  {test.isActive ? "Active" : "Draft"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[70vh] pr-4">
                <div className="space-y-6 pr-4">
                  {isEditing ? (
                    <>
                      <div className="space-y-2">
                        <Label>Test Title</Label>
                        <Input
                          value={editData.title || ''}
                          onChange={(e) => setEditData({...editData, title: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={editData.description || ''}
                          onChange={(e) => setEditData({...editData, description: e.target.value})}
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Test Type</Label>
                          <Select 
                            value={editData.type} 
                            onValueChange={(value: any) => setEditData({...editData, type: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {testTypes.map(type => (
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
                          <Label>Duration (minutes)</Label>
                          <Input
                            type="number"
                            min="1"
                            value={editData.duration || 60}
                            onChange={(e) => setEditData({...editData, duration: parseInt(e.target.value)})}
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={editData.isActive || false}
                          onCheckedChange={(checked) => setEditData({...editData, isActive: checked})}
                        />
                        <Label>Active (available for assignment)</Label>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Description</Label>
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-sm leading-relaxed">{test.description}</p>
                        </div>
                      </div>

                      <Tabs defaultValue="questions" className="w-full">
                        <TabsList>
                          <TabsTrigger value="questions">Questions ({test.questions?.length || 0})</TabsTrigger>
                          <TabsTrigger value="passages">Passages ({test.passages?.length || 0})</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="questions" className="space-y-4">
                          {test.questions && test.questions.length > 0 ? (
                            <div className="space-y-3">
                              {test.questions.map((question: any, index: number) => (
                                <div key={question._id || index} className="p-4 border rounded-lg">
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
                                      <p className="text-sm font-medium mb-1">{question.question}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {question.subType?.replace('-', ' ')} • {question.difficulty}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              No questions added to this test
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="passages" className="space-y-4">
                          {test.passages && test.passages.length > 0 ? (
                            <div className="space-y-3">
                              {test.passages.map((passage: any, index: number) => (
                                <div key={passage._id || index} className="p-4 border rounded-lg">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="outline" className="text-xs">
                                          {passage.type}
                                        </Badge>
                                        <Badge variant="secondary" className="text-xs">
                                          {passage.questions?.length || 0} questions
                                        </Badge>
                                      </div>
                                      <p className="text-sm font-medium mb-1">{passage.title}</p>
                                      <p className="text-xs text-muted-foreground truncate">
                                        {passage.content?.substring(0, 100)}...
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              No passages added to this test
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
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
              <CardTitle>Test Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Type</Label>
                <div className="flex items-center gap-2">
                  {getTypeIcon(test.type)}
                  <span className="capitalize">{test.type}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Duration</Label>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{formatDuration(test.duration)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <Badge variant={test.isActive ? "default" : "secondary"}>
                  {test.isActive ? "Active" : "Draft"}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Content</Label>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {test.questions?.length || 0} questions
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    {test.passages?.length || 0} passages
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Created By</Label>
                <p className="text-sm">{test.createdBy?.firstName} {test.createdBy?.lastName}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Created</Label>
                <p className="text-sm">{new Date(test.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Last Updated</Label>
                <p className="text-sm">{new Date(test.updatedAt).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}