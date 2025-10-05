
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  HelpCircle,
  Save,
  Plus,
  Trash2,
  X,
  Eye,
  BookOpen,
  Volume2,
  PenTool,
  Upload,
  File,
  Image as ImageIcon,
  Music,
  FileText
} from 'lucide-react';
import { authService } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface NewQuestion {
  type: 'reading' | 'listening' | 'writing';
  subType: string;
  question: string;
  passage?: string;
  audioUrl?: string;
  options?: string[];
  correctAnswer?: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  instructions?: string;
  section?: string; // IELTS listening section (1-4)
  wordLimit?: number; // Writing word limit (150, 250, 400)
  instructionText?: string; // Detailed writing instructions
  blanksCount?: number; // Number of blanks for fill-blank
  audioTimestamp?: string; // For specific audio timing
  diagramImage?: string; // For diagram/map/plan labelling
  imageFile?: File; // Image file for Task 1
  audioFile?: File; // Audio file for listening
}

interface FileUpload {
  file: File;
  type: 'audio' | 'image' | 'document';
  url?: string;
  uploading: boolean;
  progress?: number;
}

export default function CreateQuestionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [questionData, setQuestionData] = useState<NewQuestion>({
    type: 'reading',
    subType: '',
    question: '',
    passage: '',
    audioUrl: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    points: 1,
    difficulty: 'medium',
    tags: [],
    instructions: '',
    section: '1',
    wordLimit: 150,
    instructionText: '',
    blanksCount: 1,
    audioTimestamp: '',
    diagramImage: ''
  });
  
  const [tagInput, setTagInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<FileUpload[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // Question type definitions
  const questionTypes = {
    reading: [
      'multiple-choice',
      'true-false-not-given',
      'matching-information',
      'matching-headings',
      'sentence-completion',
      'summary-completion',
      'short-answer',
      'diagram-labeling'
    ],
    listening: [
      'listening-multiple-choice',
      'form-completion',
      'note-completion', 
      'table-completion',
      'flowchart-completion',
      'sentence-completion',
      'summary-completion',
      'diagram-labelling',
      'map-labelling',
      'plan-labelling',
      'listening-matching',
      'listening-short-answer',
      'pick-from-list'
    ],
    writing: [
      // Core Writing Types
      'essay',                    // ✅ Free writing essay
      'task1',                   // ✅ IELTS Writing Task 1 (charts, graphs)
      'task2',                   // ✅ IELTS Writing Task 2 (opinion essay)
      'short-answer',            // ✅ Short answer questions
      'fill-blank',              // ✅ Fill in the blanks
      // Additional Types
      'multiple-choice',         // ✅ Grammar multiple choice
      'true-false',              // ✅ True/False grammar
      'matching'                 // ✅ Matching exercises
    ]
  };

  const handleInputChange = (field: keyof NewQuestion, value: any) => {
    setQuestionData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(questionData.options || ['', '', '', ''])];
    newOptions[index] = value;
    setQuestionData(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  const addOption = () => {
    const newOptions = [...(questionData.options || []), ''];
    setQuestionData(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  const removeOption = (index: number) => {
    if ((questionData.options?.length || 0) > 2) {
      const newOptions = questionData.options?.filter((_, i) => i !== index) || [];
      setQuestionData(prev => ({
        ...prev,
        options: newOptions
      }));
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !questionData.tags.includes(tagInput.trim())) {
      setQuestionData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setQuestionData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  // File upload functions
  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      const fileType = getFileType(file);
      if (!fileType) {
        setError(`File ${file.name} is not supported. Please upload audio, image, or document files.`);
        continue;
      }

      // Validate file type based on question type
      if (fileType === 'audio' && questionData.type !== 'listening') {
        setError(`Audio files can only be uploaded for listening questions. Current question type: ${questionData.type}`);
        continue;
      }

      // Different size limits based on file type
      const maxSize = fileType === 'audio' ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB for audio, 10MB for others
      if (file.size > maxSize) {
        const maxSizeText = fileType === 'audio' ? '50MB' : '10MB';
        setError(`File ${file.name} is too large. Maximum size for ${fileType} files is ${maxSizeText}.`);
        continue;
      }

      // Remove existing file of same type
      setUploadedFiles(prev => prev.filter(f => f.type !== fileType));

      // Create object URL for local preview
      const fileUrl = URL.createObjectURL(file);

      const fileUpload: FileUpload = {
        file,
        type: fileType,
        url: fileUrl,
        uploading: false
      };

      setUploadedFiles(prev => [...prev, fileUpload]);

      // Update question data based on file type for UI display
      if (fileType === 'audio') {
        setQuestionData(prev => ({ ...prev, audioUrl: fileUrl }));
      } else if (fileType === 'image') {
        setQuestionData(prev => ({ ...prev, diagramImage: fileUrl }));
      }

      console.log(`File ${file.name} prepared for upload with question submission`);
    }
  };

  const getFileType = (file: File): 'audio' | 'image' | 'document' | null => {
    const audioTypes = [
      'audio/mpeg',     // MP3
      'audio/mp3',      // MP3 alternative
      'audio/wav',      // WAV
      'audio/x-wav',    // WAV alternative
      'audio/mp4',      // M4A/MP4 audio
      'audio/m4a',      // M4A
      'audio/aac',      // AAC
      'audio/ogg',      // OGG
      'audio/webm',     // WebM audio
      'video/mp4',      // MP4 (often contains audio)
      'video/quicktime' // MOV files
    ];
    
    const imageTypes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'image/gif', 
      'image/webp',
      'image/svg+xml'
    ];
    
    const docTypes = [
      'application/pdf', 
      'text/plain', 
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    // Check by MIME type first
    if (audioTypes.includes(file.type.toLowerCase())) return 'audio';
    if (imageTypes.includes(file.type.toLowerCase())) return 'image';
    if (docTypes.includes(file.type.toLowerCase())) return 'document';
    
    // Fallback: Check by file extension if MIME type is not recognized
    const fileName = file.name.toLowerCase();
    const audioExtensions = ['.mp3', '.wav', '.m4a', '.mp4', '.aac', '.ogg', '.webm', '.mov'];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const docExtensions = ['.pdf', '.txt', '.doc', '.docx'];
    
    if (audioExtensions.some(ext => fileName.endsWith(ext))) return 'audio';
    if (imageExtensions.some(ext => fileName.endsWith(ext))) return 'image';
    if (docExtensions.some(ext => fileName.endsWith(ext))) return 'document';
    
    return null;
  };

  const removeUploadedFile = (fileToRemove: FileUpload) => {
    setUploadedFiles(prev => prev.filter(f => f !== fileToRemove));
    
    // Clear corresponding question data
    if (fileToRemove.type === 'audio') {
      setQuestionData(prev => ({ ...prev, audioUrl: '' }));
    } else if (fileToRemove.type === 'image') {
      setQuestionData(prev => ({ ...prev, diagramImage: '' }));
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleTypeChange = (value: string) => {
    const type = value as 'reading' | 'listening' | 'writing';
    
    // Clear files that are not compatible with the new question type
    if (type !== 'listening') {
      // Remove audio files if changing away from listening
      setUploadedFiles(prev => prev.filter(f => f.type !== 'audio'));
    }
    
    setQuestionData(prev => ({
      ...prev,
      type,
      subType: '',
      options: type === 'writing' ? [] : ['', '', '', ''],
      passage: type === 'reading' ? prev.passage : '',
      audioUrl: type === 'listening' ? prev.audioUrl : '',
      diagramImage: prev.diagramImage // Keep image files as they can be used for multiple types
    }));
  };

  const needsOptions = () => {
    return questionData.subType === 'multiple-choice' || 
           questionData.subType === 'listening-multiple-choice' ||
           questionData.subType === 'matching-information' ||
           questionData.subType === 'matching-headings' ||
           questionData.subType === 'listening-matching' ||
           questionData.subType === 'pick-from-list';
  };

  const needsPassage = () => {
    return questionData.type === 'reading';
  };

  const needsAudio = () => {
    return questionData.type === 'listening';
  };

  const isWritingTask = () => {
    return questionData.type === 'writing';
  };

  const isCompletionType = () => {
    const completionTypes = [
      'form-completion', 
      'note-completion', 
      'table-completion', 
      'flowchart-completion', 
      'sentence-completion', 
      'summary-completion'
    ];
    return completionTypes.includes(questionData.subType);
  };

  const isLabellingType = () => {
    const labellingTypes = [
      'diagram-labelling', 
      'map-labelling', 
      'plan-labelling'
    ];
    return labellingTypes.includes(questionData.subType);
  };

  const needsWordLimit = () => {
    return isCompletionType() || questionData.subType === 'listening-short-answer';
  };

  const isWritingType = () => {
    return questionData.type === 'writing';
  };

  const needsWritingFields = () => {
    return isWritingType() && ['essay', 'task1', 'task2'].includes(questionData.subType);
  };

  const needsImageUpload = () => {
    return questionData.type === 'writing' && questionData.subType === 'task1';
  };

  const needsAudioUpload = () => {
    return questionData.type === 'listening';
  };

  const needsDiagramImage = () => {
    return isLabellingType() || questionData.subType === 'diagram-labeling';
  };

  const validateForm = () => {
    if (!questionData.question.trim()) {
      setError('Question text is required');
      return false;
    }
    if (!questionData.subType) {
      setError('Question sub-type is required');
      return false;
    }
    if (needsOptions() && (!questionData.options || questionData.options.filter(opt => opt.trim()).length < 2)) {
      setError('At least 2 options are required for this question type');
      return false;
    }
    if (needsOptions() && !questionData.correctAnswer) {
      setError('Correct answer is required for this question type');
      return false;
    }
    if (needsPassage() && !questionData.passage?.trim()) {
      setError('Passage is required for reading questions');
      return false;
    }
    if (needsAudio() && !questionData.audioUrl?.trim()) {
      setError('Audio URL is required for listening questions');
      return false;
    }
    if (needsDiagramImage() && !questionData.diagramImage?.trim()) {
      setError('Diagram/Map/Plan image is required for labelling questions');
      return false;
    }
    if (needsWordLimit() && (!questionData.wordLimit || questionData.wordLimit < 1 || questionData.wordLimit > 5)) {
      setError('Word limit must be between 1 and 5 for completion questions');
      return false;
    }
    // Writing specific validation
    if (needsWritingFields()) {
      if (!questionData.wordLimit || questionData.wordLimit < 50) {
        setError('Word limit is required for writing tasks (minimum 50 words)');
        return false;
      }

    }
    if (questionData.type === 'writing' && questionData.subType === 'fill-blank' && (!questionData.blanksCount || questionData.blanksCount < 1)) {
      setError('Number of blanks is required for fill-blank questions');
      return false;
    }
    if (questionData.points < 1) {
      setError('Points must be at least 1');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Clean and filter data based on question type - only send core required fields
      const questionDataToSend: any = {
        type: questionData.type,
        subType: questionData.subType,
        question: questionData.question,
        points: questionData.points,
        difficulty: questionData.difficulty,
      };

      // Only add tags if they exist and are not empty
      if (questionData.tags && questionData.tags.length > 0) {
        questionDataToSend.tags = questionData.tags;
      }

      // Add type-specific fields
      if (questionData.type === 'reading' && questionData.passage?.trim()) {
        questionDataToSend.passage = questionData.passage.trim();
      }

      if (questionData.type === 'listening') {
        if (questionData.section?.trim()) {
          questionDataToSend.section = questionData.section.trim();
        }
        // Only add audioTimestamp if backend supports it
        // if (questionData.audioTimestamp?.trim()) {
        //   questionDataToSend.audioTimestamp = questionData.audioTimestamp.trim();
        // }
      }

      if (questionData.type === 'writing') {
        if (questionData.wordLimit && questionData.wordLimit > 0) {
          questionDataToSend.wordLimit = questionData.wordLimit;
        }

        if (questionData.instructionText?.trim()) {
          questionDataToSend.instructionText = questionData.instructionText.trim();
        }
        if (questionData.blanksCount && questionData.blanksCount > 0) {
          questionDataToSend.blanksCount = questionData.blanksCount;
        }
      }

      // Add options for multiple choice questions
      if (needsOptions() && questionData.options) {
        const filteredOptions = questionData.options.filter(opt => opt.trim());
        if (filteredOptions.length > 0) {
          questionDataToSend.options = filteredOptions;
        }
        if (questionData.correctAnswer?.trim()) {
          questionDataToSend.correctAnswer = questionData.correctAnswer.trim();
        }
      } else if (!needsOptions() && !isWritingTask() && questionData.correctAnswer?.trim()) {
        // For non-multiple choice questions (like completion, true/false)
        questionDataToSend.correctAnswer = questionData.correctAnswer.trim();
      }

      // Check if we have files to upload
      const audioFile = uploadedFiles.find(f => f.type === 'audio')?.file;
      const imageFile = uploadedFiles.find(f => f.type === 'image')?.file;

      // Validate file types based on question type
      if (audioFile && questionData.type !== 'listening') {
        setError('Audio files can only be uploaded for listening questions');
        return;
      }

      let response;

      if (audioFile || imageFile) {
        // Send as FormData if we have files
        const formData = new FormData();
        
        // Add each field individually instead of as JSON string
        Object.entries(questionDataToSend).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            // Handle arrays (like options, tags)
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        });
        
        // Add files if they exist
        if (audioFile) {
          formData.append('audioFile', audioFile);
        }
        if (imageFile) {
          formData.append('imageFile', imageFile);
        }

        console.log('Sending question with files:', {
          questionData: questionDataToSend,
          hasAudio: !!audioFile,
          hasImage: !!imageFile
        });

        // Log FormData contents for debugging
        const formDataEntries: any = {};
        formData.forEach((value, key) => {
          formDataEntries[key] = key === 'audioFile' || key === 'imageFile' ? '[File]' : value;
        });
        console.log('FormData contents:', formDataEntries);

        response = await fetch('http://localhost:8000/api/questions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authService.getToken()}`
          },
          body: formData
        });
      } else {
        // Send as JSON if no files
        console.log('Sending question data (no files):', JSON.stringify(questionDataToSend, null, 2));
        
        response = await fetch('http://localhost:8000/api/questions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authService.getToken()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(questionDataToSend)
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Question created successfully:', result);

      setSuccess('Question created successfully!');
      setTimeout(() => {
        router.push('/dashboard/questions');
      }, 1500);
    } catch (err) {
      setError('Failed to create question. Please try again.');
      console.error('Error creating question:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reading':
        return <BookOpen className="h-4 w-4" />;
      case 'listening':
        return <Volume2 className="h-4 w-4" />;
      case 'writing':
        return <PenTool className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  const getListeningTypeDescription = (subType: string) => {
    const descriptions: { [key: string]: string } = {
      'listening-multiple-choice': 'Multiple choice questions with audio',
      'form-completion': 'Fill in missing information in forms',
      'note-completion': 'Complete notes with key information',
      'table-completion': 'Fill in tables with missing data',
      'flowchart-completion': 'Complete flowcharts or process diagrams',
      'sentence-completion': 'Complete sentences with missing words',
      'summary-completion': 'Complete summary with key points',
      'diagram-labelling': 'Label parts of diagrams',
      'map-labelling': 'Label locations on maps',
      'plan-labelling': 'Label parts of building plans',
      'listening-matching': 'Match information from audio',
      'listening-short-answer': 'Provide short answers to questions',
      'pick-from-list': 'Choose answers from given options'
    };
    return descriptions[subType] || '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create New Question</h1>
            <p className="text-muted-foreground">Add a new question to your question bank</p>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription className="text-green-600">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Question Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Question Type */}
              <div className="space-y-2">
                <Label>Question Type</Label>
                <Tabs value={questionData.type} onValueChange={handleTypeChange}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="reading" className="flex items-center gap-2">
                      {getTypeIcon('reading')}
                      Reading
                    </TabsTrigger>
                    <TabsTrigger value="listening" className="flex items-center gap-2">
                      {getTypeIcon('listening')}
                      Listening
                    </TabsTrigger>
                    <TabsTrigger value="writing" className="flex items-center gap-2">
                      {getTypeIcon('writing')}
                      Writing
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Sub Type */}
              <div className="space-y-2">
                <Label htmlFor="subType">Sub Type</Label>
                <Select
                  value={questionData.subType}
                  onValueChange={(value) => handleInputChange('subType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sub type" />
                  </SelectTrigger>
                  <SelectContent>
                    {questionTypes[questionData.type].map((subType) => {
                      // Format display names for better readability
                      let displayName = subType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      
                      // Special formatting for listening questions
                      if (subType.startsWith('listening-')) {
                        displayName = displayName.replace('Listening ', '');
                      }
                      if (subType.includes('labelling')) {
                        displayName = displayName.replace('Labelling', 'Labeling');
                      }
                      
                      return (
                        <SelectItem key={subType} value={subType}>
                          {displayName}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {questionData.type === 'listening' && questionData.subType && (
                  <p className="text-xs text-muted-foreground">
                    {getListeningTypeDescription(questionData.subType)}
                  </p>
                )}
              </div>

              {/* Question Text */}
              <div className="space-y-2">
                <Label htmlFor="question">Question Text</Label>
                <Textarea
                  id="question"
                  placeholder="Enter the question text..."
                  value={questionData.question}
                  onChange={(e) => handleInputChange('question', e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              {/* Instructions */}
              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions (Optional)</Label>
                <Textarea
                  id="instructions"
                  placeholder="Special instructions for this question..."
                  value={questionData.instructions}
                  onChange={(e) => handleInputChange('instructions', e.target.value)}
                  rows={3}
                />
              </div>

              {/* Writing Specific Fields */}
              {isWritingType() && (
                <>
                  {/* Detailed Instructions for Writing */}
                  <div className="space-y-2">
                    <Label htmlFor="instructionText">Detailed Writing Instructions</Label>
                    <Textarea
                      id="instructionText"
                      placeholder="Provide detailed instructions for the writing task..."
                      value={questionData.instructionText}
                      onChange={(e) => handleInputChange('instructionText', e.target.value)}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      Detailed guidance for students about the writing task
                    </p>
                  </div>

                  {/* Writing Requirements */}
                  <div className="space-y-2">
                    <Label htmlFor="writingWordLimit">Word Limit</Label>
                    <Select 
                      value={questionData.wordLimit?.toString() || ''} 
                      onValueChange={(value) => handleInputChange('wordLimit', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select word limit..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="150">150 words (Task 1)</SelectItem>
                        <SelectItem value="250">250 words (Task 2)</SelectItem>
                        <SelectItem value="400">400 words (Extended Essay)</SelectItem>
                        <SelectItem value="50">50 words (Short Answer)</SelectItem>
                        <SelectItem value="100">100 words (Medium Answer)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Blanks Count for Fill-Blank */}
                  {questionData.subType === 'fill-blank' && (
                    <div className="space-y-2">
                      <Label htmlFor="blanksCount">Number of Blanks</Label>
                      <Input
                        id="blanksCount"
                        type="number"
                        min="1"
                        max="20"
                        value={questionData.blanksCount || ''}
                        onChange={(e) => handleInputChange('blanksCount', parseInt(e.target.value) || 1)}
                        placeholder="1"
                      />
                      <p className="text-xs text-muted-foreground">
                        Number of blanks students need to fill
                      </p>
                    </div>
                  )}

                  {/* Image Upload for Task 1 */}
                  {questionData.subType === 'task1' && (
                    <div className="space-y-2">
                      <Label>Upload Chart/Graph/Diagram (Task 1)</Label>
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleInputChange('imageFile', file);
                            }
                          }}
                          className="w-full"
                        />
                        <p className="text-sm text-muted-foreground mt-2">
                          Upload charts, graphs, diagrams, or maps for IELTS Task 1
                        </p>
                        {questionData.imageFile && (
                          <p className="text-sm text-green-600 mt-2">
                            ✓ {questionData.imageFile.name}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Passage for Reading */}
              {needsPassage() && (
                <div className="space-y-2">
                  <Label htmlFor="passage">Reading Passage</Label>
                  <Textarea
                    id="passage"
                    placeholder="Enter the reading passage..."
                    value={questionData.passage}
                    onChange={(e) => handleInputChange('passage', e.target.value)}
                    className="min-h-[200px]"
                  />
                </div>
              )}

              {/* Audio Upload/URL for Listening */}
              {needsAudioUpload() && (
                <div className="space-y-4">
                  <Label>Audio Content</Label>
                  
                  {/* Audio File Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="audioFile">Upload Audio File</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleInputChange('audioFile', file);
                            handleInputChange('audioUrl', ''); // Clear URL if file is selected
                          }
                        }}
                        className="w-full"
                      />
                      <p className="text-sm text-muted-foreground mt-2">
                        Upload MP3, WAV, or other audio files
                      </p>
                      {questionData.audioFile && (
                        <p className="text-sm text-green-600 mt-2">
                          ✓ {questionData.audioFile.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-center text-muted-foreground">
                    OR
                  </div>

                  {/* Audio URL */}
                  <div className="space-y-2">
                    <Label htmlFor="audioUrl">Audio URL</Label>
                    <Input
                      id="audioUrl"
                      placeholder="https://example.com/audio.mp3"
                      value={questionData.audioUrl}
                      onChange={(e) => {
                        handleInputChange('audioUrl', e.target.value);
                        if (e.target.value) {
                          handleInputChange('audioFile', undefined); // Clear file if URL is entered
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Direct link to audio file online
                    </p>
                  </div>
                </div>
              )}

              {/* Audio Timestamp for Listening */}
              {needsAudio() && (
                <div className="space-y-2">
                  <Label htmlFor="audioTimestamp">Audio Timestamp (Optional)</Label>
                  <Input
                    id="audioTimestamp"
                    placeholder="e.g., 02:15-02:45"
                    value={questionData.audioTimestamp}
                    onChange={(e) => handleInputChange('audioTimestamp', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Specific time range in the audio for this question
                  </p>
                </div>
              )}

              {/* Diagram/Map/Plan Image for Labelling */}
              {needsDiagramImage() && (
                <div className="space-y-2">
                  <Label htmlFor="diagramImage">Diagram/Map/Plan Image URL</Label>
                  <Input
                    id="diagramImage"
                    placeholder="https://example.com/diagram.jpg"
                    value={questionData.diagramImage}
                    onChange={(e) => handleInputChange('diagramImage', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Image showing the diagram, map, or plan to be labeled
                  </p>
                </div>
              )}

              {/* File Upload Area */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>File Uploads</Label>
                  <Badge variant="secondary" className="text-xs">
                    {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                {/* Drag & Drop Zone */}
                <div
                  className={`
                    border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
                    ${dragActive 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted-foreground/25 hover:border-primary/50'
                    }
                  `}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium mb-1">
                    Drop files here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Audio: MP3, WAV, M4A, MP4, AAC, OGG | Images: JPG, PNG, GIF, WebP | Docs: PDF, TXT, DOC
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum file size: Audio 50MB, Image/Document 10MB
                  </p>
                </div>

                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".mp3,.wav,.m4a,.mp4,.aac,.ogg,.webm,.mov,.jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.txt,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Uploaded Files</Label>
                    <div className="space-y-2">
                      {uploadedFiles.map((fileUpload, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
                        >
                          <div className="flex-shrink-0">
                            {fileUpload.type === 'audio' && <Music className="h-4 w-4 text-blue-500" />}
                            {fileUpload.type === 'image' && <ImageIcon className="h-4 w-4 text-green-500" />}
                            {fileUpload.type === 'document' && <FileText className="h-4 w-4 text-orange-500" />}
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <p className="text-sm font-medium truncate">{fileUpload.file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(fileUpload.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            {fileUpload.uploading && typeof fileUpload.progress === 'number' && (
                              <div className="space-y-1">
                                <Progress value={fileUpload.progress} className="h-1" />
                                <p className="text-xs text-muted-foreground">{fileUpload.progress}%</p>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {fileUpload.uploading ? (
                              <Badge variant="secondary" className="text-xs">Uploading...</Badge>
                            ) : fileUpload.url ? (
                              <Badge variant="default" className="text-xs">Uploaded</Badge>
                            ) : (
                              <Badge variant="destructive" className="text-xs">Failed</Badge>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeUploadedFile(fileUpload)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Options for Multiple Choice */}
              {needsOptions() && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Answer Options</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addOption}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Option
                    </Button>
                  </div>
                  {questionData.options?.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Label className="min-w-[20px] text-sm font-medium">
                        {String.fromCharCode(65 + index)}
                      </Label>
                      <Input
                        placeholder="Enter option text"
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                      />
                      {(questionData.options?.length || 0) > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Correct Answer */}
              {needsOptions() && (
                <div className="space-y-2">
                  <Label htmlFor="correctAnswer">Correct Answer</Label>
                  <Select
                    value={questionData.correctAnswer}
                    onValueChange={(value) => handleInputChange('correctAnswer', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select correct answer" />
                    </SelectTrigger>
                    <SelectContent>
                      {questionData.options?.map((option, index) => (
                        option.trim() && (
                          <SelectItem key={index} value={option}>
                            {String.fromCharCode(65 + index)}: {option}
                          </SelectItem>
                        )
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* For non-multiple choice questions */}
              {!needsOptions() && !isWritingTask() && (
                <div className="space-y-2">
                  <Label htmlFor="correctAnswer">Sample Answer / Keywords</Label>
                  <Input
                    id="correctAnswer"
                    placeholder="Enter sample answer or keywords"
                    value={questionData.correctAnswer}
                    onChange={(e) => handleInputChange('correctAnswer', e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Question Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="points">Points</Label>
                <Input
                  id="points"
                  type="number"
                  min="1"
                  value={questionData.points}
                  onChange={(e) => handleInputChange('points', parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select
                  value={questionData.difficulty}
                  onValueChange={(value) => handleInputChange('difficulty', value)}
                >
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

              {/* IELTS Listening Section */}
              {needsAudio() && (
                <div className="space-y-2">
                  <Label htmlFor="section">IELTS Section</Label>
                  <Select
                    value={questionData.section}
                    onValueChange={(value) => handleInputChange('section', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Section 1 (Social)</SelectItem>
                      <SelectItem value="2">Section 2 (General)</SelectItem>
                      <SelectItem value="3">Section 3 (Academic)</SelectItem>
                      <SelectItem value="4">Section 4 (Academic)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Word Limit for Completion Questions */}
              {needsWordLimit() && (
                <div className="space-y-2">
                  <Label htmlFor="wordLimit">Word Limit</Label>
                  <Input
                    id="wordLimit"
                    type="number"
                    min="1"
                    max="5"
                    value={questionData.wordLimit}
                    onChange={(e) => handleInputChange('wordLimit', parseInt(e.target.value) || 1)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum number of words for answers (1-5)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>Add tags to organize your questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <Button type="button" onClick={addTag} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {questionData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {questionData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* File Upload Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                File Upload Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-1">
                <p className="font-medium text-blue-600">🎵 Audio Files:</p>
                <p className="text-muted-foreground">For listening questions. Supported: MP3, WAV, OGG</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-green-600">🖼️ Image Files:</p>
                <p className="text-muted-foreground">For diagrams, maps, plans. Supported: JPG, PNG, GIF, WebP</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-orange-600">📄 Documents:</p>
                <p className="text-muted-foreground">For reference materials. Supported: PDF, TXT, DOC</p>
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground">
                • Maximum file size: 10MB<br />
                • Multiple files allowed<br />
                • Drag & drop supported
              </p>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full gap-2"
              >
                <Save className="h-4 w-4" />
                {loading ? 'Creating...' : 'Create Question'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="w-full"
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}