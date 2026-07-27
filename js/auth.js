// js/auth.js - Versión sin autenticación obligatoria
const API_BASE = 'http://localhost:8000';

// No hacemos login, solo ponemos un token falso para que las peticiones no fallen
function getHeaders() {
    // Si no hay token, usamos uno falso (pero la API no lo validará)
    const token = localStorage.getItem('token') || 'fake-token-for-testing';
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Función dummy para que app.js no falle
function isAuthenticated() {
    return true; // Siempre autenticado para pruebas
}

function getCurrentUser() {
    return { email: 'demo@ejemplo.com', id: 1 };
}

function logout() {
    localStorage.removeItem('token');
    // No redirigimos a login porque no existe
}

window.auth = { 
    API_BASE, 
    getHeaders, 
    isAuthenticated, 
    getCurrentUser, 
    logout 
};