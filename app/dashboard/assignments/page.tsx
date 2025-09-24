'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CalendarIcon,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { authService } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface Assignment {
  _id: string;
  testId: {
    _id: string;
    title: string;
    type: string;
    duration: number;
  };
  studentIds: string[];
  students?: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>;
  dueDate: string;
  isActive: boolean;
  createdAt: string;
  submissions?: any[];
}

interface Test {
  _id: string;
  title: string;
  type: string;
  duration: number;
  isActive: boolean;
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function AssignmentsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    testId: '',
    studentIds: [] as string[],
    dueDate: new Date(),
    isActive: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assignmentsData, testsData, studentsData] = await Promise.all([
        authService.apiRequest('/assignments?page=1&limit=50&populate=students').catch(() => ({ assignments: [] })),
        authService.apiRequest('/tests?isActive=true&page=1&limit=100'),
        authService.apiRequest('/users/students?page=1&limit=100'),
      ]);

      setAssignments(assignmentsData.assignments || []);
      setTests(testsData.tests || []);
      setStudents(studentsData.students || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async () => {
    try {
      await authService.apiRequest('/assignments', {
        method: 'POST',
        body: JSON.stringify({
          testId: newAssignment.testId,
          studentIds: newAssignment.studentIds,
          dueDate: newAssignment.dueDate.toISOString(),
          isActive: newAssignment.isActive,
        }),
      });

      setIsCreateDialogOpen(false);
      fetchData();

      // Reset form
      setNewAssignment({
        testId: '',
        studentIds: [],
        dueDate: new Date(),
        isActive: true,
      });
    } catch (error) {
      console.error('Failed to create assignment:', error);
    }
  };

  const getAssignmentStatus = (assignment: Assignment) => {
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    const isOverdue = now > dueDate;

    if (!assignment.isActive) {
      return { status: 'inactive', color: 'bg-gray-100 text-gray-800' };
    }

    if (isOverdue) {
      return { status: 'overdue', color: 'bg-red-100 text-red-800' };
    }

    return { status: 'active', color: 'bg-green-100 text-green-800' };
  };

  const filteredAssignments = assignments.filter(assignment =>
    assignment.testId?.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Assignments</h2>
          <p className="text-muted-foreground">Assign tests to students and track progress</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
              <DialogDescription>Assign a test to selected students</DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="test">Select Test</Label>
                  <Select value={newAssignment.testId} onValueChange={(value) => setNewAssignment({ ...newAssignment, testId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a test" />
                    </SelectTrigger>
                    <SelectContent>
                      {tests.map(test => (
                        <SelectItem key={test._id} value={test._id}>
                          <div className="flex flex-col">
                            <span>{test.title}</span>
                            <span className="text-xs text-muted-foreground">
                              {test.type} • {test.duration} minutes
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Select Students</Label>
                  <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
                    {students.map(student => (
                      <div key={student._id} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          id={student._id}
                          checked={newAssignment.studentIds.includes(student._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewAssignment({
                                ...newAssignment,
                                studentIds: [...newAssignment.studentIds, student._id]
                              });
                            } else {
                              setNewAssignment({
                                ...newAssignment,
                                studentIds: newAssignment.studentIds.filter(id => id !== student._id)
                              });
                            }
                          }}
                        />
                        <label htmlFor={student._id} className="text-sm">
                          {student.firstName} {student.lastName} ({student.email})
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {newAssignment.studentIds.length} student(s) selected
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !newAssignment.dueDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newAssignment.dueDate ? format(newAssignment.dueDate, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newAssignment.dueDate}
                        onSelect={(date) => date && setNewAssignment({ ...newAssignment, dueDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateAssignment}
                disabled={!newAssignment.testId || newAssignment.studentIds.length === 0}
              >
                Create Assignment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assignments by test title..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assignments ({filteredAssignments.length})</CardTitle>
          <CardDescription>
            Track test assignments and student progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading assignments...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments?.map((assignment) => {
                  const statusInfo = getAssignmentStatus(assignment);
                  const completedCount = assignment.submissions?.length || 0;
                  const totalStudents = assignment.studentIds.length;
                  const progressPercentage = totalStudents > 0 ? (completedCount / totalStudents) * 100 : 0;

                  return (
                    <TableRow
                      key={assignment._id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/dashboard/assignments/${assignment._id}`)}
                    >
                      <TableCell className="max-w-xs">
                        <div className="font-medium">{assignment.testId?.title}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <span className="capitalize">{assignment.testId?.type}</span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {assignment.testId?.duration}m
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {totalStudents}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(assignment.dueDate), 'PPP')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(assignment.dueDate), 'p')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusInfo.color} variant="outline">
                          {statusInfo.status === 'overdue' && <AlertCircle className="h-3 w-3 mr-1" />}
                          {statusInfo.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {statusInfo.status === 'inactive' && <XCircle className="h-3 w-3 mr-1" />}
                          {statusInfo.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {completedCount}/{totalStudents} completed
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(assignment.createdAt), 'PP')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/assignments/${assignment._id}`);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}