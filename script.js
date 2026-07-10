/* ==========================================================================
   PORTFOLIO DYNAMIC CONTROLLER v3.0
   — Live GitHub API · Stats Dashboard · Contribution Tracking ·
     Language Breakdown · Top Repos · Live Sites · Repos Explorer
   ========================================================================== */

'use strict';

// ── Config ─────────────────────────────────────────────────────────────────
let GITHUB_USERNAME = 'dev3Masud';
(function detectUsername() {
  const host = window.location.hostname.toLowerCase();
  if (host.endsWith('.github.io')) {
    GITHUB_USERNAME = host.split('.')[0];
  }
})();

const GH_API   = `https://api.github.com`;
const GH_USER  = `${GH_API}/users/${GITHUB_USERNAME}`;
const GH_REPOS = `${GH_API}/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`;
const GH_PAGES_HOST = `https://${GITHUB_USERNAME.toLowerCase()}.github.io`;

// ── Language Color Map ──────────────────────────────────────────────────────
const LANG_COLORS = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6',
  Python:     '#3572a5', HTML:       '#e34c26',
  CSS:        '#563d7c', Shell:      '#89e051',
  Go:         '#00add8', Rust:       '#dea584',
  C:          '#555555', 'C++':      '#f34b7d',
  Java:       '#b07219', PHP:        '#4f5d95',
  Ruby:       '#701516', Swift:      '#F05138',
  Kotlin:     '#7F52FF', Dart:       '#00B4AB',
  Vue:        '#4FC08D', Svelte:     '#FF3E00',
};

// ── State ───────────────────────────────────────────────────────────────────
let allRepos      = [];
let filteredRepos = [];
let activeFilter  = 'All';
let activeSort    = 'updated';
let searchQuery   = '';

// ── DOM refs (lazy, after DOMContentLoaded) ─────────────────────────────────
let $;

// ── Init ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  $ = id => document.getElementById(id);

  initParticles();
  initNav();
  initScrollSpy();
  initScrollReveal();
  initTypewriter();
  setFooterYear();
  injectContribImages();

  // Fetch GitHub data in parallel
  Promise.all([
    fetchUser(),
    fetchRepos(),
  ]).catch(err => {
    console.error('Portfolio data load error:', err);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PARTICLE CANVAS
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
// NAVIGATION
// ═══════════════════════════════════════════════════════════════════════════
function initNav() {
  const header = document.getElementById('site-header');
  const burger = document.getElementById('nav-hamburger');
  const navLinks = document.getElementById('nav-links');

  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  burger && burger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });

  // Close on link click
  navLinks && navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
  });
}

function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav-link');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(l => l.classList.remove('active'));
        const active = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(s => observer.observe(s));
}

// ═══════════════════════════════════════════════════════════════════════════
// SCROLL REVEAL
// ═══════════════════════════════════════════════════════════════════════════
function initScrollReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal-item').forEach(el => observer.observe(el));
}

// Re-observe newly added elements
function observeNew(el) {
  el.classList.add('reveal-item');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
    });
  }, { threshold: 0.08 });
  observer.observe(el);
  // Immediately visible if already in view
  const rect = el.getBoundingClientRect();
  if (rect.top < window.innerHeight) el.classList.add('visible');
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPEWRITER
// ═══════════════════════════════════════════════════════════════════════════
function initTypewriter() {
  const roles = [
    'Software Engineer',
    'Open Source Developer',
    'Security & Automation Builder',
    'DNS Blocklist Author',
    'Python Developer',
  ];
  const target = document.getElementById('typewriter');
  if (!target) return;
  let wi = 0, ci = 0, deleting = false;
  function tick() {
    const word = roles[wi];
    target.textContent = deleting ? word.slice(0, ci--) : word.slice(0, ci++);
    let delay = deleting ? 32 : 80;
    if (!deleting && ci > word.length)  { delay = 1800; deleting = true; }
    if (deleting  && ci < 0) { deleting = false; wi = (wi + 1) % roles.length; delay = 400; ci = 0; }
    setTimeout(tick, delay);
  }
  tick();
}

// ═══════════════════════════════════════════════════════════════════════════
// FOOTER YEAR
// ═══════════════════════════════════════════════════════════════════════════
function setFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTRIBUTION IMAGES (github-readme-stats, streak, trophies)
// ═══════════════════════════════════════════════════════════════════════════
function injectContribImages() {
  const u = GITHUB_USERNAME;
  const theme = 'github_dark';
  const bg = '00000000';

  // Contribution graph via ghchart.rshah.org
  const contribGraph = document.getElementById('contrib-graph');
  if (contribGraph) {
    contribGraph.src = `https://ghchart.rshah.org/6366f1/${u}`;
    contribGraph.onerror = function() {
      this.src = `https://github-readme-stats.vercel.app/api?username=${u}&show_icons=true&theme=${theme}&hide_border=true&bg_color=${bg}&count_private=true`;
    };
  }

  // Streak stats
  const streakImg = document.getElementById('streak-img');
  if (streakImg) {
    streakImg.src = `https://streak-stats.demolab.com/?user=${u}&theme=${theme}&hide_border=true&background=${bg}&ring=6366f1&fire=a855f7&currStreakLabel=06b6d4`;
    streakImg.onerror = function() {
      this.style.display = 'none';
      this.closest('.contrib-card').style.display = 'none';
    };
  }

  // GitHub Stats card
  const statsImg = document.getElementById('stats-img');
  if (statsImg) {
    statsImg.src = `https://github-readme-stats.vercel.app/api?username=${u}&show_icons=true&theme=${theme}&hide_border=true&bg_color=${bg}&count_private=true&include_all_commits=true&icon_color=6366f1&title_color=a855f7&text_color=94a3b8`;
    statsImg.onerror = function() {
      this.closest('.contrib-card').style.display = 'none';
    };
  }

  // Top Languages
  const langsImg = document.getElementById('langs-img');
  if (langsImg) {
    langsImg.src = `https://github-readme-stats.vercel.app/api/top-langs/?username=${u}&layout=compact&theme=${theme}&hide_border=true&bg_color=${bg}&title_color=a855f7&text_color=94a3b8&langs_count=8`;
    langsImg.onerror = function() {
      this.closest('.contrib-card').style.display = 'none';
    };
  }

  // Trophies
  const trophyImg = document.getElementById('trophy-img');
  if (trophyImg) {
    trophyImg.src = `https://github-profile-trophy.vercel.app/?username=${u}&theme=darkhub&no-frame=true&no-bg=true&margin-w=8&column=7`;
    trophyImg.onerror = function() {
      this.closest('.trophy-section').style.display = 'none';
    };
  }

  // Contribution year label
  const year = new Date().getFullYear();
  const yearEl = document.getElementById('contrib-year');
  if (yearEl) yearEl.textContent = `${year - 1}–${year}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// FETCH USER PROFILE
// ═══════════════════════════════════════════════════════════════════════════
async function fetchUser() {
  const resp = await fetch(GH_USER);
  if (!resp.ok) throw new Error(`User API ${resp.status}`);
  const user = await resp.json();
  renderUserProfile(user);
}

function renderUserProfile(user) {
  // Avatar
  const avatar = document.getElementById('profile-avatar');
  if (avatar && user.avatar_url) {
    avatar.src = user.avatar_url;
    avatar.alt = `${user.login} GitHub Avatar`;
  }

  // Name & Login
  setText('profile-name',  user.name || user.login);
  setText('profile-login', `@${user.login}`);
  setText('hero-name',     user.name || user.login);
  if (user.bio) {
    setText('profile-bio', user.bio);
    setText('hero-bio',    user.bio);
  }

  // Nav link href update
  const ghLink = document.getElementById('profile-gh-link');
  if (ghLink) ghLink.href = user.html_url;

  // Meta fields
  showMeta('meta-location', 'profile-location', user.location);
  showMeta('meta-company',  'profile-company',  user.company);
  if (user.blog) {
    const el = document.getElementById('meta-blog');
    const link = document.getElementById('profile-blog');
    if (el && link) {
      el.style.display = 'flex';
      link.href = user.blog.startsWith('http') ? user.blog : `https://${user.blog}`;
      link.textContent = user.blog.replace(/^https?:\/\//, '');
    }
  }

  // Join date
  if (user.created_at) {
    const joined = new Date(user.created_at);
    setText('profile-joined', joined.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
  }

  // Social counts
  animateCount('profile-followers', 0, user.followers, 900);
  animateCount('profile-following', 0, user.following, 900);
  animateCount('profile-gists',     0, user.public_gists, 900);

  // Account age for stats
  if (user.created_at) {
    const days = Math.floor((Date.now() - new Date(user.created_at)) / 86400000);
    const years = (days / 365).toFixed(1);
    setText('stat-account-age', `${years}y`);
  }

  // Followers in stats dashboard
  animateCount('stat-followers', 0, user.followers, 1000);
}

function showMeta(wrapperId, spanId, value) {
  if (!value) return;
  const wrap = document.getElementById(wrapperId);
  const span = document.getElementById(spanId);
  if (wrap && span) { wrap.style.display = 'flex'; span.textContent = value; }
}

// ═══════════════════════════════════════════════════════════════════════════
// FETCH REPOSITORIES
// ═══════════════════════════════════════════════════════════════════════════
async function fetchRepos() {
  const resp = await fetch(GH_REPOS);
  if (!resp.ok) throw new Error(`Repos API ${resp.status}`);
  const data = await resp.json();

  const myLogin   = GITHUB_USERNAME.toLowerCase();
  const portfolioName = `${myLogin}.github.io`;

  // Exclude forks, own profile repo, and the portfolio repo
  allRepos = data.filter(r =>
    !r.fork &&
    r.name.toLowerCase() !== myLogin &&
    r.name.toLowerCase() !== portfolioName
  );

  computeAndRenderStats(data); // pass full data (including forks) for total calc
  renderLanguageBreakdown();
  renderTopRepos();
  renderLiveSites();
  renderFilters();
  renderRepos();
}

// ═══════════════════════════════════════════════════════════════════════════
// STATS COMPUTATION
// ═══════════════════════════════════════════════════════════════════════════
function computeAndRenderStats(rawData) {
  let totalStars = 0, totalForks = 0, totalWatchers = 0, livePages = 0;
  const langCounts = {};

  allRepos.forEach(r => {
    totalStars    += r.stargazers_count || 0;
    totalForks    += r.forks_count      || 0;
    totalWatchers += r.watchers_count   || 0;
    if (r.has_pages) livePages++;
    if (r.language) langCounts[r.language] = (langCounts[r.language] || 0) + 1;
  });

  const topLang = Object.entries(langCounts).sort((a,b) => b[1]-a[1])[0]?.[0] || '—';

  animateCount('stat-repos',     0, allRepos.length, 1000);
  animateCount('stat-stars',     0, totalStars,      1000);
  animateCount('stat-forks',     0, totalForks,      1000);
  animateCount('stat-pages',     0, livePages,       1000);
  animateCount('stat-watchers',  0, totalWatchers,   1000);
  setText('stat-top-lang', topLang);

  // Hero quick stats
  animateCount('qs-repos',  0, allRepos.length, 900);
  animateCount('qs-stars',  0, totalStars,      900);
  animateCount('qs-pages',  0, livePages,       900);
  animateCount('qs-forks',  0, totalForks,      900);

  // Repos meta count
  setText('repos-count-label', `Showing ${allRepos.length} repositories`);
}

// ═══════════════════════════════════════════════════════════════════════════
// LANGUAGE BREAKDOWN BAR
// ═══════════════════════════════════════════════════════════════════════════
function renderLanguageBreakdown() {
  const langCounts = {};
  allRepos.forEach(r => {
    if (r.language) langCounts[r.language] = (langCounts[r.language] || 0) + 1;
  });

  const total = Object.values(langCounts).reduce((a, b) => a + b, 0);
  if (total === 0) return;

  const sorted = Object.entries(langCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  setText('lang-total-repos', `across ${allRepos.length} repositories`);

  const bar    = document.getElementById('lang-bar');
  const legend = document.getElementById('lang-legend');
  if (!bar || !legend) return;

  bar.innerHTML = '';
  legend.innerHTML = '';

  sorted.forEach(([lang, count]) => {
    const pct   = ((count / total) * 100).toFixed(1);
    const color = LANG_COLORS[lang] || '#64748b';

    const seg = document.createElement('div');
    seg.className = 'lang-bar-segment';
    seg.style.width = `${pct}%`;
    seg.style.background = color;
    seg.title = `${lang}: ${pct}%`;
    bar.appendChild(seg);

    const item = document.createElement('div');
    item.className = 'lang-legend-item';
    item.innerHTML = `
      <span class="lang-dot" style="background:${color}"></span>
      <span>${lang}</span>
      <span class="lang-pct">${pct}%</span>
    `;
    legend.appendChild(item);
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// TOP REPOS PODIUM (Most Starred)
// ═══════════════════════════════════════════════════════════════════════════
function renderTopRepos() {
  const grid = document.getElementById('top-repos-grid');
  if (!grid) return;

  const top = [...allRepos]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 6);

  if (top.length === 0) { grid.parentElement.style.display = 'none'; return; }

  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣'];
  grid.innerHTML = '';

  top.forEach((repo, i) => {
    const color = LANG_COLORS[repo.language] || '#64748b';
    const card = document.createElement('div');
    card.className = 'top-repo-card';
    card.innerHTML = `
      <span class="top-repo-rank">${medals[i]}</span>
      <div class="top-repo-name">
        <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">${repo.name}</a>
      </div>
      <p class="top-repo-desc">${repo.description || 'No description provided.'}</p>
      <div class="top-repo-footer">
        ${repo.language ? `<span class="repo-stat-badge"><span class="lang-dot-sm" style="background:${color}"></span> ${repo.language}</span>` : ''}
        <span class="repo-stat-badge">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          ${repo.stargazers_count}
        </span>
        <span class="repo-stat-badge">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 15V9a4 4 0 0 0-4-4H9"></path><line x1="6" y1="9" x2="6" y2="15"></line></svg>
          ${repo.forks_count}
        </span>
        ${repo.has_pages ? `<span class="live-badge" style="font-size:0.65rem;padding:0.15rem 0.5rem"><span class="live-badge-dot"></span> LIVE</span>` : ''}
      </div>
    `;
    observeNew(card);
    grid.appendChild(card);
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// LIVE SITES SECTION
// ═══════════════════════════════════════════════════════════════════════════
function renderLiveSites() {
  const section = document.getElementById('live-sites');
  const grid    = document.getElementById('live-sites-grid');
  if (!section || !grid) return;

  const liveRepos = allRepos.filter(r => r.has_pages);
  if (liveRepos.length === 0) { section.style.display = 'none'; return; }

  section.style.display = '';
  grid.innerHTML = '';

  liveRepos.forEach((repo, i) => {
    const color   = LANG_COLORS[repo.language] || '#64748b';
    const pageUrl = `${GH_PAGES_HOST}/${repo.name}/`;
    const card    = document.createElement('div');
    card.className = 'live-card';
    card.style.transitionDelay = `${i * 0.07}s`;
    card.innerHTML = `
      <div class="live-card-glow"></div>
      <div class="live-card-top">
        <div class="live-card-icon">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
        </div>
        <span class="live-badge"><span class="live-badge-dot"></span> LIVE DEMO</span>
      </div>
      <h3 class="live-card-title">${repo.name}</h3>
      <p class="live-card-desc">${repo.description || 'No description provided for this repository.'}</p>
      <div class="live-card-footer">
        <div class="lang-tag">
          ${repo.language ? `<span class="lang-color-dot lang-dot" style="background:${color}"></span><span>${repo.language}</span>` : '<span>—</span>'}
        </div>
        <div class="live-card-links">
          <a href="${pageUrl}" target="_blank" rel="noopener noreferrer" class="btn-live">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            Visit Site
          </a>
          <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" class="icon-btn" title="Source Code">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
          </a>
        </div>
      </div>
    `;
    observeNew(card);
    grid.appendChild(card);
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// FILTERS
// ═══════════════════════════════════════════════════════════════════════════
function renderFilters() {
  const container = document.getElementById('filter-tags');
  if (!container) return;

  const langs = [...new Set(allRepos.map(r => r.language).filter(Boolean))];
  const options = ['All'];
  if (allRepos.some(r => r.has_pages)) options.push('🌐 Live Sites');
  langs.forEach(l => options.push(l));

  container.innerHTML = '';
  options.forEach(opt => {
    const btn = document.createElement('button');
    const isLive = opt.includes('Live Sites');
    btn.className = `filter-btn${isLive ? ' live-filter' : ''}${opt === activeFilter ? ' active' : ''}`;
    btn.textContent = opt;
    btn.addEventListener('click', () => {
      container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = opt;
      renderRepos();
    });
    container.appendChild(btn);
  });

  // Sort select
  const sortSel = document.getElementById('sort-select');
  sortSel && sortSel.addEventListener('change', e => {
    activeSort = e.target.value;
    renderRepos();
  });

  // Search
  const searchInp = document.getElementById('search-input');
  searchInp && searchInp.addEventListener('input', e => {
    searchQuery = e.target.value.trim();
    renderRepos();
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// REPOSITORIES GRID
// ═══════════════════════════════════════════════════════════════════════════
function renderRepos() {
  const grid = document.getElementById('repos-grid');
  if (!grid) return;

  // Filter
  let filtered = allRepos.filter(r => {
    if (activeFilter === '🌐 Live Sites') return r.has_pages;
    if (activeFilter !== 'All')           return r.language === activeFilter;
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
    if (activeSort === 'forks')   return b.forks_count - a.forks_count;
    if (activeSort === 'name')    return a.name.localeCompare(b.name);
    return new Date(b.updated_at) - new Date(a.updated_at); // updated
  });

  // Count label
  const countEl = document.getElementById('repos-count-label');
  if (countEl) countEl.textContent = `Showing ${filtered.length} of ${allRepos.length} repositories`;

  grid.innerHTML = '';

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:4rem 2rem;color:var(--text-2)">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 1rem;color:var(--text-3)"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <p style="font-size:1.1rem;font-weight:700;margin-bottom:0.5rem">No repositories found</p>
        <p style="font-size:0.88rem;color:var(--text-3)">Try a different search term, filter, or sort.</p>
      </div>`;
    return;
  }

  filtered.forEach((repo, i) => {
    const color   = LANG_COLORS[repo.language] || '#64748b';
    const pageUrl = `${GH_PAGES_HOST}/${repo.name}/`;
    const relTime = timeAgo(repo.updated_at);

    const card = document.createElement('div');
    card.className = `repo-card${repo.has_pages ? ' has-live' : ''}`;
    card.style.transitionDelay = `${Math.min(i, 8) * 0.04}s`;
    card.innerHTML = `
      <div>
        <div class="repo-card-top">
          <div class="repo-icon-wrap">
            <div class="repo-icon${repo.has_pages ? ' live-icon' : ''}">
              ${repo.has_pages
                ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`
                : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`
              }
            </div>
            ${repo.has_pages ? `<span class="live-badge" style="font-size:0.65rem;padding:0.18rem 0.55rem"><span class="live-badge-dot"></span>LIVE</span>` : ''}
          </div>
          <div class="repo-card-stats">
            <span class="repo-mini-stat" title="Stars">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              ${repo.stargazers_count}
            </span>
            <span class="repo-mini-stat" title="Forks">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 15V9a4 4 0 0 0-4-4H9"></path><line x1="6" y1="9" x2="6" y2="15"></line></svg>
              ${repo.forks_count}
            </span>
          </div>
        </div>
        <div class="repo-name">${repo.name}</div>
        <p class="repo-desc">${repo.description || 'No description provided for this repository.'}</p>
      </div>
      <div class="repo-footer">
        <div class="repo-lang">
          ${repo.language ? `<span class="lang-color-dot" style="background:${color}"></span><span>${repo.language}</span>` : `<span style="color:var(--text-3);font-size:0.75rem">${relTime}</span>`}
        </div>
        <div class="repo-links">
          ${repo.has_pages ? `<a href="${pageUrl}" target="_blank" rel="noopener noreferrer" class="btn-visit-sm">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            Visit</a>` : ''}
          <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" class="repo-link-btn" title="View Source">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
          </a>
        </div>
      </div>
    `;
    observeNew(card);
    grid.appendChild(card);
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
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

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30)  return `${days}d ago`;
  if (days < 365) return `${Math.floor(days/30)}mo ago`;
  return `${(days/365).toFixed(1)}y ago`;
}
