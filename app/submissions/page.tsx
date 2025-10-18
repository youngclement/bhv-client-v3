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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Clock,
  Play,
  CheckCircle,
  AlertCircle,
  XCircle,
  BookOpen,
  Volume2,
  PenTool,
  Calendar,
  ArrowLeft,
  LogOut,
  ArrowRight,
  FileText,
  Grid3x3,
  Target,
  TrendingUp,
  Flame,
  Trophy,
  Lightbulb
} from 'lucide-react';
import { authService } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import Link from 'next/link';

interface Assignment {
  _id: string;
  testId: {
    _id: string;
    title: string;
    description: string;
    type: 'reading' | 'listening' | 'writing' | 'mixed';
    duration: number;
    totalPoints: number;
  };
  studentIds: string[];
  assignedBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  dueDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  submissionStatus: 'not-started' | 'pending' | 'in-progress' | 'completed' | 'overdue';
  submissionId?: string;
  score?: number;
  submittedAt?: string;
}

export default function SubmissionsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]); // To keep track of all assignments for counting
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  // Re-fetch assignments when status filter changes
  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchAssignments(selectedStatus === 'all' ? undefined : selectedStatus);
    }
  }, [selectedStatus]);

  const checkAuthAndFetchData = async () => {
    try {
      if (!authService.isAuthenticated()) {
        router.push('/login');
        return;
      }

      // Get user profile
      const userProfile = await authService.getProfile();
      setUser(userProfile);

      // Fetch all assignments first for counting
      await fetchAllAssignments();
      
      // Fetch filtered assignments for display
      await fetchAssignments(selectedStatus === 'all' ? undefined : selectedStatus);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      router.push('/login');
    }
  };

  const fetchAllAssignments = async () => {
    try {
      // Fetch all assignments without status filter for counting
      let data;
      try {
        data = await authService.apiRequest('/assignments/my-assignments');
      } catch (error) {
        console.warn('my-assignments endpoint not available, using fallback');
        data = await authService.apiRequest('/assignments?page=1&limit=100');
      }

      const assignments = data.assignments || [];
      const processedAssignments = assignments.map((assignment: any) => {
        return { ...assignment };
      });

      // Save assignmentId to localStorage for each testId
      processedAssignments.forEach((assignment: any) => {
        if (assignment.testId && assignment.testId._id && assignment._id) {
          const testId = assignment.testId._id;
          const assignmentId = assignment._id;
          localStorage.setItem(`bhv-assignment-${testId}`, assignmentId);
          console.log(`💾 Saved assignmentId ${assignmentId} for testId ${testId} to localStorage`);
        }
      });

      setAllAssignments(processedAssignments);
    } catch (error) {
      console.error('Failed to fetch all assignments:', error);
      setAllAssignments([]);
    }
  };

  const fetchAssignments = async (status?: string) => {
    try {
      // Try the my-assignments endpoint with status parameter
      let data;
      try {
        const endpoint = status && status !== 'all' 
          ? `/assignments/my-assignments?status=${status}`
          : '/assignments/my-assignments';
        data = await authService.apiRequest(endpoint);
      } catch (error) {
        console.warn('my-assignments endpoint not available, using fallback');
        // Fallback to regular assignments endpoint
        data = await authService.apiRequest('/assignments?page=1&limit=100');
      }

      const assignments = data.assignments || [];
      const processedAssignments = assignments.map((assignment: any) => {
        // The API now returns submissionStatus directly
        return {
          ...assignment
        };
      });

      // Save assignmentId to localStorage for each testId
      processedAssignments.forEach((assignment: any) => {
        if (assignment.testId && assignment.testId._id && assignment._id) {
          const testId = assignment.testId._id;
          const assignmentId = assignment._id;
          localStorage.setItem(`bhv-assignment-${testId}`, assignmentId);
          console.log(`💾 Saved assignmentId ${assignmentId} for testId ${testId} to localStorage`);
        }
      });

      setAssignments(processedAssignments);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      // Set empty array but don't show error to user
      setAssignments([]);
      // You could show a toast notification here if needed
      // toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async (assignmentId: string, testId: string) => {
    try {
      // Check if there's already a submission in progress
      try {
        const existingSubmissions = await authService.apiRequest(`/submissions?testId=${testId}&status=in-progress`);
        if (existingSubmissions && existingSubmissions.length > 0) {
          // Continue existing submission
          const existingSubmission = existingSubmissions[0];
          router.push(`/submissions/take-test/${assignmentId}?submission=${existingSubmission._id}&testId=${testId}`);
          return;
        }
      } catch (error) {
        console.log('No existing submission found, starting new one');
      }

      // Start new test submission
      try {
        const response = await authService.startSubmission(testId, assignmentId);
        router.push(`/submissions/take-test/${assignmentId}?submission=${response.submissionId}&testId=${testId}`);
      } catch (error) {
        console.error('Failed to start submission:', error);
        // Fallback: navigate without submission ID
        router.push(`/submissions/take-test/${assignmentId}?assignment=${assignmentId}&testId=${testId}`);
      }

    } catch (error) {
      console.error('Failed to start test:', error);
      // Final fallback: navigate with assignment ID
      router.push(`/submissions/take-test/${assignmentId}?assignment=${assignmentId}&testId=${testId}`);
    }
  };

  const handleContinueTest = (submissionId: string, testId: string) => {
    router.push(`/submissions/take-test/${testId}?submission=${submissionId}`);
  };

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in-progress': return <Play className="h-4 w-4 text-blue-600" />;
      case 'overdue': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'not-started': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'not-started': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reading': return <BookOpen className="h-4 w-4" />;
      case 'listening': return <Volume2 className="h-4 w-4" />;
      case 'writing': return <PenTool className="h-4 w-4" />;
      default: return <Play className="h-4 w-4" />;
    }
  };

  // Filter assignments by search term (status already filtered by API)
  const filteredAssignments = assignments.filter(assignment =>
    assignment.testId?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.testId?.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading your tests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md overflow-hidden">
                <img 
                  src="/BHV-logo-page.jpg" 
                  alt="BHV English Logo" 
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.src = '/logo.svg';
                  }}
                />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-[#004875] tracking-tight">BHV English</h1>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium">IELTS Test Center</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {user && (
                <div className="hidden md:flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#004875] to-[#005a8f] flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>
                  <div className="flex flex-col">
                    <div className="text-sm font-semibold text-slate-900">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-xs text-slate-500">Student</div>
                  </div>
                </div>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push('/dashboard')} 
                className="gap-2 hover:bg-slate-100 text-slate-700"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout} 
                className="gap-2 hover:bg-red-50 text-red-600 hover:text-red-700"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[100rem] mx-auto px-2 sm:px-3 lg:px-6 xl:px-8 py-4">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <Button 
            className="bg-[#004875] hover:bg-[#003a5c] text-white h-12 justify-start gap-3"
            onClick={() => {
              const nextTest = allAssignments.find(a => a.submissionStatus === 'not-started' || a.submissionStatus === 'pending');
              if (nextTest) handleStartTest(nextTest._id, nextTest.testId._id);
            }}
          >
            <ArrowRight className="h-5 w-5" />
            <span className="font-semibold">Take Next Test</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-12 justify-start gap-3 border-slate-300 hover:bg-slate-50"
            onClick={() => {/* Navigate to results */}}
          >
            <FileText className="h-5 w-5" />
            <Link href="/submissions/review-result" className="font-semibold">Review Results</Link>
          </Button>
          <Button 
            variant="outline" 
            className="h-12 justify-start gap-3 border-slate-300 hover:bg-slate-50"
            onClick={() => {/* Navigate to practice */}}
          >
            <Grid3x3 className="h-5 w-5" />
            <span className="font-semibold">Practice Mode</span>
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Left Sidebar */}
          <div className="lg:w-80 flex-shrink-0 space-y-4">
            {/* Header Section */}
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="pt-6 pb-6">
                <h2 className="text-xl font-bold text-slate-900">My Assignments</h2>
                <p className="text-sm text-slate-600 mt-1">View and take your assignETS tests</p>
              </CardContent>
            </Card>

            {/* Total Assignments */}
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="pt-6 pb-6">
                <p className="text-sm font-medium text-slate-500 mb-4 text-center">Total Assignments</p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-slate-900">{allAssignments.length}</div>
                    <div className="text-xs text-slate-500 mt-1">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-slate-900">{allAssignments.filter(a => a.submissionStatus === 'completed').length}</div>
                    <div className="text-xs text-slate-500 mt-1">Completed</div>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4 text-[#004875]" />
                    <span className="text-sm font-medium text-slate-700">In Progress</span>
                  </div>
                  <span className="text-lg font-bold text-slate-900">{allAssignments.filter(a => a.submissionStatus === 'in-progress').length}</span>
                </div>
              </CardContent>
            </Card>

            {/* Progress Overview with Circle */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Progress Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Progress Circle */}
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-slate-200"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${(allAssignments.filter(a => a.submissionStatus === 'completed').length / Math.max(allAssignments.length, 1)) * 352} 352`}
                        className="text-[#004875]"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-slate-900">
                        {Math.round((allAssignments.filter(a => a.submissionStatus === 'completed').length / Math.max(allAssignments.length, 1)) * 100)}%
                      </span>
                      <span className="text-xs text-slate-500">Test de done</span>
                    </div>
                  </div>
                </div>

                {/* Progress Bars */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Listening</span>
                      <span className="text-slate-600">
                        {allAssignments.filter(a => a.testId?.type === 'listening' && a.submissionStatus === 'completed').length}/{allAssignments.filter(a => a.testId?.type === 'listening').length} tests done
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#004875] rounded-full transition-all"
                        style={{
                          width: `${(allAssignments.filter(a => a.testId?.type === 'listening' && a.submissionStatus === 'completed').length / Math.max(allAssignments.filter(a => a.testId?.type === 'listening').length, 1)) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Reading</span>
                      <span className="text-slate-600">
                        {allAssignments.filter(a => a.testId?.type === 'reading' && a.submissionStatus === 'completed').length}/{allAssignments.filter(a => a.testId?.type === 'reading').length} tests done
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#004875] rounded-full transition-all"
                        style={{
                          width: `${(allAssignments.filter(a => a.testId?.type === 'reading' && a.submissionStatus === 'completed').length / Math.max(allAssignments.filter(a => a.testId?.type === 'reading').length, 1)) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Attempts</span>
                      <span className="text-sm font-bold text-slate-900">0</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Motivational Tip */}
            <Card className="border-blue-200 bg-blue-50/50 shadow-sm">
              <CardContent className="pt-4 pb-4">
                <div className="flex gap-3">
                  <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-sm text-blue-900 mb-1">Tip</h3>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      In the Listening section, look out for section changes. This can help you identify answers!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Content - Tests Table */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Search and Filters */}
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="pt-4 pb-4">
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search tests..."
                      className="pl-10 border-slate-200 focus:border-[#004875] focus:ring-[#004875]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  {/* Status Filter Tabs */}
                  <div className="flex flex-wrap gap-1">
                    {[
                      { key: 'all', label: 'All Tests', icon: Grid3x3, count: allAssignments.length },
                      { key: 'pending', label: 'Not Started', icon: AlertCircle, count: allAssignments.filter(a => a.submissionStatus === 'not-started' || a.submissionStatus === 'pending').length },
                      { key: 'in-progress', label: 'In Progress', icon: Play, count: allAssignments.filter(a => a.submissionStatus === 'in-progress').length },
                      { key: 'completed', label: 'Completed', icon: CheckCircle, count: allAssignments.filter(a => a.submissionStatus === 'completed').length },
                      { key: 'overdue', label: 'Overdue', icon: XCircle, count: allAssignments.filter(a => a.submissionStatus === 'overdue').length }
                    ].map((status) => {
                      const Icon = status.icon;
                      const isActive = selectedStatus === status.key;
                      return (
                        <Button
                          key={status.key}
                          variant={isActive ? 'default' : 'outline'}
                          size="sm"
                          className={`h-8 px-3 text-xs font-medium transition-all ${
                            isActive 
                              ? 'bg-[#004875] hover:bg-[#003a5c] text-white border-[#004875]' 
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                          onClick={() => setSelectedStatus(status.key)}
                        >
                          <Icon className="h-3 w-3 mr-1.5" />
                          {status.label}
                          <Badge 
                            variant="secondary" 
                            className={`ml-1.5 text-xs h-4 px-1.5 ${
                              isActive 
                                ? 'bg-white/20 text-white hover:bg-white/20' 
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {status.count}
                          </Badge>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          {/* Tests Table */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-4 sm:px-6 py-4 sm:py-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg sm:text-xl text-slate-900">
                    Assigned Tests
                    <Badge variant="secondary" className="ml-2 sm:ml-3 bg-[#004875] text-white hover:bg-[#003a5c] text-xs">
                      {filteredAssignments.length}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="mt-1 text-xs sm:text-sm">
                    Your IELTS test assignments and progress
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="border-slate-200 bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="font-semibold text-slate-700 text-xs sm:text-sm w-[35%] min-w-[200px]">Test Information</TableHead>
                      <TableHead className="font-semibold text-slate-700 hidden md:table-cell text-xs sm:text-sm w-[12%] min-w-[120px]">Type</TableHead>
                      <TableHead className="font-semibold text-slate-700 hidden lg:table-cell text-xs sm:text-sm w-[10%] min-w-[90px]">Duration</TableHead>
                      <TableHead className="font-semibold text-slate-700 hidden xl:table-cell text-xs sm:text-sm w-[11%] min-w-[110px]">Assigned By</TableHead>
                      <TableHead className="font-semibold text-slate-700 hidden sm:table-cell text-xs sm:text-sm w-[12%] min-w-[100px]">Due Date</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-xs sm:text-sm w-[10%] min-w-[90px]">Status</TableHead>
                      <TableHead className="font-semibold text-slate-700 hidden lg:table-cell text-xs sm:text-sm w-[8%] min-w-[70px]">Score</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right text-xs sm:text-sm w-[12%] min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssignments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12">
                          <div className="flex flex-col items-center gap-3">
                            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                              <BookOpen className="h-8 w-8 text-slate-400" />
                            </div>
                            <div>
                              <p className="text-slate-900 font-medium">No tests found</p>
                              <p className="text-sm text-slate-500 mt-1">
                                {searchTerm ? 'Try adjusting your search' : 'No assignments available yet'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAssignments.map((assignment) => {
                        const isOverdue = new Date() > new Date(assignment.dueDate);
                        const actualStatus = isOverdue && assignment.submissionStatus === 'not-started' ? 'overdue' : assignment.submissionStatus;

                        return (
                          <TableRow key={assignment._id} className="border-slate-200 hover:bg-slate-50/50 transition-colors">
                            <TableCell className="max-w-xs py-3 sm:py-4">
                              <div className="font-semibold text-slate-900 text-sm sm:text-base">{assignment.testId?.title}</div>
                              <div className="text-xs sm:text-sm text-slate-500 truncate mt-0.5">
                                {assignment.testId?.description}
                              </div>
                              {/* Mobile: Show type inline */}
                              <div className="flex items-center gap-2 mt-2 md:hidden">
                                <div className={`h-6 w-6 rounded-lg flex items-center justify-center ${
                                  assignment.testId?.type === 'reading' ? 'bg-blue-50' :
                                  assignment.testId?.type === 'listening' ? 'bg-purple-50' :
                                  assignment.testId?.type === 'writing' ? 'bg-green-50' : 'bg-slate-50'
                                }`}>
                                  {getTypeIcon(assignment.testId?.type)}
                                </div>
                                <span className="capitalize text-slate-700 text-xs font-medium">{assignment.testId?.type}</span>
                                <span className="text-xs text-slate-500 ml-auto">{assignment.testId?.duration}m</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell py-3 sm:py-4">
                              <div className="flex items-center gap-2">
                                <div className={`h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center ${
                                  assignment.testId?.type === 'reading' ? 'bg-blue-50' :
                                  assignment.testId?.type === 'listening' ? 'bg-purple-50' :
                                  assignment.testId?.type === 'writing' ? 'bg-green-50' : 'bg-slate-50'
                                }`}>
                                  {getTypeIcon(assignment.testId?.type)}
                                </div>
                                <span className="capitalize text-slate-700 text-xs sm:text-sm font-medium">{assignment.testId?.type}</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell py-3 sm:py-4">
                              <div className="flex items-center gap-2 text-slate-700">
                                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
                                <span className="font-medium text-xs sm:text-sm">{assignment.testId?.duration}m</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden xl:table-cell py-3 sm:py-4">
                              <div className="text-xs sm:text-sm text-slate-700 font-medium">
                                {assignment.assignedBy.firstName} {assignment.assignedBy.lastName}
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell py-3 sm:py-4">
                              <div className="text-xs sm:text-sm text-slate-700 font-medium">
                                {format(new Date(assignment.dueDate), 'MMM dd, yyyy')}
                              </div>
                              <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
                                {format(new Date(assignment.dueDate), 'h:mm a')}
                              </div>
                            </TableCell>
                            <TableCell className="py-3 sm:py-4">
                              <Badge 
                                className={`${getStatusColor(actualStatus)} border-0 font-medium text-[10px] sm:text-xs`}
                                variant="outline"
                              >
                                {getStatusIcon(actualStatus)}
                                <span className="ml-1 sm:ml-1.5 capitalize">
                                  {actualStatus === 'not-started' ? 'pending' : actualStatus.replace('-', ' ')}
                                </span>
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell py-3 sm:py-4">
                              {assignment.score !== undefined ? (
                                <div className="flex items-center gap-2">
                                  <div className="text-xs sm:text-sm font-bold text-[#004875]">
                                    {assignment.score}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    / {assignment.testId?.totalPoints || 0}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-xs sm:text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right py-3 sm:py-4">
                              <div className="flex justify-end gap-1.5 sm:gap-2">
                                {(assignment.submissionStatus === 'not-started' || assignment.submissionStatus === 'pending') && !isOverdue && (
                                  <Button
                                    size="sm"
                                    disabled={loading}
                                    onClick={() => handleStartTest(assignment._id, assignment.testId?._id)}
                                    className="bg-[#004875] hover:bg-[#003a5c] text-white shadow-sm h-8 text-xs px-2 sm:px-3"
                                  >
                                    <Play className="h-3 w-3 sm:h-3.5 sm:w-3.5 sm:mr-1.5" />
                                    <span className="hidden sm:inline">Start Test</span>
                                    <span className="sm:hidden">Start</span>
                                  </Button>
                                )}

                                {assignment.submissionStatus === 'in-progress' && assignment.submissionId && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={loading}
                                    onClick={() => handleContinueTest(assignment.submissionId!, assignment.testId?._id)}
                                    className="border-[#004875] text-[#004875] hover:bg-[#004875] hover:text-white h-8 text-xs px-2 sm:px-3"
                                  >
                                    <Play className="h-3 w-3 sm:h-3.5 sm:w-3.5 sm:mr-1.5" />
                                    <span className="hidden sm:inline">Continue</span>
                                    <span className="sm:hidden">Continue</span>
                                  </Button>
                                )}

                                {assignment.submissionStatus === 'completed' && (
                                  <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 px-2 sm:px-3 py-1 text-[10px] sm:text-xs">
                                    <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
                                    Completed
                                  </Badge>
                                )}

                                {actualStatus === 'overdue' && (
                                  <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200">
                                    Overdue
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </div>
  );
}