document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm') || document.querySelector('form');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const emailInput = document.getElementById('email') || document.querySelector('input[type="email"]');
            const passwordInput = document.getElementById('password') || document.querySelector('input[type="password"]');

            const email = emailInput ? emailInput.value.trim() : '';
            const password = passwordInput ? passwordInput.value.trim() : '';

            if (!email || !password) {
                alert('Por favor, ingresa tu correo y contraseña.');
                return;
            }

            // Guardar estado de sesión
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userEmail', email);
            localStorage.setItem('user_email', email);

            // REDIRECCIÓN CORRECTA: Sale de pages/ e ingresa a index.html en la raíz
            window.location.href = '../index.html';
        });
    }
});