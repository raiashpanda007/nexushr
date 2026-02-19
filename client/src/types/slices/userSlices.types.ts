export interface UserDetails {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    profilePhoto?: string;
    deptId?: string;
    skills?: string[];
    note?: string;
}
export interface UserState {
    userDetails: UserDetails | null;
}

