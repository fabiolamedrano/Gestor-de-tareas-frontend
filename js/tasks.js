import { API_BASE, getHeaders, handleUnauthorized } from './auth.js';

// Convierte el "detail" de un error de FastAPI en un texto legible,
function formatApiError(error, fallback) {
    if (!error || !error.detail) return fallback;
    if (typeof error.detail === 'string') return error.detail;
    if (Array.isArray(error.detail)) {
        return error.detail.map(e => `${e.loc?.[e.loc.length - 1] || 'campo'}: ${e.msg}`).join(' | ');
    }
    return fallback;
}

// Si la respuesta es 401 (token inválido/expirado), redirige al login
function checkUnauthorized(response) {
    if (response.status === 401) {
        handleUnauthorized();
        return new Promise(() => {});
    }
    return null;
}

// Convertir tarea del backend al formato de la UI
function fromBackend(task) {
    return {
        id: task.id,
        title: task.title,
        description: task.description || '',
        priority: task.priority || 'media',
        status: task.status || 'pendiente',
        completed: task.status === 'completada',
        dueDate: task.due_date || null,
        progress: task.progress || 0,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
        tags: task.tags || [],
        subtasks: (task.subtasks || []).map(st => ({
            id: st.id,
            text: st.text || st.title,
            done: st.done || st.is_completed || false
        }))
    };
}

// Convertir tarea de la UI al formato del backend
function toBackend(task, includeId = false) {
    const data = {
        title: task.title,
        description: task.description || '',
        priority: task.priority || 'media',
        status: task.completed ? 'completada' : 'pendiente',
        due_date: task.dueDate || null,
        progress: task.progress || 0,
        tag_names: task.tagNames || []
    };
    if (includeId && task.id) {
        data.id = task.id;
    } else {
        // Solo se manda en creación (el backend lo requiere para saber de quién es la tarea)
        data.user_id = Number(localStorage.getItem('user_id'));
    }
    return data;
}

// API Calls
export async function getTasks() {
    try {
        const response = await fetch(`${API_BASE}/tasks/`, { headers: getHeaders() });
        const unauthorized = checkUnauthorized(response);
        if (unauthorized) return unauthorized;
        if (!response.ok) {
            const error = await response.json();
            throw new Error(formatApiError(error, 'Error al obtener tareas'));
        }
        const data = await response.json();
        return data.map(fromBackend);
    } catch (error) {
        console.error('Error en getTasks:', error);
        return [];
    }
}

export async function getTaskById(id) {
    const response = await fetch(`${API_BASE}/tasks/${id}`, { headers: getHeaders() });
    const unauthorized = checkUnauthorized(response);
    if (unauthorized) return unauthorized;
    if (!response.ok) {
        const error = await response.json();
        throw new Error(formatApiError(error, 'Error al obtener tarea'));
    }
    const data = await response.json();
    return fromBackend(data);
}

export async function createTask(taskData) {
    const body = toBackend(taskData);
    const response = await fetch(`${API_BASE}/tasks/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
    });
    const unauthorized = checkUnauthorized(response);
    if (unauthorized) return unauthorized;
    if (!response.ok) {
        const error = await response.json();
        throw new Error(formatApiError(error, 'Error al crear tarea'));
    }
    const data = await response.json();
    return fromBackend(data);
}

export async function updateTask(taskData) {
    const body = toBackend(taskData, true);
    const response = await fetch(`${API_BASE}/tasks/`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body)
    });
    const unauthorized = checkUnauthorized(response);
    if (unauthorized) return unauthorized;
    if (!response.ok) {
        const error = await response.json();
        throw new Error(formatApiError(error, 'Error al actualizar tarea'));
    }
    const data = await response.json();
    return fromBackend(data);
}

export async function deleteTask(id) {
    const response = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    const unauthorized = checkUnauthorized(response);
    if (unauthorized) return unauthorized;
    if (!response.ok) {
        const error = await response.json();
        throw new Error(formatApiError(error, 'Error al eliminar tarea'));
    }
    return true;
}

export async function toggleTaskComplete(id) {
    const task = await getTaskById(id);
    task.completed = !task.completed;
    return updateTask(task);
}

export async function deleteTag(id) {
    const response = await fetch(`${API_BASE}/tags/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    const unauthorized = checkUnauthorized(response);
    if (unauthorized) return unauthorized;
    if (!response.ok) {
        const error = await response.json();
        throw new Error(formatApiError(error, 'Error al eliminar etiqueta'));
    }
    return true;
}

// Obtener etiquetas
export async function getTags() {
    const userId = localStorage.getItem('user_id');
    try {
        const response = await fetch(`${API_BASE}/tags/user/${userId}`, { headers: getHeaders() });
        const unauthorized = checkUnauthorized(response);
        if (unauthorized) return unauthorized;
        if (response.ok) {
            const data = await response.json();
            return data;
        }
    } catch (e) {
        const tasks = await getTasks();
        const tagSet = new Set();
        tasks.forEach(t => {
            if (t.tags) t.tags.forEach(tag => {
                const name = typeof tag === 'string' ? tag : tag.name || tag.TagName;
                if (name) tagSet.add(name);
            });
        });
        return Array.from(tagSet).map(name => ({ name }));
    }
}