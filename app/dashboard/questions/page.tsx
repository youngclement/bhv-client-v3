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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Search, Edit2, Trash2, BookOpen, Volume2, PenTool } from 'lucide-react';
import { authService } from '@/lib/auth';
import { useRouter } from 'next/navigation';

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

const subTypes = {
  reading: ['multiple-choice', 'fill-blank', 'true-false', 'matching'],
  listening: ['multiple-choice', 'fill-blank', 'short-answer'],
  writing: ['task1', 'task2'],
};

export default function QuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    type: 'reading' as 'reading' | 'listening' | 'writing',
    subType: '',
    question: '',
    passage: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    points: 1,
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    tags: '',
  });

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

  const handleCreateQuestion = async () => {
    try {
      const questionData = {
        ...newQuestion,
        tags: newQuestion.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        options: newQuestion.type === 'reading' ? newQuestion.options : undefined,
      };

      await authService.apiRequest('/questions', {
        method: 'POST',
        body: JSON.stringify(questionData),
      });

      setIsCreateDialogOpen(false);
      fetchQuestions();
      
      // Reset form
      setNewQuestion({
        type: 'reading',
        subType: '',
        question: '',
        passage: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        points: 1,
        difficulty: 'medium',
        tags: '',
      });
    } catch (error) {
      console.error('Failed to create question:', error);
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
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Question</DialogTitle>
              <DialogDescription>Add a new question to your question bank</DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Question Type</Label>
                  <Select value={newQuestion.type} onValueChange={(value: any) => setNewQuestion({...newQuestion, type: value, subType: ''})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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
                
                <div className="space-y-2">
                  <Label htmlFor="subType">Sub Type</Label>
                  <Select value={newQuestion.subType} onValueChange={(value) => setNewQuestion({...newQuestion, subType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sub type" />
                    </SelectTrigger>
                    <SelectContent>
                      {subTypes[newQuestion.type].map(subType => (
                        <SelectItem key={subType} value={subType}>
                          {subType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {newQuestion.type === 'reading' && (
                <div className="space-y-2">
                  <Label htmlFor="passage">Passage</Label>
                  <Textarea
                    placeholder="Enter the reading passage..."
                    value={newQuestion.passage}
                    onChange={(e) => setNewQuestion({...newQuestion, passage: e.target.value})}
                    rows={4}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="question">Question</Label>
                <Textarea
                  placeholder="Enter your question..."
                  value={newQuestion.question}
                  onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})}
                  rows={3}
                />
              </div>

              {newQuestion.type === 'reading' && newQuestion.subType === 'multiple-choice' && (
                <div className="space-y-2">
                  <Label>Options</Label>
                  {newQuestion.options.map((option, index) => (
                    <Input
                      key={index}
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...newQuestion.options];
                        newOptions[index] = e.target.value;
                        setNewQuestion({...newQuestion, options: newOptions});
                      }}
                    />
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="correctAnswer">Correct Answer</Label>
                <Input
                  placeholder="Enter the correct answer..."
                  value={newQuestion.correctAnswer}
                  onChange={(e) => setNewQuestion({...newQuestion, correctAnswer: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="points">Points</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newQuestion.points}
                    onChange={(e) => setNewQuestion({...newQuestion, points: parseInt(e.target.value)})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={newQuestion.difficulty} onValueChange={(value: any) => setNewQuestion({...newQuestion, difficulty: value})}>
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
                
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    placeholder="comma, separated, tags"
                    value={newQuestion.tags}
                    onChange={(e) => setNewQuestion({...newQuestion, tags: e.target.value})}
                  />
                </div>
              </div>
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateQuestion}>Create Question</Button>
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