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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Search, Edit2, Trash2, BookOpen, Volume2, PenTool, Zap, Sparkles, ChevronDown } from 'lucide-react';
import { authService } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Question {
  _id: string;
  type: 'reading' | 'listening' | 'writing';
  subType: string;
  question: string;
  passage?: string;
  options?: string[];
  correctAnswer?: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  createdAt: string;
  createdBy?: {
    firstName: string;
    lastName: string;
  };
}

const questionTypes = [
  { value: 'reading', label: 'Reading', icon: BookOpen },
  { value: 'listening', label: 'Listening', icon: Volume2 },
  { value: 'writing', label: 'Writing', icon: PenTool },
];



export default function QuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');


  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const data = await authService.apiRequest('/questions?page=1&limit=50');
      setQuestions(data.questions || []);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setLoading(false);
    }
  };



  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'all' || !selectedType || question.type === selectedType;
    return matchesSearch && matchesType;
  });

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
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
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
          </div>
        </CardContent>
      </Card>

      {/* Questions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Questions ({filteredQuestions.length})</CardTitle>
          <CardDescription>
            Manage your collection of IELTS questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading questions...</div>
          ) : (
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
                {filteredQuestions.map((question) => (
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
                        {question.tags.slice(0, 2).map((tag) => (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}