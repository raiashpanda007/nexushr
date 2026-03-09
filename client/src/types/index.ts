import type { UserDetails, UserState } from "./slices/userSlices.types"
import type { EventItem, EventType } from "./events"

export type { UserDetails, UserState }
export type { EventItem, EventType }


export interface Department {
    _id: string;
    name: string;
}

export interface Skill {
    _id: string;
    name: string;
}

export interface EmployeeSkill {
    skillId?: string | Skill;
    _id?: string;
    name?: string;
    amount: number;
}

export interface Employee {
    _id: string;
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    profilePhoto?: string;
    deptId?: string | { _id: string; name: string };
    skills?: (string | Skill | EmployeeSkill)[];
    note?: string;
    online?: boolean;
    createdAt?: string;
    updatedAt?: string;
    syncState?: "unsynced" | "synced";
}


export type RequestType = "POST" | "GET" | "PUT" | "PATCH" | "DELETE"