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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Search,
  Edit2,
  BookOpen,
  Volume2,
  PenTool,
  Play,
  Clock,
  Users,
  FileText,
  Eye
} from 'lucide-react';
import { authService } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface Test {
  _id: string;
  title: string;
  description: string;
  type: 'reading' | 'listening' | 'writing' | 'full';
  duration: number;
  totalQuestions: number;
  totalPoints: number;
  isActive: boolean;
  status: 'draft' | 'published' | 'archived';
  questions?: string[];
  sections: any[];
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
  { value: 'full', label: 'Full', icon: Play },
];

export default function TestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [newTest, setNewTest] = useState({
    title: '',
    description: '',
    type: 'reading' as 'reading' | 'listening' | 'writing' | 'full',
    duration: 60,
    isActive: true,
  });

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const data = await authService.apiRequest('/tests?page=1&limit=50');
      setTests(data.tests || []);
    } catch (error) {
      console.error('Failed to fetch tests:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleCreateTest = async () => {
    try {
      // Create test with status "draft" first
      const response = await authService.apiRequest('/tests', {
        method: 'POST',
        body: JSON.stringify({
          title: newTest.title,
          description: newTest.description,
          type: newTest.type,
          duration: newTest.duration,
          status: 'draft' // Mark as draft initially
        }),
      });

      console.log('Test created successfully:', response);
      setIsCreateDialogOpen(false);

      // Navigate to test builder page to add questions
      router.push(`/dashboard/tests/${response._id}/builder`);

      // Reset form
      setNewTest({
        title: '',
        description: '',
        type: 'reading',
        duration: 60,
        isActive: true,
      });

      // Refresh the tests list
      fetchTests();
    } catch (error) {
      console.error('Failed to create test:', error);
      alert('Failed to create test. Please try again.');
    }
  };

  const toggleTestStatus = async (testId: string, currentStatus: boolean) => {
    try {
      await authService.apiRequest(`/tests/${testId}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      fetchTests();
    } catch (error) {
      console.error('Failed to update test status:', error);
    }
  };




  const filteredTests = tests.filter(test => {
    const matchesSearch = test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || !selectedType || test.type === selectedType;
    return matchesSearch && matchesType;
  });


  const getTypeIcon = (type: string) => {
    const typeConfig = testTypes.find(t => t.value === type);
    return typeConfig ? <typeConfig.icon className="h-4 w-4" /> : null;
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


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tests</h2>
          <p className="text-muted-foreground">Create and manage IELTS tests</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Test
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Test</DialogTitle>
              <DialogDescription>Create a new IELTS test for your students</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Test Title</Label>
                <Input
                  placeholder="e.g., IELTS Reading Practice Test 1"
                  value={newTest.title}
                  onChange={(e) => setNewTest({ ...newTest, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  placeholder="Describe what this test covers..."
                  value={newTest.description}
                  onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Test Type</Label>
                  <Select value={newTest.type} onValueChange={(value: any) => setNewTest({ ...newTest, type: value })}>
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
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newTest.duration}
                    onChange={(e) => setNewTest({ ...newTest, duration: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={newTest.isActive}
                  onCheckedChange={(checked) => setNewTest({ ...newTest, isActive: checked })}
                />
                <Label htmlFor="isActive">Active (available for assignment)</Label>
              </div>

              {/* Note about adding questions */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Plus className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900">Add Questions Later</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      After creating the test, you&apos;ll be redirected to the test builder where you can add questions, upload audio files, and organize sections.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateTest}
                disabled={!newTest.title || !newTest.description}
              >
                Create Test
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tests..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
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
        </CardContent>
      </Card>

      {/* Tests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tests ({filteredTests.length})</CardTitle>
          <CardDescription>
            Manage your IELTS test collection
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading tests...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test Details</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTests.map((test) => (
                  <TableRow
                    key={test._id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/dashboard/tests/${test._id}`)}
                  >
                    <TableCell className="max-w-xs">
                      <div className="font-medium">{test.title}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {test.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(test.type)}
                        <span className="capitalize">{test.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {formatDuration(test.duration)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {test.totalQuestions || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            test.status === 'published' ? "default" :
                              test.status === 'draft' ? "secondary" :
                                "outline"
                          }
                          className={
                            test.status === 'published' ? 'bg-green-100 text-green-800' :
                              test.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                          }
                        >
                          {test.status === 'draft' ? 'Draft' :
                            test.status === 'published' ? 'Published' :
                              test.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {test.status === 'published' && (
                          <Switch
                            checked={test.isActive}
                            onCheckedChange={() => toggleTestStatus(test._id, test.isActive)}
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(test.createdAt).toLocaleDateString()}
                      </div>
                      {test.createdBy && (
                        <div className="text-xs text-muted-foreground">
                          by {test.createdBy.firstName} {test.createdBy.lastName}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {test.status === 'draft' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/tests/${test._id}/builder`);
                            }}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Continue Building
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/tests/${test._id}`);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/tests/${test._id}/builder`);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}