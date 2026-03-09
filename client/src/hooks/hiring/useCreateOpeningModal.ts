import { useState, useEffect, useCallback } from "react";
import ApiCaller from "@/utils/ApiCaller";
import { toast } from "sonner";
import type {
    CreateOpeningFormData,
    RoundFormItem,
    QuestionFormItem,
} from "@/types/hiring";
import type { Department, Employee } from "@/types";

interface UseCreateOpeningModalProps {
    isOpen: boolean;
    onSuccess: () => void;
}

const INITIAL_FORM: CreateOpeningFormData = {
    title: "",
    description: "",
    status: "",
    departmentId: "",
    departmentName: "",
    note: "",
    HiringManager: "",
    HiringManagerName: "",
    rounds: [],
    questions: [],
};

const BLANK_ROUND: RoundFormItem = { name: "", description: "", type: "" };
const BLANK_QUESTION: QuestionFormItem = { question: "", type: "", options: [] };

export function useCreateOpeningModal({
    isOpen,
    onSuccess,
}: UseCreateOpeningModalProps) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<CreateOpeningFormData>(INITIAL_FORM);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // ---- Department search ----
    const [deptQuery, setDeptQuery] = useState("");
    const [deptResults, setDeptResults] = useState<Department[]>([]);
    const [deptLoading, setDeptLoading] = useState(false);
    const [isDeptOpen, setIsDeptOpen] = useState(false);

    // ---- Hiring manager search ----
    const [managerQuery, setManagerQuery] = useState("");
    const [managerResults, setManagerResults] = useState<Employee[]>([]);
    const [managerLoading, setManagerLoading] = useState(false);
    const [isManagerOpen, setIsManagerOpen] = useState(false);

    // Reset when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setFormData(INITIAL_FORM);
            setError(null);
            setFieldErrors({});
            setDeptQuery("");
            setDeptResults([]);
            setManagerQuery("");
            setManagerResults([]);
        }
    }, [isOpen]);

    // Search departments
    useEffect(() => {
        if (!deptQuery.trim()) {
            fetchAllDepts();
            return;
        }
        const tid = setTimeout(() => searchDepts(deptQuery), 300);
        return () => clearTimeout(tid);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deptQuery]);

    const fetchAllDepts = async () => {
        setDeptLoading(true);
        try {
            const result = await ApiCaller<null, any>({
                requestType: "GET",
                paths: ["api", "v1", "departments"],
                queryParams: { page: "1", limit: "100" },
            });
            if (result.ok) {
                const data = result.response.data;
                const list = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.data)
                    ? data.data
                    : [];
                setDeptResults(list);
            }
        } finally {
            setDeptLoading(false);
        }
    };

    const searchDepts = async (q: string) => {
        setDeptLoading(true);
        try {
            const result = await ApiCaller<null, any>({
                requestType: "GET",
                paths: ["api", "v1", "search", "departments"],
                queryParams: { query: q },
            });
            if (result.ok) {
                const data = result.response.data;
                setDeptResults(Array.isArray(data) ? data : data?.data ?? []);
            }
        } finally {
            setDeptLoading(false);
        }
    };

    // Search hiring managers – filtered by selected department
    const searchManagers = useCallback(
        async (q: string) => {
            if (!formData.departmentId) return;
            setManagerLoading(true);
            try {
                const queryParams: Record<string, string> = {
                    deptId: formData.departmentId,
                };
                if (q.trim()) queryParams.query = q.trim();

                const result = await ApiCaller<null, any>({
                    requestType: "GET",
                    paths: ["api", "v1", "search", "employees"],
                    queryParams,
                });
                if (result.ok) {
                    const data = result.response.data;
                    const list = Array.isArray(data)
                        ? data
                        : Array.isArray(data?.data)
                        ? data.data
                        : [];
                    setManagerResults(list);
                }
            } finally {
                setManagerLoading(false);
            }
        },
        [formData.departmentId]
    );

    useEffect(() => {
        if (!formData.departmentId) {
            setManagerResults([]);
            return;
        }
        const tid = setTimeout(() => searchManagers(managerQuery), 300);
        return () => clearTimeout(tid);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [managerQuery, formData.departmentId]);

    // ---- Select helpers ----
    const selectDept = (dept: Department) => {
        setFormData((prev) => ({
            ...prev,
            departmentId: dept._id,
            departmentName: dept.name,
            HiringManager: "",
            HiringManagerName: "",
        }));
        setIsDeptOpen(false);
        setDeptQuery("");
    };

    const selectManager = (emp: Employee) => {
        setFormData((prev) => ({
            ...prev,
            HiringManager: emp._id,
            HiringManagerName: `${emp.firstName} ${emp.lastName}`,
        }));
        setIsManagerOpen(false);
        setManagerQuery("");
    };

    // ---- Step 1 field change ----
    const handleStep1Change = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const handleStatusChange = (value: string) => {
        setFormData((prev) => ({ ...prev, status: value as CreateOpeningFormData["status"] }));
        setFieldErrors((prev) => ({ ...prev, status: "" }));
    };

    // ---- Step 1 validation ----
    const validateStep1 = () => {
        const errs: Record<string, string> = {};
        if (!formData.title.trim()) errs.title = "Title is required";
        if (!formData.description.trim()) errs.description = "Description is required";
        if (!formData.status) errs.status = "Status is required";
        if (!formData.departmentId) errs.departmentId = "Department is required";
        if (!formData.HiringManager) errs.HiringManager = "Hiring manager is required";
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // ---- Step 2: Rounds ----
    const addRound = () =>
        setFormData((prev) => ({ ...prev, rounds: [...prev.rounds, { ...BLANK_ROUND }] }));

    const removeRound = (idx: number) =>
        setFormData((prev) => ({
            ...prev,
            rounds: prev.rounds.filter((_, i) => i !== idx),
        }));

    const updateRound = (idx: number, field: keyof RoundFormItem, value: string) =>
        setFormData((prev) => {
            const rounds = [...prev.rounds];
            rounds[idx] = { ...rounds[idx], [field]: value };
            return { ...prev, rounds };
        });

    const validateStep2 = () => {
        for (const r of formData.rounds) {
            if (!r.name.trim() || !r.type) {
                setError("All rounds must have a name and type");
                return false;
            }
        }
        setError(null);
        return true;
    };

    // ---- Step 3: Questions ----
    const addQuestion = () =>
        setFormData((prev) => ({
            ...prev,
            questions: [...prev.questions, { ...BLANK_QUESTION, options: [] }],
        }));

    const removeQuestion = (idx: number) =>
        setFormData((prev) => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== idx),
        }));

    const updateQuestion = (
        idx: number,
        field: keyof QuestionFormItem,
        value: string | string[]
    ) =>
        setFormData((prev) => {
            const questions = [...prev.questions];
            questions[idx] = { ...questions[idx], [field]: value };
            // Reset options when switching type to TEXT
            if (field === "type" && value === "TEXT") {
                questions[idx].options = [];
            }
            return { ...prev, questions };
        });

    const addOption = (qIdx: number) =>
        setFormData((prev) => {
            const questions = [...prev.questions];
            questions[qIdx] = {
                ...questions[qIdx],
                options: [...questions[qIdx].options, ""],
            };
            return { ...prev, questions };
        });

    const updateOption = (qIdx: number, oIdx: number, value: string) =>
        setFormData((prev) => {
            const questions = [...prev.questions];
            const options = [...questions[qIdx].options];
            options[oIdx] = value;
            questions[qIdx] = { ...questions[qIdx], options };
            return { ...prev, questions };
        });

    const removeOption = (qIdx: number, oIdx: number) =>
        setFormData((prev) => {
            const questions = [...prev.questions];
            questions[qIdx] = {
                ...questions[qIdx],
                options: questions[qIdx].options.filter((_, i) => i !== oIdx),
            };
            return { ...prev, questions };
        });

    const validateStep3 = () => {
        for (const q of formData.questions) {
            if (!q.question.trim() || !q.type) {
                setError("All questions must have text and a type");
                return false;
            }
            if (q.type === "MULTIPLE_CHOICE" && q.options.length < 2) {
                setError("Multiple choice questions need at least 2 options");
                return false;
            }
        }
        setError(null);
        return true;
    };

    // ---- Navigation ----
    const goNext = () => {
        if (step === 1 && !validateStep1()) return;
        if (step === 2 && !validateStep2()) return;
        setError(null);
        setStep((s) => Math.min(s + 1, 3));
    };

    const goBack = () => {
        setError(null);
        setStep((s) => Math.max(s - 1, 1));
    };

    // ---- Submit ----
    const handleSubmit = async () => {
        if (!validateStep3()) return;
        setLoading(true);
        setError(null);
        try {
            const payload = {
                title: formData.title,
                description: formData.description,
                status: formData.status,
                departmentId: formData.departmentId,
                note: formData.note || undefined,
                HiringManager: formData.HiringManager,
                skills: [],
                rounds: formData.rounds
                    .filter((r) => r.name.trim() && r.type)
                    .map((r) => ({
                        name: r.name,
                        description: r.description,
                        type: r.type,
                    })),
                questions: formData.questions
                    .filter((q) => q.question.trim() && q.type)
                    .map((q) => ({
                        question: q.question,
                        type: q.type,
                        options: q.type === "MULTIPLE_CHOICE" ? q.options : undefined,
                    })),
            };

            const result = await ApiCaller<typeof payload, unknown>({
                requestType: "POST",
                paths: ["api", "v1", "hiring", "openings"],
                body: payload,
            });

            if (result.ok) {
                toast.success("Opening created successfully");
                onSuccess();
            } else {
                setError(result.response.message || "Failed to create opening");
            }
        } catch (err) {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return {
        step,
        formData,
        loading,
        error,
        fieldErrors,
        // dept search
        deptQuery,
        setDeptQuery,
        deptResults,
        deptLoading,
        isDeptOpen,
        setIsDeptOpen,
        selectDept,
        // manager search
        managerQuery,
        setManagerQuery,
        managerResults,
        managerLoading,
        isManagerOpen,
        setIsManagerOpen,
        selectManager,
        // step 1
        handleStep1Change,
        handleStatusChange,
        // step 2 rounds
        addRound,
        removeRound,
        updateRound,
        // step 3 questions
        addQuestion,
        removeQuestion,
        updateQuestion,
        addOption,
        updateOption,
        removeOption,
        // navigation
        goNext,
        goBack,
        handleSubmit,
    };
}
