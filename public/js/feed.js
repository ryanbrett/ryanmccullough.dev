function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

export async function loadFeed() {
  try {
    const res = await fetch('/api/get-feed');
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Failed to load feed');

    return data.items;
  } catch (err) {
    console.error('Error loading feed:', err);
    return [];
  }
}

export function displayFeed(items) {
  const container = document.getElementById('feed-content');
  container.innerHTML = '';

  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'feed-item';
    div.innerHTML = `
      <h3>${item.title}</h3>
      <p>${item.content}</p>
      <small>${new Date(item.created).toLocaleString()}</small>
      <div class="actions">
        <button class="edit-feed" data-id="${item.id}" data-title="${escapeHTML(item.title)}" data-content="${escapeHTML(item.content)}">✏️</button>
        <button class="delete-feed" data-id="${item.id}">🗑️</button>
      </div>
    `;
    container.appendChild(div);
  });

  // Delete
  document.querySelectorAll('.delete-feed').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (confirm('Delete this post?')) {
        const res = await fetch('/api/delete-feed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });
        const result = await res.json();
        if (res.ok) {
          alert('✅ Post deleted');
          const items = await loadFeed();
          displayFeed(items);
        } else {
          alert(`❌ ${result.message}`);
        }
      }
    });
  });

  // Edit
  document.querySelectorAll('.edit-feed').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const title = btn.getAttribute('data-title');
      const content = btn.getAttribute('data-content');

      document.getElementById('feed-title').value = title;
      document.getElementById('feed-input-content').value = content;
      document.getElementById('feed-form').dataset.editingId = id;

      // Show admin tools section
      document.getElementById('admin-tools').style.display = 'block';
      document.getElementById('toggle-admin').textContent = '▲ Hide Admin Tools';
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const items = await loadFeed();
  displayFeed(items);

  const form = document.getElementById('feed-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('feed-title').value;
    const content = document.getElementById('feed-input-content').value;
    const editingId = form.dataset.editingId;

    const url = editingId ? `/api/update-feed?id=${editingId}` : '/api/update-feed';
    const method = editingId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    });

    const result = await res.json();
    if (res.ok) {
      alert(`✅ ${result.message}`);
      form.reset();
      delete form.dataset.editingId;
      const items = await loadFeed();
      displayFeed(items);
    } else {
      alert(`❌ ${result.message}`);
    }
  });
});

