const API_BASE = 'http://localhost:8000';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorBox = document.getElementById('loginError');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();

            if (!email || !password) {
                showError('Por favor, ingresa tu correo y contraseña.');
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                if (!response.ok) {
                    const error = await response.json();
                    showError(error.detail || 'Correo o contraseña incorrectos');
                    return;
                }

                const data = await response.json();

                // Guardar el token real y los datos del usuario
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('user_id', data.user_id);
                localStorage.setItem('user_email', data.email);

                window.location.href = '../index.html';
            } catch (error) {
                console.error('Error al iniciar sesión:', error);
                showError('No se pudo conectar con el servidor. ¿El backend está corriendo?');
            }
        });
    }

    function showError(message) {
        if (errorBox) {
            errorBox.textContent = message;
            errorBox.style.display = 'block';
        } else {
            alert(message);
        }
    }
});