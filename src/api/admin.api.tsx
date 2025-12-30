import { apiClient } from './apiClient';
import { isAdmin } from './auth-utils';
import { User, Course, Pagination } from './types';
import { getErrorMessage, unwrapResponse } from './utils';

export interface AdminStats {
    totalUsers: number;
    totalTeachers: number;
    totalStudents: number;
    totalCourses: number;
    activeCourses: number;
    pendingCourses: number;
    totalRevenue: number;
    monthlyRevenue: number;
    pendingReviews: number;
    activeReports: number;
    recentSignups: number;
    coursesThisMonth: number;
}

export interface UserManagementPayload {
    role?: 'STUDENT' | 'TEACHER' | 'ADMIN';
    isActive?: boolean;
    isVerified?: boolean;
}

export interface CourseModerationPayload {
    status: 'APPROVED' | 'REJECTED' | 'PENDING';
    rejectionReason?: string;
}

export interface ContentReport {
    id: string;
    type: 'COURSE' | 'REVIEW' | 'FORUM_POST' | 'USER';
    targetId: string;
    reportedBy: User;
    reason: string;
    description?: string;
    status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
    createdAt: string;
    reviewedAt?: string;
    reviewedBy?: User;
}

export interface ContentReportResponse {
    reports: ContentReport[];
    pagination: Pagination;
}

export const AdminAPI = {
    /**
     * Get admin dashboard statistics
     */
    getDashboardStats: async (): Promise<AdminStats> => {
        if (!isAdmin()) {
            throw new Error('Only admins can access dashboard stats');
        }
        try {
            const response = await apiClient.instance.get<AdminStats>('/admin/stats');
            return unwrapResponse<AdminStats>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Get all users with filtering and pagination
     */
    getUsers: async (params?: {
        page?: number;
        limit?: number;
        search?: string;
        role?: 'STUDENT' | 'TEACHER' | 'ADMIN';
        isActive?: boolean;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<{
        users: User[];
        pagination: Pagination;
    }> => {
        if (!isAdmin()) {
            throw new Error('Only admins can view all users');
        }
        try {
            const { data } = await apiClient.instance.get('/admin/users', { params });
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Get a specific user
     */
    getUser: async (userId: string): Promise<User> => {
        if (!isAdmin()) {
            throw new Error('Only admins can view user details');
        }
        try {
            const response = await apiClient.instance.get<User>(`/admin/users/${userId}`);
            return unwrapResponse<User>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Update user (role, status, etc.)
     */
    updateUser: async (userId: string, payload: UserManagementPayload): Promise<User> => {
        if (!isAdmin()) {
            throw new Error('Only admins can update users');
        }
        try {
            const response = await apiClient.instance.put<User>(`/admin/users/${userId}`, payload);
            return unwrapResponse<User>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Delete user
     */
    deleteUser: async (userId: string): Promise<void> => {
        if (!isAdmin()) {
            throw new Error('Only admins can delete users');
        }
        try {
            await apiClient.instance.delete(`/admin/users/${userId}`);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Get courses pending moderation
     */
    getPendingCourses: async (params?: {
        page?: number;
        limit?: number;
    }): Promise<{
        courses: Course[];
        pagination: Pagination;
    }> => {
        if (!isAdmin()) {
            throw new Error('Only admins can view pending courses');
        }
        try {
            const { data } = await apiClient.instance.get('/admin/courses/pending', { params });
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Moderate a course (approve/reject)
     */
    moderateCourse: async (courseId: string, payload: CourseModerationPayload): Promise<Course> => {
        if (!isAdmin()) {
            throw new Error('Only admins can moderate courses');
        }
        try {
            const response = await apiClient.instance.post<Course>(
                `/admin/courses/${courseId}/moderate`,
                payload
            );
            return unwrapResponse<Course>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Get all content reports
     */
    // Backend: GET /api/content/flags
    getContentReports: async (params?: {
        page?: number;
        limit?: number;
        status?: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
        type?: 'COURSE' | 'REVIEW' | 'FORUM_POST' | 'USER';
    }): Promise<ContentReportResponse> => {
        if (!isAdmin()) {
            throw new Error('Only admins can view content reports');
        }
        try {
            const { data } = await apiClient.instance.get<ContentReportResponse>(
                '/content/flags',
                { params }
            );
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Update report status
     * Backend: POST /api/content/flags/:flagId/review
     */
    updateReport: async (reportId: string, status: 'REVIEWED' | 'RESOLVED' | 'DISMISSED'): Promise<ContentReport> => {
        if (!isAdmin()) {
            throw new Error('Only admins can update reports');
        }
        try {
            const response = await apiClient.instance.post<ContentReport>(
                `/content/flags/${reportId}/review`,
                { status }
            );
            return unwrapResponse<ContentReport>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Get platform analytics
     */
    // Backend: GET /api/analytics/platform
    getAnalytics: async (params?: {
        startDate?: string;
        endDate?: string;
        groupBy?: 'day' | 'week' | 'month';
    }): Promise<any> => {
        if (!isAdmin()) {
            throw new Error('Only admins can view analytics');
        }
        try {
            const response = await apiClient.instance.get('/analytics/platform', { params });
            return unwrapResponse(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Get system settings
     */
    getSystemSettings: async (): Promise<any> => {
        if (!isAdmin()) {
            throw new Error('Only admins can view system settings');
        }
        const { data } = await apiClient.instance.get('/admin/settings');
        return data;
    },

    /**
     * Update system settings
     */
    updateSystemSettings: async (payload: any): Promise<any> => {
        if (!isAdmin()) {
            throw new Error('Only admins can update system settings');
        }
        const { data } = await apiClient.instance.put('/admin/settings', payload);
        return data;
    },

    /**
     * Get all payout requests
     */
    // Backend: GET /api/admin/payouts
    getPayouts: async (params?: {
        page?: number;
        limit?: number;
        status?: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';
        teacherId?: string;
    }): Promise<{
        payouts: any[];
        pagination: Pagination;
    }> => {
        if (!isAdmin()) {
            throw new Error('Only admins can view payouts');
        }
        try {
            const { data } = await apiClient.instance.get('/admin/payouts', { params });
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Approve payout request
     * Backend: POST /api/admin/payouts/:payoutId/approve
     */
    approvePayout: async (payoutId: string): Promise<any> => {
        if (!isAdmin()) {
            throw new Error('Only admins can approve payouts');
        }
        try {
            const response = await apiClient.instance.post(`/admin/payouts/${payoutId}/approve`);
            return unwrapResponse(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Reject payout request
     * Backend: POST /api/admin/payouts/:payoutId/reject
     */
    rejectPayout: async (payoutId: string, reason?: string): Promise<any> => {
        if (!isAdmin()) {
            throw new Error('Only admins can reject payouts');
        }
        try {
            const response = await apiClient.instance.post(`/admin/payouts/${payoutId}/reject`, { reason });
            return unwrapResponse(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Bulk update users
     */
    // Backend: POST /api/admin/users/bulk
    bulkUpdateUsers: async (userIds: string[], payload: UserManagementPayload): Promise<any> => {
        if (!isAdmin()) {
            throw new Error('Only admins can bulk update users');
        }
        try {
            const response = await apiClient.instance.post('/admin/users/bulk', { userIds, ...payload });
            return unwrapResponse(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Bulk update courses
     * Backend: POST /api/admin/courses/bulk
     */
    bulkUpdateCourses: async (courseIds: string[], payload: CourseModerationPayload): Promise<any> => {
        if (!isAdmin()) {
            throw new Error('Only admins can bulk update courses');
        }
        try {
            const response = await apiClient.instance.post('/admin/courses/bulk', { courseIds, ...payload });
            return unwrapResponse(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Send broadcast notification
     * Backend: POST /api/admin/broadcasts
     */
    sendBroadcast: async (payload: {
        title: string;
        message: string;
        targetAudience?: 'all' | 'students' | 'teachers' | 'admins';
        userIds?: string[];
        sendEmail?: boolean;
        sendPush?: boolean;
    }): Promise<any> => {
        if (!isAdmin()) {
            throw new Error('Only admins can send broadcasts');
        }
        try {
            const response = await apiClient.instance.post('/admin/broadcasts', payload);
            return unwrapResponse(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Get activity logs
     * Backend: GET /api/admin/logs
     */
    getActivityLogs: async (params?: {
        page?: number;
        limit?: number;
        userId?: string;
        action?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<{
        logs: any[];
        pagination: Pagination;
    }> => {
        if (!isAdmin()) {
            throw new Error('Only admins can view activity logs');
        }
        try {
            const { data } = await apiClient.instance.get('/admin/logs', { params });
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Import users from CSV
     * Backend: POST /api/admin/users/import
     */
    importUsers: async (file: File): Promise<any> => {
        if (!isAdmin()) {
            throw new Error('Only admins can import users');
        }
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await apiClient.instance.post('/admin/users/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return unwrapResponse(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Export users to CSV
     * Backend: GET /api/admin/users/export
     */
    exportUsers: async (params?: {
        role?: 'STUDENT' | 'TEACHER' | 'ADMIN';
        isActive?: boolean;
    }): Promise<Blob> => {
        if (!isAdmin()) {
            throw new Error('Only admins can export users');
        }
        try {
            const { data } = await apiClient.instance.get('/admin/users/export', {
                params,
                responseType: 'blob',
            });
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Get broadcast history
     * Backend: GET /api/admin/broadcasts
     */
    getBroadcasts: async (params?: {
        page?: number;
        limit?: number;
        startDate?: string;
        endDate?: string;
    }): Promise<{
        broadcasts: any[];
        pagination: Pagination;
    }> => {
        if (!isAdmin()) {
            throw new Error('Only admins can view broadcasts');
        }
        try {
            const { data } = await apiClient.instance.get('/admin/broadcasts', { params });
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Get all reviews (admin view)
     */
    getAllReviews: async (params?: {
        page?: number;
        limit?: number;
        courseId?: string;
        userId?: string;
        rating?: number;
        status?: string;
    }): Promise<{
        reviews: any[];
        pagination: Pagination;
    }> => {
        if (!isAdmin()) {
            throw new Error('Only admins can view all reviews');
        }
        try {
            const { data } = await apiClient.instance.get('/admin/reviews', { params });
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Moderate review (approve/reject/hide)
     */
    moderateReview: async (reviewId: string, action: 'approve' | 'reject' | 'hide' | 'delete', reason?: string): Promise<any> => {
        if (!isAdmin()) {
            throw new Error('Only admins can moderate reviews');
        }
        try {
            const response = await apiClient.instance.post(`/admin/reviews/${reviewId}/moderate`, { action, reason });
            return unwrapResponse(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Get all certificates (admin view)
     */
    getAllCertificates: async (params?: {
        page?: number;
        limit?: number;
        userId?: string;
        courseId?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<{
        certificates: any[];
        pagination: Pagination;
    }> => {
        if (!isAdmin()) {
            throw new Error('Only admins can view all certificates');
        }
        try {
            const { data } = await apiClient.instance.get('/admin/certificates', { params });
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Revoke certificate
     */
    revokeCertificate: async (certificateId: string, reason?: string): Promise<any> => {
        if (!isAdmin()) {
            throw new Error('Only admins can revoke certificates');
        }
        try {
            const response = await apiClient.instance.post(`/admin/certificates/${certificateId}/revoke`, { reason });
            return unwrapResponse(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // ============================================================
    // EMAIL TEMPLATES MANAGEMENT
    // ============================================================

    /**
     * Get all email templates
     */
    getEmailTemplates: async (): Promise<{
        templates: any[];
    }> => {
        if (!isAdmin()) {
            throw new Error('Only admins can view email templates');
        }
        try {
            const response = await apiClient.instance.get('/admin/email-templates');
            return unwrapResponse(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Get single email template
     */
    getEmailTemplate: async (templateId: string): Promise<any> => {
        if (!isAdmin()) {
            throw new Error('Only admins can view email templates');
        }
        try {
            const response = await apiClient.instance.get(`/admin/email-templates/${templateId}`);
            return unwrapResponse(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Create email template
     */
    createEmailTemplate: async (payload: {
        name: string;
        subject: string;
        body: string;
        variables: string[];
        type: string;
        isActive?: boolean;
    }): Promise<any> => {
        if (!isAdmin()) {
            throw new Error('Only admins can create email templates');
        }
        try {
            const response = await apiClient.instance.post('/admin/email-templates', payload);
            return unwrapResponse(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Update email template
     */
    updateEmailTemplate: async (templateId: string, payload: {
        name?: string;
        subject?: string;
        body?: string;
        isActive?: boolean;
    }): Promise<any> => {
        if (!isAdmin()) {
            throw new Error('Only admins can update email templates');
        }
        try {
            const response = await apiClient.instance.put(`/admin/email-templates/${templateId}`, payload);
            return unwrapResponse(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Delete email template
     */
    deleteEmailTemplate: async (templateId: string): Promise<void> => {
        if (!isAdmin()) {
            throw new Error('Only admins can delete email templates');
        }
        try {
            await apiClient.instance.delete(`/admin/email-templates/${templateId}`);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Test email template
     */
    testEmailTemplate: async (templateId: string, payload: {
        testEmail: string;
        variables: Record<string, string>;
    }): Promise<any> => {
        if (!isAdmin()) {
            throw new Error('Only admins can test email templates');
        }
        try {
            const response = await apiClient.instance.post(`/admin/email-templates/${templateId}/test`, payload);
            return unwrapResponse(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // ============================================================
    // QUIZZES MANAGEMENT
    // ============================================================

    /**
     * Get all quizzes (admin view)
     */
    getAllQuizzes: async (params?: {
        page?: number;
        limit?: number;
        search?: string;
        courseId?: string;
        status?: string;
    }): Promise<{
        quizzes: any[];
        pagination: Pagination;
    }> => {
        if (!isAdmin()) {
            throw new Error('Only admins can view all quizzes');
        }
        try {
            const { data } = await apiClient.instance.get('/admin/quizzes', { params });
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Get single quiz
     */
    getQuiz: async (quizId: string): Promise<any> => {
        if (!isAdmin()) {
            throw new Error('Only admins can view quiz details');
        }
        try {
            const response = await apiClient.instance.get(`/admin/quizzes/${quizId}`);
            return unwrapResponse(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Update quiz
     */
    updateQuiz: async (quizId: string, payload: {
        title?: string;
        description?: string;
        isActive?: boolean;
        settings?: any;
    }): Promise<any> => {
        if (!isAdmin()) {
            throw new Error('Only admins can update quizzes');
        }
        try {
            const response = await apiClient.instance.put(`/admin/quizzes/${quizId}`, payload);
            return unwrapResponse(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Delete quiz
     */
    deleteQuiz: async (quizId: string): Promise<void> => {
        if (!isAdmin()) {
            throw new Error('Only admins can delete quizzes');
        }
        try {
            await apiClient.instance.delete(`/admin/quizzes/${quizId}`);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // ============================================================
    // FORUMS MANAGEMENT
    // ============================================================

    /**
     * Get all forum posts (admin view)
     */
    getAllForumPosts: async (params?: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
        courseId?: string;
    }): Promise<{
        posts: any[];
        pagination: Pagination;
    }> => {
        if (!isAdmin()) {
            throw new Error('Only admins can view all forum posts');
        }
        try {
            const { data } = await apiClient.instance.get('/admin/forums', { params });
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Get single forum post
     */
    getForumPost: async (postId: string): Promise<any> => {
        if (!isAdmin()) {
            throw new Error('Only admins can view forum post details');
        }
        try {
            const response = await apiClient.instance.get(`/admin/forums/${postId}`);
            return unwrapResponse(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Moderate forum post
     */
    moderateForumPost: async (postId: string, payload: {
        status?: 'ACTIVE' | 'HIDDEN' | 'DELETED';
        isPinned?: boolean;
        isLocked?: boolean;
        moderationReason?: string;
    }): Promise<any> => {
        if (!isAdmin()) {
            throw new Error('Only admins can moderate forum posts');
        }
        try {
            const response = await apiClient.instance.put(`/admin/forums/${postId}`, payload);
            return unwrapResponse(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Delete forum post
     */
    deleteForumPost: async (postId: string): Promise<void> => {
        if (!isAdmin()) {
            throw new Error('Only admins can delete forum posts');
        }
        try {
            await apiClient.instance.delete(`/admin/forums/${postId}`);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // ============================================================
    // QA MANAGEMENT
    // ============================================================

    /**
     * Get all Q&A (admin view)
     */
    getAllQA: async (params?: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
        courseId?: string;
    }): Promise<{
        questions: any[];
        pagination: Pagination;
    }> => {
        if (!isAdmin()) {
            throw new Error('Only admins can view all Q&A');
        }
        try {
            const { data } = await apiClient.instance.get('/admin/qa', { params });
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Get single Q&A
     */
    getQA: async (qaId: string): Promise<any> => {
        if (!isAdmin()) {
            throw new Error('Only admins can view Q&A details');
        }
        try {
            const response = await apiClient.instance.get(`/admin/qa/${qaId}`);
            return unwrapResponse(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Moderate Q&A
     */
    moderateQA: async (qaId: string, payload: {
        status?: 'ACTIVE' | 'HIDDEN' | 'DELETED';
        moderationReason?: string;
    }): Promise<any> => {
        if (!isAdmin()) {
            throw new Error('Only admins can moderate Q&A');
        }
        try {
            const response = await apiClient.instance.put(`/admin/qa/${qaId}`, payload);
            return unwrapResponse(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Delete Q&A
     */
    deleteQA: async (qaId: string): Promise<void> => {
        if (!isAdmin()) {
            throw new Error('Only admins can delete Q&A');
        }
        try {
            await apiClient.instance.delete(`/admin/qa/${qaId}`);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // ============================================================
    // REFERRALS MANAGEMENT
    // ============================================================

    /**
     * Get referral program settings
     */
    getReferralSettings: async (): Promise<any> => {
        if (!isAdmin()) {
            throw new Error('Only admins can view referral settings');
        }
        try {
            const response = await apiClient.instance.get('/admin/referrals');
            return unwrapResponse(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Update referral settings
     */
    updateReferralSettings: async (payload: {
        isEnabled?: boolean;
        referrerReward?: {
            type: 'PERCENTAGE' | 'FIXED';
            value: number;
        };
        refereeReward?: {
            type: 'PERCENTAGE' | 'FIXED';
            value: number;
        };
        minPayout?: number;
        terms?: string;
    }): Promise<any> => {
        if (!isAdmin()) {
            throw new Error('Only admins can update referral settings');
        }
        try {
            const response = await apiClient.instance.put('/admin/referrals', payload);
            return unwrapResponse(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Get referral statistics
     */
    getReferralStats: async (params?: {
        startDate?: string;
        endDate?: string;
    }): Promise<any> => {
        if (!isAdmin()) {
            throw new Error('Only admins can view referral stats');
        }
        try {
            const response = await apiClient.instance.get('/admin/referrals/stats', { params });
            return unwrapResponse(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // ============================================================
    // BUNDLES MANAGEMENT
    // ============================================================

    /**
     * Get all bundles
     */
    getAllBundles: async (params?: {
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<{
        bundles: any[];
        pagination: Pagination;
    }> => {
        if (!isAdmin()) {
            throw new Error('Only admins can view all bundles');
        }
        try {
            const { data } = await apiClient.instance.get('/admin/bundles', { params });
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Get single bundle
     */
    getBundle: async (bundleId: string): Promise<any> => {
        if (!isAdmin()) {
            throw new Error('Only admins can view bundle details');
        }
        try {
            const response = await apiClient.instance.get(`/admin/bundles/${bundleId}`);
            return unwrapResponse(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Create bundle
     */
    createBundle: async (payload: {
        name: string;
        description?: string;
        courseIds: string[];
        price: number;
        discount?: number;
        isActive?: boolean;
    }): Promise<any> => {
        if (!isAdmin()) {
            throw new Error('Only admins can create bundles');
        }
        try {
            const response = await apiClient.instance.post('/admin/bundles', payload);
            return unwrapResponse(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Update bundle
     */
    updateBundle: async (bundleId: string, payload: {
        name?: string;
        description?: string;
        courseIds?: string[];
        price?: number;
        discount?: number;
        isActive?: boolean;
    }): Promise<any> => {
        if (!isAdmin()) {
            throw new Error('Only admins can update bundles');
        }
        try {
            const response = await apiClient.instance.put(`/admin/bundles/${bundleId}`, payload);
            return unwrapResponse(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Delete bundle
     */
    deleteBundle: async (bundleId: string): Promise<void> => {
        if (!isAdmin()) {
            throw new Error('Only admins can delete bundles');
        }
        try {
            await apiClient.instance.delete(`/admin/bundles/${bundleId}`);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // ============================================================
    // WHITEBOARDS MANAGEMENT
    // ============================================================

    /**
     * Get all whiteboards
     */
    getAllWhiteboards: async (params?: {
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<{
        whiteboards: any[];
        pagination: Pagination;
    }> => {
        if (!isAdmin()) {
            throw new Error('Only admins can view all whiteboards');
        }
        try {
            const { data } = await apiClient.instance.get('/admin/whiteboards', { params });
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Delete whiteboard
     */
    deleteWhiteboard: async (whiteboardId: string): Promise<void> => {
        if (!isAdmin()) {
            throw new Error('Only admins can delete whiteboards');
        }
        try {
            await apiClient.instance.delete(`/admin/whiteboards/${whiteboardId}`);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // ============================================================
    // BANNERS MANAGEMENT
    // ============================================================

    /**
     * Get all banners
     */
    getAllBanners: async (): Promise<{
        banners: any[];
    }> => {
        if (!isAdmin()) {
            throw new Error('Only admins can view all banners');
        }
        try {
            const response = await apiClient.instance.get('/admin/banners');
            // Backend returns { success: true, banners: [...] }
            const data = unwrapResponse(response.data, 'banners');
            const banners = Array.isArray(data) ? data : [];
            // Map backend format (image/link) to frontend format (imageUrl/linkUrl)
            return {
                banners: banners.map((banner: any) => ({
                    ...banner,
                    imageUrl: banner.image,
                    linkUrl: banner.link,
                })),
            };
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Get single banner
     */
    getBanner: async (bannerId: string): Promise<any> => {
        if (!isAdmin()) {
            throw new Error('Only admins can view banner details');
        }
        try {
            const response = await apiClient.instance.get(`/admin/banners/${bannerId}`);
            const data = unwrapResponse(response.data);
            // Map backend response (image/link) to frontend format (imageUrl/linkUrl)
            if (data && typeof data === 'object' && data !== null) {
                const dataObj = data as any;
                return {
                    ...dataObj,
                    imageUrl: dataObj.image,
                    linkUrl: dataObj.link,
                };
            }
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Create banner
     */
    createBanner: async (payload: {
        title: string;
        imageUrl?: string;
        linkUrl?: string;
        position?: 'TOP' | 'SIDEBAR' | 'BOTTOM';
        isActive?: boolean;
        startDate?: string;
        endDate?: string;
        targetAudience?: 'ALL' | 'STUDENTS' | 'TEACHERS';
        description?: string;
        priority?: number;
    }): Promise<any> => {
        if (!isAdmin()) {
            throw new Error('Only admins can create banners');
        }
        try {
            // Backend expects 'image' and 'link', not 'imageUrl' and 'linkUrl'
            const backendPayload: any = {
                title: payload.title,
                position: payload.position || 'TOP',
                isActive: payload.isActive,
                startDate: payload.startDate,
                endDate: payload.endDate,
                targetAudience: payload.targetAudience,
            };
            if (payload.imageUrl) backendPayload.image = payload.imageUrl;
            if (payload.linkUrl) backendPayload.link = payload.linkUrl;
            
            const response = await apiClient.instance.post('/admin/banners', backendPayload);
            const data = unwrapResponse(response.data);
            // Map backend response (image/link) to frontend format (imageUrl/linkUrl)
            if (data && typeof data === 'object' && data !== null) {
                const dataObj = data as any;
                return {
                    ...dataObj,
                    imageUrl: dataObj.image,
                    linkUrl: dataObj.link,
                };
            }
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Update banner
     */
    updateBanner: async (bannerId: string, payload: {
        title?: string;
        imageUrl?: string;
        linkUrl?: string;
        position?: 'TOP' | 'SIDEBAR' | 'BOTTOM';
        isActive?: boolean;
        startDate?: string;
        endDate?: string;
        targetAudience?: 'ALL' | 'STUDENTS' | 'TEACHERS';
        description?: string;
        priority?: number;
    }): Promise<any> => {
        if (!isAdmin()) {
            throw new Error('Only admins can update banners');
        }
        try {
            // Backend expects 'image' and 'link', not 'imageUrl' and 'linkUrl'
            const backendPayload: any = {};
            if (payload.title !== undefined) backendPayload.title = payload.title;
            if (payload.position !== undefined) backendPayload.position = payload.position;
            if (payload.isActive !== undefined) backendPayload.isActive = payload.isActive;
            if (payload.startDate !== undefined) backendPayload.startDate = payload.startDate;
            if (payload.endDate !== undefined) backendPayload.endDate = payload.endDate;
            if (payload.targetAudience !== undefined) backendPayload.targetAudience = payload.targetAudience;
            if (payload.imageUrl !== undefined) backendPayload.image = payload.imageUrl;
            if (payload.linkUrl !== undefined) backendPayload.link = payload.linkUrl;
            
            const response = await apiClient.instance.put(`/admin/banners/${bannerId}`, backendPayload);
            const data = unwrapResponse(response.data);
            // Map backend response (image/link) to frontend format (imageUrl/linkUrl)
            if (data && typeof data === 'object' && data !== null) {
                const dataObj = data as any;
                return {
                    ...dataObj,
                    imageUrl: dataObj.image,
                    linkUrl: dataObj.link,
                };
            }
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Delete banner
     */
    deleteBanner: async (bannerId: string): Promise<void> => {
        if (!isAdmin()) {
            throw new Error('Only admins can delete banners');
        }
        try {
            await apiClient.instance.delete(`/admin/banners/${bannerId}`);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },
};

