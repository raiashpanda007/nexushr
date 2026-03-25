export interface VideoVersion {
    "240p"?: string;
    "360p"?: string;
    "720p"?: string;
    "1080p"?: string;
    "default"?: string;
}

export interface Video {
    _id: string;
    name: string;
    versions: VideoVersion[];
    metadata?: string;
}

export interface TextResource {
    name?: string;
    content: string;
}

export interface FileResource {
    name: string;
    url: string;
}

export interface LinkResource {
    _id?: string;
    name: string;
    link: string;
}

export interface AssessmentRef {
    assessmentId: string;
    status: string;
    details?: Assessment;
}

export interface Chapter {
    _id: string;
    name: string;
    description: string;
    rank?: number;
    pdfResources: FileResource[];
    docxResources: FileResource[];
    textResources: TextResource[];
    linkResources: LinkResource[];
    videoLecture?: Video | null;
    assessments: AssessmentRef[];
}

export interface Lesson {
    _id: string;
    name: string;
    description: string;
    chaptersCount?: number;
    // Employee-only fields
    completedChaptersCount?: number;
    status?: "not_started" | "in_progress" | "completed";
    createdAt?: string;
    updatedAt?: string;
}

export interface LessonDetail extends Omit<Lesson, "chaptersCount"> {
    chapters: Chapter[];
    currentChapter?: string;
    completedChapters?: string[];
}

export interface Question {
    _id: string;
    question: string;
    type: "MCQ" | "TEXT";
    options?: string[];
    correctAnswer?: string;
    marks: number;
}

export interface Assessment {
    _id: string;
    name: string;
    questions: Question[];
    passingScore: number;
}

export interface UserProgress {
    _id: string;
    user: string;
    lesson: string;
    currentChapter?: string;
    completedChapters: string[];
    status: "not_started" | "in_progress" | "completed";
    chapterProgress: Array<{
        chapter: string;
        status: "not_started" | "in_progress" | "completed";
        openedAt?: string;
        completedAt?: string;
    }>;
}

export interface EnrolledStudent {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePhoto?: string;
    skills?: { skillId: string; amount: number }[];
    alreadyEnrolled?: boolean;
}

// Form types
export interface CreateLessonFormData {
    name: string;
    description: string;
}

// Assessment page types
export type AssessmentFilter = "all" | "reviewed" | "pending_review" | "not_attempted";

export interface MyAssessmentRow {
    lessonId: string;
    lessonName: string;
    chapterId: string;
    chapterName: string;
    rank: number;
    status: "reviewed" | "pending_review" | "not_attempted";
    attemptsCount: number;
    latestAttempt: {
        attemptedAt: string;
        percentage: number;
        passed: boolean;
        reviewStatus: "pending_review" | "reviewed";
        score: number;
        totalScore: number;
    } | null;
}

export interface PendingReviewRow {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    lessonId: string;
    lessonName: string;
    chapterId: string;
    chapterName: string;
    assessmentId: string;
    attemptedAt: string;
    answers: { questionId: string; answer: string }[];
    mcqScore: number;
    totalScore: number;
}

// Analytics types
export interface LessonOverviewItem {
    lessonId: string;
    lessonName: string;
    totalChapters: number;
    enrolledCount: number;
    completedCount: number;
    inProgressCount: number;
    notStartedCount: number;
    avgCompletionPct: number;
    pendingReviewsCount: number;
}

export interface OverviewSummary {
    totalLessons: number;
    totalEnrollments: number;
    avgCompletionRate: number;
    totalPendingReviews: number;
}

export interface OverviewData {
    summary: OverviewSummary;
    lessons: LessonOverviewItem[];
}

export interface LessonStudentRow {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    status: "not_started" | "in_progress" | "completed";
    completedCount: number;
    completionPct: number;
    avgAssessmentScore: number;
    pendingReviews: number;
}

export interface LessonAnalyticsData {
    lesson: { _id: string; name: string; description: string; totalChapters: number };
    students: LessonStudentRow[];
}

export interface StudentLessonRow {
    lessonId: string;
    lessonName: string;
    lessonDescription: string;
    status: "not_started" | "in_progress" | "completed";
    chaptersCount: number;
    completedCount: number;
    completionPct: number;
    bestScore: number;
}

export interface AssessmentAttempt {
    attemptedAt: string;
    score: number;
    totalScore: number;
    percentage: number;
    passed: boolean;
    reviewStatus: "pending_review" | "reviewed";
    reviewedAt?: string;
    reviewerNote?: string;
}

export interface ChapterAnalyticsRow {
    rank: number;
    chapterId: string;
    name: string;
    description: string;
    hasAssessments: boolean;
    status: "not_started" | "in_progress" | "completed";
    openedAt?: string;
    completedAt?: string;
    attempts: AssessmentAttempt[];
    bestScore: number | null;
}

export interface StudentLessonDetailData {
    lesson: { _id: string; name: string; totalChapters: number };
    overallStatus: "not_started" | "in_progress" | "completed";
    completedCount: number;
    completionPct: number;
    chapters: ChapterAnalyticsRow[];
}
