/* ==========================================================================
   PREMIUM DYNAMIC GITHUB DASHBOARD CONTROLLER v4.0
   ========================================================================== */

'use strict';

const GITHUB_USERNAME = 'dev3Masud';
const HOST_REPO = `${GITHUB_USERNAME}.github.io`;
const CACHE_KEY = 'gh_dash_cache_v3'; // unique cache key for new structure
const CACHE_TTL = 5 * 60 * 1000;      // 5 minutes cache TTL

const GH_API = `https://api.github.com`;
const GH_USER = `${GH_API}/users/${GITHUB_USERNAME}`;
const GH_PAGES_HOST = `https://${GITHUB_USERNAME.toLowerCase()}.github.io`;

const LANG_COLORS = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572a5', Java: '#b07219',
  'C++': '#f34b7d', C: '#555555', 'C#': '#178600', Go: '#00ADD8', Rust: '#dea584',
  Ruby: '#701516', PHP: '#4F5D95', HTML: '#e34c26', CSS: '#563d7c', SCSS: '#c6538c',
  Shell: '#89e051', Vue: '#41b883', Svelte: '#ff3e00', Swift: '#F05138', Kotlin: '#A97BFF',
  Dart: '#00B4AB', Lua: '#000080', Elixir: '#6e4a7e', Haskell: '#5e5086', R: '#198CE7'
};

// ── State ───────────────────────────────────────────────────────────────────
let rawRepos      = []; // Raw repository array from API
let allRepos      = []; // Repository array filtered for visibility
let activeSort    = 'updated';
let searchQuery   = '';
let userProfile   = null;
let showHidden    = false;
let pagesOnly     = false;

// ── DOM refs ────────────────────────────────────────────────────────────────
let $;

// ── Init ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  $ = id => document.getElementById(id);

  initParticles();
  setFooterYear();

  // Bind Dashboard Buttons
  const refreshBtn = $('refreshBtn');
  const pagesOnlyBtn = $('pagesOnlyBtn');
  const showHiddenBtn = $('showHiddenBtn');

  refreshBtn && refreshBtn.addEventListener('click', () => {
    loadData(true);
  });

  pagesOnlyBtn && pagesOnlyBtn.addEventListener('click', () => {
    pagesOnly = !pagesOnly;
    pagesOnlyBtn.classList.toggle('active', pagesOnly);
    renderRepos();
  });

  showHiddenBtn && showHiddenBtn.addEventListener('click', () => {
    showHidden = !showHidden;
    showHiddenBtn.classList.toggle('active', showHidden);
    const labelSpan = showHiddenBtn.querySelector('span:last-child');
    if (labelSpan) {
      labelSpan.textContent = showHidden ? 'Showing all' : 'Show all';
    }
    applyVisibilityFilters();
    renderAll();
  });

  // Bind Toolbar Search & Sort
  const searchInput = $('searchInput');
  searchInput && searchInput.addEventListener('input', e => {
    searchQuery = e.target.value.trim();
    renderRepos();
  });

  const sortSelect = $('sortSelect');
  sortSelect && sortSelect.addEventListener('change', e => {
    activeSort = e.target.value;
    renderRepos();
  });

  // Sticky Header Scroll Effect
  window.addEventListener('scroll', () => {
    const header = $('site-header');
    if (header) {
      header.classList.toggle('scrolled', window.scrollY > 20);
    }
  }, { passive: true });

  // Load Dashboard Data (from Cache or API)
  loadData();
});

// ═══════════════════════════════════════════════════════════════════════════
// PARTICLE CANVAS ANIMATION
// ═══════════════════════════════════════════════════════════════════════════
function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const PARTICLE_COUNT = 60;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.4,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(99,102,241,${p.alpha})`;
      ctx.fill();
      p.x += p.dx; p.y += p.dy;
      if (p.x < 0 || p.x > canvas.width)  p.dx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
    });
    requestAnimationFrame(draw);
  }
  draw();
}

// ═══════════════════════════════════════════════════════════════════════════
// FOOTER YEAR
// ═══════════════════════════════════════════════════════════════════════════
function setFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
}

// ── Cache Helpers ───────────────────────────────────────────────────────────
function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (Date.now() - cached.ts > CACHE_TTL) return null;
    return cached.data;
  } catch { return null; }
}

function saveCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      ts: Date.now(),
      data
    }));
  } catch {}
}

// ═══════════════════════════════════════════════════════════════════════════
// FETCH ALL REPOSITORIES (PAGINATED RECURSION)
// ═══════════════════════════════════════════════════════════════════════════
async function fetchAllRepos() {
  let all = [], page = 1;
  while (true) {
    const res = await fetch(`${GH_API}/users/${GITHUB_USERNAME}/repos?per_page=100&page=${page}&type=owner&sort=updated`);
    if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    all = all.concat(batch);
    if (batch.length < 100) break;
    page++;
  }
  return all;
}

function applyVisibilityFilters() {
  const myLogin = GITHUB_USERNAME.toLowerCase();
  const portfolioName = `${myLogin}.github.io`;

  allRepos = rawRepos.filter(r => {
    if (!showHidden) {
      if (r.fork) return false;
      if (r.name.toLowerCase() === myLogin) return false;
      if (r.name.toLowerCase() === portfolioName) return false;
    }
    return true;
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD DATA LOADER & RENDER COORDINATOR
// ═══════════════════════════════════════════════════════════════════════════
async function loadData(force = false) {
  console.log('GitHub Dashboard: loadData(force=' + force + ') initiated');
  if (!force) {
    const cached = loadCache();
    if (cached) {
      console.log('GitHub Dashboard: Cache hit found. Render from Cache.', cached);
      userProfile = cached.user;
      rawRepos = cached.repos;
      applyVisibilityFilters();
      renderAll();
      const lastUpdatedEl = $('lastUpdated');
      if (lastUpdatedEl && cached.updatedAt) {
        lastUpdatedEl.textContent = cached.updatedAt;
      }
      return;
    }
  }

  console.log('GitHub Dashboard: Cache miss or force load. Fetching from GitHub API...');
  const refreshBtn = $('refreshBtn');
  const refreshLabel = $('refreshLabel');
  if (refreshBtn) {
    refreshBtn.classList.add('refreshing');
    refreshBtn.disabled = true;
  }
  if (refreshLabel) refreshLabel.textContent = 'Refreshing…';

  try {
    const [user, repos] = await Promise.all([
      fetch(GH_USER).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
      fetchAllRepos()
    ]);
    console.log('GitHub Dashboard: API fetch successful.', { user, reposCount: repos.length });
    userProfile = user;
    rawRepos = repos;
    applyVisibilityFilters();
    
    const updatedAtStr = new Date().toLocaleTimeString();
    saveCache({ user, repos, updatedAt: updatedAtStr });
    
    renderAll();
    
    const lastUpdatedEl = $('lastUpdated');
    if (lastUpdatedEl) lastUpdatedEl.textContent = updatedAtStr;
  } catch (err) {
    console.error('GitHub Dashboard: Error loading GitHub data:', err);
    const reposGrid = $('repos');
    if (reposGrid && rawRepos.length === 0) {
      reposGrid.innerHTML = `
        <div class="state">
          <div class="error" style="color:var(--accent-pink);">⚠ Error loading GitHub data. rate limits may have been hit or connection is offline.</div>
        </div>`;
    }
  } finally {
    if (refreshBtn) {
      refreshBtn.classList.remove('refreshing');
      refreshBtn.disabled = false;
    }
    if (refreshLabel) refreshLabel.textContent = 'Refresh';
  }
}

function renderAll() {
  console.log('GitHub Dashboard: renderAll() triggered.', { hasUserProfile: !!userProfile, reposCount: rawRepos.length, visibleReposCount: allRepos.length });
  if (userProfile) {
    console.log('GitHub Dashboard: Rendering User Profile Card');
    renderUserProfile(userProfile);
  }
  if (rawRepos.length > 0) {
    console.log('GitHub Dashboard: Rendering Stats Grid and Repos Grid');
    computeAndRenderStats();
    renderRepos();
  } else {
    console.warn('GitHub Dashboard: No repositories to render.');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// RENDER USER PROFILE CARD
// ═══════════════════════════════════════════════════════════════════════════
function renderUserProfile(user) {
  const profileEl = $('profile');
  if (!profileEl) return;
  const u = user;
  profileEl.innerHTML = `
    <div class="profile-avatar-frame">
      <div class="avatar-ring"></div>
      <img class="avatar" src="${u.avatar_url}" alt="${u.login}" />
      <div class="online-indicator" title="Open to work"></div>
    </div>
    <div class="profile-info">
      <div class="profile-name">
        ${escape(u.name || u.login)}
        <span class="profile-login">@${escape(u.login)}</span>
      </div>
      ${u.bio ? `<div class="profile-bio">${escape(u.bio)}</div>` : ''}
      <div class="profile-meta">
        ${u.company ? `<span>🏢 ${escape(u.company)}</span>` : ''}
        ${u.location ? `<span>📍 ${escape(u.location)}</span>` : ''}
        ${u.blog ? `<span>🔗 <a href="${u.blog.startsWith('http') ? u.blog : 'https://' + u.blog}" target="_blank" rel="noopener">${escape(u.blog.replace(/^https?:\/\//, ''))}</a></span>` : ''}
        <span>✉️ <a href="mailto:devmasud@proton.me">devmasud@proton.me</a></span>
        <span>👥 <strong>${u.followers}</strong> followers · <strong>${u.following}</strong> following</span>
        <span>📦 <strong>${u.public_repos}</strong> public repos</span>
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════
// RENDER STATS CARDS
// ═══════════════════════════════════════════════════════════════════════════
function computeAndRenderStats() {
  const statsEl = $('stats');
  if (!statsEl) return;

  const total = allRepos.length;
  const withPages = allRepos.filter(r => r.has_pages).length;
  const totalStars = allRepos.reduce((s, r) => s + (r.stargazers_count || 0), 0);
  const totalForks = allRepos.reduce((s, r) => s + (r.forks_count || 0), 0);
  const languages = new Set(allRepos.map(r => r.language).filter(Boolean));

  statsEl.innerHTML = `
    <div class="stat">
      <div class="stat-label">Repositories</div>
      <div class="stat-value" id="stat-val-repos">0</div>
      <div class="stat-sub">Total tracked</div>
    </div>
    <div class="stat green">
      <div class="stat-label">GitHub Pages</div>
      <div class="stat-value" id="stat-val-pages">0</div>
      <div class="stat-sub">Repos with live sites</div>
    </div>
    <div class="stat yellow">
      <div class="stat-label">Stars Earned</div>
      <div class="stat-value" id="stat-val-stars">0</div>
      <div class="stat-sub">Across all repos</div>
    </div>
    <div class="stat purple">
      <div class="stat-label">Forks</div>
      <div class="stat-value" id="stat-val-forks">0</div>
      <div class="stat-sub">Community copies</div>
    </div>
    <div class="stat blue">
      <div class="stat-label">Languages</div>
      <div class="stat-value" id="stat-val-languages">0</div>
      <div class="stat-sub">Unique languages</div>
    </div>
  `;

  // Animate Count-ups
  animateCount('stat-val-repos', 0, total, 1000);
  animateCount('stat-val-pages', 0, withPages, 1000);
  animateCount('stat-val-stars', 0, totalStars, 1000);
  animateCount('stat-val-forks', 0, totalForks, 1000);
  animateCount('stat-val-languages', 0, languages.size, 1000);
}

// ═══════════════════════════════════════════════════════════════════════════
// RENDER REPOSITORIES GRID
// ═══════════════════════════════════════════════════════════════════════════
function renderRepos() {
  const grid = $('repos');
  if (!grid) return;

  // Filter
  let filtered = allRepos.filter(r => {
    if (pagesOnly && !r.has_pages) return false;
    return true;
  });

  // Search
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(r =>
      r.name.toLowerCase().includes(q) ||
      (r.description && r.description.toLowerCase().includes(q)) ||
      (r.language && r.language.toLowerCase().includes(q))
    );
  }

  // Sort
  filtered = [...filtered].sort((a, b) => {
    if (activeSort === 'stars')   return b.stargazers_count - a.stargazers_count;
    if (activeSort === 'created') return new Date(b.created_at) - new Date(a.created_at);
    if (activeSort === 'name')    return a.name.localeCompare(b.name);
    return new Date(b.updated_at) - new Date(a.updated_at); // default: updated
  });

  grid.innerHTML = '';

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 1rem;color:var(--text-3)"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <p style="font-size:1.1rem;font-weight:700;margin-bottom:0.5rem;color:var(--text-2)">No repositories found</p>
        <p style="font-size:0.85rem;color:var(--text-3)">Try a different search term or filter.</p>
      </div>`;
    return;
  }

  filtered.forEach((repo, i) => {
    const color = LANG_COLORS[repo.language] || '#8b949e';
    const pageUrl = repo.has_pages ? `${GH_PAGES_HOST}/${repo.name}/` : null;
    const isUserSite = /^[a-z0-9_.-]+\.github\.io$/i.test(repo.name);

    const tags = [];
    if (repo.has_pages) tags.push(`<span class="tag pages" title="GitHub Pages is enabled">⚡ Pages</span>`);
    if (repo.fork) tags.push(`<span class="tag fork">⑂ Fork</span>`);
    if (repo.archived) tags.push(`<span class="tag archived">📦 Archived</span>`);
    if (repo.is_template) tags.push(`<span class="tag template">📋 Template</span>`);
    if (repo.private) tags.push(`<span class="tag private">🔒 Private</span>`);

    const card = document.createElement('article');
    card.className = `repo${repo.has_pages ? ' has-live' : ''}`;
    card.style.transitionDelay = `${Math.min(i, 8) * 0.04}s`;
    card.innerHTML = `
      <div class="repo-header">
        <svg class="repo-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.25.25 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"/></svg>
        <a class="repo-name" href="${repo.html_url}" target="_blank" rel="noopener">${escape(repo.name)}</a>
      </div>
      ${repo.description ? `<div class="repo-desc">${escape(repo.description)}</div>` : `<div class="repo-desc" style="opacity:0.4;">No description provided.</div>`}
      <div class="repo-tags">${tags.join('')}</div>
      <div class="repo-footer">
        ${repo.language ? `<span><span class="lang-dot" style="background:${color}"></span>${escape(repo.language)}</span>` : ''}
        <span title="Stars">⭐ ${num(repo.stargazers_count)}</span>
        <span title="Forks">🍴 ${num(repo.forks_count)}</span>
        <span title="Last updated">🕒 ${timeAgo(repo.updated_at)}</span>
        ${pageUrl && !isUserSite ? `<a class="pages-link" href="${pageUrl}" target="_blank" rel="noopener" title="Open live site">↗ Visit</a>` : ''}
      </div>
    `;
    observeNew(card);
    grid.appendChild(card);
  });
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function escape(s) {
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function num(n) {
  if (n == null) return '0';
  if (n >= 1000) return (n/1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/,'') + 'k';
  return String(n);
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30)  return `${days}d ago`;
  if (days < 365) return `${Math.floor(days/30)}mo ago`;
  return `${(days/365).toFixed(1)}y ago`;
}

function animateCount(id, from, to, duration) {
  const el = document.getElementById(id);
  if (!el) return;
  if (to === 0) { el.textContent = '0'; return; }
  let start = null;
  function step(ts) {
    if (!start) start = ts;
    const prog = Math.min((ts - start) / duration, 1);
    const ease = 1 - Math.pow(1 - prog, 3); // ease-out cubic
    el.textContent = Math.floor(ease * (to - from) + from);
    if (prog < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function observeNew(el) {
  el.classList.add('reveal-item');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
    });
  }, { threshold: 0.08 });
  observer.observe(el);
  const rect = el.getBoundingClientRect();
  if (rect.top < window.innerHeight) el.classList.add('visible');
}
