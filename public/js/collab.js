(() => {
  const noteId = document.querySelector('form[action^="/dashboard/item/"]')?.action.match(/item\/(.*?)\?_method=PUT/)?.[1] || window.NOTE_ID;
  if (!noteId) return;
  const collabEnabled = typeof window.COLLAB_ENABLED === 'boolean' ? window.COLLAB_ENABLED : true;

  function ready(fn){ if(document.readyState!=='loading'){ fn(); } else { document.addEventListener('DOMContentLoaded', fn); } }

  ready(() => {
    const form = document.querySelector('form[action*="_method=PUT"]');
    if (!form) return;
    const presenceEl = document.createElement('div');
    presenceEl.id = 'presence-bar';
    presenceEl.style.fontSize = '0.9rem';
    presenceEl.style.marginBottom = '0.5rem';
    form.parentNode.insertBefore(presenceEl, form);

    if (!collabEnabled) {
      presenceEl.innerHTML = '<span class="text-muted">Collaboration is disabled</span>';
      return;
    }

    // eslint-disable-next-line no-undef
    const socket = io({ withCredentials: true });

    const titleEl = document.getElementById('title');
    const bodyEl = document.getElementById('body');
    presenceEl.innerHTML = '<span class="text-muted">Connecting collaborators…</span>';

    const users = new Map();
    function renderPresence() {
      if (users.size === 0) {
        presenceEl.innerHTML = '<span class="text-muted">You are alone here</span>';
        return;
      }
      const pills = Array.from(users.values()).map(u => `<span class="badge rounded-pill" style="background:${u.color};color:#000;margin-right:6px">${u.name}</span>`).join('');
      presenceEl.innerHTML = `<i class="fas fa-users me-2"></i>${pills}`;
    }

    let isApplyingRemote = false;

    socket.on('connect', () => {
      socket.emit('note:join', { noteId });
    });

    socket.on('auth:error', (msg) => {
      console.warn('Socket auth error:', msg);
      presenceEl.innerHTML = '<span class="text-danger">Collaboration unavailable</span>';
    });

    socket.on('note:state', ({ body, users: u }) => {
      if (typeof body === 'string' && bodyEl && bodyEl.value !== body) {
        isApplyingRemote = true; bodyEl.value = body; isApplyingRemote = false;
      }
      users.clear();
      (u || []).forEach(x => users.set(x.id, x));
      renderPresence();
    });

    socket.on('presence:join', (u) => { users.set(u.id, u); renderPresence(); });
    socket.on('presence:leave', (u) => { users.delete(u.id); renderPresence(); });

    function emitTyping(state){ socket.emit('note:typing', { noteId, typing: state }); }
    function debounce(fn, ms){ let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); }; }

    const sendUpdate = debounce(() => {
      socket.emit('note:update', { noteId, body: bodyEl.value });
      emitTyping(false);
    }, 200);

    bodyEl.addEventListener('input', () => {
      if (isApplyingRemote) return;
      emitTyping(true);
      sendUpdate();
    });

    titleEl && titleEl.addEventListener('change', () => {
      socket.emit('note:save', { noteId, title: titleEl.value, body: bodyEl.value });
    });

    socket.on('presence:typing', ({ userId, typing }) => {
      const elId = `typing-${userId}`;
      let el = document.getElementById(elId);
      if (typing) {
        if (!el) {
          el = document.createElement('span');
          el.id = elId;
          el.className = 'ms-2 text-muted';
          el.textContent = 'someone is typing…';
          presenceEl.appendChild(el);
        }
      } else if (el) {
        el.remove();
      }
    });

    socket.on('note:patch', ({ body }) => {
      if (typeof body !== 'string') return;
      if (document.activeElement === bodyEl) return;
      if (bodyEl.value === body) return;
      isApplyingRemote = true; bodyEl.value = body; isApplyingRemote = false;
    });

    form.addEventListener('submit', () => {
      socket.emit('note:save', { noteId, title: titleEl?.value, body: bodyEl.value });
    });

    window.addEventListener('beforeunload', () => {
      socket.emit('note:leave', { noteId });
    });
  });
})();
