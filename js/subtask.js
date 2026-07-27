// js/subtasks.js
(function() {
    'use strict';

    window.renderSubtasks = async function(taskId, container) {
        try {
            const task = await window.tasksAPI.getTaskById(taskId);
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

            // Eventos...
            container.querySelectorAll('[data-action="toggle-subtask"]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const item = btn.closest('.subtask-item');
                    if (!item) return;
                    const subtaskId = item.dataset.subtaskId;
                    await toggleSubtask(taskId, subtaskId);
                });
            });

            container.querySelectorAll('[data-action="delete-subtask"]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const item = btn.closest('.subtask-item');
                    if (!item) return;
                    const subtaskId = item.dataset.subtaskId;
                    if (confirm('¿Eliminar esta subtarea?')) {
                        await deleteSubtask(taskId, subtaskId);
                    }
                });
            });

            container.querySelectorAll('[data-action="edit-subtask"]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const item = btn.closest('.subtask-item');
                    if (!item) return;
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
                            await updateSubtaskText(taskId, subtaskId, newText);
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
                        await addSubtask(taskId, text);
                        addInput.value = '';
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
    };

    // Funciones auxiliares
    async function toggleSubtask(taskId, subtaskId) {
        const task = await window.tasksAPI.getTaskById(taskId);
        const subtask = task.subtasks.find(s => s.id == subtaskId);
        if (subtask) {
            subtask.done = !subtask.done;
            await window.tasksAPI.updateTask(task);
            const container = document.querySelector('.modal-body .subtask-list-container');
            if (container) window.renderSubtasks(taskId, container);
        }
    }

    async function deleteSubtask(taskId, subtaskId) {
        const task = await window.tasksAPI.getTaskById(taskId);
        task.subtasks = task.subtasks.filter(s => s.id != subtaskId);
        await window.tasksAPI.updateTask(task);
        const container = document.querySelector('.modal-body .subtask-list-container');
        if (container) window.renderSubtasks(taskId, container);
    }

    async function updateSubtaskText(taskId, subtaskId, newText) {
        const task = await window.tasksAPI.getTaskById(taskId);
        const subtask = task.subtasks.find(s => s.id == subtaskId);
        if (subtask) {
            subtask.text = newText;
            await window.tasksAPI.updateTask(task);
            const container = document.querySelector('.modal-body .subtask-list-container');
            if (container) window.renderSubtasks(taskId, container);
        }
    }

    async function addSubtask(taskId, text) {
        const task = await window.tasksAPI.getTaskById(taskId);
        const newSub = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
            text: text,
            done: false
        };
        task.subtasks.push(newSub);
        await window.tasksAPI.updateTask(task);
        const container = document.querySelector('.modal-body .subtask-list-container');
        if (container) window.renderSubtasks(taskId, container);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
})();