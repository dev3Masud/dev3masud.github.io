/* ==========================================================================
   PORTFOLIO DYNAMIC CONTROLLER (script.js)
   --------------------------------------------------------------------------
   Handles live data fetching from GitHub API, parses stats, creates
   language tags, handles live search/filters, and manages skeleton states.
   ========================================================================== */

// Auto-detect username dynamically from the URL if hosted on GitHub Pages
let githubUsername = 'dev3Masud';
const hostname = window.location.hostname.toLowerCase();
if (hostname.endsWith('.github.io')) {
  githubUsername = hostname.split('.')[0];
}

const REPOS_API_URL = `https://api.github.com/users/${githubUsername}/repos?per_page=100&sort=updated`;

// Color codes for languages
const LANG_COLORS = {
  JavaScript: '#f1e05a',
  Python: '#3572a5',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  TypeScript: '#3178c6',
  Go: '#00add8',
  Rust: '#dea584',
  C: '#555555',
  "C++": '#f34b7d',
  Java: '#b07219',
  PHP: '#4f5d95'
};

// State Variables
let repositories = [];
let activeFilter = 'All';
let searchQuery = '';

// DOM Elements
const projectsGrid = document.getElementById('projects-grid');
const searchInput = document.getElementById('search-input');
const filterTagsContainer = document.getElementById('filter-tags');

// Stat DOM Elements
const totalReposEl = document.getElementById('stat-total-repos');
const totalStarsEl = document.getElementById('stat-total-stars');
const topLangEl = document.getElementById('stat-top-lang');
const activeDaysEl = document.getElementById('stat-active-days');

// Init
document.addEventListener('DOMContentLoaded', () => {
  fetchGitHubPortfolio();
  setupSearch();
  runTypewriter();
});

// Fetch data from GitHub API
async function fetchGitHubPortfolio() {
  try {
    const response = await fetch(REPOS_API_URL);
    if (!response.ok) {
      throw new Error(`GitHub API returned status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Filter out forks if desired, or sort by stars / updates
    // Filter out forks, profile README repository, and the github.io portfolio repository itself
    const profileRepo = githubUsername.toLowerCase();
    const portfolioRepo = `${githubUsername.toLowerCase()}.github.io`;
    
    repositories = data.filter(repo => {
      const nameLower = repo.name.toLowerCase();
      return !repo.fork && nameLower !== profileRepo && nameLower !== portfolioRepo;
    });
    
    calculateStats(data);
    renderFilters();
    renderLiveSites();
    renderProjects();
    
  } catch (error) {
    console.error('Error fetching GitHub portfolio:', error);
    renderErrorState();
  }
}

// Calculate Profile Statistics dynamically
function calculateStats(allRepos) {
  let totalStars = 0;
  let languages = {};
  
  allRepos.forEach(repo => {
    totalStars += repo.stargazers_count;
    if (repo.language) {
      languages[repo.language] = (languages[repo.language] || 0) + 1;
    }
  });

  // Find top language
  let topLang = 'None';
  let maxCount = 0;
  for (const [lang, count] of Object.entries(languages)) {
    if (count > maxCount) {
      maxCount = count;
      topLang = lang;
    }
  }

  // Find active days (difference between earliest and latest repo update)
  let activeDays = 0;
  if (allRepos.length > 0) {
    const dates = allRepos.map(r => new Date(r.updated_at));
    const latest = new Date(Math.max(...dates));
    const earliest = new Date(Math.min(...dates));
    const diffTime = Math.abs(latest - earliest);
    activeDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Update elements with animations
  animateValue(totalReposEl, 0, allRepos.length, 1000);
  animateValue(totalStarsEl, 0, totalStars, 1000);
  topLangEl.textContent = topLang;
  
  if (activeDays > 365) {
    activeDaysEl.textContent = `${(activeDays / 365).toFixed(1)}y+`;
  } else {
    activeDaysEl.textContent = `${activeDays}d`;
  }
}

// Animation helper for stats counters
function animateValue(obj, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.innerHTML = Math.floor(progress * (end - start) + start);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

// Render unique language tags dynamically based on fetched repos
function renderFilters() {
  const filterOptions = ['All'];
  if (repositories.some(repo => repo.has_pages)) {
    filterOptions.push('Live Demos');
  }
  repositories.forEach(repo => {
    if (repo.language && !filterOptions.includes(repo.language)) {
      filterOptions.push(repo.language);
    }
  });

  filterTagsContainer.innerHTML = '';
  filterOptions.forEach(opt => {
    const btn = document.createElement('button');
    if (opt === 'Live Demos') {
      btn.className = `filter-btn filter-btn-live ${opt === activeFilter ? 'active' : ''}`;
      btn.innerHTML = `🌐 ${opt}`;
    } else {
      btn.className = `filter-btn ${opt === activeFilter ? 'active' : ''}`;
      btn.textContent = opt;
    }
    
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = opt;
      renderProjects();
    });
    filterTagsContainer.appendChild(btn);
  });
}

// Render dynamic project cards
function renderProjects() {
  projectsGrid.innerHTML = '';
  
  // Filter repositories
  const filtered = repositories.filter(repo => {
    const matchesLang = activeFilter === 'All' || 
                        (activeFilter === 'Live Demos' ? repo.has_pages : repo.language === activeFilter);
    const matchesSearch = repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesLang && matchesSearch;
  });

  if (filtered.length === 0) {
    projectsGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);">
        <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">No repositories found</p>
        <p style="font-size: 0.9rem; color: var(--text-muted);">Try adjusting your search query or language filter.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(repo => {
    const card = document.createElement('div');
    card.className = repo.has_pages ? 'project-card live-site-card' : 'project-card';
    
    const langDotColor = LANG_COLORS[repo.language] || '#64748b';
    
    // Page/Live Demo link
    let liveDemoLinkHtml = '';
    if (repo.has_pages) {
      const pageUrl = `https://${githubUsername.toLowerCase()}.github.io/${repo.name}/`;
      liveDemoLinkHtml = `
        <a href="${pageUrl}" target="_blank" class="btn btn-primary btn-sm" style="padding: 0.45rem 1.1rem; font-size: 0.8rem; box-shadow: 0 4px 10px rgba(6, 182, 212, 0.25); background: linear-gradient(135deg, var(--accent-cyan), var(--accent-primary)); border: none; border-radius: 8px; color: var(--text-primary); text-decoration: none; font-weight: 600; display: inline-flex; align-items: center;">
          Visit Site
        </a>
      `;
    }

    card.innerHTML = `
      ${repo.has_pages ? '<div class="live-card-glow"></div>' : ''}
      <div>
        <div class="project-meta">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div class="project-folder-icon" style="${repo.has_pages ? 'color: var(--accent-cyan);' : ''}">
              ${repo.has_pages ? `
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
              ` : `
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
              `}
            </div>
            ${repo.has_pages ? `
              <span class="live-badge">
                <span class="live-badge-dot"></span>
                LIVE DEMO
              </span>
            ` : ''}
          </div>
          <div class="project-stats">
            <div class="project-stat-item" title="Stars">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              <span>${repo.stargazers_count}</span>
            </div>
            <div class="project-stat-item" title="Forks">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 15V9a4 4 0 0 0-4-4H9"></path><line x1="6" y1="9" x2="6" y2="15"></line></svg>
              <span>${repo.forks_count}</span>
            </div>
          </div>
        </div>
        
        <h3>${repo.name}</h3>
        <p>${repo.description || 'No description provided for this repository.'}</p>
      </div>

      <div class="project-footer">
        <div class="project-lang">
          ${repo.language ? `
            <span class="lang-color-dot" style="background-color: ${langDotColor};"></span>
            <span>${repo.language}</span>
          ` : ''}
        </div>
        <div class="project-links" style="display: flex; align-items: center;">
          ${liveDemoLinkHtml}
          <a href="${repo.html_url}" target="_blank" class="project-link-btn" title="View Source Code" style="margin-left: 0.75rem; display: inline-flex; align-items: center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
          </a>
        </div>
      </div>
    `;
    projectsGrid.appendChild(card);
  });
  
  setupScrollReveal();
}

// Render showcase of repos with GitHub Pages (Live sites)
function renderLiveSites() {
  const liveSitesGrid = document.getElementById('live-sites-grid');
  const liveSitesSection = document.getElementById('live-sites');
  
  if (!liveSitesGrid) return;
  
  // Filter repositories that have pages enabled
  const liveRepos = repositories.filter(repo => repo.has_pages);
  
  if (liveRepos.length === 0) {
    liveSitesSection.style.display = 'none';
    return;
  }
  
  liveSitesSection.style.display = 'block';
  liveSitesGrid.innerHTML = '';
  
  liveRepos.forEach(repo => {
    const card = document.createElement('div');
    card.className = 'project-card live-site-card';
    
    const langDotColor = LANG_COLORS[repo.language] || '#64748b';
    const pageUrl = `https://${githubUsername.toLowerCase()}.github.io/${repo.name}/`;
    
    card.innerHTML = `
      <div class="live-card-glow"></div>
      <div>
        <div class="project-meta">
          <div class="project-folder-icon" style="color: var(--accent-cyan);">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
          </div>
          <span class="live-badge">
            <span class="live-badge-dot"></span>
            LIVE DEMO
          </span>
        </div>
        
        <h3>${repo.name}</h3>
        <p>${repo.description || 'No description provided for this repository.'}</p>
      </div>

      <div class="project-footer">
        <div class="project-lang">
          ${repo.language ? `
            <span class="lang-color-dot" style="background-color: ${langDotColor};"></span>
            <span>${repo.language}</span>
          ` : ''}
        </div>
        <div class="project-links" style="display: flex; align-items: center;">
          <a href="${pageUrl}" target="_blank" class="btn btn-primary btn-sm" style="padding: 0.45rem 1.1rem; font-size: 0.8rem; box-shadow: 0 4px 10px rgba(6, 182, 212, 0.25); background: linear-gradient(135deg, var(--accent-cyan), var(--accent-primary)); border: none; border-radius: 8px; color: var(--text-primary); text-decoration: none; font-weight: 600;">
            Visit Site
          </a>
          <a href="${repo.html_url}" target="_blank" class="project-link-btn" title="View Source" style="margin-left: 0.75rem; display: inline-flex; align-items: center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
          </a>
        </div>
      </div>
    `;
    liveSitesGrid.appendChild(card);
  });
}

// Setup searching input handler
function setupSearch() {
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderProjects();
  });
}

// Error state backup handler (if GitHub API gets rate-limited)
function renderErrorState() {
  projectsGrid.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; padding: 4rem 2rem; background: var(--glass-bg); border-radius: 20px; border: 1px solid var(--glass-border);">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 1.5rem;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      <h3 style="font-family: var(--font-heading); font-size: 1.5rem; margin-bottom: 0.75rem;">GitHub API Limit Exceeded</h3>
      <p style="color: var(--text-secondary); max-width: 500px; margin: 0 auto 2rem;">
        We could not load the live repositories right now because GitHub's public API is temporarily rate-limited. You can visit the repositories directly on GitHub.
      </p>
      <a href="https://github.com/${githubUsername}" target="_blank" class="btn btn-primary">
        Go to ${githubUsername} on GitHub
      </a>
    </div>
  `;
}

// Typewriter Effect for Hero Subsection
function runTypewriter() {
  const words = ["Software Engineer", "Open Source Developer", "Security & Automation Builder"];
  let wordIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  const target = document.getElementById("typewriter");
  if (!target) return;
  
  function type() {
    const currentWord = words[wordIndex];
    if (isDeleting) {
      target.textContent = currentWord.substring(0, charIndex - 1);
      charIndex--;
    } else {
      target.textContent = currentWord.substring(0, charIndex + 1);
      charIndex++;
    }
    
    let typeSpeed = isDeleting ? 35 : 85;
    
    if (!isDeleting && charIndex === currentWord.length) {
      typeSpeed = 1800; // pause at the end of typing
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      typeSpeed = 400; // pause before typing next word
    }
    
    setTimeout(type, typeSpeed);
  }
  
  type();
}

// Scroll reveal animations observer
function setupScrollReveal() {
  const revealElements = document.querySelectorAll('.hero-card, .stat-card, .section-header, .project-card, .contact-card');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // Trigger only once
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: "0px 0px -40px 0px"
  });
  
  revealElements.forEach(el => {
    el.classList.add('reveal-item');
    observer.observe(el);
  });
}

