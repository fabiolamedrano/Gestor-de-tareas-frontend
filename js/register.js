document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('registerForm');
  const errorMessage = document.getElementById('errorMessage');
  const btnRegister = document.getElementById('btnRegister');

  // Ajusta la URL de acuerdo a tu servidor Backend (FastAPI, Node.js, Express, etc.)
  const API_REGISTER_URL = 'http://localhost:8000/api/auth/register';

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Limpiar mensajes de error previos
    hideError();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validaciones del cliente
    if (!name || !email || !password || !confirmPassword) {
      showError('Por favor, completa todos los campos.');
      return;
    }

    if (password !== confirmPassword) {
      showError('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      showError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      btnRegister.disabled = true;
      btnRegister.textContent = 'Registrando...';

      const response = await fetch(API_REGISTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name,
          email: email,
          password: password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Error al registrar usuario.');
      }

      // Redireccionar al login tras registro exitoso
      alert('¡Cuenta creada con éxito! Por favor inicia sesión.');
      window.location.href = 'login.html';

    } catch (error) {
      showError(error.message);
    } finally {
      btnRegister.disabled = false;
      btnRegister.textContent = 'Registrarse';
    }
  });

  function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.style.display = 'block';
  }

  function hideError() {
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';
  }
});