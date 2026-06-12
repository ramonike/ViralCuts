import { API_URL, API_ENDPOINTS } from '../config/api';

export async function fetchUsers(page = 1, pageSize = 20, search = '') {
    const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
    });

    if (search) {
        params.append('search', search);
    }

    const response = await fetch(`${API_ENDPOINTS.ADMIN.USERS}?${params}`, {
        credentials: 'include',
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch users');
    }

    return response.json();
}
