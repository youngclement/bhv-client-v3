'use client';

import { useState, useEffect } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  File,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Music,
  Image,
  FileText,
  Zap,
  Clock
} from 'lucide-react';
import { authService } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface Template {
  id: string;
  name: string;
  type: 'listening-section' | 'completion-set' | 'multiple-choice-set' | 'labelling-set';
  description: string;
  questionCount: number;
  suggestedSection: string;
  questionTypes: string[];
  requiresAudio: boolean;
  requiresImage: boolean;
}

interface TemplateQuestion {
  subType: string;
  question: string;
  correctAnswer: string | string[];
  options?: string[];
  points: number;
  blanksCount?: number;
  wordLimit?: number;
}

export default function TemplatesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [availableTemplates, setAvailableTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateQuestions, setTemplateQuestions] = useState<TemplateQuestion[]>([]);
  
  // Template customization data
  const [baseData, setBaseData] = useState({
    section: '1',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    tags: [] as string[],
    audioUrl: '',
    imageUrl: '',
    instructionText: ''
  });
  
  const [tagInput, setTagInput] = useState('');

  // Load available templates
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const response = await fetch(`http://localhost:8000/api/batch-questions/templates`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load templates');
      }

      const result = await response.json();
      setAvailableTemplates(result.templates || []);
    } catch (err) {
      console.error('Error loading templates:', err);
      // Fallback to mock templates if API fails
      setAvailableTemplates(getMockTemplates());
    } finally {
      setTemplatesLoading(false);
    }
  };

  const getMockTemplates = (): Template[] => [
    {
      id: 'listening-section-1',
      name: 'IELTS Listening Section 1',
      type: 'listening-section',
      description: 'Complete Section 1 template with form completion and multiple choice questions',
      questionCount: 10,
      suggestedSection: '1',
      questionTypes: ['form-completion', 'listening-multiple-choice', 'table-completion'],
      requiresAudio: true,
      requiresImage: false
    },
    {
      id: 'completion-set',
      name: 'Completion Questions Set',
      type: 'completion-set',
      description: 'Various completion-type questions: form, note, table, sentence',
      questionCount: 8,
      suggestedSection: '1-2',
      questionTypes: ['form-completion', 'note-completion', 'table-completion', 'sentence-completion'],
      requiresAudio: true,
      requiresImage: false
    },
    {
      id: 'multiple-choice-set',
      name: 'Multiple Choice Set',
      type: 'multiple-choice-set',
      description: 'Collection of multiple choice and matching questions',
      questionCount: 6,
      suggestedSection: '2-3',
      questionTypes: ['listening-multiple-choice', 'listening-matching', 'pick-from-list'],
      requiresAudio: true,
      requiresImage: false
    },
    {
      id: 'labelling-set',
      name: 'Labelling Questions Set',
      type: 'labelling-set',
      description: 'Diagram, map, and plan labelling questions',
      questionCount: 5,
      suggestedSection: '2-4',
      questionTypes: ['diagram-labelling', 'map-labelling', 'plan-labelling'],
      requiresAudio: true,
      requiresImage: true
    }
  ];

  const selectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setBaseData(prev => ({
      ...prev,
      section: template.suggestedSection.includes('-') 
        ? template.suggestedSection.split('-')[0] 
        : template.suggestedSection
    }));
    
    // Generate template questions based on template type
    setTemplateQuestions(generateTemplateQuestions(template));
  };

  const generateTemplateQuestions = (template: Template): TemplateQuestion[] => {
    const questions: TemplateQuestion[] = [];

    switch (template.type) {
      case 'listening-section':
        // Section 1 typical structure
        questions.push(
          // Form completion (Questions 1-4)
          {
            subType: 'form-completion',
            question: 'Complete the booking form below. Write NO MORE THAN TWO WORDS for each answer.',
            correctAnswer: ['Wilson', 'deluxe', '£89', 'Friday'],
            points: 4,
            blanksCount: 4,
            wordLimit: 2
          },
          // Multiple choice (Questions 5-7)
          {
            subType: 'listening-multiple-choice',
            question: 'What type of room does the customer want?',
            options: ['Single room', 'Double room', 'Twin room', 'Family room'],
            correctAnswer: 'Double room',
            points: 1
          },
          {
            subType: 'listening-multiple-choice',
            question: 'When does the customer want to check in?',
            options: ['Thursday evening', 'Friday morning', 'Friday evening', 'Saturday morning'],
            correctAnswer: 'Friday evening',
            points: 1
          },
          // Table completion (Questions 8-10)
          {
            subType: 'table-completion',
            question: 'Complete the table below. Write NO MORE THAN ONE WORD for each answer.',
            correctAnswer: ['breakfast', 'pool', 'gym'],
            points: 3,
            blanksCount: 3,
            wordLimit: 1
          }
        );
        break;

      case 'completion-set':
        questions.push(
          {
            subType: 'form-completion',
            question: 'Complete the application form.',
            correctAnswer: ['', ''],
            points: 2,
            blanksCount: 2,
            wordLimit: 2
          },
          {
            subType: 'note-completion',
            question: 'Complete the notes below.',
            correctAnswer: ['', ''],
            points: 2,
            blanksCount: 2,
            wordLimit: 3
          }
        );
        break;

      case 'multiple-choice-set':
        questions.push(
          {
            subType: 'listening-multiple-choice',
            question: 'Sample multiple choice question',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 'Option A',
            points: 1
          }
        );
        break;

      case 'labelling-set':
        questions.push(
          {
            subType: 'diagram-labelling',
            question: 'Label the diagram below.',
            correctAnswer: ['', ''],
            points: 2,
            blanksCount: 2,
            wordLimit: 2
          }
        );
        break;
    }

    return questions;
  };

  const updateTemplateQuestion = (index: number, field: keyof TemplateQuestion, value: any) => {
    setTemplateQuestions(prev =>
      prev.map((q, i) => i === index ? { ...q, [field]: value } : q)
    );
  };

  const addTag = () => {
    if (tagInput.trim() && !baseData.tags.includes(tagInput.trim())) {
      setBaseData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setBaseData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleSubmit = async () => {
    if (!selectedTemplate) {
      setError('Please select a template');
      return;
    }

    if (selectedTemplate.requiresAudio && !baseData.audioUrl.trim()) {
      setError('Audio URL is required for this template');
      return;
    }

    if (selectedTemplate.requiresImage && !baseData.imageUrl.trim()) {
      setError('Image URL is required for this template');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const templateData = {
        templateType: selectedTemplate.type,
        baseData,
        questions: templateQuestions
      };

      const response = await fetch(`http://localhost:8000/api/batch-questions/template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify(templateData)
      });

      if (!response.ok) {
        throw new Error('Template creation failed');
      }

      const result = await response.json();
      setSuccess(`Created ${result.results.created} questions successfully using template!`);
      
      setTimeout(() => {
        router.push('/dashboard/questions');
      }, 2000);

    } catch (err) {
      setError('Failed to create questions from template. Please try again.');
      console.error('Template creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'listening-section':
        return <Music className="h-5 w-5 text-blue-500" />;
      case 'completion-set':
        return <FileText className="h-5 w-5 text-green-500" />;
      case 'multiple-choice-set':
        return <CheckCircle className="h-5 w-5 text-purple-500" />;
      case 'labelling-set':
        return <Image className="h-5 w-5 text-orange-500" />;
      default:
        return <File className="h-5 w-5" />;
    }
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
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              IELTS Templates
            </h1>
            <p className="text-muted-foreground">Create questions using standardized IELTS templates</p>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-green-600">{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Select Template</TabsTrigger>
          <TabsTrigger value="customize" disabled={!selectedTemplate}>
            Customize Template
          </TabsTrigger>
          <TabsTrigger value="questions" disabled={!selectedTemplate}>
            Review Questions
          </TabsTrigger>
        </TabsList>

        {/* Templates Selection */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Templates</CardTitle>
              <CardDescription>
                Choose from standardized IELTS listening question templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Clock className="h-6 w-6 animate-spin mr-2" />
                  Loading templates...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedTemplate?.id === template.id
                          ? 'ring-2 ring-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => selectTemplate(template)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(template.type)}
                            <CardTitle className="text-base">{template.name}</CardTitle>
                          </div>
                          {selectedTemplate?.id === template.id && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <CardDescription className="text-sm">
                          {template.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span>Questions: <strong>{template.questionCount}</strong></span>
                          <span>Section: <strong>{template.suggestedSection}</strong></span>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">Question Types:</p>
                          <div className="flex flex-wrap gap-1">
                            {template.questionTypes.map((type) => (
                              <Badge key={type} variant="secondary" className="text-xs">
                                {type.replace(/-/g, ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Music className={`h-3 w-3 ${template.requiresAudio ? 'text-blue-500' : 'text-muted-foreground'}`} />
                            <span>Audio {template.requiresAudio ? 'required' : 'optional'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Image className={`h-3 w-3 ${template.requiresImage ? 'text-green-500' : 'text-muted-foreground'}`} />
                            <span>Image {template.requiresImage ? 'required' : 'optional'}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customize Template */}
        <TabsContent value="customize" className="space-y-6">
          {selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getTypeIcon(selectedTemplate.type)}
                  Customize {selectedTemplate.name}
                </CardTitle>
                <CardDescription>
                  Configure the basic settings for this template
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>IELTS Section</Label>
                    <Select 
                      value={baseData.section}
                      onValueChange={(value) => setBaseData(prev => ({ ...prev, section: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Section 1 - Social & Daily Life</SelectItem>
                        <SelectItem value="2">Section 2 - Social & Educational</SelectItem>
                        <SelectItem value="3">Section 3 - Academic Discussion</SelectItem>
                        <SelectItem value="4">Section 4 - Academic Lecture</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Difficulty Level</Label>
                    <Select 
                      value={baseData.difficulty}
                      onValueChange={(value) => setBaseData(prev => ({ ...prev, difficulty: value as any }))}
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
                </div>

                {selectedTemplate.requiresAudio && (
                  <div className="space-y-2">
                    <Label>Audio URL *</Label>
                    <Input
                      placeholder="https://example.com/audio.mp3"
                      value={baseData.audioUrl}
                      onChange={(e) => setBaseData(prev => ({ ...prev, audioUrl: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Audio file that will be used by all questions in this template
                    </p>
                  </div>
                )}

                {selectedTemplate.requiresImage && (
                  <div className="space-y-2">
                    <Label>Image URL *</Label>
                    <Input
                      placeholder="https://example.com/diagram.jpg"
                      value={baseData.imageUrl}
                      onChange={(e) => setBaseData(prev => ({ ...prev, imageUrl: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Image file for labelling questions (diagram, map, or plan)
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Instruction Text</Label>
                  <Textarea
                    placeholder="General instructions for this set of questions..."
                    value={baseData.instructionText}
                    onChange={(e) => setBaseData(prev => ({ ...prev, instructionText: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add tag"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    />
                    <Button type="button" onClick={addTag} size="sm">
                      Add
                    </Button>
                  </div>
                  {baseData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {baseData.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Review Questions */}
        <TabsContent value="questions" className="space-y-6">
          {selectedTemplate && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Template Questions Preview</CardTitle>
                  <CardDescription>
                    Review and customize the questions that will be created
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {templateQuestions.map((question, index) => (
                    <Card key={index} className="bg-muted/30">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          Question {index + 1} - {question.subType.replace(/-/g, ' ')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <Label>Question Text</Label>
                          <Textarea
                            value={question.question}
                            onChange={(e) => updateTemplateQuestion(index, 'question', e.target.value)}
                            rows={2}
                          />
                        </div>

                        {question.options && (
                          <div className="space-y-2">
                            <Label>Options</Label>
                            {question.options.map((option, optIndex) => (
                              <Input
                                key={optIndex}
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...question.options!];
                                  newOptions[optIndex] = e.target.value;
                                  updateTemplateQuestion(index, 'options', newOptions);
                                }}
                                placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                              />
                            ))}
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Points</Label>
                            <Input
                              type="number"
                              min="1"
                              value={question.points}
                              onChange={(e) => updateTemplateQuestion(index, 'points', parseInt(e.target.value) || 1)}
                            />
                          </div>

                          {question.blanksCount && (
                            <div className="space-y-2">
                              <Label>Blanks</Label>
                              <Input
                                type="number"
                                min="1"
                                value={question.blanksCount}
                                onChange={(e) => updateTemplateQuestion(index, 'blanksCount', parseInt(e.target.value) || 1)}
                              />
                            </div>
                          )}

                          {question.wordLimit && (
                            <div className="space-y-2">
                              <Label>Word Limit</Label>
                              <Input
                                type="number"
                                min="1"
                                max="5"
                                value={question.wordLimit}
                                onChange={(e) => updateTemplateQuestion(index, 'wordLimit', parseInt(e.target.value) || 2)}
                              />
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Correct Answer</Label>
                          <Input
                            value={Array.isArray(question.correctAnswer) 
                              ? question.correctAnswer.join(', ') 
                              : question.correctAnswer
                            }
                            onChange={(e) => {
                              const value = e.target.value;
                              updateTemplateQuestion(
                                index, 
                                'correctAnswer',
                                question.blanksCount && question.blanksCount > 1
                                  ? value.split(',').map(s => s.trim()).filter(Boolean)
                                  : value
                              );
                            }}
                            placeholder={
                              question.blanksCount && question.blanksCount > 1
                                ? "Enter answers separated by commas"
                                : "Enter the correct answer"
                            }
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Create {templateQuestions.length} questions using template</h4>
                      <p className="text-sm text-muted-foreground">
                        Questions will be created with shared settings and files
                      </p>
                    </div>
                    <Button 
                      onClick={handleSubmit}
                      disabled={loading}
                      className="gap-2"
                      size="lg"
                    >
                      <Zap className="h-4 w-4" />
                      {loading ? 'Creating...' : 'Create from Template'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}