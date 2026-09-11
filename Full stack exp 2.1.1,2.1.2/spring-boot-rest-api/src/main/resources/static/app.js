// Spring Boot REST API Studio Client Logic

const API_BASE = '/api/v1/posts';
let allPosts = [];
let activeFilter = 'ALL';
let currentEditingPost = null;
let auditLogs = [];

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  loadPosts();
  setDefaultDateTime();
});

// Set default datetime to tomorrow 9am for scheduled post
function setDefaultDateTime() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  const formatted = tomorrow.toISOString().slice(0, 16);
  const dateInput = document.getElementById('form-scheduledAt');
  if (dateInput) {
    dateInput.value = formatted;
  }
}

// Navigation Tab Switching
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

  const targetTab = document.getElementById(`tab-${tabId}`);
  const targetNav = document.getElementById(`nav-${tabId}-btn`);

  if (targetTab) targetTab.classList.add('active');
  if (targetNav) targetNav.classList.add('active');

  const titleMap = {
    posts: { title: 'Posts Management', sub: 'Full REST CRUD lifecycle with JPA persistence, Bean Validation & Tracing' },
    explorer: { title: 'REST API & Error Lab', sub: 'Interactive experiments for Bean Validation (400), Not Found (404), and MDC Tracing' },
    logs: { title: 'Trace & Logs Audit', sub: 'Inspect client-server correlation IDs, HTTP status codes and roundtrip latency' }
  };

  if (titleMap[tabId]) {
    document.getElementById('page-title').innerText = titleMap[tabId].title;
    document.getElementById('page-subtitle').innerText = titleMap[tabId].sub;
  }
}

// Fetch all posts from Backend
async function loadPosts() {
  const startTime = performance.now();
  try {
    const res = await fetch(API_BASE, {
      headers: {
        'Accept': 'application/json',
        'X-Correlation-Id': 'ui-fetch-all-' + Math.random().toString(36).substring(2, 8)
      }
    });
    const latency = Math.round(performance.now() - startTime);
    const correlationId = res.headers.get('X-Correlation-Id') || 'N/A';
    const json = await res.json();

    logAudit('GET', API_BASE, res.status, latency, correlationId, json.message || 'Retrieved');

    if (json.success && Array.isArray(json.data)) {
      allPosts = json.data;
      updateStats();
      renderPosts();
    } else {
      showToast(json.message || 'Failed to fetch posts', 'error');
    }
  } catch (err) {
    console.error('Error fetching posts:', err);
    showToast('Failed to connect to backend service', 'error');
  }
}

// Update Dashboard Statistics
function updateStats() {
  const total = allPosts.length;
  const published = allPosts.filter(p => p.status === 'PUBLISHED').length;
  const scheduled = allPosts.filter(p => p.status === 'SCHEDULED').length;
  const draft = allPosts.filter(p => p.status === 'DRAFT').length;

  document.getElementById('stat-total').innerText = total;
  document.getElementById('stat-published').innerText = published;
  document.getElementById('stat-scheduled').innerText = scheduled;
  document.getElementById('stat-draft').innerText = draft;
}

// Render Posts to Grid
function renderPosts() {
  const container = document.getElementById('posts-container');
  const emptyState = document.getElementById('empty-state');
  const query = (document.getElementById('post-search').value || '').toLowerCase().trim();

  const filtered = allPosts.filter(post => {
    const matchesFilter = activeFilter === 'ALL' || post.status === activeFilter;
    const matchesSearch = !query ||
      (post.title && post.title.toLowerCase().includes(query)) ||
      (post.content && post.content.toLowerCase().includes(query)) ||
      (post.status && post.status.toLowerCase().includes(query));
    return matchesFilter && matchesSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  container.innerHTML = filtered.map(post => {
    const statusClass = (post.status || 'draft').toLowerCase();
    const scheduledDate = post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : 'Not scheduled';

    return `
      <div class="post-card" id="post-card-${post.id}">
        <div class="post-card-header">
          <span class="status-badge ${statusClass}">${post.status || 'DRAFT'}</span>
          <span class="post-id-tag">#${post.id}</span>
        </div>
        <h3 class="post-title" title="${escapeHtml(post.title)}">${escapeHtml(post.title)}</h3>
        <p class="post-excerpt">${escapeHtml(post.content)}</p>
        <div class="post-card-footer">
          <div class="post-meta-date">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>${scheduledDate}</span>
          </div>
          <div class="post-actions">
            <button class="icon-btn" title="View Details" onclick="openViewModal(${post.id})">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button class="icon-btn" title="Edit Post" onclick="openEditModal(${post.id})">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="icon-btn danger" title="Delete Post" onclick="deletePost(${post.id})">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Filter posts on search input
function filterPosts() {
  renderPosts();
}

// Status Filter Pills
function setStatusFilter(status) {
  activeFilter = status;
  document.querySelectorAll('.filter-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === status);
  });
  renderPosts();
}

// Open Modal for Create
function openCreateModal() {
  currentEditingPost = null;
  document.getElementById('modal-title').innerText = 'Create New Post';
  document.getElementById('form-post-id').value = '';
  document.getElementById('form-title').value = '';
  document.getElementById('form-content').value = '';
  document.getElementById('form-status').value = 'SCHEDULED';
  setDefaultDateTime();
  hideFormError();
  document.getElementById('post-modal').classList.remove('hidden');
}

// Open Modal for Edit
function openEditModal(id) {
  const post = allPosts.find(p => p.id === id);
  if (!post) return;

  currentEditingPost = post;
  document.getElementById('modal-title').innerText = `Edit Post #${post.id}`;
  document.getElementById('form-post-id').value = post.id;
  document.getElementById('form-title').value = post.title;
  document.getElementById('form-content').value = post.content;
  document.getElementById('form-status').value = post.status;
  if (post.scheduledAt) {
    document.getElementById('form-scheduledAt').value = post.scheduledAt.slice(0, 16);
  }
  hideFormError();
  document.getElementById('post-modal').classList.remove('hidden');
}

// Close Create/Edit Modal
function closeModal() {
  document.getElementById('post-modal').classList.add('hidden');
}

function handleModalBackdropClick(e) {
  if (e.target === document.getElementById('post-modal')) {
    closeModal();
  }
}

// View Details Modal
function openViewModal(id) {
  const post = allPosts.find(p => p.id === id);
  if (!post) return;

  document.getElementById('view-title').innerText = post.title;
  document.getElementById('view-content').innerText = post.content;
  document.getElementById('view-id-badge').innerText = `ID: #${post.id}`;
  
  const statusBadge = document.getElementById('view-status-badge');
  statusBadge.innerText = post.status;
  statusBadge.className = `status-badge ${post.status.toLowerCase()}`;

  document.getElementById('view-scheduled-at').innerText = post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : 'N/A';
  document.getElementById('view-created-at').innerText = post.createdAt ? new Date(post.createdAt).toLocaleString() : 'N/A';
  document.getElementById('view-updated-at').innerText = post.updatedAt ? new Date(post.updatedAt).toLocaleString() : 'N/A';

  document.getElementById('view-edit-btn').onclick = () => {
    closeViewModal();
    openEditModal(post.id);
  };

  document.getElementById('view-modal').classList.remove('hidden');
}

function closeViewModal() {
  document.getElementById('view-modal').classList.add('hidden');
}

function handleViewModalBackdropClick(e) {
  if (e.target === document.getElementById('view-modal')) {
    closeViewModal();
  }
}

// Handle Form Submission (Create or Update)
async function handleFormSubmit(event) {
  event.preventDefault();
  hideFormError();

  const id = document.getElementById('form-post-id').value;
  const title = document.getElementById('form-title').value.trim();
  const content = document.getElementById('form-content').value.trim();
  const status = document.getElementById('form-status').value;
  let scheduledAt = document.getElementById('form-scheduledAt').value;

  if (scheduledAt && scheduledAt.length === 16) {
    scheduledAt += ':00';
  }

  const payload = { title, content, status, scheduledAt };
  const isEdit = Boolean(id);
  const url = isEdit ? `${API_BASE}/${id}` : API_BASE;
  const method = isEdit ? 'PUT' : 'POST';

  const startTime = performance.now();
  try {
    const res = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-Id': (isEdit ? 'ui-update-' : 'ui-create-') + Math.random().toString(36).substring(2, 8)
      },
      body: JSON.stringify(payload)
    });

    const latency = Math.round(performance.now() - startTime);
    const correlationId = res.headers.get('X-Correlation-Id') || 'N/A';
    const json = await res.json();

    logAudit(method, url, res.status, latency, correlationId, json.message || (isEdit ? 'Post updated' : 'Post created'));

    if (res.ok && json.success) {
      showToast(isEdit ? 'Post updated successfully!' : 'Post created successfully!', 'success');
      closeModal();
      loadPosts();
    } else {
      // Handle validation errors or service error
      let errorMsg = json.message || 'Operation failed';
      if (json.details && Array.isArray(json.details)) {
        errorMsg = json.details.join('<br/>');
      }
      showFormError(errorMsg);
    }
  } catch (err) {
    console.error('Error submitting post:', err);
    showFormError('Failed to communicate with server');
  }
}

// Delete Post
async function deletePost(id) {
  if (!confirm(`Are you sure you want to delete post #${id}?`)) return;

  const url = `${API_BASE}/${id}`;
  const startTime = performance.now();
  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'X-Correlation-Id': 'ui-delete-' + Math.random().toString(36).substring(2, 8)
      }
    });

    const latency = Math.round(performance.now() - startTime);
    const correlationId = res.headers.get('X-Correlation-Id') || 'N/A';
    const json = await res.json();

    logAudit('DELETE', url, res.status, latency, correlationId, json.message || 'Deleted');

    if (res.ok && json.success) {
      showToast(`Post #${id} deleted successfully!`, 'success');
      loadPosts();
    } else {
      showToast(json.message || 'Failed to delete post', 'error');
    }
  } catch (err) {
    console.error('Error deleting post:', err);
    showToast('Failed to delete post from server', 'error');
  }
}

// Seed Demo Data
async function seedSamplePosts() {
  const samplePosts = [
    {
      title: "Spring Boot 3.2 Feature Showcase",
      content: "Exploring Virtual Threads, CRaC checkpoints, Docker Compose support and REST Client improvements in Spring Boot 3.2.",
      scheduledAt: new Date(Date.now() + 86400000).toISOString().slice(0, 19),
      status: "PUBLISHED"
    },
    {
      title: "Mastering Correlation IDs with MDC",
      content: "How request tracing with mapped diagnostic context (MDC) makes debugging distributed microservices and Spring web APIs effortless.",
      scheduledAt: new Date(Date.now() + 172800000).toISOString().slice(0, 19),
      status: "SCHEDULED"
    },
    {
      title: "Clean Exception Handling via ControllerAdvice",
      content: "Standardizing API error envelopes with HTTP status codes, error details, and timestamp stamps for seamless client consumption.",
      scheduledAt: new Date(Date.now() + 259200000).toISOString().slice(0, 19),
      status: "DRAFT"
    }
  ];

  showToast('Seeding demo posts...', 'info');
  for (const post of samplePosts) {
    try {
      await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-Id': 'seed-' + Math.random().toString(36).substring(2, 8)
        },
        body: JSON.stringify(post)
      });
    } catch (e) {
      console.error(e);
    }
  }

  showToast('Demo posts created!', 'success');
  loadPosts();
}

// --- API LAB / EXPERIMENTS ---

function testInvalidPayload(type) {
  const codeArea = document.getElementById('custom-request-body');
  if (type === 'blank') {
    codeArea.value = JSON.stringify({
      title: "",
      content: "",
      scheduledAt: "2026-09-10T10:00:00",
      status: "DRAFT"
    }, null, 2);
  } else if (type === 'short_title') {
    codeArea.value = JSON.stringify({
      title: "Hi",
      content: "Valid length content for this test",
      scheduledAt: "2026-09-10T10:00:00",
      status: "DRAFT"
    }, null, 2);
  } else if (type === 'missing_date') {
    codeArea.value = JSON.stringify({
      title: "Valid Post Title",
      content: "Valid Post Content description",
      scheduledAt: null,
      status: "SCHEDULED"
    }, null, 2);
  }
}

async function executeCustomPost() {
  const rawBody = document.getElementById('custom-request-body').value;
  await performLabRequest('POST', API_BASE, rawBody);
}

async function testNotFound() {
  const id = document.getElementById('test-not-found-id').value || '999';
  await performLabRequest('GET', `${API_BASE}/${id}`, null);
}

async function testDeleteNotFound() {
  const id = document.getElementById('test-not-found-id').value || '999';
  await performLabRequest('DELETE', `${API_BASE}/${id}`, null);
}

async function testCustomTrace() {
  const cid = document.getElementById('custom-correlation-id').value || 'trace-custom-999';
  await performLabRequest('GET', API_BASE, null, cid);
}

async function performLabRequest(method, url, body, customCid = null) {
  const startTime = performance.now();
  const cid = customCid || 'lab-test-' + Math.random().toString(36).substring(2, 8);

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Correlation-Id': cid
    }
  };
  if (body && method !== 'GET') {
    options.body = body;
  }

  try {
    const res = await fetch(url, options);
    const latency = Math.round(performance.now() - startTime);
    const resCid = res.headers.get('X-Correlation-Id') || cid;
    const json = await res.json();

    logAudit(method, url, res.status, latency, resCid, json.message || json.error || 'Done');

    // Update Response Inspector UI
    const statusBadge = document.getElementById('resp-status');
    statusBadge.innerText = `Status: ${res.status} ${res.statusText}`;
    statusBadge.className = `meta-badge badge-${res.status >= 200 && res.status < 300 ? '200' : res.status}`;

    document.getElementById('resp-time').innerText = `Time: ${latency} ms`;
    document.getElementById('resp-cid').innerText = `X-Correlation-Id: ${resCid}`;

    document.getElementById('api-response-code').innerText = JSON.stringify(json, null, 2);

    if (res.ok) {
      showToast(`Request ${method} ${url} succeeded!`, 'success');
      loadPosts();
    } else {
      showToast(`Request returned ${res.status}: ${json.message || json.error}`, 'error');
    }
  } catch (err) {
    document.getElementById('api-response-code').innerText = `Fetch Error: ${err.message}`;
    showToast(`Request failed: ${err.message}`, 'error');
  }
}

// Request Audit Logging Table
function logAudit(method, url, status, latency, cid, message) {
  const item = {
    time: new Date().toLocaleTimeString(),
    method,
    url,
    status,
    latency,
    cid,
    message
  };
  auditLogs.unshift(item);
  if (auditLogs.length > 50) auditLogs.pop();
  renderAuditLogs();
}

function renderAuditLogs() {
  const tbody = document.getElementById('audit-log-tbody');
  if (!tbody) return;

  tbody.innerHTML = auditLogs.map(log => {
    const statusColor = log.status >= 200 && log.status < 300 ? 'color: var(--emerald);' : 'color: var(--rose);';
    return `
      <tr>
        <td style="font-family: var(--font-mono); font-size: 0.76rem;">${log.time}</td>
        <td><span class="method-badge method-${log.method.toLowerCase()}">${log.method}</span></td>
        <td style="font-family: var(--font-mono); font-size: 0.78rem;">${escapeHtml(log.url)}</td>
        <td style="${statusColor} font-weight: 700;">${log.status}</td>
        <td style="font-family: var(--font-mono); font-size: 0.78rem;">${log.latency} ms</td>
        <td style="font-family: var(--font-mono); font-size: 0.75rem; color: #a5b4fc;">${escapeHtml(log.cid)}</td>
        <td style="color: var(--text-secondary);">${escapeHtml(log.message)}</td>
      </tr>
    `;
  }).join('');
}

function clearLogAudit() {
  auditLogs = [];
  renderAuditLogs();
}

// Helper: Show Form Error in Modal
function showFormError(html) {
  const el = document.getElementById('form-error-alert');
  el.innerHTML = html;
  el.classList.remove('hidden');
}

function hideFormError() {
  const el = document.getElementById('form-error-alert');
  el.innerHTML = '';
  el.classList.add('hidden');
}

// Helper: Toast System
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Helper: Escape HTML to avoid XSS
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
