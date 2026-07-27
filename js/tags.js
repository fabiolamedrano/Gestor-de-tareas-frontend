// js/tags.js
(function() {
    'use strict';

    async function renderTags() {
        const container = document.getElementById('tagList');
        if (!container) return;

        try {
            const tags = await window.tasksAPI.getTags();
            const currentTag = window.getCurrentTagFilter ? window.getCurrentTagFilter() : null;

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
                    const tag = btn.dataset.tag;
                    if (window.setTagFilter) window.setTagFilter(tag);
                });
            });
        } catch (error) {
            console.error('Error al cargar etiquetas:', error);
            container.innerHTML = '<div class="empty-state">Sin etiquetas</div>';
        }
    }

    function getTagColor(name) {
        const colors = ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6', '#fb923c', '#22d3ee'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }

    window.tagsUI = { renderTags };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderTags);
    } else {
        renderTags();
    }
})();