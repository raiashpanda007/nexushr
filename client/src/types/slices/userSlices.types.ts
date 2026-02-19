export interface UserDetails {
    id: string;
    name: string;
    email: string;
    role: string;
    profile: string
}
export interface UserState {
    userDetails: UserDetails | null;
}

