export interface UserDetails {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    profilePhoto?: string;
}

export interface Employee {
    _id: string;
    id?: string; // Fallback if sometimes mapped
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    profilePhoto?: string;
    deptId?: string | { _id: string; name: string };
    skills?: (string | { _id: string; name: string })[];
    note?: string;
    online?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface UserState {
    userDetails: UserDetails | null;
}
