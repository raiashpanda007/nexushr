export type EventType = "MEETING" | "BIRTHDAY" | "ANNIVERSARY" | "OTHER" | "HOLIDAY";

export interface EventItem {
    _id: string;
    name: string;
    description: string;
    date: string;
    time: string;
    type: EventType;
    forAll: boolean;
    resepectedEmplooyees?: string[];
    respectedToDepartments?: string[];
    employeeDetails?: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
        profilePhoto?: string;
    }[];
    departmentDetails?: {
        _id: string;
        name: string;
    }[];
    createdAt?: string;
    updatedAt?: string;
    meetLink?: string;
}
