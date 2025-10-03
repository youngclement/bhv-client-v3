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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  BookOpen,
  Volume2,
  Clock,
  FileText,
  Users,
  CheckCircle2,
  X,
  Trash,
  Edit,
  PlusIcon
} from 'lucide-react';
import { authService } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface EmbeddedQuestion {
  _id?: string;
  number: number;
  type:
  | 'true-false-not-given'
  | 'multiple-choice'
  | 'matching-information'
  | 'matching-headings'
  | 'sentence-completion'
  | 'summary-completion'
  | 'short-answer';
  prompt?: string;
  options?: string[];
  points: number;
  paragraphRef?: string;
  correctAnswer?: string;
}

interface Section {
  _id?: string;
  name: string;
  instructions?: string;
  range: {
    start: number;
    end: number;
  };
  questions: EmbeddedQuestion[];
}

interface BankQuestion {
  _id: string;
  type: 'reading' | 'listening' | 'writing';
  subType: string;
  question: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  createdBy: { firstName: string; lastName: string };
}

interface Passage {
  _id: string;
  title: string;
  content: string;
  type: 'reading' | 'listening';
  audioUrl?: string;
  duration?: number;
  questions?: BankQuestion[];
  sections?: Section[];
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

const passageTypes = [
  { value: 'reading', label: 'Reading', icon: BookOpen },
  { value: 'listening', label: 'Listening', icon: Volume2 },
];

export default function PassagesPage() {
  const router = useRouter();
  const [passages, setPassages] = useState<Passage[]>([]);
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [questionSearchTerm, setQuestionSearchTerm] = useState('');
  const [selectedQuestionType, setSelectedQuestionType] = useState<string>('all');
  const [selectedQuestionDifficulty, setSelectedQuestionDifficulty] = useState<string>('all');

  const [newPassage, setNewPassage] = useState({
    title: '',
    content: '',
    type: 'reading' as 'reading' | 'listening',
    audioUrl: '',
    duration: 0,
    sections: [] as Section[],
  });

  useEffect(() => {
    fetchPassages();
  }, []);

  const fetchPassages = async () => {
    try {
      const data = await authService.apiRequest('/passages?page=1&limit=50');
      setPassages(data.passages || []);
    } catch (error) {
      console.error('Failed to fetch passages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    if (questions.length > 0) return; // Don't fetch if already loaded

    setQuestionsLoading(true);
    try {
      const data = await authService.apiRequest('/questions?page=1&limit=100');
      setQuestions(data.questions || []);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleCreatePassage = async () => {
    try {
      // Sanitize questions: only include options for types that need them and drop empties
      const sanitizeQuestion = (q: EmbeddedQuestion) => {
        const question: any = { ...q };
        if (q.type === 'multiple-choice' || q.type === 'matching-headings') {
          const trimmed = (q.options || []).map(o => (o || '').trim()).filter(o => o.length > 0);
          if (trimmed.length > 0) {
            question.options = q.type === 'multiple-choice' ? trimmed.slice(0, 4) : trimmed;
          } else {
            delete question.options;
          }
        } else {
          delete question.options;
        }
        return question;
      };

      const sanitizedSections = (newPassage.sections || []).map((s) => ({
        ...s,
        questions: (s.questions || []).map(sanitizeQuestion)
      }));

      const passageData = {
        title: newPassage.title,
        content: newPassage.content,
        type: newPassage.type,
        duration: newPassage.type === 'listening' ? newPassage.duration : undefined,
        audioUrl: newPassage.type === 'listening' ? newPassage.audioUrl : undefined,
        sections: sanitizedSections,
      } as any;

      await authService.apiRequest('/passages', {
        method: 'POST',
        body: JSON.stringify(passageData),
      });

      setIsCreateDialogOpen(false);
      fetchPassages();

      // Reset form
      setNewPassage({
        title: '',
        content: '',
        type: 'reading',
        audioUrl: '',
        duration: 0,
        sections: [],
      });
    } catch (error) {
      console.error('Failed to create passage:', error);
    }
  };

  const addSection = () => {
    const newSection: Section = {
      name: '',
      instructions: '',
      range: { start: 1, end: 5 },
      questions: []
    };
    setNewPassage({
      ...newPassage,
      sections: [...newPassage.sections, newSection]
    });
  };

  const removeSection = (index: number) => {
    setNewPassage({
      ...newPassage,
      sections: newPassage.sections.filter((_, i) => i !== index)
    });
  };

  const updateSection = (index: number, section: Section) => {
    const updatedSections = [...newPassage.sections];
    updatedSections[index] = section;
    setNewPassage({
      ...newPassage,
      sections: updatedSections
    });
  };

  const addQuestionToSection = (sectionIndex: number) => {
    const updatedSections = [...newPassage.sections];
    const section = updatedSections[sectionIndex];
    const existingNumbers = (section.questions || []).map(q => q.number || 0);
    const lastNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : (section.range?.start || 1) - 1;
    const nextNumber = lastNumber + 1;

    const newQuestion: EmbeddedQuestion = {
      number: nextNumber,
      type: 'multiple-choice',
      prompt: '',
      options: ['', '', '', ''],
      points: 1,
      correctAnswer: ''
    };

    section.questions.push(newQuestion);
    setNewPassage({
      ...newPassage,
      sections: updatedSections
    });
  };

  const removeQuestionFromSection = (sectionIndex: number, questionIndex: number) => {
    const updatedSections = [...newPassage.sections];
    const section = updatedSections[sectionIndex];
    section.questions.splice(questionIndex, 1);
    const startNumber = section.range?.start || 1;
    section.questions = section.questions.map((q, idx) => ({ ...q, number: startNumber + idx }));
    updatedSections[sectionIndex] = section;
    setNewPassage({
      ...newPassage,
      sections: updatedSections
    });
  };

  const updateQuestion = (sectionIndex: number, questionIndex: number, question: EmbeddedQuestion) => {
    const updatedSections = [...newPassage.sections];
    updatedSections[sectionIndex].questions[questionIndex] = question;
    setNewPassage({
      ...newPassage,
      sections: updatedSections
    });
  };

  const filteredPassages = passages.filter(passage => {
    const matchesSearch = passage.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      passage.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || passage.type === selectedType;
    return matchesSearch && matchesType;
  });

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.question.toLowerCase().includes(questionSearchTerm.toLowerCase()) ||
      question.tags.some((tag: string) => tag.toLowerCase().includes(questionSearchTerm.toLowerCase()));
    const matchesType = selectedQuestionType === 'all' || question.type === selectedQuestionType;
    const matchesDifficulty = selectedQuestionDifficulty === 'all' || question.difficulty === selectedQuestionDifficulty;
    const matchesPassageType = newPassage.type === 'reading' ?
      question.type === 'reading' :
      question.type === 'listening';
    return matchesSearch && matchesType && matchesDifficulty && matchesPassageType;
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
      default: return null;
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
          <h2 className="text-3xl font-bold tracking-tight">Passages</h2>
          <p className="text-muted-foreground">Manage reading and listening passages with associated questions</p>
        </div>

        <Button onClick={() => router.push('/dashboard/passages/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Passage
        </Button>
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
                placeholder="Search passages..."
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
        </CardContent>
      </Card>

      {/* Passages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Passages ({filteredPassages.length})</CardTitle>
          <CardDescription>
            Manage your collection of reading and listening passages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading passages...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Passage Details</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPassages?.map((passage) => (
                  <TableRow
                    key={passage._id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/dashboard/passages/${passage._id}`)}
                  >
                    <TableCell className="max-w-xs">
                      <div className="font-medium">{passage.title}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {passage.content.substring(0, 100)}...
                      </div>
                      {passage.createdBy && (
                        <div className="text-xs text-muted-foreground mt-1">
                          by {passage.createdBy.firstName} {passage.createdBy.lastName}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(passage.type)}
                        <span className="capitalize">{passage.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {formatDuration(passage.duration || 0)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {passage.sections?.reduce((acc, section) => acc + section.questions.length, 0) || passage.questions?.length || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(passage.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/passages/${passage._id}`);
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