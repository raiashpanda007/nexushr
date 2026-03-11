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

export interface Interview {
    _id: string;
    applicantId: { _id: string; name: string; email: string } | string;
    roundId: { _id: string; name: string; type: string } | string;
    reviewers: Reviewer[];
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

export interface MyInterview extends Interview {
    opening?: {
        _id: string;
        title: string;
        departmentId: { _id: string; name: string } | string;
        HiringManager:
            | { _id: string; firstName: string; lastName: string; email: string }
            | string;
    } | null;
}

export interface Applicant {
    _id: string;
    name: string;
    email: string;
    phone: string;
    resume: string;
    status: "APPLIED" | "INTERVIEWING" | "OFFERED" | "OFFERING" | "REJECTED";
    currentRound?: string | Round;
    note?: string;
    createdAt?: string;
}

export interface Opening {
    _id: string;
    title: string;
    description: string;
    departmentId: { _id: string; name: string } | string;
    skills: Array<{
        skillId: { _id: string; name: string } | string;
        proficiencyLevel: number;
    }>;
    HiringManager:
        | { _id: string; firstName: string; lastName: string; email: string }
        | string;
    Status: "OPEN" | "CLOSED" | "PAUSED";
    note?: string;
    questions: Question[];
    rounds: Round[];
    applicants: Applicant[];
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
    currentRound?: Round | null;
    note?: string;
    createdAt?: string;
    questions: Array<{
        questionId: { _id: string; questionText: string } | string;
        answer: string;
    }>;
    openingId: {
        _id: string;
        title: string;
        description: string;
        departmentId: { _id: string; name: string } | string;
        HiringManager: { _id: string; firstName: string; lastName: string; email: string } | string;
        rounds: Round[];
    };
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
