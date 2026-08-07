import { API_BASE, getHeaders, handleUnauthorized } from './auth.js';
import { getTaskById } from './tasks.js';
import { showConfirm } from './confirm.js';

function checkUnauthorized(response) {
    if (response.status === 401) {
        handleUnauthorized();
        return new Promise(() => {});
    }
    return null;
}

// API Calls de subtareas
async function apiCreateSubtask(taskId, title) {
    const response = await fetch(`${API_BASE}/subtasks/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ task_id: Number(taskId), title })
    });
    const unauthorized = checkUnauthorized(response);
    if (unauthorized) return unauthorized;
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al crear subtarea');
    }
    return response.json();
}

async function apiUpdateSubtask(id, title, isCompleted) {
    const response = await fetch(`${API_BASE}/subtasks/`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ id: Number(id), title, is_completed: isCompleted })
    });
    const unauthorized = checkUnauthorized(response);
    if (unauthorized) return unauthorized;
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al actualizar subtarea');
    }
    return response.json();
}

async function apiDeleteSubtask(id) {
    const response = await fetch(`${API_BASE}/subtasks/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    const unauthorized = checkUnauthorized(response);
    if (unauthorized) return unauthorized;
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al eliminar subtarea');
    }
    return true;
}

// onChange: callback opcional para refrescar la lista de tareas de fondo
// (así la barra de progreso de la tarjeta se actualiza aunque el modal siga abierto)
export async function renderSubtasks(taskId, container, onChange) {
    try {
        const task = await getTaskById(taskId);
        const subtasks = task.subtasks || [];

        let html = '<div class="subtask-list">';
        if (subtasks.length === 0) {
            html += '<div class="empty-state">Sin subtareas</div>';
        } else {
            subtasks.forEach(st => {
                html += `
                    <div class="subtask-item" data-subtask-id="${st.id}">
                        <button class="subtask-check ${st.done ? 'done' : ''}" data-action="toggle-subtask"></button>
                        <span class="subtask-label ${st.done ? 'done' : ''}">${escapeHtml(st.text)}</span>
                        <div class="subtask-actions">
                            <button data-action="edit-subtask" title="Editar">✎</button>
                            <button data-action="delete-subtask" title="Eliminar">✕</button>
                        </div>
                    </div>
                `;
            });
        }
        html += `
            <div class="subtask-add">
                <input type="text" placeholder="Nueva subtarea…" id="newSubtaskInput" />
                <button id="addSubtaskBtn">+ Añadir</button>
            </div>
        </div>`;
        container.innerHTML = html;

        // ---- Eventos ----
        container.querySelectorAll('[data-action="toggle-subtask"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const item = btn.closest('.subtask-item');
                if (!item) return;
                const subtaskId = item.dataset.subtaskId;
                const wasDone = btn.classList.contains('done');
                const label = item.querySelector('.subtask-label').textContent;
                try {
                    await apiUpdateSubtask(subtaskId, label, !wasDone);
                    await renderSubtasks(taskId, container, onChange);
                    if (onChange) onChange();
                } catch (error) {
                    console.error('Error al marcar subtarea:', error);
                }
            });
        });

        container.querySelectorAll('[data-action="delete-subtask"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const item = btn.closest('.subtask-item');
                if (!item) return;
                const subtaskId = item.dataset.subtaskId;
                const ok = await showConfirm('¿Eliminar esta subtarea?', { title: 'Eliminar subtarea' });
                if (ok) {
                    try {
                        await apiDeleteSubtask(subtaskId);
                        await renderSubtasks(taskId, container, onChange);
                        if (onChange) onChange();
                    } catch (error) {
                        console.error('Error al eliminar subtarea:', error);
                    }
                }
            });
        });

        container.querySelectorAll('[data-action="edit-subtask"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const item = btn.closest('.subtask-item');
                if (!item) return;
                const subtaskId = item.dataset.subtaskId;
                const isDone = item.querySelector('.subtask-check').classList.contains('done');
                const label = item.querySelector('.subtask-label');
                if (!label) return;
                const currentText = label.textContent;
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'subtask-edit-input';
                input.value = currentText;
                label.replaceWith(input);
                input.focus();

                const save = async () => {
                    const newText = input.value.trim();
                    if (newText && newText !== currentText) {
                        try {
                            await apiUpdateSubtask(subtaskId, newText, isDone);
                            await renderSubtasks(taskId, container, onChange);
                            if (onChange) onChange();
                        } catch (error) {
                            console.error('Error al editar subtarea:', error);
                        }
                    } else {
                        const span = document.createElement('span');
                        span.className = 'subtask-label';
                        span.textContent = currentText;
                        input.replaceWith(span);
                    }
                };
                input.addEventListener('blur', save);
                input.addEventListener('keydown', (ev) => {
                    if (ev.key === 'Enter') { ev.preventDefault(); input.blur(); }
                    if (ev.key === 'Escape') { input.value = currentText; input.blur(); }
                });
            });
        });

        const addInput = container.querySelector('#newSubtaskInput');
        const addBtn = container.querySelector('#addSubtaskBtn');
        if (addBtn && addInput) {
            const add = async () => {
                const text = addInput.value.trim();
                if (text) {
                    try {
                        await apiCreateSubtask(taskId, text);
                        await renderSubtasks(taskId, container, onChange);
                        if (onChange) onChange();
                    } catch (error) {
                        console.error('Error al crear subtarea:', error);
                    }
                }
            };
            addBtn.addEventListener('click', add);
            addInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); add(); }
            });
        }
    } catch (error) {
        console.error('Error al renderizar subtareas:', error);
        container.innerHTML = '<div class="empty-state">Error al cargar subtareas</div>';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}