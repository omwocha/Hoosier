// Shared header, footer, nav highlighting, and per-page rendering for APNAD site.
(function () {
  const data = window.APNAD_DATA || {};

  // -------- Header / Footer injection --------
  function pageName() {
    const p = location.pathname.split('/').pop() || 'index.html';
    return p.replace('.html', '') || 'index';
  }

  function renderHeader() {
    const slot = document.getElementById('site-header');
    if (!slot) return;
    const current = pageName();
    const links = [
      { href: 'index.html', label: 'Home', key: 'index' },
      { href: 'directory.html', label: 'Directory', key: 'directory' },
      { href: 'events.html', label: 'Events', key: 'events' },
      { href: 'blog.html', label: 'Blog', key: 'blog' },
      { href: 'album.html', label: 'Photo Album', key: 'album' }
    ];
    slot.innerHTML = `
      <header class="site-header">
        <div class="nav-wrap">
          <a class="brand" href="index.html" aria-label="APNAD home">
            <span class="brand-logo">A</span>
            <span>
              <div class="brand-name">APNAD</div>
              <div class="brand-tag">Adventist Pastors · NAD</div>
            </span>
          </a>
          <button class="nav-toggle" aria-label="Open menu" id="navToggle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
          </button>
          <nav class="nav" id="primaryNav">
            ${links.map(l => `<a href="${l.href}" class="${current === l.key ? 'active' : ''}">${l.label}</a>`).join('')}
          </nav>
        </div>
      </header>
    `;
    const toggle = document.getElementById('navToggle');
    const nav = document.getElementById('primaryNav');
    toggle?.addEventListener('click', () => nav.classList.toggle('open'));
  }

  function renderFooter() {
    const slot = document.getElementById('site-footer');
    if (!slot) return;
    slot.innerHTML = `
      <footer class="site-footer">
        <div class="footer-grid">
          <div>
            <div class="brand" style="margin-bottom:12px;">
              <span class="brand-logo">A</span>
              <span>
                <div class="brand-name" style="color:#fff;">APNAD</div>
                <div class="brand-tag" style="color:rgba(255,255,255,0.6);">Adventist Pastors · NAD</div>
              </span>
            </div>
            <p style="max-width:320px;">A fellowship for Seventh-day Adventist pastors serving across the North American Division — encouraging one another in word, work, and witness.</p>
            <div class="social">
              <a href="#" aria-label="Facebook"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9V14.9H8v-2.9h2.4V9.8c0-2.4 1.4-3.7 3.6-3.7 1 0 2.1.2 2.1.2v2.3h-1.2c-1.2 0-1.5.7-1.5 1.5V12H16l-.4 2.9h-2.2V22A10 10 0 0 0 22 12z"/></svg></a>
              <a href="#" aria-label="Instagram"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg></a>
              <a href="#" aria-label="YouTube"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23 7.5s-.2-1.6-.9-2.3c-.9-.9-1.9-.9-2.4-1C16.2 4 12 4 12 4s-4.2 0-7.7.2c-.5.1-1.5.1-2.4 1C1.2 5.9 1 7.5 1 7.5S.8 9.4.8 11.3v1.4c0 1.9.2 3.8.2 3.8s.2 1.6.9 2.3c.9.9 2.1.9 2.6 1 1.9.2 8 .2 8 .2s4.2 0 7.7-.3c.5-.1 1.5-.1 2.4-1 .7-.7.9-2.3.9-2.3s.2-1.9.2-3.8v-1.4c0-1.9-.2-3.8-.2-3.8zM9.7 14.7V8.2l5.6 3.2-5.6 3.3z"/></svg></a>
            </div>
          </div>
          <div>
            <h4>Explore</h4>
            <a href="index.html">Home</a>
            <a href="directory.html">Pastor Directory</a>
            <a href="events.html">Events</a>
            <a href="blog.html">Blog</a>
            <a href="album.html">Photo Album</a>
          </div>
          <div>
            <h4>Resources</h4>
            <a href="#">Sermon Library</a>
            <a href="#">Continuing Education</a>
            <a href="#">Member Care</a>
            <a href="#">Newsletter Archive</a>
          </div>
          <div>
            <h4>Contact</h4>
            <p style="color:rgba(255,255,255,0.78);margin:0;">
              12501 Old Columbia Pike<br/>
              Silver Spring, MD 20904<br/>
              <a href="mailto:office@apnad.org" style="display:inline;">office@apnad.org</a>
            </p>
          </div>
        </div>
        <div class="footer-bottom">
          &copy; ${new Date().getFullYear()} Adventist Pastors in North America Division · Demo site
        </div>
      </footer>
    `;
  }

  // -------- Helpers --------
  function formatDate(iso, opts = { month: 'long', day: 'numeric', year: 'numeric' }) {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', opts);
  }
  function monthShort(iso) { return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' }); }
  function dayNum(iso) { return new Date(iso + 'T00:00:00').getDate(); }
  function yearNum(iso) { return new Date(iso + 'T00:00:00').getFullYear(); }

  // -------- Page: Directory --------
  function renderDirectory() {
    const grid = document.getElementById('pastorGrid');
    const countEl = document.getElementById('pastorCount');
    if (!grid) return;

    const unionSel = document.getElementById('filterUnion');
    const search = document.getElementById('searchInput');
    const roleSel = document.getElementById('filterRole');

    // Populate union filter
    if (unionSel && unionSel.options.length <= 1) {
      data.unions.forEach(u => {
        const o = document.createElement('option');
        o.value = u; o.textContent = u;
        unionSel.appendChild(o);
      });
    }
    // Populate role filter
    if (roleSel && roleSel.options.length <= 1) {
      [...new Set(data.pastors.map(p => p.role))].sort().forEach(r => {
        const o = document.createElement('option');
        o.value = r; o.textContent = r;
        roleSel.appendChild(o);
      });
    }

    function apply() {
      const q = (search?.value || '').trim().toLowerCase();
      const union = unionSel?.value || '';
      const role = roleSel?.value || '';
      const filtered = data.pastors.filter(p => {
        if (union && p.union !== union) return false;
        if (role && p.role !== role) return false;
        if (q) {
          const blob = `${p.name} ${p.church} ${p.city} ${p.role}`.toLowerCase();
          if (!blob.includes(q)) return false;
        }
        return true;
      });

      if (countEl) countEl.textContent = `${filtered.length} pastor${filtered.length === 1 ? '' : 's'}`;

      if (filtered.length === 0) {
        grid.innerHTML = `<div class="empty-state">No pastors match your filters. Try clearing them.</div>`;
        return;
      }

      grid.innerHTML = filtered.map(p => `
        <article class="card pastor-card">
          <img class="pastor-photo" src="${p.photo}" alt="Portrait of ${p.name}" loading="lazy">
          <div class="card-body">
            <span class="badge">${p.role}</span>
            <h3 class="card-title" style="margin-top:8px;">${p.name}</h3>
            <div class="pastor-meta">
              <div><strong>${p.church}</strong></div>
              <div>${p.city}</div>
              <div>${p.union} · Ordained ${p.ordained}</div>
            </div>
            <div class="links">
              <a href="mailto:${p.email}">Email</a>
              <a href="tel:${p.phone.replace(/[^0-9+]/g, '')}">${p.phone}</a>
            </div>
          </div>
        </article>
      `).join('');
    }

    search?.addEventListener('input', apply);
    unionSel?.addEventListener('change', apply);
    roleSel?.addEventListener('change', apply);
    apply();
  }

  // -------- Page: Events --------
  function renderEvents() {
    const list = document.getElementById('eventList');
    if (!list) return;
    const filter = document.getElementById('eventFilter');

    function paint() {
      const f = filter?.value || 'upcoming';
      const today = new Date(); today.setHours(0,0,0,0);
      const items = data.events
        .map(e => ({ ...e, _d: new Date(e.date + 'T00:00:00') }))
        .filter(e => f === 'all' ? true : (f === 'past' ? e._d < today : e._d >= today))
        .sort((a, b) => a._d - b._d);

      if (items.length === 0) {
        list.innerHTML = `<div class="empty-state">No events to show.</div>`;
        return;
      }

      list.innerHTML = items.map(e => `
        <article class="event-row">
          <div class="event-date">
            <div class="month">${monthShort(e.date)}</div>
            <div class="day">${dayNum(e.date)}</div>
            <div class="year">${yearNum(e.date)}</div>
          </div>
          <div class="event-body">
            <span class="badge badge-blue">${e.type}</span>
            <h3 style="margin-top:8px;">${e.title}</h3>
            <p style="color:var(--muted);margin:6px 0 8px;">${e.description}</p>
            <div class="event-meta">
              <span>📍 ${e.location}</span>
              <span>🕒 ${e.time}</span>
              ${e.endDate ? `<span>📅 through ${formatDate(e.endDate, { month: 'short', day: 'numeric' })}</span>` : ''}
            </div>
          </div>
          <a class="btn btn-dark" href="${e.url}">Register</a>
        </article>
      `).join('');
    }

    filter?.addEventListener('change', paint);
    paint();
  }

  // -------- Page: Blog --------
  function renderBlog() {
    const featured = document.getElementById('featuredPost');
    const grid = document.getElementById('postGrid');
    if (!featured || !grid) return;

    const posts = [...data.posts].sort((a, b) => b.date.localeCompare(a.date));
    const [first, ...rest] = posts;

    featured.innerHTML = `
      <img src="${first.image}" alt="">
      <div class="body">
        <span class="badge">Featured</span>
        <h2>${first.title}</h2>
        <div class="card-meta">${first.author} · ${formatDate(first.date)}</div>
        <p>${first.excerpt}</p>
        <a class="read-more" href="#">Read full post →</a>
      </div>
    `;

    grid.innerHTML = rest.map(p => `
      <article class="card blog-card">
        <img class="card-img" src="${p.image}" alt="" loading="lazy">
        <div class="card-body">
          <div class="card-meta">${formatDate(p.date)} · ${p.author}</div>
          <h3 class="card-title">${p.title}</h3>
          <p style="color:var(--muted);">${p.excerpt}</p>
          <div style="margin-top:10px;">
            ${p.tags.map(t => `<span class="badge" style="margin-right:6px;">${t}</span>`).join('')}
          </div>
          <a class="read-more" href="#" style="display:inline-block;margin-top:14px;">Read post →</a>
        </div>
      </article>
    `).join('');
  }

  // -------- Page: Album --------
  function renderAlbum() {
    const grid = document.getElementById('albumGrid');
    const filter = document.getElementById('albumFilter');
    const lightbox = document.getElementById('lightbox');
    const lbImg = document.getElementById('lightboxImg');
    const lbClose = document.getElementById('lightboxClose');
    if (!grid) return;

    const categories = ['All', ...new Set(data.album.map(a => a.category))];
    if (filter && filter.children.length === 0) {
      filter.innerHTML = categories.map((c, i) =>
        `<button class="chip ${i === 0 ? 'active' : ''}" data-cat="${c}">${c}</button>`
      ).join('');
    }

    function paint(category) {
      const items = category === 'All' ? data.album : data.album.filter(a => a.category === category);
      grid.innerHTML = items.map((a, i) => `
        <figure data-idx="${i}">
          <img src="${a.src}" alt="${a.caption}" loading="lazy">
          <figcaption>${a.caption}</figcaption>
        </figure>
      `).join('');
      grid.querySelectorAll('figure').forEach(fig => {
        fig.addEventListener('click', () => {
          const idx = parseInt(fig.dataset.idx, 10);
          lbImg.src = items[idx].src;
          lbImg.alt = items[idx].caption;
          lightbox.classList.add('open');
        });
      });
    }

    filter?.addEventListener('click', (e) => {
      const btn = e.target.closest('.chip');
      if (!btn) return;
      filter.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      paint(btn.dataset.cat);
    });

    lbClose?.addEventListener('click', () => lightbox.classList.remove('open'));
    lightbox?.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.classList.remove('open'); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') lightbox?.classList.remove('open'); });

    paint('All');
  }

  // -------- Page: Home (latest blog + events teasers) --------
  function renderHomeTeasers() {
    const eventTeaser = document.getElementById('homeEvents');
    const postTeaser = document.getElementById('homePosts');
    const today = new Date(); today.setHours(0,0,0,0);

    if (eventTeaser) {
      const upcoming = data.events
        .map(e => ({ ...e, _d: new Date(e.date + 'T00:00:00') }))
        .filter(e => e._d >= today)
        .sort((a, b) => a._d - b._d)
        .slice(0, 3);
      eventTeaser.innerHTML = upcoming.map(e => `
        <article class="card">
          <div class="card-body">
            <span class="badge">${e.type}</span>
            <h3 class="card-title" style="margin-top:8px;">${e.title}</h3>
            <div class="card-meta">${formatDate(e.date)} · ${e.location}</div>
            <p style="color:var(--muted);">${e.description}</p>
            <a class="read-more" href="events.html">Details →</a>
          </div>
        </article>
      `).join('');
    }

    if (postTeaser) {
      const recent = [...data.posts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
      postTeaser.innerHTML = recent.map(p => `
        <article class="card blog-card">
          <img class="card-img" src="${p.image}" alt="" loading="lazy">
          <div class="card-body">
            <div class="card-meta">${formatDate(p.date)} · ${p.author}</div>
            <h3 class="card-title">${p.title}</h3>
            <p style="color:var(--muted);">${p.excerpt}</p>
            <a class="read-more" href="blog.html">Read post →</a>
          </div>
        </article>
      `).join('');
    }
  }

  // -------- Boot --------
  document.addEventListener('DOMContentLoaded', () => {
    renderHeader();
    renderFooter();
    renderDirectory();
    renderEvents();
    renderBlog();
    renderAlbum();
    renderHomeTeasers();

    // Newsletter form (demo only)
    document.querySelectorAll('.newsletter-form').forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = form.querySelector('input[type="email"]');
        const btn = form.querySelector('button');
        if (btn) { btn.textContent = 'Subscribed ✓'; btn.disabled = true; }
        if (input) input.value = '';
      });
    });
  });
})();
