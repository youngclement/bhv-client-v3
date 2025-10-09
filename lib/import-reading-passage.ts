/**
 * Import Reading Passage Script - TypeScript Version
 * For use in Next.js environment
 */

import passageData from '../reading-passage-complete.json';

interface Question {
  questionNumber: number;
  question: string;
  passage?: string;
  options: string[];
  correctAnswer: string;
  points: number;
  difficulty: string;
  tags: string[];
  subType?: string;
}

interface Section {
  sectionNumber: number;
  title: string;
  description: string;
  points: number;
  questions: Question[];
}

interface PassageData {
  title: string;
  description: string;
  type: string;
  duration: number;
  totalPoints: number;
  sections: Section[];
}

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Helper to get option letter (A, B, C, D)
function getOptionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

// Convert question to API format
function convertQuestionToApiFormat(question: Question, sectionTitle: string) {
  const optionIndex = question.options.findIndex(opt => opt === question.correctAnswer);
  const correctAnswerLetter = getOptionLetter(optionIndex);

  return {
    type: 'reading',
    subType: question.subType || 'multiple-choice',
    question: question.question,
    passage: question.passage || '',
    options: question.options,
    correctAnswer: correctAnswerLetter,
    points: question.points,
    difficulty: question.difficulty,
    tags: question.tags || [],
    instructionText: sectionTitle,
  };
}

// Main import function using authService
export async function importReadingPassageWithAuth(authService: any) {
  const results = {
    totalQuestions: 0,
    createdQuestions: 0,
    failedQuestions: 0,
    questionIds: [] as string[],
    testId: null as string | null,
    errors: [] as string[],
  };

  try {
    console.log('📚 Starting Reading Passage Import...');
    console.log(`📖 Title: ${passageData.title}`);

    // Calculate total questions
    results.totalQuestions = passageData.sections.reduce(
      (sum: number, s: Section) => sum + s.questions.length,
      0
    );

    console.log(`📊 Total Questions: ${results.totalQuestions}`);

    // Create all questions
    for (const section of passageData.sections) {
      console.log(`\n📂 Section ${section.sectionNumber}: ${section.title}`);

      for (const question of section.questions) {
        try {
          const apiQuestion = convertQuestionToApiFormat(question, section.title);

          const created = await authService.apiRequest('/questions', {
            method: 'POST',
            body: JSON.stringify(apiQuestion),
          });

          results.questionIds.push(created._id);
          results.createdQuestions++;
          console.log(`✅ Q${question.questionNumber} created`);

          // Small delay to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error: any) {
          results.failedQuestions++;
          results.errors.push(`Q${question.questionNumber}: ${error.message}`);
          console.error(`❌ Q${question.questionNumber} failed:`, error.message);
        }
      }
    }

    // Create the test if we have questions
    if (results.questionIds.length > 0) {
      console.log('\n🧪 Creating test...');

      const test = await authService.apiRequest('/tests', {
        method: 'POST',
        body: JSON.stringify({
          title: passageData.title,
          description: passageData.description,
          type: passageData.type,
          duration: passageData.duration,
          questions: results.questionIds,
          passages: [],
          isActive: true,
        }),
      });

      results.testId = test._id;
      console.log('✅ Test created successfully!');
      console.log(`   Test ID: ${test._id}`);
    }

    return results;
  } catch (error: any) {
    console.error('❌ Import failed:', error.message);
    throw error;
  }
}

// Browser-based import function
export async function importReadingPassageBrowser(token: string) {
  const results = {
    totalQuestions: 0,
    createdQuestions: 0,
    failedQuestions: 0,
    questionIds: [] as string[],
    testId: null as string | null,
    errors: [] as string[],
  };

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  try {
    // Calculate total questions
    results.totalQuestions = passageData.sections.reduce(
      (sum: number, s: Section) => sum + s.questions.length,
      0
    );

    // Create all questions
    for (const section of passageData.sections) {
      for (const question of section.questions) {
        try {
          const apiQuestion = convertQuestionToApiFormat(question, section.title);

          const response = await fetch(`${API_BASE_URL}/questions`, {
            method: 'POST',
            headers,
            body: JSON.stringify(apiQuestion),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const created = await response.json();
          results.questionIds.push(created._id);
          results.createdQuestions++;

          // Small delay
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error: any) {
          results.failedQuestions++;
          results.errors.push(`Q${question.questionNumber}: ${error.message}`);
        }
      }
    }

    // Create the test
    if (results.questionIds.length > 0) {
      const response = await fetch(`${API_BASE_URL}/tests`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: passageData.title,
          description: passageData.description,
          type: passageData.type,
          duration: passageData.duration,
          questions: results.questionIds,
          passages: [],
          isActive: true,
        }),
      });

      if (response.ok) {
        const test = await response.json();
        results.testId = test._id;
      }
    }

    return results;
  } catch (error: any) {
    console.error('❌ Import failed:', error);
    throw error;
  }
}
