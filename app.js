/* ============================================
   GitHub Dashboard — Main Application
   dev3Masud GitHub Activity Tracker
   ============================================ */

(() => {
    'use strict';

    // ── Configuration ──
    const CONFIG = {
        username: 'dev3Masud',
        // Repos to hide by default (username repo + hosting repo)
        hiddenRepos: ['dev3masud', 'dev3masud.github.io'],
        cacheKey: 'gh_dash_cache_v5',
        cacheTTL: 5 * 60 * 1000, // 5 minutes
        apiBase: 'https://api.github.com',
        pagesBase: 'https://dev3masud.github.io',
    };

    // ── Language Colors ──
    const LANG_COLORS = {
        JavaScript: '#f1e05a',
        TypeScript: '#3178c6',
        Python: '#3572A5',
        HTML: '#e34c26',
        CSS: '#563d7c',
        Java: '#b07219',
        'C++': '#f34b7d',
        C: '#555555',
        'C#': '#178600',
        Go: '#00ADD8',
        Rust: '#dea584',
        Ruby: '#701516',
        PHP: '#4F5D95',
        Swift: '#F05138',
        Kotlin: '#A97BFF',
        Dart: '#00B4AB',
        Shell: '#89e051',
        Vue: '#41b883',
        Svelte: '#ff3e00',
        SCSS: '#c6538c',
        Lua: '#000080',
        Jupyter: '#DA5B0B',
        R: '#198CE7',
        Dockerfile: '#384d54',
        Makefile: '#427819',
        Markdown: '#083fa1',
    };

    // ── State ──
    let allRepos = [];
    let currentFilter = 'all';
    let currentSort = 'updated';
    let searchQuery = '';

    // ── DOM References ──
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // ── Initialization ──
    document.addEventListener('DOMContentLoaded', init);

    async function init() {
        console.log('GitHub Dashboard: Initializing...');
        setupEventListeners();
        await loadData();
    }

    // ── Event Listeners ──
    function setupEventListeners() {
        // Search
        const searchInput = $('#repo-search');
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    searchQuery = e.target.value.toLowerCase().trim();
                    renderRepos();
                }, 200);
            });
        }

        // Filter buttons
        $$('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                $$('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.filter;
                renderRepos();
            });
        });

        // Sort
        const sortSelect = $('#sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                currentSort = e.target.value;
                renderRepos();
            });
        }
    }

    // ── Data Loading ──
    async function loadData() {
        // Try cache first
        const cached = loadCache();
        if (cached) {
            console.log('GitHub Dashboard: Using cached data');
            renderAll(cached.profile, cached.repos, cached.events);
        }

        try {
            const [profile, repos, events] = await Promise.all([
                fetchJSON(`${CONFIG.apiBase}/users/${CONFIG.username}`),
                fetchAllRepos(),
                fetchJSON(`${CONFIG.apiBase}/users/${CONFIG.username}/events?per_page=30`),
            ]);

            saveCache({ profile, repos, events });
            renderAll(profile, repos, events);
            console.log('GitHub Dashboard: Data loaded from API');
        } catch (err) {
            console.error('GitHub Dashboard: API Error:', err);
            if (!cached) {
                showError('Failed to load data. GitHub API may be rate-limited. Try again in a minute.');
            }
        }
    }

    async function fetchJSON(url) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
        return res.json();
    }

    async function fetchAllRepos() {
        const repos = [];
        let page = 1;
        while (true) {
            const batch = await fetchJSON(
                `${CONFIG.apiBase}/users/${CONFIG.username}/repos?per_page=100&sort=updated&page=${page}`
            );
            repos.push(...batch);
            if (batch.length < 100) break;
            page++;
        }
        return repos;
    }

    // ── Caching ──
    function loadCache() {
        try {
            const raw = localStorage.getItem(CONFIG.cacheKey);
            if (!raw) return null;
            const data = JSON.parse(raw);
            if (Date.now() - data.timestamp > CONFIG.cacheTTL) return null;
            return data;
        } catch {
            return null;
        }
    }

    function saveCache(data) {
        try {
            localStorage.setItem(CONFIG.cacheKey, JSON.stringify({
                ...data,
                timestamp: Date.now(),
            }));
        } catch { /* ignore quota errors */ }
    }

    // ── Render All ──
    function renderAll(profile, repos, events) {
        allRepos = repos.filter(r => !r.private);
        renderProfile(profile);
        renderStats(profile, allRepos);
        renderActivity(events);
        renderLanguages(allRepos);
        renderRepos();
        updateFooter();
    }

    // ── Profile ──
    function renderProfile(p) {
        const avatar = $('#profile-avatar');
        if (avatar) {
            avatar.src = p.avatar_url;
            avatar.alt = `${p.name || p.login}'s avatar`;
        }

        setText('#profile-name', p.name || p.login);
        setText('#header-username', `@${p.login}`);
        setText('#profile-bio', p.bio || '');

        const profileLink = $('#github-profile-link');
        if (profileLink) profileLink.href = p.html_url;

        // Location
        const locEl = $('#profile-location');
        if (locEl) {
            if (p.location) {
                locEl.classList.remove('hidden');
                locEl.querySelector('span').textContent = p.location;
            }
        }

        // Company
        const compEl = $('#profile-company');
        if (compEl) {
            if (p.company) {
                compEl.classList.remove('hidden');
                compEl.querySelector('span').textContent = p.company;
            }
        }

        // Joined date
        const joinedEl = $('#profile-joined');
        if (joinedEl) {
            joinedEl.querySelector('span').textContent = `Joined ${formatDate(p.created_at)}`;
        }
    }

    // ── Stats ──
    function renderStats(profile, repos) {
        const pagesCount = repos.filter(r => r.has_pages && !isHiddenRepo(r.name)).length;
        const visibleRepos = repos.filter(r => !isHiddenRepo(r.name) && !r.fork);

        animateCounter('#stat-repos-value', visibleRepos.length);
        animateCounter('#stat-followers-value', profile.followers);
        animateCounter('#stat-following-value', profile.following);
        animateCounter('#stat-pages-value', pagesCount);
    }

    function animateCounter(selector, target) {
        const el = $(selector);
        if (!el) return;

        const duration = 1200;
        const start = performance.now();

        function step(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            el.textContent = Math.round(eased * target);
            if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    // ── Activity Timeline ──
    function renderActivity(events) {
        const container = $('#activity-timeline');
        if (!container || !events) return;

        // Filter to meaningful events
        const meaningful = events
            .filter(e => ['PushEvent', 'CreateEvent', 'WatchEvent', 'ForkEvent',
                           'IssuesEvent', 'PullRequestEvent', 'DeleteEvent', 'ReleaseEvent',
                           'IssueCommentEvent', 'PullRequestReviewEvent'].includes(e.type))
            .slice(0, 10);

        if (meaningful.length === 0) {
            container.innerHTML = '<p style="color:var(--text-muted);padding:var(--space-md);text-align:center;">No recent activity</p>';
            return;
        }

        container.innerHTML = meaningful.map((event, i) => {
            const { icon, iconClass, title } = formatEvent(event);
            return `
                <div class="activity-item" style="animation-delay:${i * 60}ms">
                    <div class="activity-icon ${iconClass}">${icon}</div>
                    <div class="activity-content">
                        <div class="activity-title">${title}</div>
                        <div class="activity-time">${timeAgo(event.created_at)}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function formatEvent(event) {
        const repoName = event.repo?.name?.split('/')[1] || event.repo?.name || '';
        const repoUrl = `https://github.com/${event.repo?.name}`;

        switch (event.type) {
            case 'PushEvent': {
                const commits = event.payload?.commits?.length || 0;
                return {
                    icon: '⬆️',
                    iconClass: 'push',
                    title: `Pushed ${commits} commit${commits !== 1 ? 's' : ''} to <a href="${repoUrl}" target="_blank">${repoName}</a>`,
                };
            }
            case 'CreateEvent': {
                const refType = event.payload?.ref_type || 'repository';
                const ref = event.payload?.ref;
                return {
                    icon: '✨',
                    iconClass: 'create',
                    title: ref
                        ? `Created ${refType} <strong>${ref}</strong> in <a href="${repoUrl}" target="_blank">${repoName}</a>`
                        : `Created ${refType} <a href="${repoUrl}" target="_blank">${repoName}</a>`,
                };
            }
            case 'WatchEvent':
                return {
                    icon: '⭐',
                    iconClass: 'star',
                    title: `Starred <a href="${repoUrl}" target="_blank">${repoName}</a>`,
                };
            case 'ForkEvent':
                return {
                    icon: '🍴',
                    iconClass: 'fork',
                    title: `Forked <a href="${repoUrl}" target="_blank">${repoName}</a>`,
                };
            case 'IssuesEvent': {
                const action = event.payload?.action || 'updated';
                return {
                    icon: '🔵',
                    iconClass: 'issue',
                    title: `${capitalize(action)} issue in <a href="${repoUrl}" target="_blank">${repoName}</a>`,
                };
            }
            case 'PullRequestEvent': {
                const action = event.payload?.action || 'updated';
                return {
                    icon: '🔀',
                    iconClass: 'pr',
                    title: `${capitalize(action)} PR in <a href="${repoUrl}" target="_blank">${repoName}</a>`,
                };
            }
            case 'DeleteEvent': {
                const refType = event.payload?.ref_type || 'branch';
                return {
                    icon: '🗑️',
                    iconClass: 'delete',
                    title: `Deleted ${refType} in <a href="${repoUrl}" target="_blank">${repoName}</a>`,
                };
            }
            case 'ReleaseEvent':
                return {
                    icon: '🚀',
                    iconClass: 'release',
                    title: `Published release in <a href="${repoUrl}" target="_blank">${repoName}</a>`,
                };
            case 'IssueCommentEvent':
                return {
                    icon: '💬',
                    iconClass: 'issue',
                    title: `Commented on issue in <a href="${repoUrl}" target="_blank">${repoName}</a>`,
                };
            case 'PullRequestReviewEvent':
                return {
                    icon: '👁️',
                    iconClass: 'pr',
                    title: `Reviewed PR in <a href="${repoUrl}" target="_blank">${repoName}</a>`,
                };
            default:
                return {
                    icon: '📋',
                    iconClass: 'default',
                    title: `Activity in <a href="${repoUrl}" target="_blank">${repoName}</a>`,
                };
        }
    }

    // ── Language Distribution ──
    function renderLanguages(repos) {
        const container = $('#languages-chart');
        if (!container) return;

        // Count languages across visible repos
        const langCounts = {};
        const visibleRepos = repos.filter(r => !isHiddenRepo(r.name) && !r.fork);

        visibleRepos.forEach(repo => {
            if (repo.language) {
                langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
            }
        });

        const total = Object.values(langCounts).reduce((a, b) => a + b, 0);
        if (total === 0) {
            container.innerHTML = '<p style="color:var(--text-muted);padding:var(--space-md);text-align:center;">No language data available</p>';
            return;
        }

        // Sort by count descending
        const sorted = Object.entries(langCounts)
            .sort((a, b) => b[1] - a[1]);

        // Generate bar
        const barHTML = sorted.map(([lang, count]) => {
            const pct = (count / total * 100);
            const color = LANG_COLORS[lang] || '#6b7280';
            return `<div class="lang-bar-segment" style="width:${pct}%;background:${color}" title="${lang}: ${pct.toFixed(1)}%"></div>`;
        }).join('');

        // Generate legend
        const legendHTML = sorted.map(([lang, count]) => {
            const pct = (count / total * 100).toFixed(1);
            const color = LANG_COLORS[lang] || '#6b7280';
            return `
                <div class="lang-item">
                    <span class="lang-dot" style="background:${color}"></span>
                    <span>${lang}</span>
                    <span class="lang-percent">${pct}%</span>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="lang-bar-container">${barHTML}</div>
            <div class="lang-legend">${legendHTML}</div>
        `;
    }

    // ── Repository Grid ──
    function renderRepos() {
        const grid = $('#repos-grid');
        const emptyState = $('#repos-empty');
        if (!grid) return;

        // Filter repos
        let filtered = allRepos.filter(repo => {
            // Always hide the default repos
            if (isHiddenRepo(repo.name)) return false;

            // Filter by type
            if (currentFilter === 'pages' && !repo.has_pages) return false;
            if (currentFilter === 'source' && repo.fork) return false;
            if (currentFilter === 'forked' && !repo.fork) return false;

            // Search
            if (searchQuery) {
                const haystack = [
                    repo.name,
                    repo.description || '',
                    repo.language || '',
                    ...(repo.topics || []),
                ].join(' ').toLowerCase();
                return haystack.includes(searchQuery);
            }

            return true;
        });

        // Sort repos
        filtered = sortRepos(filtered, currentSort);

        if (filtered.length === 0) {
            grid.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');

        grid.innerHTML = filtered.map((repo, i) => createRepoCard(repo, i)).join('');
    }

    function sortRepos(repos, sortBy) {
        const sorted = [...repos];
        switch (sortBy) {
            case 'updated':
                return sorted.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
            case 'stars':
                return sorted.sort((a, b) => b.stargazers_count - a.stargazers_count);
            case 'name':
                return sorted.sort((a, b) => a.name.localeCompare(b.name));
            case 'created':
                return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            default:
                return sorted;
        }
    }

    function createRepoCard(repo, index) {
        const langColor = LANG_COLORS[repo.language] || '#6b7280';
        const pagesUrl = `${CONFIG.pagesBase}/${repo.name}/`;

        // Badges
        let badges = '';
        if (repo.has_pages) {
            badges += `<span class="badge badge-pages">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg>
                Pages
            </span>`;
        }
        if (repo.fork) {
            badges += `<span class="badge badge-fork">Fork</span>`;
        }
        if (repo.archived) {
            badges += `<span class="badge badge-archived">Archived</span>`;
        }

        // Topics
        let topicsHTML = '';
        if (repo.topics && repo.topics.length > 0) {
            topicsHTML = `<div class="repo-topics" style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:var(--space-sm);">
                ${repo.topics.slice(0, 5).map(t => `<span style="padding:2px 8px;border-radius:var(--radius-full);background:rgba(99,102,241,0.1);color:var(--accent-primary);font-size:0.7rem;font-weight:500;">${t}</span>`).join('')}
            </div>`;
        }

        // Pages link
        let pagesLinkHTML = '';
        if (repo.has_pages) {
            pagesLinkHTML = `
                <a href="${pagesUrl}" class="repo-pages-link" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                    Visit Site →
                </a>
            `;
        }

        return `
            <div class="repo-card glass-card" style="animation-delay:${index * 50}ms" onclick="window.open('${repo.html_url}','_blank')">
                <div class="repo-header">
                    <div class="repo-name">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            ${repo.fork
                                ? '<line x1="12" y1="2" x2="12" y2="14"></line><path d="M18 22V16a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v6"></path><circle cx="12" cy="4" r="2"></circle><circle cx="6" cy="20" r="2"></circle><circle cx="18" cy="20" r="2"></circle>'
                                : '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>'
                            }
                        </svg>
                        ${escapeHTML(repo.name)}
                    </div>
                    <div class="repo-badges">${badges}</div>
                </div>
                ${topicsHTML}
                <p class="repo-description">${escapeHTML(repo.description || 'No description provided')}</p>
                <div class="repo-meta">
                    ${repo.language ? `
                        <span class="repo-meta-item">
                            <span class="repo-lang-dot" style="background:${langColor}"></span>
                            ${repo.language}
                        </span>
                    ` : ''}
                    <span class="repo-meta-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        ${repo.stargazers_count}
                    </span>
                    <span class="repo-meta-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="2" x2="12" y2="14"></line>
                            <path d="M18 22V16a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v6"></path>
                            <circle cx="12" cy="4" r="2"></circle>
                            <circle cx="6" cy="20" r="2"></circle>
                            <circle cx="18" cy="20" r="2"></circle>
                        </svg>
                        ${repo.forks_count}
                    </span>
                    <span class="repo-meta-item">
                        Updated ${timeAgo(repo.updated_at)}
                    </span>
                </div>
                ${pagesLinkHTML}
            </div>
        `;
    }

    // ── Footer ──
    function updateFooter() {
        const el = $('#footer-update');
        if (el) {
            el.textContent = `Last updated: ${new Date().toLocaleString()}`;
        }
    }

    // ── Error Display ──
    function showError(msg) {
        const main = $('#main-content');
        if (!main) return;
        main.innerHTML = `
            <div style="text-align:center;padding:4rem 1rem;">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--rose)" stroke-width="1.5" style="margin-bottom:1rem;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                <h2 style="color:var(--text-primary);margin-bottom:0.5rem;">Oops!</h2>
                <p style="color:var(--text-secondary);max-width:500px;margin:0 auto;">${escapeHTML(msg)}</p>
                <button onclick="location.reload()" style="margin-top:1.5rem;padding:0.5rem 1.5rem;border-radius:9999px;background:linear-gradient(135deg,var(--accent-secondary),var(--purple));border:none;color:white;font-size:0.9rem;cursor:pointer;font-family:var(--font-sans);">
                    Try Again
                </button>
            </div>
        `;
    }

    // ── Helpers ──
    function isHiddenRepo(name) {
        return CONFIG.hiddenRepos.includes(name.toLowerCase());
    }

    function setText(sel, text) {
        const el = $(sel);
        if (el) el.textContent = text;
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
        });
    }

    function timeAgo(dateStr) {
        const now = new Date();
        const date = new Date(dateStr);
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHr = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHr / 24);
        const diffWeek = Math.floor(diffDay / 7);
        const diffMonth = Math.floor(diffDay / 30);

        if (diffSec < 60) return 'just now';
        if (diffMin < 60) return `${diffMin}m ago`;
        if (diffHr < 24) return `${diffHr}h ago`;
        if (diffDay < 7) return `${diffDay}d ago`;
        if (diffWeek < 4) return `${diffWeek}w ago`;
        if (diffMonth < 12) return `${diffMonth}mo ago`;
        return formatDate(dateStr);
    }

})();
