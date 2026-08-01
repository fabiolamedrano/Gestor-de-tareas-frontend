import { getTags } from './tasks.js';

function getTagColor(name) {
    const colors = ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6', '#fb923c', '#22d3ee'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

export async function renderTags(currentTag, onTagClick) {
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
            const active = (name === currentTag) ? 'active' : '';
            const color = getTagColor(name);
            return `
                <button class="sidebar-btn ${active}" data-tag="${name}">
                    <span class="tag-dot" style="background:${color}"></span>
                    ${name}
                </button>
            `;
        }).join('');

        container.querySelectorAll('.sidebar-btn[data-tag]').forEach(btn => {
            btn.addEventListener('click', () => {
                onTagClick(btn.dataset.tag);
            });
        });
    } catch (error) {
        console.error('Error al cargar etiquetas:', error);
        container.innerHTML = '<div class="empty-state">Sin etiquetas</div>';
    }
}