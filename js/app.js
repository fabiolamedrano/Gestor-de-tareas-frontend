import { getTasks, createTask, updateTask, getTaskById, toggleTaskComplete, deleteTask } from './tasks.js';
import { renderTags } from './tags.js';
import { renderSubtasks } from './subtasks.js';

let tasks = [];
let currentFilter = 'all';
let searchQuery = '';
let selectedPriority = null;
let selectedTag = null;

// INICIALIZACIÓN
async function initApp() {
    // Cargar tema guardado
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === savedTheme);
    });

    // Token de prueba (si no hay) (esto solo mientras no haya login)
    if (!localStorage.getItem('token')) {
        localStorage.setItem('token', 'demo-token');
        localStorage.setItem('user_email', 'demo@ejemplo.com');
    }

    // Usuario en sidebar
    const email = localStorage.getItem('user_email') || '';
    const avatar = document.getElementById('userAvatar');
    const emailEl = document.getElementById('userEmail');
    if (email && avatar && emailEl) {
        avatar.textContent = email.slice(0, 2).toUpperCase();
        emailEl.textContent = email;
    }

    // Cargar tareas y renderizar
    await loadTasks();
    renderApp();
    bindEvents();
    renderTags(selectedTag, onTagClick);
}

// CARGAR TAREAS
async function loadTasks() {
    try {
        tasks = await getTasks();
    } catch (error) {
        console.error('Error al cargar tareas:', error);
        tasks = [];
    }
}

// FILTRO DE ETIQUETA
function onTagClick(tag) {
    selectedTag = (selectedTag === tag) ? null : tag;
    renderApp();
    renderTags(selectedTag, onTagClick);
}

// FILTROS Y ESTADÍSTICAS
function getFilteredTasks() {
    let result = tasks;
    if (currentFilter === 'pendientes') result = result.filter(t => !t.completed);
    else if (currentFilter === 'completadas') result = result.filter(t => t.completed);
    if (selectedPriority) result = result.filter(t => t.priority === selectedPriority);
    if (selectedTag) {
        result = result.filter(t => t.tags && t.tags.some(tag => {
            const name = typeof tag === 'string' ? tag : tag.name || tag.TagName;
            return name === selectedTag;
        }));
    }
    if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        result = result.filter(t =>
            t.title.toLowerCase().includes(q) ||
            (t.description && t.description.toLowerCase().includes(q))
        );
    }
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return result;
}

function getStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const overdue = tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length;
    return { total, completed, pending, overdue };
}

// RENDER PRINCIPAL
function renderApp() {
    const filtered = getFilteredTasks();
    const stats = getStats();
    updateHeader(filtered.length);
    renderStats(stats);
    renderTabs();
    renderTaskList(filtered);
    renderPriorityList();
    renderActivity(tasks.slice(0, 5));
    renderPriorityChart();
}

// HEADER
function updateHeader(count) {
    const title = document.getElementById('pageTitle');
    const counter = document.getElementById('taskCounter');
    const dot = document.getElementById('priorityDot');

    if (title) {
        let label = 'Todas las tareas';
        if (currentFilter === 'pendientes') label = 'Pendientes';
        else if (currentFilter === 'completadas') label = 'Completadas';
        if (selectedPriority) label += ` · Prioridad ${selectedPriority}`;
        if (selectedTag) label += ` · #${selectedTag}`;
        title.textContent = label;
    }

    if (counter) {
        counter.textContent = `${count} tarea${count !== 1 ? 's' : ''}`;
    }

    if (dot) {
        const colors = { alta: '#f87171', media: '#fbbf24', baja: '#34d399' };
        dot.style.background = selectedPriority ? colors[selectedPriority] || 'var(--accent)' : 'var(--accent)';
    }
}

// STATS
function renderStats(stats) {
    const grid = document.getElementById('statsGrid');
    if (!grid) return;
    grid.innerHTML = `
        <div class="stat-card">
            <p class="stat-number">${stats.total}</p>
            <p class="stat-label">Total</p>
            <p class="stat-sub">Todas las tareas</p>
        </div>
        <div class="stat-card">
            <p class="stat-number">${stats.pending}</p>
            <p class="stat-label">Pendientes</p>
            <p class="stat-sub">${stats.overdue > 0 ? stats.overdue + ' vencidas' : 'Sin vencidas'}</p>
        </div>
        <div class="stat-card">
            <p class="stat-number">${stats.completed}</p>
            <p class="stat-label">Completadas</p>
            <p class="stat-sub">${stats.total > 0 ? Math.round((stats.completed/stats.total)*100) : 0}% completado</p>
        </div>
        <div class="stat-card">
            <p class="stat-number">${stats.overdue}</p>
            <p class="stat-label">Vencidas</p>
            <p class="stat-sub">${stats.overdue > 0 ? '⚠️ Revisar' : '¡Sin retrasos!'}</p>
        </div>
    `;
}

// TABS
function renderTabs() {
    const bar = document.getElementById('tabsBar');
    if (!bar) return;
    const filters = [
        { key: 'all', label: ' Todas' },
        { key: 'pendientes', label: ' Pendientes' },
        { key: 'completadas', label: ' Completadas' }
    ];
    bar.innerHTML = filters.map(f =>
        `<button class="tab-btn ${f.key === currentFilter ? 'active' : ''}" data-filter="${f.key}">${f.label}</button>`
    ).join('');

    bar.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.filter;
            renderApp();
        });
    });
}

// LISTA DE TAREAS
function renderTaskList(filteredTasks) {
    const container = document.getElementById('contentArea');
    if (!container) return;

    if (filteredTasks.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay tareas que coincidan con los filtros</div>';
        return;
    }

    container.innerHTML = filteredTasks.map(task => {
        const subtaskCount = task.subtasks ? task.subtasks.length : 0;
        const doneSubtasks = task.subtasks ? task.subtasks.filter(s => s.done).length : 0;
        const progress = subtaskCount > 0 ? Math.round((doneSubtasks / subtaskCount) * 100) : 0;
        const isOverdue = !task.completed && task.dueDate && new Date(task.dueDate) < new Date();
        const priorityColor = { alta: 'var(--danger)', media: 'var(--warning)', baja: 'var(--success)' }[task.priority] || 'var(--text-faint)';

        return `
            <div class="task-card" style="border-left-color: ${priorityColor};" data-task-id="${task.id}">
                <div class="task-row">
                    <button class="task-checkbox ${task.completed ? 'done' : ''}" data-action="toggle-task"></button>
                    <div class="task-content">
                        <p class="task-title ${task.completed ? 'done' : ''}">${escapeHtml(task.title)}</p>
                        ${task.description ? `<p class="task-desc">${escapeHtml(task.description)}</p>` : ''}
                        <div class="task-meta">
                            ${task.priority ? `<span class="task-status badge-${task.priority}">${task.priority}</span>` : ''}
                            ${task.dueDate ? `<span class="task-due ${isOverdue ? 'overdue' : ''}">📅 ${formatDate(task.dueDate)} ${isOverdue ? '⚠️' : ''}</span>` : ''}
                            ${task.tags && task.tags.length > 0 ? task.tags.map(t => {
                                const name = typeof t === 'string' ? t : t.name || t.TagName;
                                return `<span class="task-status" style="background:var(--accent-soft);">#${escapeHtml(name)}</span>`;
                            }).join('') : ''}
                            ${subtaskCount > 0 ? `
                                <div class="progress-wrap">
                                    <div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div>
                                    <span class="progress-label">${doneSubtasks}/${subtaskCount}</span>
                                </div>
                            ` : ''}
                            <button class="task-view-btn" data-action="view-task">Ver detalles</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.querySelectorAll('[data-action="toggle-task"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const card = btn.closest('.task-card');
            if (!card) return;
            const taskId = card.dataset.taskId;
            try {
                await toggleTaskComplete(taskId);
                await loadTasks();
                renderApp();
            } catch (error) {
                console.error('Error al alternar tarea:', error);
            }
        });
    });

    container.querySelectorAll('[data-action="view-task"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.task-card');
            if (!card) return;
            const taskId = card.dataset.taskId;
            openTaskDetail(taskId);
        });
    });
}

// SIDEBAR: PRIORIDADES
function renderPriorityList() {
    const container = document.getElementById('priorityList');
    if (!container) return;
    const priorities = ['alta', 'media', 'baja'];
    const labels = { alta: 'Alta', media: 'Media', baja: 'Baja' };
    const colors = { alta: '#f87171', media: '#fbbf24', baja: '#34d399' };

    const counts = { alta: 0, media: 0, baja: 0 };
    tasks.forEach(t => {
        if (t.priority && counts.hasOwnProperty(t.priority)) counts[t.priority]++;
    });

    container.innerHTML = priorities.map(p => `
        <button class="sidebar-btn ${p === selectedPriority ? 'active' : ''}" data-priority="${p}">
            <span class="dot" style="background:${colors[p]}"></span>
            ${labels[p]}
            <span class="badge">${counts[p]}</span>
        </button>
    `).join('');

    container.querySelectorAll('.sidebar-btn[data-priority]').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedPriority = selectedPriority === btn.dataset.priority ? null : btn.dataset.priority;
            renderApp();
        });
    });
}

// ACTIVIDAD
function renderActivity(recentTasks) {
    const container = document.getElementById('activityList');
    if (!container) return;
    if (recentTasks.length === 0) {
        container.innerHTML = '<div class="empty-state">Sin actividad reciente</div>';
        return;
    }
    container.innerHTML = recentTasks.map(task => `
        <div class="activity-item">
            <div class="activity-icon" style="background:${task.completed ? 'var(--success)' : 'var(--accent)'}">
                ${task.completed ? '✓' : '⏳'}
            </div>
            <div>
                <div class="activity-text"><span>${escapeHtml(task.title)}</span> ${task.completed ? 'completada' : 'actualizada'}</div>
                <div class="activity-time">${timeAgo(task.createdAt)}</div>
            </div>
        </div>
    `).join('');
}

// GRÁFICO PRIORIDADES
function renderPriorityChart() {
    const container = document.getElementById('priorityChart');
    if (!container) return;
    const counts = { alta: 0, media: 0, baja: 0 };
    tasks.forEach(t => {
        if (t.priority && counts.hasOwnProperty(t.priority)) counts[t.priority]++;
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    const colors = { alta: '#f87171', media: '#fbbf24', baja: '#34d399' };
    const labels = { alta: 'Alta', media: 'Media', baja: 'Baja' };

    container.innerHTML = `
        <div class="priority-bar">
            ${Object.keys(counts).map(p => `
                <div>
                    <div class="priority-row">
                        <span class="label">${labels[p]}</span>
                        <span class="value">${counts[p]}</span>
                    </div>
                    <div class="priority-track">
                        <div class="priority-fill" style="width:${(counts[p]/total)*100}%; background:${colors[p]};"></div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// MODAL DETALLE
function openTaskDetail(taskId) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-box">
            <div class="modal-header">
                <div class="top-row">
                    <h2 id="modalTaskTitle">Cargando...</h2>
                    <button class="modal-close" data-action="close-modal">✕</button>
                </div>
                <div class="meta-tags" id="modalMetaTags"></div>
            </div>
            <div class="modal-body">
                <p id="modalTaskDesc"></p>
                <div>
                    <h5>Subtareas</h5>
                    <div class="subtask-list-container"></div>
                </div>
                <div style="display:flex; gap:8px; justify-content:flex-end; border-top:1px solid var(--border); padding-top:12px;">
                    <button class="cancel-btn" data-action="close-modal">Cerrar</button>
                    <button class="cancel-btn" id="modalEditTask">✎ Editar</button>
                    <button class="btn-primary" id="modalToggleComplete">Marcar completada</button>
                    <button class="danger" style="background:var(--danger); color:white; padding:9px 14px; border-radius:8px; border:none;" id="modalDeleteTask">Eliminar</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modalContainer').appendChild(overlay);

    let currentTask = null;

    async function loadAndRenderDetail() {
        currentTask = await getTaskById(taskId);
        overlay.querySelector('#modalTaskTitle').textContent = currentTask.title;
        overlay.querySelector('#modalTaskDesc').textContent = currentTask.description || 'Sin descripción';
        overlay.querySelector('#modalToggleComplete').textContent = currentTask.completed ? 'Marcar pendiente' : 'Marcar completada';

        const metaContainer = overlay.querySelector('#modalMetaTags');
        let metaHtml = '';
        if (currentTask.priority) metaHtml += `<span class="task-status badge-${currentTask.priority}">${currentTask.priority}</span>`;
        if (currentTask.dueDate) metaHtml += `<span class="task-due">📅 ${formatDate(currentTask.dueDate)}</span>`;
        if (currentTask.tags && currentTask.tags.length > 0) {
            currentTask.tags.forEach(t => {
                const name = typeof t === 'string' ? t : t.name || t.TagName;
                metaHtml += `<span class="task-status" style="background:var(--accent-soft);">#${escapeHtml(name)}</span>`;
            });
        }
        metaContainer.innerHTML = metaHtml;

        const subtaskCount = currentTask.subtasks ? currentTask.subtasks.length : 0;
        const doneCount = currentTask.subtasks ? currentTask.subtasks.filter(s => s.done).length : 0;
        const progressPct = subtaskCount > 0 ? Math.round((doneCount / subtaskCount) * 100) : 0;
        const progressContainer = overlay.querySelector('#modalProgressContainer');
        if (progressContainer) {
            progressContainer.innerHTML = subtaskCount > 0 ? `
                <div class="progress-wrap">
                    <div class="progress-track"><div class="progress-fill" style="width:${progressPct}%"></div></div>
                    <span class="progress-label">${doneCount}/${subtaskCount} · ${progressPct}%</span>
                </div>
            ` : '';
        }

        const subContainer = overlay.querySelector('.subtask-list-container');
        if (subContainer) {
            renderSubtasks(taskId, subContainer, async () => {
                await loadTasks();
                renderApp();
            });
        }
    }

    overlay.querySelectorAll('[data-action="close-modal"]').forEach(el => {
        el.addEventListener('click', () => overlay.remove());
    });
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });

    overlay.querySelector('#modalToggleComplete').addEventListener('click', async () => {
        await toggleTaskComplete(taskId);
        await loadTasks();
        overlay.remove();
        renderApp();
    });

    overlay.querySelector('#modalDeleteTask').addEventListener('click', async () => {
        if (confirm('¿Eliminar esta tarea definitivamente?')) {
            await deleteTask(taskId);
            await loadTasks();
            overlay.remove();
            renderApp();
        }
    });

    overlay.querySelector('#modalEditTask').addEventListener('click', () => {
        openEditTaskModal(currentTask, async () => {
            await loadAndRenderDetail();
            await loadTasks();
            renderApp();
        });
    });

    loadAndRenderDetail().catch(error => {
        console.error('Error al cargar tarea:', error);
        overlay.querySelector('#modalTaskTitle').textContent = 'Error al cargar';
    });
}

// MODAL EDITAR TAREA
function openEditTaskModal(task, onSaved) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay new-task-modal';

    const dueDateValue = task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '';
    const currentTagNames = (task.tags || []).map(t => typeof t === 'string' ? t : (t.name || t.TagName)).join(', ');

    overlay.innerHTML = `
        <div class="modal-box">
            <div style="padding:20px 24px;">
                <h2>Editar tarea</h2>
                <div class="field-group">
                    <label>Título *</label>
                    <input type="text" id="editTaskTitle" value="${escapeHtml(task.title)}" />
                </div>
                <div class="field-group">
                    <label>Descripción</label>
                    <textarea id="editTaskDesc" rows="2">${escapeHtml(task.description || '')}</textarea>
                </div>
                <div class="row">
                    <div class="field-group">
                        <label>Prioridad</label>
                        <select id="editTaskPriority">
                            <option value="baja" ${task.priority === 'baja' ? 'selected' : ''}>Baja</option>
                            <option value="media" ${task.priority === 'media' ? 'selected' : ''}>Media</option>
                            <option value="alta" ${task.priority === 'alta' ? 'selected' : ''}>Alta</option>
                        </select>
                    </div>
                    <div class="field-group">
                        <label>Fecha límite</label>
                        <input type="date" id="editTaskDue" value="${dueDateValue}" />
                    </div>
                </div>
                <div class="field-group">
                    <label>Etiquetas (separadas por comas)</label>
                    <input type="text" id="editTaskTags" value="${escapeHtml(currentTagNames)}" placeholder="ej. trabajo, personal" />
                </div>
                <div class="actions">
                    <button class="cancel-btn" data-action="close-modal">Cancelar</button>
                    <button class="create-btn" id="confirmEditTask">Guardar cambios</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modalContainer').appendChild(overlay);

    overlay.querySelectorAll('[data-action="close-modal"]').forEach(el => {
        el.addEventListener('click', () => overlay.remove());
    });
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });

    overlay.querySelector('#confirmEditTask').addEventListener('click', async () => {
        const title = overlay.querySelector('#editTaskTitle').value.trim();
        if (!title) {
            alert('El título es obligatorio');
            return;
        }
        const description = overlay.querySelector('#editTaskDesc').value.trim();
        const priority = overlay.querySelector('#editTaskPriority').value;
        const dueDate = overlay.querySelector('#editTaskDue').value;
        const tagsInput = overlay.querySelector('#editTaskTags').value;
        const tagNames = tagsInput ? tagsInput.split(',').map(s => s.trim()).filter(Boolean) : [];

        try {
            await updateTask({
                id: task.id,
                title,
                description,
                priority,
                dueDate: dueDate || null,
                completed: task.completed,
                tagNames
            });
            overlay.remove();
            if (onSaved) await onSaved();
        } catch (error) {
            console.error('Error al editar tarea:', error);
            alert('Error al guardar los cambios');
        }
    });
}

// MODAL NUEVA TAREA
function openNewTaskModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay new-task-modal';
    overlay.innerHTML = `
        <div class="modal-box">
            <div style="padding:20px 24px;">
                <h2>Nueva tarea</h2>
                <div class="field-group">
                    <label>Título *</label>
                    <input type="text" id="newTaskTitle" placeholder="Escribe el título" />
                </div>
                <div class="field-group">
                    <label>Descripción</label>
                    <textarea id="newTaskDesc" rows="2" placeholder="Descripción opcional"></textarea>
                </div>
                <div class="row">
                    <div class="field-group">
                        <label>Prioridad</label>
                        <select id="newTaskPriority">
                            <option value="baja">Baja</option>
                            <option value="media" selected>Media</option>
                            <option value="alta">Alta</option>
                        </select>
                    </div>
                    <div class="field-group">
                        <label>Fecha límite</label>
                        <input type="date" id="newTaskDue" />
                    </div>
                </div>
                <div class="field-group">
                    <label>Etiquetas (separadas por comas)</label>
                    <input type="text" id="newTaskTags" placeholder="ej. trabajo, personal" />
                </div>
                <div class="actions">
                    <button class="cancel-btn" data-action="close-modal">Cancelar</button>
                    <button class="create-btn" id="confirmNewTask">Crear</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modalContainer').appendChild(overlay);

    overlay.querySelectorAll('[data-action="close-modal"]').forEach(el => {
        el.addEventListener('click', () => overlay.remove());
    });
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });

    overlay.querySelector('#confirmNewTask').addEventListener('click', async () => {
        const title = overlay.querySelector('#newTaskTitle').value.trim();
        if (!title) {
            alert('El título es obligatorio');
            return;
        }
        const description = overlay.querySelector('#newTaskDesc').value.trim();
        const priority = overlay.querySelector('#newTaskPriority').value;
        const dueDate = overlay.querySelector('#newTaskDue').value;
        const tagsInput = overlay.querySelector('#newTaskTags').value;
        const tagNames = tagsInput ? tagsInput.split(',').map(s => s.trim()).filter(Boolean) : [];

        try {
            await createTask({
                title,
                description,
                priority,
                dueDate: dueDate || null,
                completed: false,
                tagNames,
                subtasks: []
            });
            await loadTasks();
            overlay.remove();
            renderApp();
        } catch (error) {
            console.error('Error al crear tarea:', error);
            alert('Error al crear la tarea');
        }
    });
}

// EVENTOS GLOBALES
function bindEvents() {
    // Hamburguesa
    const hamburger = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (hamburger && sidebar && backdrop) {
        const toggleSidebar = () => {
            sidebar.classList.toggle('open');
            backdrop.classList.toggle('open');
        };
        hamburger.addEventListener('click', toggleSidebar);
        backdrop.addEventListener('click', toggleSidebar);
    }

    // Nueva tarea
    document.getElementById('newTaskBtn')?.addEventListener('click', openNewTaskModal);

    // Búsqueda
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let timeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                searchQuery = searchInput.value;
                renderApp();
            }, 300);
        });
    }

    // Menú de usuario
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userMenuDropdown = document.getElementById('userMenuDropdown');
    const arrowEl = userMenuBtn?.querySelector('.arrow');

    if (userMenuBtn && userMenuDropdown) {
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = userMenuDropdown.style.display === 'block';
            userMenuDropdown.style.display = isOpen ? 'none' : 'block';
            if (arrowEl) arrowEl.classList.toggle('open', !isOpen);
        });

        document.addEventListener('click', (e) => {
            if (!userMenuBtn.contains(e.target) && !userMenuDropdown.contains(e.target)) {
                userMenuDropdown.style.display = 'none';
                if (arrowEl) arrowEl.classList.remove('open');
            }
        });
    }

    // Botones de tema
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const theme = btn.dataset.theme;
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (userMenuDropdown) {
                userMenuDropdown.style.display = 'none';
                if (arrowEl) arrowEl.classList.remove('open');
            }
        });
    });

    // Logout
    const logoutBtn = document.querySelector('.user-dropdown .danger');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user_email');
            localStorage.removeItem('user_id');
            location.reload();
        });
    }

    // Configuración y Notificaciones
    document.querySelectorAll('.user-dropdown .menu-btn:not(.danger)').forEach(btn => {
        btn.addEventListener('click', () => {
            alert(`Has hecho clic en "${btn.textContent.trim()}"`);
            if (userMenuDropdown) {
                userMenuDropdown.style.display = 'none';
                if (arrowEl) arrowEl.classList.remove('open');
            }
        });
    });
}

// UTILIDADES
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function timeAgo(isoDate) {
    const now = new Date();
    const past = new Date(isoDate);
    const diffMs = now - past;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'hace un momento';
    if (diffMin < 60) return `hace ${diffMin} min`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `hace ${diffHour} h`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `hace ${diffDay} d`;
    return formatDate(isoDate);
}

// ARRANCAR
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}