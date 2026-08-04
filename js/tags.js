import { getTags, deleteTag } from './tasks.js';
import { showConfirm } from './confirm.js';

function getTagColor(name) {
    const colors = ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6', '#fb923c', '#22d3ee'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

// currentTag: etiqueta activa actualmente (o null)
// onTagClick: función que recibe el nombre de la etiqueta al hacer clic (filtro)
// onTagDeleted: función opcional que se llama después de eliminar una etiqueta, para que app.js refresque la lista de tareas
export async function renderTags(currentTag, onTagClick, onTagDeleted) {
    const container = document.getElementById('tagList');
    if (!container) return;

    try {
        const tags = await getTags();

        if (!tags || tags.length === 0) {
            container.innerHTML = '<div class="empty-state">Sin etiquetas</div>';
            return;
        }

        container.innerHTML = tags.map(tag => {
            const name = tag.name || tag.TagName || tag;
            const id = tag.id;
            const active = (name === currentTag) ? 'active' : '';
            const color = getTagColor(name);
            return `
                <div class="sidebar-tag-row">
                    <button class="sidebar-btn ${active}" data-tag="${name}">
                        <span class="tag-dot" style="background:${color}"></span>
                        ${name}
                    </button>
                    <button class="tag-delete-btn" data-tag-id="${id}" title="Eliminar etiqueta">✕</button>
                </div>
            `;
        }).join('');

        container.querySelectorAll('.sidebar-btn[data-tag]').forEach(btn => {
            btn.addEventListener('click', () => {
                onTagClick(btn.dataset.tag);
            });
        });

        container.querySelectorAll('.tag-delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const ok = await showConfirm(
                    'Se quitará de todas las tareas que la tengan asignada.',
                    { title: 'Eliminar etiqueta' }
                );
                if (ok) {
                    try {
                        await deleteTag(btn.dataset.tagId);
                        await renderTags(currentTag, onTagClick, onTagDeleted);
                        if (onTagDeleted) onTagDeleted();
                    } catch (error) {
                        console.error('Error al eliminar etiqueta:', error);
                        alert('No se pudo eliminar la etiqueta');
                    }
                }
            });
        });
    } catch (error) {
        console.error('Error al cargar etiquetas:', error);
        container.innerHTML = '<div class="empty-state">Sin etiquetas</div>';
    }
}