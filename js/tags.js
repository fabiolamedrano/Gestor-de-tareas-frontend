import { getTags, deleteTag } from './tasks.js';
import { showConfirm } from './confirm.js';
import { showToast } from './toast.js';

const MAX_VISIBLE_TAGS = 6;

function getTagColor(name) {
    const colors = ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6', '#fb923c', '#22d3ee'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

function buildTagRowsHtml(tagList, currentTag) {
    return tagList.map(tag => {
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
}

// Conecta los clics de filtrar y eliminar dentro de cualquier contenedor que tenga filas de etiquetas
// (se usa tanto en el sidebar como dentro del modal "Ver todas")
function bindTagRowEvents(container, currentTag, onTagClick, onTagDeleted, refreshFn) {
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
                    await refreshFn();
                    if (onTagDeleted) onTagDeleted();
                    showToast('Etiqueta eliminada', 'success');
                } catch (error) {
                    console.error('Error al eliminar etiqueta:', error);
                    showToast('No se pudo eliminar la etiqueta');
                }
            }
        });
    });
}

// currentTag: etiqueta activa actualmente (o null)
// onTagClick: función que recibe el nombre de la etiqueta al hacer clic (filtro)
// onTagDeleted: función opcional que se llama después de eliminar una etiqueta,
//               para que app.js refresque la lista de tareas
export async function renderTags(currentTag, onTagClick, onTagDeleted) {
    const container = document.getElementById('tagList');
    if (!container) return;

    try {
        const tags = await getTags();

        if (!tags || tags.length === 0) {
            container.innerHTML = '<div class="empty-state">Sin etiquetas</div>';
            return;
        }

        const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS);
        const hasMore = tags.length > MAX_VISIBLE_TAGS;

        container.innerHTML = buildTagRowsHtml(visibleTags, currentTag) +
            (hasMore ? `<button class="see-all-tags-btn" id="seeAllTagsBtn">Ver todas (${tags.length}) →</button>` : '');

        const refresh = () => renderTags(currentTag, onTagClick, onTagDeleted);
        bindTagRowEvents(container, currentTag, onTagClick, onTagDeleted, refresh);

        const seeAllBtn = container.querySelector('#seeAllTagsBtn');
        if (seeAllBtn) {
            seeAllBtn.addEventListener('click', () => {
                openAllTagsModal(tags, currentTag, onTagClick, onTagDeleted);
            });
        }
    } catch (error) {
        console.error('Error al cargar etiquetas:', error);
        container.innerHTML = '<div class="empty-state">Sin etiquetas</div>';
    }
}

// Modal con la lista completa de etiquetas, cuando hay más de MAX_VISIBLE_TAGS
function openAllTagsModal(tags, currentTag, onTagClick, onTagDeleted) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-box" style="width:340px;">
            <div class="modal-header">
                <div class="top-row">
                    <h2 style="margin:0; font-size:16px; color:var(--text);">Todas las etiquetas</h2>
                    <button class="modal-close" id="closeAllTagsModal">✕</button>
                </div>
            </div>
            <div class="modal-body" id="allTagsList" style="max-height:420px; overflow-y:auto; padding-top:12px;"></div>
        </div>
    `;
    document.getElementById('modalContainer').appendChild(overlay);

    const listContainer = overlay.querySelector('#allTagsList');
    listContainer.innerHTML = buildTagRowsHtml(tags, currentTag);

    // Al elegir una etiqueta desde el modal, se filtra y se cierra el modal
    const refresh = async () => {
        overlay.remove();
        openAllTagsModal(
            (await getTags()),
            currentTag,
            onTagClick,
            onTagDeleted
        );
    };
    bindTagRowEvents(listContainer, currentTag, (tag) => {
        overlay.remove();
        onTagClick(tag);
    }, onTagDeleted, refresh);

    overlay.querySelector('#closeAllTagsModal').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
}