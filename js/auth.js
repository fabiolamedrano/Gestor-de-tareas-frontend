export const API_BASE = 'http://localhost:8000';

export function getHeaders() {
    const token = localStorage.getItem('token') || 'fake-token-for-testing';
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

export function isAuthenticated() {
    return true;
}

export function getCurrentUser() {
    return { email: 'demo@ejemplo.com', id: 1 };
}

export function logout() {
    localStorage.removeItem('token');
}

// Se llama cuando el backend responde 401 (token inválido o expirado).
export function handleUnauthorized() {
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    localStorage.setItem('session_expired', '1');
    window.location.href = 'pages/login.html';
}