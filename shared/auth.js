/**
 * NLE Auth Module
 * Manages users, sessions, and per-user data namespacing.
 * All pages import this to enforce login and isolate data.
 */
const NLE_AUTH = (function () {
  const USERS_KEY = 'nle_users';
  const SESSION_KEY = 'nle_session';

  // Default admin created on first load
  function init() {
    const users = getUsers();
    if (users.length === 0) {
      saveUsers([{
        id: _uid(),
        nome: 'Admin',
        login: 'admin',
        senha: _hash('admin123'),
        role: 'admin',
        ativo: true,
        criadoEm: new Date().toISOString()
      }]);
    }
  }

  // Simple hash (not crypto-secure, but fine for localStorage auth)
  function _hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return 'h_' + Math.abs(h).toString(36);
  }

  function _uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // Users CRUD
  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
    catch (e) { return []; }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function createUser(nome, login, senha, role, extra) {
    const users = getUsers();
    if (users.find(u => u.login === login)) return { ok: false, msg: 'Login ja existe' };
    extra = extra || {};
    const whatsapp = _cleanPhone(extra.whatsapp || '');
    const user = {
      id: _uid(),
      nome: nome.trim(),
      login: login.trim().toLowerCase(),
      senha: _hash(senha),
      role: role || 'vendedor',
      whatsapp: whatsapp,
      cidade: (extra.cidade || '').trim(),
      bio: (extra.bio || '').trim(),
      ativo: true,
      criadoEm: new Date().toISOString()
    };
    users.push(user);
    saveUsers(users);
    return { ok: true, user };
  }

  function _cleanPhone(phone) {
    return phone.replace(/\D/g, '');
  }

  function updateUser(id, data) {
    const users = getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return { ok: false, msg: 'Usuario nao encontrado' };
    if (data.nome !== undefined) users[idx].nome = data.nome.trim();
    if (data.login !== undefined) {
      const dup = users.find(u => u.login === data.login.toLowerCase() && u.id !== id);
      if (dup) return { ok: false, msg: 'Login ja existe' };
      users[idx].login = data.login.trim().toLowerCase();
    }
    if (data.senha !== undefined && data.senha !== '') users[idx].senha = _hash(data.senha);
    if (data.role !== undefined) users[idx].role = data.role;
    if (data.ativo !== undefined) users[idx].ativo = data.ativo;
    if (data.whatsapp !== undefined) users[idx].whatsapp = _cleanPhone(data.whatsapp);
    if (data.cidade !== undefined) users[idx].cidade = data.cidade.trim();
    if (data.bio !== undefined) users[idx].bio = data.bio.trim();
    saveUsers(users);
    return { ok: true, user: users[idx] };
  }

  function deleteUser(id) {
    let users = getUsers();
    const user = users.find(u => u.id === id);
    if (!user) return { ok: false, msg: 'Usuario nao encontrado' };
    if (user.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1) {
      return { ok: false, msg: 'Nao pode deletar o ultimo admin' };
    }
    // Remove user data
    _clearUserData(id);
    users = users.filter(u => u.id !== id);
    saveUsers(users);
    return { ok: true };
  }

  // Session
  function login(loginStr, senha) {
    const users = getUsers();
    const user = users.find(u => u.login === loginStr.trim().toLowerCase());
    if (!user) return { ok: false, msg: 'Usuario nao encontrado' };
    if (!user.ativo) return { ok: false, msg: 'Usuario desativado' };
    if (user.senha !== _hash(senha)) return { ok: false, msg: 'Senha incorreta' };
    const session = {
      userId: user.id,
      nome: user.nome,
      login: user.login,
      role: user.role,
      whatsapp: user.whatsapp || '',
      cidade: user.cidade || '',
      bio: user.bio || '',
      inicio: new Date().toISOString()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { ok: true, session };
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = '/login/';
  }

  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
    catch (e) { return null; }
  }

  function isLoggedIn() {
    return getSession() !== null;
  }

  function isAdmin() {
    const s = getSession();
    return s && s.role === 'admin';
  }

  // Auth guard - redirect to login if not authenticated
  function requireAuth() {
    if (!isLoggedIn()) {
      window.location.href = '/login/';
      return false;
    }
    return true;
  }

  function requireAdmin() {
    if (!requireAuth()) return false;
    if (!isAdmin()) {
      window.location.href = '/';
      return false;
    }
    return true;
  }

  // Data namespacing - prefix all storage keys with user ID
  function userKey(baseKey) {
    const s = getSession();
    if (!s) return baseKey;
    return baseKey + '_' + s.userId;
  }

  // Get data for current user
  function getUserData(baseKey) {
    try { return JSON.parse(localStorage.getItem(userKey(baseKey))); }
    catch (e) { return null; }
  }

  function setUserData(baseKey, data) {
    localStorage.setItem(userKey(baseKey), JSON.stringify(data));
  }

  // Admin: get data for a specific user
  function getDataForUser(baseKey, userId) {
    try { return JSON.parse(localStorage.getItem(baseKey + '_' + userId)); }
    catch (e) { return null; }
  }

  // Admin: get all leads across all users
  function getAllLeads() {
    const users = getUsers();
    const all = [];
    users.forEach(u => {
      const leads = getDataForUser('nle_leads', u.id) || [];
      leads.forEach(l => {
        l._vendedor = u.nome;
        l._vendedorId = u.id;
        all.push(l);
      });
    });
    return all;
  }

  function _clearUserData(userId) {
    const prefix = '_' + userId;
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.endsWith(prefix)) keysToRemove.push(key);
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  }

  // Inject user bar into page
  function renderUserBar() {
    const s = getSession();
    if (!s) return;
    const bar = document.createElement('div');
    bar.id = 'nle-user-bar';
    bar.innerHTML = `
      <span class="ub-name">${s.nome}</span>
      <span class="ub-role">${s.role === 'admin' ? 'Admin' : 'Vendedor'}</span>
      ${s.role === 'admin' ? '<a href="/admin/" class="ub-link">Gerenciar</a>' : ''}
      <button onclick="NLE_AUTH.logout()" class="ub-logout">Sair</button>
    `;
    const style = document.createElement('style');
    style.textContent = `
      #nle-user-bar{position:fixed;bottom:0;left:0;right:0;background:#161b22;border-top:1px solid #30363d;padding:.5rem 1rem;display:flex;align-items:center;gap:.8rem;z-index:9999;font-size:.82rem}
      .ub-name{color:#e6edf3;font-weight:600}
      .ub-role{background:#1c2333;color:#8b949e;padding:.15rem .5rem;border-radius:10px;font-size:.72rem}
      .ub-link{color:#58a6ff;text-decoration:none;margin-left:auto}
      .ub-link:hover{text-decoration:underline}
      .ub-logout{background:none;border:1px solid #30363d;color:#f85149;padding:.2rem .6rem;border-radius:6px;cursor:pointer;font-size:.78rem;margin-left:auto}
      .ub-logout:hover{background:#f8514920;border-color:#f85149}
      body{padding-bottom:45px!important}
    `;
    document.head.appendChild(style);
    document.body.appendChild(bar);
  }

  // Get full user object for current session
  function getCurrentUser() {
    const s = getSession();
    if (!s) return null;
    return getUsers().find(u => u.id === s.userId) || null;
  }

  // Generate WhatsApp link for current user (or any user)
  function waLink(msg, userId) {
    let phone;
    if (userId) {
      const u = getUsers().find(x => x.id === userId);
      phone = u ? u.whatsapp : '';
    } else {
      const s = getSession();
      phone = s ? s.whatsapp : '';
    }
    if (!phone) return '#';
    const num = phone.startsWith('55') ? phone : '55' + phone;
    const encoded = msg ? encodeURIComponent(msg) : '';
    return 'https://wa.me/' + num + (encoded ? '?text=' + encoded : '');
  }

  // Get just the wa.me URL (no message)
  function waUrl(userId) {
    return waLink('', userId);
  }

  init();

  return {
    getUsers, createUser, updateUser, deleteUser,
    login, logout, getSession, isLoggedIn, isAdmin,
    requireAuth, requireAdmin,
    userKey, getUserData, setUserData, getDataForUser, getAllLeads,
    renderUserBar, getCurrentUser, waLink, waUrl, _hash
  };
})();
