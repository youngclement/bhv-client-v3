/**
 * Import Reading Passage Script
 * 
 * This script imports the complete reading test from reading-passage-complete.json
 * into the system by creating questions and a test through the API.
 * 
 * Usage: node import-reading-passage.js [email] [password]
 * Example: node import-reading-passage.js teacher@example.com password123
 */

const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
let AUTH_TOKEN = '';

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  if (AUTH_TOKEN) {
    defaultHeaders['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`❌ Request failed for ${endpoint}:`, error.message);
    throw error;
  }
}

// Login function
async function login(email, password) {
  console.log('🔐 Logging in...');
  
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  AUTH_TOKEN = response.token;
  console.log('✅ Login successful!');
  return response;
}

// Create a single question
async function createQuestion(questionData) {
  try {
    const response = await apiRequest('/questions', {
      method: 'POST',
      body: JSON.stringify(questionData),
    });
    return response;
  } catch (error) {
    console.error(`❌ Failed to create question ${questionData.questionNumber}:`, error.message);
    throw error;
  }
}

// Create test with questions
async function createTest(testData, questionIds) {
  try {
    const response = await apiRequest('/tests', {
      method: 'POST',
      body: JSON.stringify({
        title: testData.title,
        description: testData.description,
        type: testData.type,
        duration: testData.duration,
        questions: questionIds,
        passages: [],
        isActive: true,
      }),
    });
    return response;
  } catch (error) {
    console.error('❌ Failed to create test:', error.message);
    throw error;
  }
}

// Map options array to A, B, C, D format
function getOptionLetter(index) {
  return String.fromCharCode(65 + index); // 65 is 'A' in ASCII
}

// Convert question data to API format
function convertQuestionToApiFormat(question, sectionTitle) {
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

// Main import function
async function importReadingPassage() {
  try {
    console.log('\n📚 Starting Reading Passage Import...\n');

    // Read the JSON file
    const jsonPath = path.join(__dirname, 'reading-passage-complete.json');
    const passageData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    console.log(`📖 Title: ${passageData.title}`);
    console.log(`📊 Total Questions: ${passageData.sections.reduce((sum, s) => sum + s.questions.length, 0)}`);
    console.log(`⏱️  Duration: ${passageData.duration} minutes\n`);

    // Login
    const args = process.argv.slice(2);
    const email = args[0] || 'teacher@bhv.com';
    const password = args[1] || 'password123';

    await login(email, password);

    // Create all questions
    console.log('\n📝 Creating questions...\n');
    const createdQuestionIds = [];
    let questionCount = 0;

    for (const section of passageData.sections) {
      console.log(`\n📂 Section ${section.sectionNumber}: ${section.title}`);
      console.log(`   ${section.description}`);
      console.log(`   Questions: ${section.questions.length}\n`);

      for (const question of section.questions) {
        questionCount++;
        process.stdout.write(`   Creating question ${questionCount}... `);

        const apiQuestion = convertQuestionToApiFormat(question, section.title);
        
        try {
          const created = await createQuestion(apiQuestion);
          createdQuestionIds.push(created._id);
          console.log(`✅ Q${question.questionNumber} created (ID: ${created._id})`);
        } catch (error) {
          console.log(`❌ Failed`);
          // Continue with next question even if one fails
        }

        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`\n✅ Successfully created ${createdQuestionIds.length} out of ${questionCount} questions\n`);

    // Create the test
    if (createdQuestionIds.length > 0) {
      console.log('🧪 Creating test...');
      
      const test = await createTest(passageData, createdQuestionIds);
      
      console.log('\n✅ Test created successfully!');
      console.log(`   Test ID: ${test._id}`);
      console.log(`   Title: ${test.title}`);
      console.log(`   Questions: ${test.questions.length}`);
      console.log(`   Total Points: ${test.totalPoints}`);
      console.log(`\n🎉 Import completed successfully!\n`);
      
      return test;
    } else {
      console.log('\n❌ No questions were created, test creation skipped.\n');
    }

  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    process.exit(1);
  }
}

// Run the import
if (require.main === module) {
  importReadingPassage()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { importReadingPassage };
