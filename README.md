<div align="center">

![BHV English Center](./public/BHV-logo-page.jpg)

## BHV English Center – Special Courses Platform

**Real Client Project · Production Website**  
**Live Demo**: [bhvspecialcourses.com](https://www.bhvspecialcourses.com)

</div>

---

## Overview

This is a **real-world production project** built for **BHV English Center** to manage and deliver their special English courses.
It combines a marketing landing page with a lightweight learning platform for teachers and students.

- Modern, responsive UI optimized for both desktop and mobile
- Clear presentation of courses, learning paths, and center branding
- Internal dashboard for managing tests, assignments, and student submissions

> Timeline: **September 2025 – October 2025**  
> Role: **Solo Frontend Developer**

---

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, custom CSS
- **UI Kit**: Shadcn/UI, Radix UI
- **Forms & Validation**: React Hook Form, Zod
- **State & Data**: React Query-style patterns, local state
- **Notifications**: Sonner (toast notifications)

---

## Key Features

### 1. Marketing Landing & Branding
- Hero section presenting BHV English Center and its special courses
- Clear CTA sections to drive sign-ups and contact
- Responsive layout that works well on desktop, tablet, and mobile

### 2. Teacher Dashboard
- Dashboard for teachers to manage:
  - Reading passages and test content
  - Students, submissions, and grading flows
  - Assignments and test configurations
- Structured navigation with sidebar and header components

### 3. Test & Assignment Management
- Create and edit tests with multiple question types
- Manage assignments, submissions, and review results
- Pages for:
  - `tests/` – list and detail
  - `tests/[id]/builder` – build test flow
  - `tests/[id]/question/[questionId]/edit` – question editor
  - `submissions/` – list of submissions
  - `submissions/results/[submissionId]` – result views

### 4. Student Experience
- Student-facing pages to:
  - Take tests (`submissions/take-test/[testId]`)
  - View and review results
- User-friendly layouts to make online testing simple and clear

### 5. File & Media Handling
- API route for file upload (`app/api/upload`) to handle reading passages and assets
- Scripts and utilities to seed and manage reading passages

---

## Folder Structure (High Level)

```text
bhv-client-v3/
  app/
    page.tsx                 # Landing / entry page
    login/                   # Login page
    dashboard/               # Teacher / admin dashboard
    submissions/             # Student submissions & review
    api/upload/              # File upload API route
  components/
    header.tsx
    sidebar.tsx
    question-renderer.tsx
    ui/                      # Shadcn + Radix UI components
  lib/
    auth.ts                  # Auth helpers
    utils.ts                 # Shared utilities
  public/
    BHV-logo-page.jpg
    logo.svg
```

---

## Development

```bash
pnpm install
pnpm dev
```

Then open `http://localhost:3000` in your browser.

---

## Credits

- **Client**: BHV English Center  
- **Developer**: Clement Hoang (`@youngclement`)


