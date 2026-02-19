import type { UserDetails, UserState, Employee } from "./slices/userSlices.types"

export type { UserDetails, UserState, Employee }


export interface Department {
    _id: string;
    name: string;
}

export interface Skill {
    _id: string;
    name: string;
}

export type RequestType = "POST" | "GET" | "PUT" | "PATCH" | "DELETE"