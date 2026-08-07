// Notificaciones flotantes con el estilo de la app, en vez de alert() nativo.

let container = null;

function ensureContainer() {
    if (container) return container;
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

export function showToast(message, type = 'error') {
    const box = ensureContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    box.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 250);
    }, 3000);
}