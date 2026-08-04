// Modal de confirmación con el estilo de la app, en lugar del confirm() nativo del navegador.

export function showConfirm(message, options = {}) {
    const { title = 'Confirmar', confirmText = 'Eliminar', danger = true } = options;

    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay new-task-modal';
        overlay.innerHTML = `
            <div class="modal-box" style="width:360px;">
                <div style="padding:24px;">
                    <h3 style="margin:0 0 10px; font-size:16px; color:var(--text);">${title}</h3>
                    <p style="margin:0 0 20px; font-size:13px; color:var(--text-muted); line-height:1.5;">${message}</p>
                    <div class="actions">
                        <button class="cancel-btn" id="confirmCancelBtn">Cancelar</button>
                        <button class="create-btn" id="confirmOkBtn" style="${danger ? 'background:var(--danger);' : ''}">${confirmText}</button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modalContainer').appendChild(overlay);

        const cleanup = (result) => {
            overlay.remove();
            resolve(result);
        };

        overlay.querySelector('#confirmCancelBtn').addEventListener('click', () => cleanup(false));
        overlay.querySelector('#confirmOkBtn').addEventListener('click', () => cleanup(true));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) cleanup(false);
        });
    });
}