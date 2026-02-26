import { useEffect, useState, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { format, startOfWeek, startOfMonth } from 'date-fns';
import ApiCaller from '@/utils/ApiCaller';
import type { RootState } from '@/store';

interface Punch {
    type: "IN" | "OUT";
    time: string;
}

interface Department {
    _id: string;
    name: string;
}

export interface AttendanceRecord {
    _id: string;
    user: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
        profilePhoto?: string;
        deptId?: Department;
    };
    date: string;
    punches: Punch[];
    totalMinutes: number;
    syncState?: "unsynced" | "synced";
}

export function useAttendance() {
    const { userDetails } = useSelector((state: RootState) => state.userState);
    const isHR = userDetails?.role === 'HR';

    const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
    const [analyticsData, setAnalyticsData] = useState<AttendanceRecord[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const [filterDate, setFilterDate] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');


    const [analyticsDeptFilter, setAnalyticsDeptFilter] = useState<string>("ALL");
    const [analyticsMonthFilter, setAnalyticsMonthFilter] = useState<string>(
        format(new Date(), 'yyyy-MM')
    );

    const [activeTab, setActiveTab] = useState<"Records" | "Analytics">("Records");

    const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);


    const availableDepartments = useMemo(() => {
        const uniqueIds = new Set<string>();
        const depts: Department[] = [];
        analyticsData.forEach(a => {
            if (a.user?.deptId && !uniqueIds.has(a.user.deptId._id)) {
                uniqueIds.add(a.user.deptId._id);
                depts.push(a.user.deptId);
            }
        });
        return depts;
    }, [analyticsData]);

    const fetchAttendances = async (dateStr?: string, currentPage = 1) => {
        setLoading(true);
        try {
            const queryParams: Record<string, string> = { page: currentPage.toString(), limit: limit.toString() };
            if (dateStr) queryParams.date = dateStr;

            let apiAttendances: AttendanceRecord[] = [];
            let apiTotal = 0;

            if (navigator.onLine) {
                const { response } = await ApiCaller<any, any>({
                    requestType: 'GET',
                    paths: ['api', 'v1', 'attendance'],
                    queryParams
                });

                if (response?.data) {
                    if (Array.isArray(response.data)) {
                        apiAttendances = response.data;
                    } else if (response.data.data) {
                        apiAttendances = response.data.data;
                        apiTotal = response.data.total || 0;
                    }
                }
            }

            const { default: OfflineQueue } = await import("@/utils/DbManger");
            const offlinePunches = await OfflineQueue.getAllPunches();
            let addedCount = 0;

            if (offlinePunches.length > 0) {
                const today = format(new Date(), 'yyyy-MM-dd');

                if (!dateStr || dateStr === today) {
                    const existingRecordIdx = apiAttendances.findIndex(a =>
                        a.user?._id === userDetails?.id && a.date === today
                    );

                    const punches = offlinePunches.map(p => ({
                        type: p.type as "IN" | "OUT",
                        time: new Date(p.createdAt).toISOString(),
                    }));

                    if (existingRecordIdx !== -1) {
                        apiAttendances[existingRecordIdx] = {
                            ...apiAttendances[existingRecordIdx],
                            punches: [...apiAttendances[existingRecordIdx].punches, ...punches],
                            syncState: 'unsynced'
                        };
                    } else if (userDetails) {
                        apiAttendances.unshift({
                            _id: `offline-${Date.now()}`,
                            user: {
                                _id: userDetails.id,
                                firstName: userDetails.firstName || '',
                                lastName: userDetails.lastName || '',
                                email: userDetails.email || ''
                            },
                            date: today,
                            punches: punches,
                            totalMinutes: 0,
                            syncState: 'unsynced'
                        } as AttendanceRecord);
                        addedCount = 1;
                    }
                }
            }

            setAttendances(apiAttendances);
            setTotal(apiTotal + addedCount);
        } catch (error) {
            console.error('Error fetching attendances:', error);
        } finally {
            setLoading(false);
        }
    };

    const workerRef = useRef<Worker | null>(null);

    const triggerSyncWorker = (onComplete?: () => void) => {
        if (workerRef.current) {
            workerRef.current.terminate();
        }
        const worker = new Worker(
            new URL('../../workers/syncQueue.worker.ts', import.meta.url),
            { type: 'module' }
        );
        workerRef.current = worker;
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        worker.postMessage({ type: 'FLUSH', baseUrl });
        worker.onmessage = (e) => {
            if (e.data?.type === 'FLUSH_COMPLETE') {
                console.log('[SyncWorker] Offline punches synced successfully.');
                onComplete?.();
            } else if (e.data?.type === 'FLUSH_ERROR') {
                console.error('[SyncWorker] Sync error:', e.data.error);
            }
            worker.terminate();
            workerRef.current = null;
        };
    };

    // Auto-flush queues when returning online
    useEffect(() => {
        const handleOnline = () => {
            if (userDetails) {
                triggerSyncWorker(() => fetchAttendances(filterDate, page));
            }
        };

        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [userDetails, filterDate, page]);

    const fetchAnalyticsData = async (monthStr: string) => {
        if (!isHR) return;
        try {
            const startDate = `${monthStr}-01`;
            const endDate = format(new Date(parseInt(monthStr.split('-')[0]), parseInt(monthStr.split('-')[1]), 0), 'yyyy-MM-dd');

            const { response } = await ApiCaller<any, any>({
                requestType: 'GET',
                paths: ['api', 'v1', 'attendance'],
                queryParams: { startDate, endDate, limit: 'all' }
            });

            if (response?.data) {
                if (Array.isArray(response.data)) {
                    setAnalyticsData(response.data);
                } else if (response.data.data) {
                    setAnalyticsData(response.data.data);
                }
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        }
    };

    useEffect(() => {
        if (userDetails) {
            fetchAttendances(filterDate, page);
        }
    }, [userDetails, filterDate, page]);

    useEffect(() => {
        if (isHR && userDetails && activeTab === "Analytics") {
            fetchAnalyticsData(analyticsMonthFilter);
        }
    }, [isHR, userDetails, activeTab, analyticsMonthFilter]);

    const handlePunch = async (type: "IN" | "OUT") => {
        if (!userDetails) return;

        setActionLoading(true);
        try {
            if (!navigator.onLine) {
                const { default: OfflineQueue } = await import("@/utils/DbManger");
                await OfflineQueue.addPunch(type);
                await fetchAttendances(filterDate);
                return;
            }

            const result = await ApiCaller<{ userId: string; type: string }, any>({
                requestType: 'POST',
                paths: ['api', 'v1', 'attendance'],
                body: {
                    userId: userDetails.id,
                    type
                }
            });
            if (result.ok) {
                await fetchAttendances(filterDate);
            } else {
                alert(result.response?.message || "Failed to punch");
            }
        } catch (error) {
            console.error('Error punching:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const filteredAttendances = useMemo(() => {
        return attendances.filter(a => {
            if (!searchTerm) return true;
            const search = searchTerm.toLowerCase();
            const fullName = `${a.user?.firstName || ''} ${a.user?.lastName || ''}`.toLowerCase();
            return fullName.includes(search) || a.user?._id?.toLowerCase().includes(search);
        });
    }, [attendances, searchTerm]);

    const analyticsFilteredAttendances = useMemo(() => {
        return analyticsData.filter(a => {
            if (!a.date) return false;
            const d = new Date(a.date);
            if (isNaN(d.getTime())) return false;
            return format(d, 'yyyy-MM') === analyticsMonthFilter;
        });
    }, [analyticsData, analyticsMonthFilter]);

    const departmentStats = useMemo(() => {
        if (!isHR) return [];
        const map = new Map<string, { _id: string, name: string, totalMinutes: number, count: number }>();

        analyticsFilteredAttendances.forEach(a => {
            if (!a.user?.deptId) return;
            const dept = a.user.deptId;
            if (!map.has(dept._id)) {
                map.set(dept._id, { _id: dept._id, name: dept.name, totalMinutes: 0, count: 0 });
            }
            const stat = map.get(dept._id)!;
            stat.totalMinutes += a.totalMinutes || 0;
            stat.count += 1;
        });

        return Array.from(map.values()).map(d => ({
            ...d,
            avgMinutes: d.count ? d.totalMinutes / d.count : 0,
            avgHours: d.count ? (d.totalMinutes / d.count) / 60 : 0
        })).sort((a, b) => b.avgMinutes - a.avgMinutes);
    }, [analyticsFilteredAttendances, isHR]);

    const bestDepartment = departmentStats.length > 0 ? departmentStats[0] : null;
    const worstDepartment = departmentStats.length > 0 ? departmentStats[departmentStats.length - 1] : null;

    const employeesInSelectedDept = useMemo(() => {
        if (analyticsDeptFilter === "ALL") return [];
        const uniqueEmps = new Map<string, any>();

        analyticsFilteredAttendances.forEach(a => {
            if (a.user?.deptId?._id === analyticsDeptFilter && a.user?._id) {
                if (!uniqueEmps.has(a.user._id)) {
                    uniqueEmps.set(a.user._id, {
                        ...a.user,
                        totalLoggedMinutes: 0
                    });
                }
                const emp = uniqueEmps.get(a.user._id)!;
                emp.totalLoggedMinutes += a.totalMinutes || 0;
            }
        });
        return Array.from(uniqueEmps.values()).sort((a, b) => b.totalLoggedMinutes - a.totalLoggedMinutes);
    }, [analyticsFilteredAttendances, analyticsDeptFilter]);

    const selectedEmpRecords = useMemo(() => {
        if (!selectedEmpId) return [];
        return analyticsData
            .filter(a => a.user?._id === selectedEmpId && a.date)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [analyticsData, selectedEmpId]);

    const chartDaily = useMemo(() => {
        return selectedEmpRecords.map(a => {
            const date = new Date(a.date);
            return {
                name: isNaN(date.getTime()) ? 'Unknown' : format(date, 'MM/dd'),
                Hours: parseFloat((a.totalMinutes / 60).toFixed(2)).toFixed(2)
            };
        });
    }, [selectedEmpRecords]);

    const chartWeekly = useMemo(() => {
        const weeks = new Map<string, number>();
        selectedEmpRecords.forEach(a => {
            const d = new Date(a.date);
            if (isNaN(d.getTime())) return;
            const w = format(startOfWeek(d), 'MMM dd');
            weeks.set(w, (weeks.get(w) || 0) + (a.totalMinutes / 60));
        });
        return Array.from(weeks.entries()).map(([k, v]) => ({ name: `Week ${k}`, Hours: parseFloat(v.toFixed(2)) }));
    }, [selectedEmpRecords]);

    const chartMonthly = useMemo(() => {
        const months = new Map<string, number>();
        selectedEmpRecords.forEach(a => {
            const d = new Date(a.date);
            if (isNaN(d.getTime())) return;
            const m = format(startOfMonth(d), 'MMM yyyy');
            months.set(m, (months.get(m) || 0) + (a.totalMinutes / 60));
        });
        return Array.from(months.entries()).map(([k, v]) => ({ name: k, Hours: parseFloat(v.toFixed(2)) }));
    }, [selectedEmpRecords]);

    const selectedEmpName = selectedEmpRecords.length > 0 ? `${selectedEmpRecords[0].user.firstName} ${selectedEmpRecords[0].user.lastName}` : "";

    return {
        userDetails,
        isHR,
        attendances,
        loading,
        actionLoading,
        page,
        setPage,
        total,
        limit,
        filterDate,
        setFilterDate,
        searchTerm,
        setSearchTerm,
        analyticsDeptFilter,
        setAnalyticsDeptFilter,
        analyticsMonthFilter,
        setAnalyticsMonthFilter,
        activeTab,
        setActiveTab,
        selectedEmpId,
        setSelectedEmpId,
        availableDepartments,
        handlePunch,
        filteredAttendances,
        departmentStats,
        bestDepartment,
        worstDepartment,
        employeesInSelectedDept,
        selectedEmpRecords,
        chartDaily,
        chartWeekly,
        chartMonthly,
        selectedEmpName
    };
}
