export const apiClient = {
  get: (url: string) => fetchWithAuth(url, { method: 'GET' }),
  post: (url: string, data: any) => fetchWithAuth(url, { method: 'POST', body: JSON.stringify(data) }),
  put: (url: string, data: any) => fetchWithAuth(url, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (url: string, data: any) => fetchWithAuth(url, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (url: string) => fetchWithAuth(url, { method: 'DELETE' }),
};

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const finalUrl = url.startsWith('http') ? url : `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;

  let token = null;
  let tenantSlug = null;
  
  if (typeof window !== 'undefined') {
    // Check if we are in the super-admin section
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const isSuperAdminRoute = pathParts[0] === 'super-admin';
    
    if (isSuperAdminRoute) {
      token = localStorage.getItem('superAdminToken');
    } else {
      // Fallback to cookie if localStorage is aggressively cleared by mobile browsers
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
      };
      
      const cookieToken = getCookie('adminToken');
      token = sessionStorage.getItem('impersonatedToken') || localStorage.getItem('adminToken') || cookieToken;
      
      // Sync cookie back to localStorage if it was wiped
      if (token === cookieToken && !localStorage.getItem('adminToken') && !sessionStorage.getItem('impersonatedToken')) {
        localStorage.setItem('adminToken', token);
      }
      
      // Extract tenant slug from URL (e.g. /demo-restaurant/checkout -> demo-restaurant)
      if (pathParts.length > 0 && pathParts[0] !== 'admin' && pathParts[0] !== 'login' && pathParts[0] !== 'signup') {
        tenantSlug = pathParts[0];
      }
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(tenantSlug ? { 'x-tenant-slug': tenantSlug } : {}),
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(finalUrl, { ...options, headers });

  if (response.status === 401) {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
      localStorage.removeItem('adminToken');
      document.cookie = 'adminToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      window.location.href = '/admin/login';
    }
  }

  return response;
}
