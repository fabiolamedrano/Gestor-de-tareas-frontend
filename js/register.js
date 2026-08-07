document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const errorBox = document.getElementById('registerError'); // Cambiado al ID del segundo código
    const btnRegister = document.getElementById('btnRegister');

    // Mantenemos la URL que SÍ funciona (del segundo código)
    const API_BASE = 'http://localhost:8000';

    function showError(message) {
        if (errorBox) {
            errorBox.classList.remove('success');
            errorBox.textContent = message;
            errorBox.style.display = 'block';
        } else {
            alert(message);
        }
    }

    function hideError() {
        if (errorBox) {
            errorBox.textContent = '';
            errorBox.style.display = 'none';
        }
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError();

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (!email || !password || !confirmPassword) {
                showError('Completa todos los campos.');
                return;
            }
            if (password.length < 8) {
                showError('La contraseña debe tener al menos 8 caracteres.');
                return;
            }
            if (password !== confirmPassword) {
                showError('Las contraseñas no coinciden.');
                return;
            }

            try {
                if (btnRegister) {
                    btnRegister.disabled = true;
                    btnRegister.textContent = 'Registrando...';
                }

                const response = await fetch(`${API_BASE}/users/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                if (!response.ok) {
                    const error = await response.json();
                    showError(error.detail || 'No se pudo crear la cuenta.');
                    return;
                }

                localStorage.setItem('account_created', '1');
                window.location.href = 'login.html';

            } catch (error) {
                console.error('Error al registrar:', error);
                showError('No se pudo conectar con el servidor. ¿El backend está corriendo?');
            } finally {
                if (btnRegister) {
                    btnRegister.disabled = false;
                    btnRegister.textContent = 'Registrarse';
                }
            }
        });
    }
});
