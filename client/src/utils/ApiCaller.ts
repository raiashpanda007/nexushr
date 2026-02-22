import axios from "axios";
import type { AxiosRequestConfig } from "axios";
import type { ApiResponse } from "@/types/response";
import type { RequestType } from "@/types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

import offlineQueue from "./DbManger";

const INVALID_ERROR: ApiResponse<string> = {
    statusCode: 500,
    message: "Unexpected error occurred",
    data: "",
    success: false,
    errors: [],
};



type QueryParams = Record<string, string | number | boolean | undefined>;

interface ApiCallerParameters<TBody> {
    requestType: RequestType;
    paths?: string[];
    body?: TBody;
    queryParams?: QueryParams;
    retry?: boolean;
    _isRetry?: boolean;
}

export type ApiResult<T> =
    | { ok: true; response: ApiResponse<T> }
    | { ok: false; response: ApiResponse<string> };

let isRefreshing = false;
let refreshSubscribers: ((tokenSuccess: boolean) => void)[] = [];

const subscribeToRefresh = (cb: (tokenSuccess: boolean) => void) => {
    refreshSubscribers.push(cb);
};

const onRefreshed = (tokenSuccess: boolean) => {
    refreshSubscribers.forEach((cb) => cb(tokenSuccess));
    refreshSubscribers = [];
};

function mapRequestToQueueItem(
    paths: string[],
    requestType: RequestType
): { table: any; type: "CREATE" | "UPDATE" | "DELETE" } | null {
    if (!["POST", "PUT", "DELETE", "PATCH"].includes(requestType.toUpperCase())) {
        return null;
    }

    let type: "CREATE" | "UPDATE" | "DELETE" = "CREATE";
    if (requestType.toUpperCase() === "POST") type = "CREATE";
    if (requestType.toUpperCase() === "PUT" || requestType.toUpperCase() === "PATCH") type = "UPDATE";
    if (requestType.toUpperCase() === "DELETE") type = "DELETE";

    const pathStr = paths.join("/");
    let table: any = null;

    if (pathStr.includes("user/create-employee") || pathStr.includes("user/update-employee") || pathStr.includes("user/delete-employee")) table = "EMPLOYEE";
    else if (pathStr.includes("attendance")) table = "ATTENDANCE";
    else if (pathStr.includes("leaves/requests")) table = "LEAVEREQUEST";
    else if (pathStr.includes("leaves/balances")) table = "LEAVEBALANCE";
    else if (pathStr.includes("leaves/types")) table = "LEAVETYPE";
    else if (pathStr.includes("salaries")) table = "SALARIES";
    else if (pathStr.includes("payroll")) table = "PAYROLLS";
    else if (pathStr.includes("departments")) table = "DEPARTMENTS";
    else if (pathStr.includes("skills")) table = "SKILLS";

    if (table) return { table, type };
    return null;
}

async function ApiCaller<TBody, TResp>({
    requestType,
    paths = [],
    body,
    queryParams,
    retry = true,
    _isRetry = false
}: ApiCallerParameters<TBody>): Promise<ApiResult<TResp>> {
    const url = new URL(BASE_URL);
    if (paths.length > 0) {
        const existingPath = url.pathname === '/' ? '' : url.pathname;
        const newPath = paths.map(p => encodeURIComponent(p)).join("/");
        url.pathname = `${existingPath}/${newPath}`.replace(/\/+/g, '/');
    }

    if (queryParams) {
        Object.entries(queryParams).forEach(([key, value]) => {
            if (value !== undefined) {
                url.searchParams.set(key, String(value));
            }
        });
    }

    const config: AxiosRequestConfig = {
        method: requestType,
        url: url.toString(),
        data: body,
        withCredentials: true,
        headers: {
            "Content-Type": "application/json",
        },
    };

    const handleOfflineQueue = async () => {
        const queueMapping = mapRequestToQueueItem(paths, requestType);
        if (queueMapping) {
            const queueItem = {
                id: crypto.randomUUID(),
                table: queueMapping.table,
                type: queueMapping.type,
                payload: { paths, requestType, body, queryParams },
                createdAt: new Date()
            };

            await offlineQueue.add(queueItem);

            return {
                ok: true,
                response: {
                    statusCode: 200,
                    message: "Saved to offline queue",
                    data: null as any,
                    success: true,
                    errors: []
                }
            } as ApiResult<TResp>;
        }
        return null;
    };

    if (!navigator.onLine) {
        const offlineRes = await handleOfflineQueue();
        if (offlineRes) return offlineRes;
    }

    try {
        const res = await axios<ApiResponse<TResp>>(config);
        return { ok: true, response: res.data };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
            const offlineRes = await handleOfflineQueue();
            if (offlineRes) return offlineRes;
        }

        if (axios.isAxiosError(err)) {
            const status = err.response?.status;

            if (status === 401 && retry && !_isRetry) {
                if (isRefreshing) {
                    return new Promise((resolve) => {
                        subscribeToRefresh((tokenSuccess) => {
                            if (tokenSuccess) {
                                resolve(ApiCaller({
                                    requestType,
                                    paths,
                                    body,
                                    queryParams,
                                    retry: true,
                                    _isRetry: true
                                }));
                            } else {
                                resolve({ ok: false, response: err.response?.data || INVALID_ERROR });
                            }
                        });
                    });
                }

                isRefreshing = true;

                try {
                    const refreshRes = await axios.post(`${BASE_URL}/api/v1/auth/refresh-access-token`, {}, {
                        withCredentials: true
                    });

                    if (refreshRes.status === 200) {
                        isRefreshing = false;
                        onRefreshed(true);
                        return ApiCaller({
                            requestType,
                            paths,
                            body,
                            queryParams,
                            retry: true,
                            _isRetry: true
                        });
                    } else {
                        isRefreshing = false;
                        onRefreshed(false);
                        return { ok: false, response: err.response?.data };
                    }
                } catch {
                    isRefreshing = false;
                    onRefreshed(false);
                    return { ok: false, response: err.response?.data };
                }
            }

            return { ok: false, response: err.response?.data || INVALID_ERROR };
        }

        return { ok: false, response: INVALID_ERROR };
    }
}

export const getOAuthUrl = (provider: string) => {
    return `${BASE_URL}/api/v1/auth/${provider}`;
}

export default ApiCaller;
