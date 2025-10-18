'use client';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'teacher' | 'student';
}

interface AuthResponse {
  token: string;
  user: User;
}

class AuthService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  private tokenKey = 'auth_token';

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.tokenKey);
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    this.setToken(data.token);
    return data;
  }

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'teacher' | 'student';
  }): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error('Registration failed');
    }

    const data = await response.json();
    this.setToken(data.token);
    return data;
  }

  async getProfile(): Promise<User> {
    const response = await this.authenticatedRequest('/users/profile');
    return response.json();
  }

  logout(): void {
    this.removeToken();
  }

  private async authenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    const headers: Record<string, string> = {
      ...options.headers as Record<string, string>,
      'Authorization': `Bearer ${token}`,
    };

    // Only set Content-Type for non-FormData requests
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    return fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });
  }

  async apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const response = await this.authenticatedRequest(endpoint, options);
    
    if (!response.ok) {
      let errorMessage = `API request failed: ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('API Error Details:', errorData);
        errorMessage += ` - ${errorData.message || errorData.error || 'Unknown error'}`;
      } catch (e) {
        console.error('Failed to parse error response');
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Submission-specific API methods
  async getMyAssignments(): Promise<any> {
    try {
      return this.apiRequest('/assignments/my-assignments');
    } catch (error) {
      // Fallback to regular assignments if my-assignments doesn't exist
      console.warn('my-assignments endpoint not available, using fallback');
      return this.apiRequest('/assignments?page=1&limit=100');
    }
  }

  // Backend API: POST /api/submissions/:testId/start
  async startSubmission(testId: string, assignmentId?: string): Promise<any> {
    const body: any = {};
    if (assignmentId) {
      body.assignmentId = assignmentId;
    }
    return this.apiRequest(`/submissions/start/${testId}`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  // Backend API: PUT /api/submissions/:submissionId/answer
  async saveAnswer(submissionId: string, questionId: string, answer: any): Promise<any> {
    return this.apiRequest(`/submissions/answer/${submissionId}`, {
      method: 'PUT',
      body: JSON.stringify({ questionId, answer })
    });
  }

  // Backend API: POST /api/submissions/:submissionId/submit
  async submitTest(submissionId: string): Promise<any> {
    return this.apiRequest(`/submissions/${submissionId}/submit`, {
      method: 'POST'
    });
  }

  async getSubmissionResults(submissionId: string): Promise<any> {
    return this.apiRequest(`/submissions/${submissionId}`);
  }

  // Student Management API methods
  async createStudent(studentData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<any> {
    return this.apiRequest('/users/students', {
      method: 'POST',
      body: JSON.stringify(studentData)
    });
  }

  async getStudent(studentId: string): Promise<any> {
    return this.apiRequest(`/users/students/${studentId}`);
  }

  async updateStudent(studentId: string, updateData: {
    firstName?: string;
    lastName?: string;
    email?: string;
  }): Promise<any> {
    return this.apiRequest(`/users/students/${studentId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  }

  async deleteStudent(studentId: string): Promise<any> {
    return this.apiRequest(`/users/students/${studentId}`, {
      method: 'DELETE'
    });
  }

  async getStudents(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const queryString = queryParams.toString();
    return this.apiRequest(`/users/students${queryString ? `?${queryString}` : ''}`);
  }

  // Get detailed student statistics
  async getStudentStatistics(studentId: string): Promise<any> {
    return this.apiRequest(`/users/students/${studentId}/statistics`);
  }

  // Submissions API methods
  async getSubmissions(params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    
    const queryString = queryParams.toString();
    return this.apiRequest(`/submissions${queryString ? `?${queryString}` : ''}`);
  }

  async getSubmission(submissionId: string): Promise<any> {
    return this.apiRequest(`/submissions/${submissionId}`);
  }

  // Get detailed submission with question-by-question breakdown
  async getSubmissionWithQuestions(submissionId: string): Promise<any> {
    return this.apiRequest(`/submissions/${submissionId}/questions`);
  }
}

export const authService = new AuthService();
export type { User, AuthResponse };