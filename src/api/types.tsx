// src/api/types.ts

export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

export interface User {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface AuthResponse {
    token: string;
    refreshToken: string;
    user: User;
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export interface Course {
    id: string;
    title: string;
    description: string;
    price: number;
    thumbnailUrl?: string;
    categoryId: string;
    difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
    duration: number;
    language: string;
    instructorId: string;
    instructor?: User;
    learningObjectives?: string[];
    requirements?: string[];
    createdAt: string;
    updatedAt: string;
}

export interface CourseCreatePayload {
    title: string;
    description: string;
    price: number;
    order?: number;
    createdBy?: string;
    instructorId: string;
    thumbnailUrl?: string;
    categoryId: string;
    difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
    duration: number;
    language: string;
    learningObjectives?: string[];
    requirements?: string[];
}

export interface Module {
    id: string;
    courseId: string;
    title: string;
    description?: string;
    order: number;
    createdBy?: string;
    createdAt: string;
}

export interface Lesson {
    id: string;
    moduleId: string;
    courseId: string;
    title: string;
    description?: string;
    order: number;
    duration: number;
    isPreview: boolean;
    createdAt: string;
}

export interface Quiz {
    id: string;
    courseId: string;
    lessonId: string;
    title: string;
    description?: string;
    instructions?: string;
    timeLimit?: number;
    maxAttempts?: number;
    passingScore?: number;
    dueDate?: string;
    isPublished: boolean;
    createdBy?: string;
    createdAt: string;
}

export interface Enrollment {
    id: string;
    courseId: string;
    studentId: string;
    paymentId?: string;
    createdAt: string;
    course?: Course;
    student?: User;
    payment?: Payment;
}

export interface Payment {
    id: string;
    amount: number;
    currency: string;
    status: string;
    provider: string;
    transactionId: string;
}

export interface Subscription {
    id: string;
    userId: string;
    status: 'active' | 'pending' | 'cancelled' | 'expired';
    startDate: string;
    endDate: string;
    provider: string;
    transactionId: string;
    createdAt: string;
}

export interface Review {
    id: string;
    courseId: string;
    userId: string;
    rating: number;
    comment?: string;
    createdAt: string;
    user?: User;
}

export interface Category {
    id: string;
    name: string;
    description?: string;
    parentId?: string;
    createdAt: string;
}

export interface Tag {
    id: string;
    name: string;
    createdAt: string;
}