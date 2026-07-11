/* ============================================
   Portfolio + GitHub Dashboard — App Controller
   ============================================ */

(() => {
    'use strict';

    // ── Config ──
    const CFG = {
        username: 'dev3Masud',
        hiddenRepos: ['dev3masud', 'dev3masud.github.io'],
        cacheKey: 'gh_portfolio_v7',
        cacheTTL: 5 * 60 * 1000,
        api: 'https://api.github.com',
        pagesBase: 'https://dev3masud.github.io',
    };

    // ── Language colors ──
    const COLORS = {
        JavaScript:'#f1e05a', TypeScript:'#3178c6', Python:'#3572A5',
        HTML:'#e34c26', CSS:'#563d7c', Java:'#b07219', 'C++':'#f34b7d',
        C:'#555555', 'C#':'#178600', Go:'#00ADD8', Rust:'#dea584',
        Ruby:'#701516', PHP:'#4F5D95', Swift:'#F05138', Kotlin:'#A97BFF',
        Dart:'#00B4AB', Shell:'#89e051', Vue:'#41b883', Svelte:'#ff3e00',
        SCSS:'#c6538c', Lua:'#000080', R:'#198CE7', Dockerfile:'#384d54',
        Makefile:'#427819', Markdown:'#083fa1', Jupyter:'#DA5B0B',
        EJS:'#a91e50', Nix:'#7e7eff', Astro:'#ff5a03', Zig:'#ec915c',
    };

    // ── State ──
    let allRepos = [];
    let filter = 'all', sort = 'updated', search = '';

    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);

    // ── Init ──
    document.addEventListener('DOMContentLoaded', () => {
        document.body.classList.add('js-scroll');
        initParticles();
        initScrollAnimations();
        initNav();
        initControls();
        loadData();
    });

    // ════════════════════════════════
    //  Particle Background
    // ════════════════════════════════
    function initParticles() {
        const canvas = $('#particle-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let w, h, particles = [];

        function resize() {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        }

        function createParticle() {
            return {
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                r: Math.random() * 1.5 + 0.5,
                o: Math.random() * 0.4 + 0.1,
            };
        }

        function init() {
            resize();
            particles = Array.from({ length: 60 }, createParticle);
        }

        function draw() {
            ctx.clearRect(0, 0, w, h);
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0) p.x = w;
                if (p.x > w) p.x = 0;
                if (p.y < 0) p.y = h;
                if (p.y > h) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(129,140,248,${p.o})`;
                ctx.fill();
            });

            // Draw connections
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 150) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(99,102,241,${0.06 * (1 - dist / 150)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(draw);
        }

        init();
        draw();
        window.addEventListener('resize', resize);
    }

    // ════════════════════════════════
    //  Scroll Animations
    // ════════════════════════════════
    function initScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, i) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, i * 80);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

        $$('.animate-on-scroll').forEach(el => observer.observe(el));
    }

    // ════════════════════════════════
    //  Navigation
    // ════════════════════════════════
    function initNav() {
        const navbar = $('#navbar');
        const hamburger = $('#nav-hamburger');
        const links = $('#nav-links');

        // Scroll effect
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        });

        // Hamburger
        hamburger?.addEventListener('click', () => {
            links.classList.toggle('open');
        });

        // Active section tracking
        const sections = ['hero', 'activity', 'skills', 'projects', 'contact'];
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    $$('.nav-link').forEach(l => l.classList.remove('active'));
                    const link = $(`.nav-link[data-section="${entry.target.id}"]`);
                    link?.classList.add('active');
                }
            });
        }, { threshold: 0.3, rootMargin: '-80px 0px -50% 0px' });

        sections.forEach(id => {
            const el = $(`#${id}`);
            if (el) sectionObserver.observe(el);
        });

        // Close menu on link click
        $$('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                links.classList.remove('open');
            });
        });
    }

    // ════════════════════════════════
    //  Controls
    // ════════════════════════════════
    function initControls() {
        // Search
        const searchInput = $('#repo-search');
        let debounce;
        searchInput?.addEventListener('input', e => {
            clearTimeout(debounce);
            debounce = setTimeout(() => {
                search = e.target.value.toLowerCase().trim();
                renderProjects();
            }, 200);
        });

        // Filter chips
        $$('.chip').forEach(c => {
            c.addEventListener('click', () => {
                $$('.chip').forEach(b => b.classList.remove('active'));
                c.classList.add('active');
                filter = c.dataset.filter;
                renderProjects();
            });
        });

        // Sort
        $('#sort-select')?.addEventListener('change', e => {
            sort = e.target.value;
            renderProjects();
        });
    }

    // ════════════════════════════════
    //  Data Loading
    // ════════════════════════════════
    async function loadData() {
        const cached = getCache();
        if (cached) renderAll(cached.profile, cached.repos);

        try {
            const [profile, repos] = await Promise.all([
                api(`/users/${CFG.username}`),
                fetchAllRepos(),
            ]);
            setCache({ profile, repos });
            renderAll(profile, repos);
        } catch (e) {
            console.error('API Error:', e);
            if (!cached) showError('GitHub API rate limit reached. Try again shortly.');
        }
    }

    async function api(path) {
        const r = await fetch(`${CFG.api}${path}`);
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
    }

    async function fetchAllRepos() {
        const all = [];
        let page = 1;
        while (true) {
            const batch = await api(`/users/${CFG.username}/repos?per_page=100&sort=updated&page=${page}`);
            all.push(...batch);
            if (batch.length < 100) break;
            page++;
        }
        return all;
    }

    function getCache() {
        try {
            const d = JSON.parse(localStorage.getItem(CFG.cacheKey));
            return d && Date.now() - d.ts < CFG.cacheTTL ? d : null;
        } catch { return null; }
    }

    function setCache(data) {
        try { localStorage.setItem(CFG.cacheKey, JSON.stringify({ ...data, ts: Date.now() })); }
        catch {}
    }

    // ════════════════════════════════
    //  Render All
    // ════════════════════════════════
    function renderAll(profile, repos) {
        allRepos = repos.filter(r => !r.private);
        const visible = allRepos.filter(r => !isHidden(r.name) && !r.fork);

        renderHero(profile, visible);
        renderSkills(visible);
        renderProjects();
        renderFooter();

        // Set GitHub links
        $('#nav-github-link')?.setAttribute('href', profile.html_url);
        $('#contact-github-link')?.setAttribute('href', profile.html_url);
    }

    // ── Hero ──
    function renderHero(p, repos) {
        const avatar = $('#hero-avatar');
        if (avatar) { avatar.src = p.avatar_url; avatar.alt = p.name || p.login; }

        setText('#hero-name', p.name || p.login);

        if (p.bio) {
            setText('#hero-tagline', p.bio);
        }

        const pagesCount = repos.filter(r => r.has_pages).length;
        const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0);
        const langs = new Set(repos.map(r => r.language).filter(Boolean)).size;

        animateNumber('#hero-repos', repos.length);
        animateNumber('#hero-pages', pagesCount);
        animateNumber('#hero-stars', totalStars);
        animateNumber('#hero-langs', langs);
    }

    // ── Skills ──
    function renderSkills(repos) {
        const counts = {};
        repos.forEach(r => {
            if (r.language) counts[r.language] = (counts[r.language] || 0) + 1;
        });

        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        if (!total) return;

        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

        // Bar
        const bar = $('#skills-bar');
        if (bar) {
            bar.innerHTML = sorted.map(([lang, count]) => {
                const pct = (count / total * 100);
                const color = COLORS[lang] || '#6b7280';
                return `<div class="skills-bar-seg" style="width:${pct}%;background:${color}" title="${lang}: ${pct.toFixed(1)}%"></div>`;
            }).join('');
        }

        // Grid
        const grid = $('#skills-grid');
        if (grid) {
            grid.innerHTML = sorted.map(([lang, count]) => {
                const pct = (count / total * 100).toFixed(1);
                const color = COLORS[lang] || '#6b7280';
                return `
                    <div class="skill-card animate-on-scroll">
                        <span class="skill-dot" style="background:${color};color:${color}"></span>
                        <span class="skill-name">${lang}</span>
                        <span class="skill-pct">${pct}%</span>
                        <span class="skill-repos">${count} repo${count > 1 ? 's' : ''}</span>
                    </div>
                `;
            }).join('');

            // Re-observe new animated elements
            const obs = new IntersectionObserver(entries => {
                entries.forEach(e => {
                    if (e.isIntersecting) {
                        e.target.classList.add('visible');
                        obs.unobserve(e.target);
                    }
                });
            }, { threshold: 0.1 });
            grid.querySelectorAll('.animate-on-scroll').forEach(el => obs.observe(el));
        }
    }

    // ── Projects ──
    function renderProjects() {
        const grid = $('#repos-grid');
        const empty = $('#repos-empty');
        if (!grid) return;

        let filtered = allRepos.filter(repo => {
            if (isHidden(repo.name)) return false;
            if (filter === 'pages' && !repo.has_pages) return false;
            if (filter === 'source' && repo.fork) return false;
            if (filter === 'forked' && !repo.fork) return false;
            if (search) {
                const hay = [repo.name, repo.description || '', repo.language || '', ...(repo.topics || [])].join(' ').toLowerCase();
                return hay.includes(search);
            }
            return true;
        });

        // Sort
        filtered = sortRepos(filtered, sort);

        if (!filtered.length) {
            grid.innerHTML = '';
            empty?.classList.remove('hidden');
            return;
        }
        empty?.classList.add('hidden');

        grid.innerHTML = filtered.map((r, i) => projectCard(r, i)).join('');
    }

    function sortRepos(repos, by) {
        const s = [...repos];
        switch (by) {
            case 'updated': return s.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
            case 'stars': return s.sort((a, b) => b.stargazers_count - a.stargazers_count);
            case 'name': return s.sort((a, b) => a.name.localeCompare(b.name));
            case 'created': return s.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            default: return s;
        }
    }

    function projectCard(r, i) {
        const color = COLORS[r.language] || '#6b7280';
        const pUrl = `${CFG.pagesBase}/${r.name}/`;

        let badges = '';
        if (r.has_pages) badges += `<span class="badge badge-pages"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg> Live</span>`;
        if (r.fork) badges += `<span class="badge badge-fork">Fork</span>`;
        if (r.archived) badges += `<span class="badge badge-archived">Archived</span>`;

        let topics = '';
        if (r.topics?.length) {
            topics = `<div class="project-topics">${r.topics.slice(0, 5).map(t => `<span class="topic-tag">${esc(t)}</span>`).join('')}</div>`;
        }

        let visit = '';
        if (r.has_pages) {
            visit = `<a href="${pUrl}" class="project-visit" target="_blank" onclick="event.stopPropagation()">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                Visit Site →
            </a>`;
        }

        return `
            <div class="project-card glass-card" style="animation-delay:${i * 60}ms" onclick="window.open('${r.html_url}','_blank')">
                <div class="project-header">
                    <div class="project-name">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            ${r.fork
                                ? '<line x1="12" y1="2" x2="12" y2="14"/><path d="M18 22V16a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v6"/><circle cx="12" cy="4" r="2"/><circle cx="6" cy="20" r="2"/><circle cx="18" cy="20" r="2"/>'
                                : '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>'
                            }
                        </svg>
                        ${esc(r.name)}
                    </div>
                    <div class="project-badges">${badges}</div>
                </div>
                ${topics}
                <p class="project-desc">${esc(r.description || 'No description provided.')}</p>
                <div class="project-meta">
                    ${r.language ? `<span class="project-meta-item"><span class="lang-dot" style="background:${color}"></span>${r.language}</span>` : ''}
                    <span class="project-meta-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        ${r.stargazers_count}
                    </span>
                    <span class="project-meta-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="14"/><path d="M18 22V16a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v6"/><circle cx="12" cy="4" r="2"/><circle cx="6" cy="20" r="2"/><circle cx="18" cy="20" r="2"/></svg>
                        ${r.forks_count}
                    </span>
                    <span class="project-meta-item">${timeAgo(r.updated_at)}</span>
                </div>
                ${visit}
            </div>
        `;
    }


    // ── Footer ──
    function renderFooter() {
        setText('#footer-update', `Last synced: ${new Date().toLocaleString()}`);
    }

    // ── Error ──
    function showError(msg) {
        const main = $('#main-content') || $('main') || document.body;
        const el = document.createElement('div');
        el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;z-index:9999;padding:3rem;';
        el.innerHTML = `
            <div style="font-size:3rem;margin-bottom:1rem;">⚠️</div>
            <h2 style="color:var(--text-1);margin-bottom:0.5rem;">Oops!</h2>
            <p style="color:var(--text-3);max-width:400px;">${esc(msg)}</p>
            <button onclick="location.reload()" style="margin-top:1.5rem;padding:10px 28px;border-radius:999px;background:var(--gradient-brand);border:none;color:white;font-size:0.9rem;cursor:pointer;font-family:var(--sans);">Try Again</button>
        `;
        document.body.appendChild(el);
    }

    // ── Helpers ──
    function isHidden(name) { return CFG.hiddenRepos.includes(name.toLowerCase()); }
    function setText(sel, val) { const el = $(sel); if (el) el.textContent = val; }
    function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
    function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

    function animateNumber(sel, target) {
        const el = $(sel);
        if (!el) return;
        const dur = 1400, start = performance.now();
        (function step(now) {
            const p = Math.min((now - start) / dur, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(ease * target);
            if (p < 1) requestAnimationFrame(step);
        })(start);
    }

    function timeAgo(ds) {
        const s = Math.floor((Date.now() - new Date(ds)) / 1000);
        if (s < 60) return 'just now';
        const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
        const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
        const d = Math.floor(h / 24); if (d < 7) return `${d}d ago`;
        const w = Math.floor(d / 7); if (w < 4) return `${w}w ago`;
        const mo = Math.floor(d / 30); if (mo < 12) return `${mo}mo ago`;
        return new Date(ds).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }

})();
