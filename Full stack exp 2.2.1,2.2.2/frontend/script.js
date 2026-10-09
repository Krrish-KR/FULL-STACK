// ==========================================================================
// Spring Boot Read-API Lab - Frontend Logic (Exp 2.2.1 & 2.2.2)
// Paginated catalog, author directory, and performance labs
// ==========================================================================

let currentPage = 0;
let totalPages = 1;
let totalElements = 0;
let currentSortBy = 'id';
let currentSortDir = 'asc';
let currentGenreFilter = 'all';
let currentAuthorId = null;
let currentAuthorName = null;
let bookSearchTimeout = null;
let bookLoadSequence = 0;
let benchmarkMode = 'naive';

let availableGenres = [
  'Sci-Fi', 'Mystery', 'Fiction', 'Non-Fiction', 'History',
  'Dystopian', 'Fantasy', 'Classic', 'Cyberpunk', 'Horror',
  'Philosophy', 'Thriller', 'Biography', 'Poetry', 'Adventure'
];

function apiBase() {
  const input = document.getElementById('apiBase');
  return (input ? input.value : 'http://localhost:8080').replace(/\/$/, '');
}

// --------------------------------------------------------------------------
// Health Check & Genres Loading
// --------------------------------------------------------------------------
async function checkBackendHealth() {
  const dot = document.querySelector('#healthStatusPill .status-dot');
  const text = document.getElementById('healthStatusText');
  const badge = document.getElementById('latencyBadge');
  const btn = document.getElementById('testConnBtn');

  if (btn) btn.disabled = true;
  if (text) text.textContent = 'Pinging...';

  const start = performance.now();
  try {
    const res = await fetch(`${apiBase()}/api/books?page=0&size=1`, { cache: 'no-store' });
    const elapsed = Math.round(performance.now() - start);

    if (res.ok) {
      const data = await res.json();
      if (dot) {
        dot.className = 'status-dot online pulsing';
      }
      if (text) text.textContent = 'Backend Connected';
      if (badge) badge.textContent = `${elapsed} ms`;
      if (data.totalElements != null) {
        const kpiBooks = document.getElementById('kpiTotalBooks');
        if (kpiBooks) kpiBooks.textContent = data.totalElements.toLocaleString();
      }
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (err) {
    if (dot) {
      dot.className = 'status-dot offline';
    }
    if (text) text.textContent = 'Backend Offline';
    if (badge) badge.textContent = 'error';
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function loadGenresList() {
  try {
    const res = await fetch(`${apiBase()}/api/books/genres`);
    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list) && list.length > 0) {
        availableGenres = list;
      }
    }
  } catch (ignored) {
    // Fallback to predefined genres pool
  }

  const select = document.getElementById('genreFilter');
  if (select) {
    const prevVal = select.value;
    select.innerHTML = '<option value="all">All Genres (15 types)</option>';
    availableGenres.forEach(g => {
      const opt = document.createElement('option');
      opt.value = g;
      opt.textContent = g;
      if (g === prevVal) opt.selected = true;
      select.appendChild(opt);
    });
  }
}

// --------------------------------------------------------------------------
// Tab Navigation
// --------------------------------------------------------------------------
function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

  const activePane = document.getElementById(tabId);
  if (activePane) activePane.classList.add('active');

  const btnId = tabId.replace('tab-', 'tabBtn-');
  const activeBtn = document.getElementById(btnId);
  if (activeBtn) activeBtn.classList.add('active');
}

// --------------------------------------------------------------------------
// Experiment 2.2.1: Pagination, Sorting & Genre Filtering
// --------------------------------------------------------------------------
async function loadPage(page) {
  const loadSequence = ++bookLoadSequence;
  const sizeSelect = document.getElementById('pageSize');
  const size = sizeSelect ? sizeSelect.value : 10;
  const sortBySelect = document.getElementById('sortBy');
  const sortBy = sortBySelect ? sortBySelect.value : currentSortBy;
  const sortDirInput = document.getElementById('sortDir');
  const direction = sortDirInput ? sortDirInput.value : currentSortDir;

  const genreFilter = document.getElementById('genreFilter');
  const genre = genreFilter ? genreFilter.value : 'all';
  const searchInput = document.getElementById('searchFilter');
  const search = searchInput ? searchInput.value.trim() : '';
  currentGenreFilter = genre;

  currentSortBy = sortBy;
  currentSortDir = direction;
  updateSortIcons(sortBy, direction);

  const loader = document.getElementById('tableLoading');
  if (loader) loader.classList.remove('hidden');

  let url = `${apiBase()}/api/books?page=${page}&size=${size}&sortBy=${sortBy}&direction=${direction}`;
  if (genre && genre !== 'all') {
    url += `&genre=${encodeURIComponent(genre)}`;
  }
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  if (currentAuthorId != null) {
    url += `&authorId=${encodeURIComponent(currentAuthorId)}`;
  }

  // Update Author Filter pill visibility
  const authorPill = document.getElementById('authorFilterPill');
  const authorNameSpan = document.getElementById('authorFilterName');
  if (authorPill) {
    if (currentAuthorId != null && currentAuthorName) {
      if (authorNameSpan) authorNameSpan.textContent = currentAuthorName;
      authorPill.classList.remove('hidden');
    } else {
      authorPill.classList.add('hidden');
    }
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} (${res.statusText})`);
    const data = await res.json();
    if (loadSequence !== bookLoadSequence) return;

    currentPage = data.page;
    totalPages = data.totalPages;
    totalElements = data.totalElements;

    // Update KPI & Summary
    const kpiBooks = document.getElementById('kpiTotalBooks');
    if (kpiBooks) kpiBooks.textContent = totalElements.toLocaleString();

    const startIdx = totalElements === 0 ? 0 : data.page * data.size + 1;
    const endIdx = Math.min((data.page + 1) * data.size, totalElements);
    const startElem = document.getElementById('summaryStart');
    const endElem = document.getElementById('summaryEnd');
    const totalElem = document.getElementById('summaryTotal');
    if (startElem) startElem.textContent = startIdx.toLocaleString();
    if (endElem) endElem.textContent = endIdx.toLocaleString();
    if (totalElem) totalElem.textContent = totalElements.toLocaleString();

    // Render Table Rows
    const tbody = document.getElementById('booksTableBody');
    if (tbody) {
      tbody.innerHTML = '';
      if (!data.content || data.content.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 32px; color: var(--text-muted);">No books found matching criteria.</td></tr>`;
      } else {
        data.content.forEach(b => {
          const tr = document.createElement('tr');
          tr.id = `book-row-${b.id}`;
          const genreClass = getGenreClass(b.genre);
          const popPercent = Math.min(100, Math.round((b.popularity / 1000) * 100));
          const formattedPrice = b.price != null ? `$${b.price.toFixed(2)}` : '$19.99';
          const pubYear = b.publishYear ?? (b.publishedDate ? b.publishedDate.split('-')[0] : '1990');
          const country = b.authorCountry || 'Global';

          // Build genre options with current selected
          const genreOptions = availableGenres.map(g => {
            const isSel = (g.toLowerCase() === (b.genre || '').toLowerCase()) ? 'selected' : '';
            return `<option value="${escapeHtml(g)}" ${isSel}>${escapeHtml(g)}</option>`;
          }).join('');

          tr.innerHTML = `
            <td><span class="id-badge">#${b.id}</span></td>
            <td class="book-title-cell">${escapeHtml(b.title)}</td>
            <td>
              <div class="genre-cell-wrap">
                <span class="genre-pill ${genreClass}" id="genre-badge-${b.id}">${escapeHtml(b.genre || 'General')}</span>
                <select class="row-genre-select" title="Change genre for this book" onchange="changeBookGenre(${b.id}, this.value)">
                  ${genreOptions}
                </select>
              </div>
            </td>
            <td><span class="price-tag">${formattedPrice}</span></td>
            <td><span class="year-tag">${escapeHtml(pubYear)}</span></td>
            <td>
              <div class="pop-wrap">
                <div class="pop-bar-bg"><div class="pop-bar-fill" style="width: ${popPercent}%"></div></div>
                <span class="pop-num">${b.popularity ?? '--'}</span>
              </div>
            </td>
            <td>
              <div class="author-cell">
                <span class="author-name">${escapeHtml(b.authorName || 'Unknown')}</span>
                <span class="country-pill">🌍 ${escapeHtml(country)}</span>
              </div>
            </td>
          `;
          tbody.appendChild(tr);
        });
      }
    }

    // Render Pagination Controls
    renderPaginationButtons(data.page, data.totalPages);
  } catch (err) {
    if (loadSequence === bookLoadSequence) {
      showToast('Failed to load books', `${err.message}. Is backend running on ${apiBase()}?`, 'danger');
    }
  } finally {
    if (loader && loadSequence === bookLoadSequence) loader.classList.add('hidden');
  }
}

async function exploreBookField(field) {
  const sortBy = document.getElementById('sortBy');
  if (sortBy) sortBy.value = field;
  const directionInput = document.getElementById('sortDir');
  const ascButton = document.getElementById('dirAscBtn');
  const descButton = document.getElementById('dirDescBtn');
  if (directionInput) directionInput.value = 'asc';
  if (ascButton) ascButton.classList.add('active');
  if (descButton) descButton.classList.remove('active');
  await loadPage(0);

}

// --------------------------------------------------------------------------
// Modify Book Genre via REST API (PATCH /api/books/{id}/genre)
// --------------------------------------------------------------------------
async function changeBookGenre(bookId, newGenre) {
  try {
    const res = await fetch(`${apiBase()}/api/books/${bookId}/genre?genre=${encodeURIComponent(newGenre)}`, {
      method: 'PATCH'
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const updatedBook = await res.json();

    // Update the UI genre badge dynamically
    const badge = document.getElementById(`genre-badge-${bookId}`);
    if (badge) {
      badge.textContent = updatedBook.genre;
      badge.className = `genre-pill ${getGenreClass(updatedBook.genre)}`;
    }

    showToast('Genre Updated', `Book #${bookId} ("${updatedBook.title}") genre changed to ${newGenre}!`, 'success');
  } catch (err) {
    showToast('Failed to Update Genre', err.message, 'danger');
  }
}

function getGenreClass(genre) {
  if (!genre) return '';
  const g = genre.toLowerCase();
  if (g.includes('sci-fi')) return 'genre-scifi';
  if (g.includes('cyberpunk')) return 'genre-cyberpunk';
  if (g.includes('mystery')) return 'genre-mystery';
  if (g.includes('thriller')) return 'genre-thriller';
  if (g.includes('fantasy')) return 'genre-fantasy';
  if (g.includes('fiction')) return 'genre-fiction';
  if (g.includes('dystopian')) return 'genre-dystopian';
  if (g.includes('horror')) return 'genre-horror';
  if (g.includes('classic')) return 'genre-classic';
  if (g.includes('history')) return 'genre-history';
  if (g.includes('philosophy')) return 'genre-philosophy';
  if (g.includes('biography')) return 'genre-biography';
  if (g.includes('poetry')) return 'genre-poetry';
  if (g.includes('adventure')) return 'genre-adventure';
  return '';
}

function renderPaginationButtons(page, total) {
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const firstBtn = document.getElementById('firstBtn');
  const lastBtn = document.getElementById('lastBtn');
  const pillsContainer = document.getElementById('pagePills');

  if (prevBtn) prevBtn.disabled = page === 0;
  if (firstBtn) firstBtn.disabled = page === 0;
  if (nextBtn) nextBtn.disabled = page >= total - 1;
  if (lastBtn) lastBtn.disabled = page >= total - 1;

  if (!pillsContainer) return;
  pillsContainer.innerHTML = '';

  const maxVisible = 5;
  let startPage = Math.max(0, page - Math.floor(maxVisible / 2));
  let endPage = Math.min(total - 1, startPage + maxVisible - 1);

  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(0, endPage - maxVisible + 1);
  }

  if (startPage > 0) {
    pillsContainer.appendChild(createPill(0, '1', page === 0));
    if (startPage > 1) {
      const dots = document.createElement('span');
      dots.className = 'pill-dots';
      dots.textContent = '...';
      pillsContainer.appendChild(dots);
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pillsContainer.appendChild(createPill(i, `${i + 1}`, i === page));
  }

  if (endPage < total - 1) {
    if (endPage < total - 2) {
      const dots = document.createElement('span');
      dots.className = 'pill-dots';
      dots.textContent = '...';
      pillsContainer.appendChild(dots);
    }
    pillsContainer.appendChild(createPill(total - 1, `${total}`, page === total - 1));
  }
}

function createPill(pageIndex, text, isActive) {
  const btn = document.createElement('button');
  btn.className = `pill-btn ${isActive ? 'active' : ''}`;
  btn.textContent = text;
  btn.onclick = () => loadPage(pageIndex);
  return btn;
}

function prevPage() {
  if (currentPage > 0) loadPage(currentPage - 1);
}

function nextPage() {
  if (currentPage + 1 < totalPages) loadPage(currentPage + 1);
}

function jumpToPage() {
  const input = document.getElementById('jumpPageInput');
  if (!input) return;
  const p = parseInt(input.value, 10);
  if (isNaN(p) || p < 1 || p > totalPages) {
    showToast('Invalid Page', `Please enter a page number between 1 and ${totalPages}`, 'warning');
    return;
  }
  loadPage(p - 1);
}

function setDirection(dir) {
  const dirInput = document.getElementById('sortDir');
  const ascBtn = document.getElementById('dirAscBtn');
  const descBtn = document.getElementById('dirDescBtn');

  if (dirInput) dirInput.value = dir;
  if (dir === 'asc') {
    if (ascBtn) ascBtn.classList.add('active');
    if (descBtn) descBtn.classList.remove('active');
  } else {
    if (descBtn) descBtn.classList.add('active');
    if (ascBtn) ascBtn.classList.remove('active');
  }
  loadPage(0);
}

function sortTableBy(col) {
  const sortBySelect = document.getElementById('sortBy');

  if (currentSortBy === col) {
    const nextDir = currentSortDir === 'asc' ? 'desc' : 'asc';
    setDirection(nextDir);
  } else {
    currentSortBy = col;
    if (sortBySelect) sortBySelect.value = col;
    setDirection('asc');
  }
}

function updateSortIcons(col, dir) {
  const columns = ['id', 'title', 'genre', 'price', 'publishYear', 'popularity'];
  columns.forEach(c => {
    const icon = document.getElementById(`sort-icon-${c}`);
    if (icon) {
      if (c === col) {
        icon.textContent = dir === 'asc' ? '▲' : '▼';
        icon.style.opacity = '1';
      } else {
        icon.textContent = '↕';
        icon.style.opacity = '0.4';
      }
    }
  });
}

function filterTableRows() {
  if (bookSearchTimeout) clearTimeout(bookSearchTimeout);
  bookSearchTimeout = setTimeout(() => loadPage(0), 250);
}

// --------------------------------------------------------------------------
// Experiment 2.2.2: N+1 vs JOIN FETCH Benchmark
// --------------------------------------------------------------------------
function selectBenchmarkMode(mode) {
  benchmarkMode = mode === 'optimized' ? 'optimized' : 'naive';
  const isOptimized = benchmarkMode === 'optimized';
  const standardButton = document.getElementById('standardModeBtn');
  const fastButton = document.getElementById('fastModeBtn');
  const runButton = document.getElementById('runSelectedModeBtn');

  if (standardButton) {
    standardButton.classList.toggle('active', !isOptimized);
    standardButton.setAttribute('aria-pressed', String(!isOptimized));
  }
  if (fastButton) {
    fastButton.classList.toggle('active', isOptimized);
    fastButton.setAttribute('aria-pressed', String(isOptimized));
  }
  if (runButton) {
    runButton.textContent = isOptimized ? 'Run Fast Mode' : 'Run Standard Mode';
  }
}

function runSelectedBenchmark() {
  if (benchmarkMode === 'optimized') {
    return runBenchmark('/api/books/optimized', 'optimizedResult', 'runSelectedModeBtn');
  }
  return runBenchmark('/api/books/naive', 'naiveResult', 'runSelectedModeBtn');
}

async function runBenchmark(path, boxId, btnId) {
  const box = document.getElementById(boxId);
  const btn = document.getElementById(btnId);

  if (btn) btn.disabled = true;
  if (box) {
    box.innerHTML = `<div class="bench-stat-row"><span class="bench-stat-name">Status:</span><span class="bench-stat-val">Executing query across 1,200 books...</span></div>`;
  }

  try {
    const requestStart = performance.now();
    const res = await fetch(apiBase() + path);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    data.requestLatencyMs = performance.now() - requestStart;

    const isNaive = data.strategy.toLowerCase().includes('naive');
    const queryBadge = isNaive
      ? `<span class="stat-pill-danger">${data.queryCount} queries (1 book query + 50 author queries)</span>`
      : `<span class="stat-pill-success">${data.queryCount} query (Single JOIN FETCH for 1,200 books)</span>`;

    if (box) {
      box.innerHTML = `
        <div class="bench-stat-row">
          <span class="bench-stat-name">Strategy:</span>
          <span class="bench-stat-val"><strong>${escapeHtml(data.strategy)}</strong></span>
        </div>
        <div class="bench-stat-row">
          <span class="bench-stat-name">Execution Time:</span>
          <span class="bench-stat-val">${data.elapsedMillis} ms</span>
        </div>
        <div class="bench-stat-row">
          <span class="bench-stat-name">Browser Request Latency:</span>
          <span class="bench-stat-val">${data.requestLatencyMs.toFixed(1)} ms</span>
        </div>
        <div class="bench-stat-row">
          <span class="bench-stat-name">SQL Queries Executed:</span>
          <span class="bench-stat-val">${queryBadge}</span>
        </div>
        <div class="bench-stat-row">
          <span class="bench-stat-name">Records Returned:</span>
          <span class="bench-stat-val">${data.books ? data.books.length : 0} books</span>
        </div>
      `;
    }
    return data;
  } catch (err) {
    if (box) {
      box.innerHTML = `<div class="bench-stat-row text-rose"><span class="bench-stat-name">Error:</span><span class="bench-stat-val">${escapeHtml(err.message)}</span></div>`;
    }
    return null;
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function runSideBySideComparison() {
  showToast('Benchmarking...', 'Running Naive and Optimized queries across 1,200 books', 'info');
  const compareButton = document.getElementById('compareModesBtn');
  if (compareButton) compareButton.disabled = true;

  const naiveData = await runBenchmark('/api/books/naive', 'naiveResult');
  const optData = await runBenchmark('/api/books/optimized', 'optimizedResult');

  if (naiveData && optData) {
    const compPanel = document.getElementById('comparisonPanel');
    if (compPanel) compPanel.classList.remove('hidden');

    const naiveQ = naiveData.queryCount;
    const optQ = optData.queryCount;
    const naiveExecution = naiveData.elapsedMillis;
    const optExecution = optData.elapsedMillis;
    const maxExecution = Math.max(naiveExecution, optExecution, 1);
    const naiveLatency = naiveData.requestLatencyMs;
    const optLatency = optData.requestLatencyMs;
    const maxLatency = Math.max(naiveLatency, optLatency, 1);

    const barNaive = document.getElementById('barQueryNaive');
    const barOpt = document.getElementById('barQueryOpt');
    const reductionText = document.getElementById('reductionPercentText');
    const executionNaiveValue = document.getElementById('executionNaiveValue');
    const executionOptValue = document.getElementById('executionOptValue');
    const barExecutionNaive = document.getElementById('barExecutionNaive');
    const barExecutionOpt = document.getElementById('barExecutionOpt');
    const executionImprovementText = document.getElementById('executionImprovementText');
    const naiveLatencyValue = document.getElementById('latencyNaiveValue');
    const optLatencyValue = document.getElementById('latencyOptValue');
    const barLatencyNaive = document.getElementById('barLatencyNaive');
    const barLatencyOpt = document.getElementById('barLatencyOpt');
    const latencyImprovementText = document.getElementById('latencyImprovementText');

    if (executionNaiveValue) executionNaiveValue.textContent = `${naiveExecution} ms`;
    if (executionOptValue) executionOptValue.textContent = `${optExecution} ms`;
    if (barExecutionNaive) {
      barExecutionNaive.style.width = `${Math.max(2, (naiveExecution / maxExecution) * 100)}%`;
    }
    if (barExecutionOpt) {
      barExecutionOpt.style.width = `${Math.max(2, (optExecution / maxExecution) * 100)}%`;
    }
    if (executionImprovementText) {
      if (naiveExecution > optExecution) {
        const reductionPct = Math.round(((naiveExecution - optExecution) / naiveExecution) * 100);
        const speedup = (naiveExecution / Math.max(optExecution, 1)).toFixed(1);
        executionImprovementText.textContent = `JOIN FETCH used ${reductionPct}% less backend execution time (${speedup}× faster in this run).`;
      } else if (naiveExecution < optExecution) {
        executionImprovementText.textContent = `JOIN FETCH took ${optExecution - naiveExecution} ms longer in this run; backend timings can vary between runs.`;
      } else {
        executionImprovementText.textContent = 'Both modes had the same backend execution time in this run.';
      }
    }

    if (naiveLatencyValue) naiveLatencyValue.textContent = `${naiveLatency.toFixed(1)} ms`;
    if (optLatencyValue) optLatencyValue.textContent = `${optLatency.toFixed(1)} ms`;
    if (barLatencyNaive) {
      barLatencyNaive.style.width = `${Math.max(2, (naiveLatency / maxLatency) * 100)}%`;
    }
    if (barLatencyOpt) {
      barLatencyOpt.style.width = `${Math.max(2, (optLatency / maxLatency) * 100)}%`;
    }
    if (latencyImprovementText) {
      if (naiveLatency > optLatency) {
        const reductionPct = Math.round(((naiveLatency - optLatency) / naiveLatency) * 100);
        const speedup = (naiveLatency / Math.max(optLatency, 0.1)).toFixed(1);
        latencyImprovementText.textContent = `JOIN FETCH was ${reductionPct}% lower latency (${speedup}× faster by browser-observed request time).`;
      } else if (naiveLatency < optLatency) {
        latencyImprovementText.textContent = `N+1 was ${(optLatency - naiveLatency).toFixed(1)} ms lower in this run; repeat the benchmark to compare after warm-up.`;
      } else {
        latencyImprovementText.textContent = 'Both modes had the same browser-observed latency in this run.';
      }
    }

    if (barNaive) {
      barNaive.textContent = `${naiveQ} SQL Queries (Naive N+1)`;
      barNaive.style.width = '88%';
    }
    if (barOpt) {
      barOpt.textContent = `${optQ} SQL Query (JOIN FETCH)`;
      barOpt.style.width = '12%';
    }

    const reductionPct = Math.round(((naiveQ - optQ) / naiveQ) * 100);
    if (reductionText) {
      reductionText.textContent = `${reductionPct}% Fewer SQL Queries (${naiveQ} ➔ ${optQ})`;
    }

    showToast(
      'Benchmark Complete!',
      `JOIN FETCH reduced database roundtrips by ${reductionPct}% (${naiveQ} queries ➔ ${optQ} query); browser request latency was ${naiveLatency.toFixed(1)} ms vs ${optLatency.toFixed(1)} ms.`,
      'success'
    );
  }
  if (compareButton) compareButton.disabled = false;
}

// --------------------------------------------------------------------------
// Experiment 2.2.2: Native Query + Ehcache Caching
// --------------------------------------------------------------------------
function syncLimitSlider(val) {
  const slider = document.getElementById('popularSlider');
  if (slider) slider.value = val;
}

function syncLimitInput(val) {
  const input = document.getElementById('popularLimit');
  if (input) input.value = val;
}

async function runPopular() {
  const limitInput = document.getElementById('popularLimit');
  const limit = limitInput ? limitInput.value : 5;
  const btn = document.getElementById('fetchPopularBtn');
  const banner = document.getElementById('cacheMetricBanner');
  const hitPill = document.getElementById('cacheHitPill');
  const hitLabel = document.getElementById('cacheHitLabel');
  const latencyVal = document.getElementById('cacheLatencyVal');
  const subtext = document.getElementById('cacheSubtext');
  const container = document.getElementById('topBooksContainer');

  if (btn) btn.disabled = true;

  try {
    const res = await fetch(`${apiBase()}/api/books/popular?limit=${limit}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (banner) banner.classList.remove('hidden');
    if (latencyVal) latencyVal.textContent = `${data.elapsedMillis} ms`;

    if (data.cacheHit) {
      if (hitPill) {
        hitPill.className = 'cache-metric-pill cache-hit';
      }
      if (hitLabel) hitLabel.textContent = '⚡ CACHE HIT (Ehcache JSR-107)';
      if (subtext) subtext.textContent = 'Instant response served directly from in-memory cache without touching the database!';
      showToast('Cache Hit!', `Served top ${limit} books in ${data.elapsedMillis} ms via Ehcache.`, 'success');
    } else {
      if (hitPill) {
        hitPill.className = 'cache-metric-pill cache-miss';
      }
      if (hitLabel) hitLabel.textContent = '💾 CACHE MISS (Database Query)';
      if (subtext) subtext.textContent = 'Native SQL executed against H2 DB and cached in Ehcache for 60 seconds.';
      showToast('Cache Miss (DB Read)', `Fetched and cached in ${data.elapsedMillis} ms. Next request will be a Cache Hit!`, 'info');
    }

    // Render Books Leaderboard
    if (container && data.books) {
      container.innerHTML = '';
      data.books.forEach((b, idx) => {
        const rank = idx + 1;
        const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : '';
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
        const priceFmt = b.price != null ? `$${b.price.toFixed(2)}` : '$19.99';

        const card = document.createElement('div');
        card.className = 'top-book-card';
        card.innerHTML = `
          <div class="rank-badge ${rankClass}">${medal}</div>
          <div class="top-book-info">
            <div class="top-book-title">${escapeHtml(b.title)}</div>
            <div class="top-book-meta">
              <span>✍️ ${escapeHtml(b.authorName || 'Author')} (🌍 ${escapeHtml(b.authorCountry || 'Global')})</span>
              <span>💵 ${priceFmt} | ⭐ Pop: <strong>${b.popularity}</strong></span>
            </div>
          </div>
        `;
        container.appendChild(card);
      });
    }
  } catch (err) {
    showToast('Cache Fetch Error', err.message, 'danger');
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function evictCache() {
  try {
    const res = await fetch(`${apiBase()}/api/books/popular/cache`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const banner = document.getElementById('cacheMetricBanner');
    if (banner) banner.classList.add('hidden');

    const container = document.getElementById('topBooksContainer');
    if (container) {
      container.innerHTML = `<div class="bench-empty-state">Cache was evicted! Click "Fetch Top Books" to trigger a Cache Miss from database.</div>`;
    }

    showToast('Cache Evicted', "Ehcache 'popularBooks' cache cleared! Next fetch will be a Cache Miss.", 'warning');
  } catch (err) {
    showToast('Eviction Failed', err.message, 'danger');
  }
}

// --------------------------------------------------------------------------
// Toast Notification Utility
// --------------------------------------------------------------------------
function showToast(title, message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  const icon = type === 'success' ? '✓' : type === 'warning' ? '⚠' : type === 'danger' ? '✕' : 'ℹ';
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <div>
      <strong>${escapeHtml(title)}</strong>
      <div style="font-size: 0.78rem; opacity: 0.9; margin-top: 2px;">${escapeHtml(message)}</div>
    </div>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// --------------------------------------------------------------------------
// Author Directory & Filtering (Tab 4)
// --------------------------------------------------------------------------
function filterBooksByAuthor(authorId, authorName) {
  currentAuthorId = authorId;
  currentAuthorName = authorName;
  switchTab('tab-pagination');
  loadPage(0);
  showToast('Filtered by Author', `Showing catalog for "${authorName}"`, 'info');
}

function clearAuthorFilter() {
  currentAuthorId = null;
  currentAuthorName = null;
  const authorPill = document.getElementById('authorFilterPill');
  if (authorPill) authorPill.classList.add('hidden');
  loadPage(0);
  showToast('Author Filter Cleared', 'Showing all books in catalog', 'info');
}

async function loadAuthorCountries() {
  try {
    const res = await fetch(`${apiBase()}/api/authors/countries`);
    if (res.ok) {
      const countries = await res.json();
      const select = document.getElementById('authorCountryFilter');
      if (select && Array.isArray(countries)) {
        const prevVal = select.value;
        select.innerHTML = '<option value="all">All Countries</option>';
        countries.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c;
          opt.textContent = c;
          if (c === prevVal) opt.selected = true;
          select.appendChild(opt);
        });
      }
    }
  } catch (err) {
    console.error('Failed to load author countries:', err);
  }
}

async function loadAuthors() {
  const searchInput = document.getElementById('authorSearchInput');
  const search = searchInput ? searchInput.value.trim() : '';
  const countrySelect = document.getElementById('authorCountryFilter');
  const country = countrySelect && countrySelect.value !== 'all' ? countrySelect.value : '';
  const sortSelect = document.getElementById('authorSortBy');
  const sortBy = sortSelect ? sortSelect.value : 'name';

  let url = `${apiBase()}/api/authors?sortBy=${encodeURIComponent(sortBy)}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (country) url += `&country=${encodeURIComponent(country)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const authors = await res.json();
    renderAuthorCards(authors);
  } catch (err) {
    console.error('Failed to load authors:', err);
    showToast('Failed to Load Authors', err.message, 'danger');
  }
}

let authorSearchTimeout = null;
function filterAuthors() {
  if (authorSearchTimeout) clearTimeout(authorSearchTimeout);
  authorSearchTimeout = setTimeout(() => {
    loadAuthors();
  }, 200);
}

function renderAuthorCards(authors) {
  const grid = document.getElementById('authorsGrid');
  const badge = document.getElementById('authorCountBadge');
  const kpiBadge = document.getElementById('kpiTotalAuthors');
  if (badge) badge.textContent = `${authors ? authors.length : 0} Authors`;
  if (kpiBadge && authors && !document.getElementById('authorSearchInput')?.value) {
    kpiBadge.textContent = authors.length;
  }

  if (!grid) return;
  grid.innerHTML = '';

  if (!authors || authors.length === 0) {
    grid.innerHTML = `<div class="authors-empty">No authors found matching your criteria. Try adjusting your search or filters.</div>`;
    return;
  }

  authors.forEach(author => {
    const initials = author.name
      ? author.name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
      : 'AU';
    const avatarImage = createAuthorAvatar(author.name || 'Author', initials);

    const genreTags = (author.genres || []).map(g => {
      const cls = getGenreClass(g);
      return `<span class="genre-pill ${cls}">${escapeHtml(g)}</span>`;
    }).join('') || '<span style="color: var(--text-muted); font-size: 0.76rem;">Multiple Genres</span>';

    const topBooksHtml = (author.topBooks || []).slice(0, 3).map(b => {
      return `
        <div class="author-work-item">
          <span class="author-work-title" title="${escapeHtml(b.title)}">📖 ${escapeHtml(b.title)}</span>
          <span class="author-work-score">⭐ ${b.popularity ?? '--'}</span>
        </div>
      `;
    }).join('') || '<div style="color: var(--text-muted); font-size: 0.76rem; font-style: italic;">Catalog in progress</div>';

    const card = document.createElement('div');
    card.className = 'author-card';
    card.innerHTML = `
      <div class="author-header">
        <img class="author-avatar" src="${avatarImage}" alt="Illustrated avatar for ${escapeHtml(author.name || 'author')}" loading="lazy" />
        <div class="author-details">
          <h3 class="author-name-title" title="${escapeHtml(author.name)}">${escapeHtml(author.name)}</h3>
          <div class="author-meta-sub">
            <span class="author-country-badge">🌍 ${escapeHtml(author.country || 'Global')}</span>
          </div>
        </div>
      </div>

      <div class="author-stats-row">
        <div class="author-stat-item">
          <span class="author-stat-label">Catalog Size</span>
          <span class="author-stat-val">${author.bookCount} <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 500;">Books</span></span>
        </div>
        <div class="author-stat-item">
          <span class="author-stat-label">Avg Popularity</span>
          <span class="author-stat-val">${author.avgPopularity} <span style="font-size: 0.72rem; color: var(--amber-400); font-weight: 500;">★</span></span>
        </div>
      </div>

      <div class="author-genres-wrap">
        <span class="author-section-title">Primary Genres</span>
        <div class="author-genre-tags">
          ${genreTags}
        </div>
      </div>

      <div class="author-works-wrap">
        <span class="author-section-title">Notable Works</span>
        <div class="author-works-list">
          ${topBooksHtml}
        </div>
      </div>

      <div class="author-card-footer">
        <button class="btn btn-author-books" onclick="filterBooksByAuthor(${author.id}, '${escapeHtml(author.name.replace(/'/g, "\\'"))}')">
          <span>View Books (${author.bookCount}) &rarr;</span>
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function createAuthorAvatar(name, initials) {
  let hash = 0;
  for (const character of name) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  const hue = hash % 360;
  const safeInitials = escapeHtml(initials);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="hsl(${hue} 72% 48%)"/><stop offset="1" stop-color="hsl(${(hue + 65) % 360} 75% 35%)"/></linearGradient></defs><rect width="96" height="96" rx="48" fill="url(#bg)"/><circle cx="48" cy="36" r="17" fill="#f8fafc" fill-opacity=".92"/><path d="M17 91c2-21 14-32 31-32s29 11 31 32" fill="#f8fafc" fill-opacity=".92"/><text x="48" y="88" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="700" fill="hsl(${hue} 55% 24%)">${safeInitials}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// --------------------------------------------------------------------------
// Initialization
// --------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', async () => {
  await checkBackendHealth();
  await loadGenresList();
  await loadAuthorCountries();
  await loadAuthors();
  await loadPage(0);
});
