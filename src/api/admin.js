import { fetchAPI } from '../lib/api-client';

export async function fetchUsers(page = 1, pageSize = 20, search = '') {
    const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
    });

    if (search) {
        params.append('search', search);
    }

    return fetchAPI(`/admin/users?${params}`);
}
