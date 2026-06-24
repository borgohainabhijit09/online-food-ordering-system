export const apiClient = {
  get: (url: string) => fetchWithAuth(url, { method: 'GET' }),
  post: (url: string, data: any) => {
    const isFormData = data instanceof FormData;
    return fetchWithAuth(url, { method: 'POST', body: isFormData ? data : JSON.stringify(data), isFormData } as any);
  },
  put: (url: string, data: any) => {
    const isFormData = data instanceof FormData;
    return fetchWithAuth(url, { method: 'PUT', body: isFormData ? data : JSON.stringify(data), isFormData } as any);
  },
  patch: (url: string, data: any) => {
    const isFormData = data instanceof FormData;
    return fetchWithAuth(url, { method: 'PATCH', body: isFormData ? data : JSON.stringify(data), isFormData } as any);
  },
  delete: (url: string) => fetchWithAuth(url, { method: 'DELETE' }),
};

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchWithAuth(url: string, options: RequestInit & { isFormData?: boolean } = {}) {
  const finalUrl = url.startsWith('http') ? url : `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;

  let token = null;
  let tenantSlug = null;
  
  if (typeof window !== 'undefined') {
    // Check if we are in the super-admin section
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const isSuperAdminRoute = pathParts[0] === 'super-admin';
    
    if (isSuperAdminRoute) {
      token = localStorage.getItem('superAdminToken');
    } else if (pathParts[0] === 'admin') {
      // Admin routes use adminToken or impersonatedToken
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
      };
      
      const cookieToken = getCookie('adminToken');
      token = sessionStorage.getItem('impersonatedToken') || localStorage.getItem('adminToken') || cookieToken;
      
      // Sync cookie back to localStorage if it was wiped
      if (token && token === cookieToken && !localStorage.getItem('adminToken') && !sessionStorage.getItem('impersonatedToken')) {
        localStorage.setItem('adminToken', token);
      }
    } else {
      // Customer routes don't use admin auth, just the slug
      if (pathParts.length > 0 && pathParts[0] !== 'login' && pathParts[0] !== 'signup') {
        tenantSlug = pathParts[0];
      }
    }
  }

  const headers: Record<string, string> = {
    ...(!options.isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(tenantSlug ? { 'x-tenant-slug': tenantSlug } : {}),
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(finalUrl, { cache: 'no-store', ...options, headers });

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (pathname.startsWith('/super-admin') && pathname !== '/super-admin/login') {
        localStorage.removeItem('superAdminToken');
        localStorage.removeItem('superAdminMode');
        window.location.href = '/super-admin/login';
      } else if (pathname.startsWith('/admin') && pathname !== '/admin/login' && !pathname.startsWith('/super-admin')) {
        localStorage.removeItem('adminToken');
        document.cookie = 'adminToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        window.location.href = '/admin/login';
      }
    }
  }

  if (response.status === 403) {
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/change-password')) {
      const clone = response.clone();
      try {
        const data = await clone.json();
        if (data.forcePasswordChange) {
          window.location.href = '/admin/change-password';
        }
      } catch (e) {}
    }
  }

  return response;
}
