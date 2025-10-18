'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Save,
  X,
  CalendarIcon,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  XCircle,
  BookOpen,
  Volume2,
  PenTool
} from 'lucide-react';
import { authService } from '@/lib/auth';

interface Assignment {
  _id: string;
  testId: {
    _id: string;
    title: string;
    type: string;
    duration: number;
    totalPoints?: number;
  };
  assignedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  studentIds: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    completionStatus: 'completed' | 'in-progress' | 'overdue' | 'pending';
    isOverdue: boolean;
    submissionId?: string;
    score?: number;
    submittedAt?: string;
  }>;
  students?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  }[];
  completionStats?: {
    totalStudents: number;
    completed: number;
    inProgress: number;
    overdue: number;
    pending: number;
    completionRate: number;
  };
  dueDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  submissions?: {
    _id: string;
    studentId?: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    student?: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    score?: number;
    submittedAt: string;
    status: string;
    answers?: Array<{
      questionId: string;
      answer: string;
      timeSpent?: number;
    }>;
  }[];
}

export default function AssignmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<Omit<Assignment, 'dueDate'>> & { dueDate?: Date | string }>({});

  useEffect(() => {
    if (params.id) {
      fetchAssignment(params.id as string);
    }
  }, [params.id]);

  const fetchAssignment = async (id: string) => {
    try {
      const data = await authService.apiRequest(`/assignments/${id}?populate=students`);
      setAssignment(data);
      setEditData({
        ...data,
        dueDate: new Date(data.dueDate),
      });
    } catch (error) {
      console.error('Failed to fetch assignment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!assignment) return;

    setSaving(true);
    try {
      const updateData = {
        ...editData,
        dueDate: editData.dueDate instanceof Date ? editData.dueDate.toISOString() : editData.dueDate,
      };

      await authService.apiRequest(`/assignments/${assignment._id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      await fetchAssignment(assignment._id);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update assignment:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!assignment) return;

    try {
      await authService.apiRequest(`/assignments/${assignment._id}`, {
        method: 'DELETE',
      });
      router.push('/dashboard/assignments');
    } catch (error) {
      console.error('Failed to delete assignment:', error);
    }
  };

  const getAssignmentStatus = (assignment: Assignment) => {
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    const isOverdue = now > dueDate;

    if (!assignment.isActive) {
      return { status: 'inactive', color: 'bg-gray-100 text-gray-800', icon: XCircle };
    }

    if (isOverdue) {
      return { status: 'overdue', color: 'bg-red-100 text-red-800', icon: AlertCircle };
    }

    return { status: 'active', color: 'bg-green-100 text-green-800', icon: CheckCircle };
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reading': return <BookOpen className="h-4 w-4" />;
      case 'listening': return <Volume2 className="h-4 w-4" />;
      case 'writing': return <PenTool className="h-4 w-4" />;
      default: return null;
    }
  };

  const getStudentStatusBadge = (status: string, score?: number) => {
    switch (status) {
      case 'completed':
        return (
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Completed
            </Badge>
            {score !== undefined && (
              <Badge variant="secondary">{score}%</Badge>
            )}
          </div>
        );
      case 'in-progress':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        );
      case 'overdue':
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Assignment not found</p>
        <Button onClick={() => router.push('/dashboard/assignments')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Assignments
        </Button>
      </div>
    );
  }

  const statusInfo = getAssignmentStatus(assignment);
  const completedCount = assignment.completionStats?.completed || assignment.submissions?.length || 0;
  const totalStudents = assignment.completionStats?.totalStudents || assignment.studentIds.length;
  const progressPercentage = assignment.completionStats?.completionRate || (totalStudents > 0 ? (completedCount / totalStudents) * 100 : 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/assignments')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assignments
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Assignment Details</h2>
            <p className="text-muted-foreground">View and manage assignment information</p>
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
                    <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this assignment? This action cannot be undone.
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
                  {getTypeIcon(assignment.testId?.type)}
                  <div>
                    <CardTitle>{assignment.testId?.title}</CardTitle>
                    <CardDescription>
                      {assignment.testId?.type?.charAt(0).toUpperCase() + assignment.testId?.type?.slice(1)} Test • {assignment.testId?.duration} minutes
                    </CardDescription>
                  </div>
                </div>
                <Badge className={statusInfo.color} variant="outline">
                  <statusInfo.icon className="h-3 w-3 mr-1" />
                  {statusInfo.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[70vh] pr-4">
                <div className="space-y-6 pr-4">
                  {isEditing ? (
                    <>
                      <div className="space-y-2">
                        <Label>Due Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full justify-start text-left font-normal',
                                !editData.dueDate && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {editData.dueDate instanceof Date ? format(editData.dueDate, 'PPP') : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={editData.dueDate instanceof Date ? editData.dueDate : undefined}
                              onSelect={(date) => date && setEditData({ ...editData, dueDate: date })}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={editData.isActive || false}
                          onCheckedChange={(checked) => setEditData({ ...editData, isActive: checked })}
                        />
                        <Label>Active Assignment</Label>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Due Date</Label>
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{format(new Date(assignment.dueDate), 'PPP')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{format(new Date(assignment.dueDate), 'p')}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Progress</Label>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>{completedCount}/{totalStudents} completed</span>
                              <span>{progressPercentage.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progressPercentage}%` }}
                              ></div>
                            </div>
                            {assignment.completionStats && (
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span>Completed: {assignment.completionStats.completed}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                  <span>In Progress: {assignment.completionStats.inProgress}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                  <span>Overdue: {assignment.completionStats.overdue}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                  <span>Pending: {assignment.completionStats.pending}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Test Information</Label>
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            {getTypeIcon(assignment.testId?.type)}
                            <span className="font-medium">{assignment.testId?.title}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <div className="flex items-center gap-4">
                              <span className="capitalize">{assignment.testId?.type} Test</span>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {assignment.testId?.duration} minutes
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Assigned Students ({totalStudents})</Label>
                        <div className="p-4 bg-muted rounded-lg max-h-80 overflow-y-auto">
                          {assignment.studentIds && assignment.studentIds.length > 0 ? (
                            <div className="space-y-2">
                              {assignment.studentIds.map((student) => (
                                <div key={student._id} className="flex items-center justify-between p-3 bg-background rounded border">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback className="text-xs">
                                        {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="text-sm font-medium">{student.firstName} {student.lastName}</p>
                                      <p className="text-xs text-muted-foreground">{student.email}</p>
                                      {student.submittedAt && (
                                        <p className="text-xs text-muted-foreground">
                                          Submitted: {new Date(student.submittedAt).toLocaleDateString()}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {getStudentStatusBadge(student.completionStatus, student.score)}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => router.push(`/dashboard/students/${student._id}`)}
                                    >
                                      View Profile
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : assignment.students && assignment.students.length > 0 ? (
                            <div className="space-y-2">
                              {assignment.students.map((student) => (
                                <div key={student._id} className="flex items-center justify-between p-2 bg-background rounded border">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback className="text-xs">
                                        {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="text-sm font-medium">{student.firstName} {student.lastName}</p>
                                      <p className="text-xs text-muted-foreground">{student.email}</p>
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push(`/dashboard/students/${student._id}`)}
                                  >
                                    View Profile
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{totalStudents} students assigned to this test</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {assignment.submissions && assignment.submissions.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Recent Submissions</Label>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {assignment.submissions.slice(0, 5).map((submission: any, index: number) => (
                              <div key={submission._id || index} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs">
                                      {submission.studentId?.firstName?.charAt(0) || submission.student?.firstName?.charAt(0)}
                                      {submission.studentId?.lastName?.charAt(0) || submission.student?.lastName?.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-sm font-medium">
                                      <a 
                                        href={`/dashboard/students/${submission.studentId?._id || submission.student?._id}`}
                                        className="hover:underline"
                                      >
                                        {submission.studentId?.firstName || submission.student?.firstName} {submission.studentId?.lastName || submission.student?.lastName}
                                      </a>
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {submission.score !== undefined && (
                                    <Badge variant="secondary">
                                      {submission.score}%
                                    </Badge>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push(`/dashboard/students/${submission.studentId?._id || submission.student?._id}`)}
                                  >
                                    View Student
                                  </Button>
                                </div>
                              </div>
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
              <CardTitle>Assignment Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <Badge className={statusInfo.color} variant="outline">
                  <statusInfo.icon className="h-3 w-3 mr-1" />
                  {statusInfo.status}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Test Type</Label>
                <div className="flex items-center gap-2">
                  {getTypeIcon(assignment.testId?.type)}
                  <span className="capitalize">{assignment.testId?.type}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Duration</Label>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{assignment.testId?.duration} minutes</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Students</Label>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{totalStudents} assigned</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Completion Rate</Label>
                <div className="text-sm">
                  {progressPercentage.toFixed(0)}% ({completedCount}/{totalStudents})
                </div>
              </div>

              {assignment.assignedBy && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Assigned By</Label>
                  <p className="text-sm">{assignment.assignedBy.firstName} {assignment.assignedBy.lastName}</p>
                </div>
              )}

              {assignment.testId?.totalPoints && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Total Points</Label>
                  <p className="text-sm">{assignment.testId.totalPoints} points</p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium">Created</Label>
                <p className="text-sm">{new Date(assignment.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Last Updated</Label>
                <p className="text-sm">{new Date(assignment.updatedAt).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}