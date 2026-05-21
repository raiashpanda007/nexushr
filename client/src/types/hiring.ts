export interface Question {
    _id: string;
    questionText: string;
    questionType: "TEXT" | "MULTIPLE_CHOICE";
    options: string[];
}

export interface Round {
    _id: string;
    name: string;
    description: string;
    type: "INTERVIEW" | "TEST" | "ASSIGNMENT";
    rank?: number;
}

export interface Reviewer {
    _id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    email: string;
}

export interface InterviewGrade {
    skillId: string | { _id: string; name: string };
    score: number;
}

export interface ApplicantSnapshot {
    _id: string;
    name: string;
    email: string;
}

export interface RoundSnapshot {
    _id: string;
    name: string;
    description?: string;
    type: "INTERVIEW" | "TEST" | "ASSIGNMENT";
    rank?: number | null;
}

export interface OpeningSnapshot {
    _id: string;
    title: string;
    departmentId?: string;
    departmentName?: string;
    hiringManagerId?: string;
    hiringManagerName?: string;
    hiringManagerEmail?: string;
}

export interface Interview {
    _id: string;
    applicantId: string;
    applicantSnapshot?: ApplicantSnapshot;
    roundId: string;
    roundSnapshot?: RoundSnapshot;
    reviewers: string[];
    reviewersSnapshot?: Reviewer[];
    openingSnapshot?: OpeningSnapshot;
    feedback?: string;
    status: "SCHEDULED" | "COMPLETED" | "CANCELED";
    reviewDate: string;
    grades: InterviewGrade[];
    result: "PASSED" | "FAILED" | "PENDING";
    zoomMeetingId?: string;
    zoomJoinUrl?: string;
    createdAt?: string;
    updatedAt?: string;
}

export type MyInterview = Interview;

export interface Applicant {
    _id: string;
    name: string;
    email: string;
    phone: string;
    resume: string;
    status: "APPLIED" | "INTERVIEWING" | "OFFERED" | "OFFERING" | "REJECTED";
    currentRound?: string;
    currentRoundSnapshot?: RoundSnapshot | null;
    openingId?: string;
    openingSnapshot?: OpeningSnapshot;
    note?: string;
    createdAt?: string;
}

export interface Opening {
    _id: string;
    title: string;
    description: string;
    departmentId: string;
    departmentSnapshot?: { _id: string; name: string };
    skills: Array<{
        skillId: string;
        skillName?: string;
        proficiencyLevel: number;
    }>;
    HiringManager: string;
    hiringManagerSnapshot?: { _id: string; firstName: string; lastName: string; email: string };
    Status: "OPEN" | "CLOSED" | "PAUSED";
    note?: string;
    questions: Question[];
    rounds: Round[];
    applicants: string[];
    expectedJoiningDate?: string | Date;
    salaryRange?: {
        min?: number;
        max?: number;
    };
    createdAt?: string;
    updatedAt?: string;
}

export interface ApplicantDetail {
    _id: string;
    name: string;
    email: string;
    phone: string;
    resume: string;
    status: "APPLIED" | "INTERVIEWING" | "OFFERED" | "OFFERING" | "REJECTED";
    currentRound?: string | null;
    currentRoundSnapshot?: RoundSnapshot | null;
    note?: string;
    createdAt?: string;
    questions: Array<{
        questionId: { _id: string; questionText: string } | string;
        answer: string;
    }>;
    openingId: string;
    openingSnapshot?: OpeningSnapshot;
}

// ------ Form-layer types -------

export interface RoundFormItem {
    name: string;
    description: string;
    type: "INTERVIEW" | "TEST" | "ASSIGNMENT" | "";
}

export interface QuestionFormItem {
    question: string;
    type: "TEXT" | "MULTIPLE_CHOICE" | "";
    options: string[];
}

export interface SkillFormItem {
    skillId: string;
    skillName: string;
    proficiencyLevel: number;
}

export interface CreateOpeningFormData {
    // Step 1
    title: string;
    description: string;
    status: "OPEN" | "CLOSED" | "PAUSED" | "";
    departmentId: string;
    departmentName: string;
    note: string;
    HiringManager: string;
    HiringManagerName: string;
    expectedJoiningDate: string;
    salaryMin: string;
    salaryMax: string;
    skills: SkillFormItem[];
    // Step 2
    rounds: RoundFormItem[];
    // Step 3
    questions: QuestionFormItem[];
}
