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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Plus, Search, Edit2, Trash2, BookOpen, Volume2, PenTool, Zap, Sparkles, ChevronDown, Filter, SortAsc, SortDesc } from 'lucide-react';
import { authService } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

interface PaginationMeta {
  current: number;
  pages: number;
  total: number;
}

interface QuestionFilters {
  page: number;
  limit: number;
  type?: string;
  difficulty?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const questionTypes = [
  { value: 'reading', label: 'Reading', icon: BookOpen },
  { value: 'listening', label: 'Listening', icon: Volume2 },
  { value: 'writing', label: 'Writing', icon: PenTool },
];

const difficultyOptions = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export default function QuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationMeta>({
    current: 1,
    pages: 1,
    total: 0
  });
  
  const [filters, setFilters] = useState<QuestionFilters>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  useEffect(() => {
    fetchQuestions();
  }, [filters]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        ...(filters.sortOrder && { sortOrder: filters.sortOrder }),
        ...(filters.type && filters.type !== 'all' && { type: filters.type }),
        ...(filters.difficulty && filters.difficulty !== 'all' && { difficulty: filters.difficulty }),
        ...(filters.search && { search: filters.search })
      });

      const data = await authService.apiRequest(`/questions?${params}`);
      setQuestions(data.questions || []);
      setPagination(data.pagination || { current: 1, pages: 1, total: 0 });
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<QuestionFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: newFilters.page || 1 // Reset to page 1 when filters change (except for pagination)
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
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
      case 'reading': return <BookOpen className="h-4 w-4" />;
      case 'listening': return <Volume2 className="h-4 w-4" />;
      case 'writing': return <PenTool className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Questions</h2>
          <p className="text-muted-foreground">Manage your IELTS question bank</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href="/dashboard/questions/create">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Single Question
            </Button>
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Zap className="mr-2 h-4 w-4" />
                Advanced Create
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/dashboard/questions/batch" className="flex items-center gap-2 w-full">
                  <Zap className="h-4 w-4 text-blue-500" />
                  <div>
                    <div className="font-medium">Batch Creation</div>
                    <div className="text-xs text-muted-foreground">Create multiple questions at once</div>
                  </div>
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <Link href="/dashboard/questions/templates" className="flex items-center gap-2 w-full">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <div>
                    <div className="font-medium">Use Template</div>
                    <div className="text-xs text-muted-foreground">Create from IELTS templates</div>
                  </div>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newOrder = filters.sortOrder === 'asc' ? 'desc' : 'asc';
                  handleFilterChange({ sortOrder: newOrder });
                }}
              >
                {filters.sortOrder === 'asc' ? (
                  <SortAsc className="h-4 w-4 mr-2" />
                ) : (
                  <SortDesc className="h-4 w-4 mr-2" />
                )}
                Sort {filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                className="pl-8"
                value={filters.search || ''}
                onChange={(e) => handleFilterChange({ search: e.target.value || undefined })}
              />
            </div>

            {/* Question Type */}
            <Select 
              value={filters.type || 'all'} 
              onValueChange={(value) => handleFilterChange({ type: value === 'all' ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {questionTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Difficulty */}
            <Select 
              value={filters.difficulty || 'all'} 
              onValueChange={(value) => handleFilterChange({ difficulty: value === 'all' ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All difficulties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All difficulties</SelectItem>
                {difficultyOptions.map(difficulty => (
                  <SelectItem key={difficulty.value} value={difficulty.value}>
                    {difficulty.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select 
              value={filters.sortBy || 'createdAt'} 
              onValueChange={(value) => handleFilterChange({ sortBy: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Created Date</SelectItem>
                <SelectItem value="points">Points</SelectItem>
                <SelectItem value="difficulty">Difficulty</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters Display */}
          {(filters.type || filters.difficulty || filters.search) && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {filters.type && (
                <Badge variant="secondary" className="gap-1">
                  Type: {filters.type}
                  <button
                    onClick={() => handleFilterChange({ type: undefined })}
                    className="hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filters.difficulty && (
                <Badge variant="secondary" className="gap-1">
                  Difficulty: {filters.difficulty}
                  <button
                    onClick={() => handleFilterChange({ difficulty: undefined })}
                    className="hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filters.search && (
                <Badge variant="secondary" className="gap-1">
                  Search: {filters.search}
                  <button
                    onClick={() => handleFilterChange({ search: undefined })}
                    className="hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({ page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' })}
                className="h-6 px-2 text-xs"
              >
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Questions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Questions ({pagination.total})</CardTitle>
              <CardDescription>
                Showing {questions.length} of {pagination.total} questions (Page {pagination.current} of {pagination.pages})
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Items per page:</span>
              <Select
                value={filters.limit.toString()}
                onValueChange={(value) => handleFilterChange({ limit: parseInt(value) })}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading questions...</p>
              </div>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No questions found matching your criteria.</p>
              <Button
                variant="outline"
                onClick={() => setFilters({ page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' })}
                className="mt-4"
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.map((question: Question) => (
                    <TableRow 
                      key={question._id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/dashboard/questions/${question._id}`)}
                    >
                      <TableCell className="max-w-xs">
                        <div className="truncate font-medium">{question.question}</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {question.subType?.replace('-', ' ') || 'N/A'}
                        </div>
                        {question.type === 'listening' && (question.audioUrl || question.audioFile) && (
                          <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                            <Volume2 className="h-3 w-3" />
                            Audio attached
                          </div>
                        )}
                        {question.createdBy && (
                          <div className="text-xs text-muted-foreground mt-1">
                            by {question.createdBy.firstName} {question.createdBy.lastName}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(question.type)}
                          <span className="capitalize">{question.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getDifficultyColor(question.difficulty)} variant="outline">
                          {question.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell>{question.points}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {question.tags.slice(0, 2).map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {question.tags.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{question.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/questions/${question._id}`);
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

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((pagination.current - 1) * filters.limit) + 1} to{' '}
                    {Math.min(pagination.current * filters.limit, pagination.total)} of{' '}
                    {pagination.total} results
                  </div>
                  
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => handlePageChange(pagination.current - 1)}
                          className={pagination.current <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {/* Page Numbers */}
                      {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                        let pageNum;
                        if (pagination.pages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.current <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.current >= pagination.pages - 2) {
                          pageNum = pagination.pages - 4 + i;
                        } else {
                          pageNum = pagination.current - 2 + i;
                        }
                        
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => handlePageChange(pageNum)}
                              isActive={pageNum === pagination.current}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}

                      {pagination.pages > 5 && pagination.current < pagination.pages - 2 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}

                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => handlePageChange(pagination.current + 1)}
                          className={pagination.current >= pagination.pages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}