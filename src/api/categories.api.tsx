import { apiClient } from './apiClient';
import { Category, Pagination } from './types';
import { getErrorMessage, unwrapResponse } from './utils';

export interface CategoriesResponse {
    categories: Category[];
    pagination?: Pagination;
}

export interface CategoryPayload {
    name: string;
    description?: string;
    parentId?: string;
}

export const CategoriesAPI = {
    // Backend: GET /api/categories/
    getCategories: async (params?: {
        page?: number;
        limit?: number;
        parentId?: string;
    }) => {
        try {
            const response = await apiClient.instance.get<CategoriesResponse | Category[]>(
                '/categories/',
                { params }
            );
            let responseData: any = response.data;
            
            // Handle wrapped response structure: { success: true, data: {...} } or { success: true, categories: [...] }
            if (responseData && typeof responseData === 'object' && 'success' in responseData) {
                // If wrapped, extract the data
                if (responseData.categories) {
                    responseData = {
                        categories: responseData.categories,
                        pagination: responseData.pagination
                    };
                } else if (responseData.data) {
                    // If data is an array, treat it as categories
                    if (Array.isArray(responseData.data)) {
                        responseData = {
                            categories: responseData.data,
                            pagination: responseData.pagination
                        };
                    } else {
                        responseData = responseData.data;
                    }
                }
            }
            
            // If response is directly an array, wrap it
            if (Array.isArray(responseData)) {
                return {
                    categories: responseData,
                    pagination: undefined
                };
            }
            
            return responseData;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: GET /api/categories/:id
    getCategory: async (id: string) => {
        try {
            const response = await apiClient.instance.get<Category>(
                `/categories/${id}`
            );
            return unwrapResponse<Category>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: POST /api/categories/ (Admin only)
    createCategory: async (payload: CategoryPayload) => {
        try {
            const response = await apiClient.instance.post<Category>(
                '/categories/',
                payload
            );
            return unwrapResponse<Category>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: PUT /api/categories/:id (Admin only)
    updateCategory: async (id: string, payload: Partial<CategoryPayload>) => {
        try {
            const response = await apiClient.instance.put<Category>(
                `/categories/${id}`,
                payload
            );
            return unwrapResponse<Category>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: DELETE /api/categories/:id (Admin only)
    deleteCategory: async (id: string) => {
        try {
            const response = await apiClient.instance.delete<{ success: boolean; message?: string }>(
                `/categories/${id}`
            );
            return response.data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },
};

