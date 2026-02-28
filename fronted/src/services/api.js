


const API_BASE = import.meta.env.DEV 
  ? window.location.origin  
  : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000');
const PACKAGES_BASE = '/api/test-packages';


async function _tryRequest(path, { method = 'GET', params, body, headers } = {}) {
  
  const url = path.startsWith('http') 
    ? new URL(path) 
    : import.meta.env.DEV
      ? new URL(path, window.location.origin)  
      : new URL(path, API_BASE);  

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });
  }

  const res = await fetch(url.toString(), {
    method,
    headers: { 'Content-Type': 'application/json', ...(headers || {}) },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try { data = await res.json(); } catch {}

  if (!res.ok) {
    const err = new Error((data && (data.error || data.message)) || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}


function _uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
function lsGet(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}
function lsSet(key, val) { localStorage.setItem(key, JSON.stringify(val)); }


export async function listLabTests({
  q = '', category = '', page = 1, limit = 200, sort = 'order',
  fields = 'order,name,shortName,category,price',
} = {}) {
  return _tryRequest('/api/lab-tests', { params: { q, category, page, limit, sort, fields } });
}

export async function listLibraryTests({ page = 1, limit = 16 } = {}) {
  return _tryRequest('/api/lab-tests/library', { params: { page, limit } });
}

export async function createLabTest(body) {
  return _tryRequest('/api/lab-tests', { method: 'POST', body });
}


const PANELS_KEY = 'panels';
const _loadPanels = () => lsGet(PANELS_KEY, []);
const _savePanels = (list) => lsSet(PANELS_KEY, list);


const _nextPanelOrder = (list) =>
  list.length ? Math.max(...list.map(p => Number(p.order) || 0)) + 1 : 1;

export async function listPanels({ q = '', category = '', page = 1, limit = 50, sort = 'order' } = {}) {
  let items = _loadPanels();

  if (q) {
    const safe = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(safe, 'i');
    items = items.filter(p =>
      re.test(p.name || '') ||
      re.test(p.category || '') ||
      (p.tests || []).some(t => re.test(t))
    );
  }

  if (category) items = items.filter(p => p.category === category);

  if (sort === 'order' || !sort) items.sort((a, b) => (a.order || 0) - (b.order || 0));
  else if (sort === '-order') items.sort((a, b) => (b.order || 0) - (a.order || 0));

  const start = (page - 1) * limit;
  const paged = items.slice(start, start + limit);
  return { items: paged, total: items.length, page, pages: Math.ceil(items.length / limit) || 1 };
}

export async function getPanel(id) {
  return _loadPanels().find(p => p._id === id) || null;
}

export async function createPanel(body) {
  const list = _loadPanels();
  const doc = {
    _id: _uid(),
    order: _nextPanelOrder(list),
    name: (body.name || '').trim(),
    category: (body.category || '').trim(),
    price: Number(body.price) || 0,
    options: body.options || {},
    tests: Array.isArray(body.tests) ? body.tests : [],
    interpretation: body.interpretation || '',
    createdAt: Date.now(),
  };
  list.push(doc);
  _savePanels(list);
  window.dispatchEvent(new CustomEvent('panels:changed', { detail: { action: 'created', id: doc._id } }));
  return doc;
}

export async function updatePanel(id, patch) {
  const list = _loadPanels();
  const idx = list.findIndex(p => p._id === id);
  if (idx === -1) throw new Error('Panel not found');

  
  list[idx] = { ...list[idx], ...patch, price: Number(patch?.price ?? list[idx].price) || 0 };
  _savePanels(list);

  window.dispatchEvent(new CustomEvent('panels:changed', { detail: { action: 'updated', id } }));
  return list[idx];
}

export async function deletePanel(id) {
  let list = _loadPanels();
  list = list.filter(p => p._id !== id);
  _savePanels(list);

  window.dispatchEvent(new CustomEvent('panels:changed', { detail: { action: 'deleted', id } }));
  return { ok: true };
}


const PACKAGES_KEY = 'packages';
const loadPkgs = () => lsGet(PACKAGES_KEY, []);
const savePkgs = (list) => lsSet(PACKAGES_KEY, list);


const nextPkgOrder = (list) =>
  list.length ? Math.max(...list.map(p => Number(p.order) || 0)) + 1 : 1;

export async function listPackages({ q = '', page = 1, limit = 200, sort = 'order' } = {}) {
  try {
    return await _tryRequest(PACKAGES_BASE, { params: { q, page, limit, sort } });
  } catch (e) {
    
    if (e.status && e.status !== 404) throw e;

    let items = loadPkgs();
    if (q) {
      const safe = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(safe, 'i');
      items = items.filter(p =>
        re.test(p.name || '') || re.test(p.gender || '') ||
        (p.tests || []).some(t => re.test(t)) ||
        (p.panels || []).some(t => re.test(t))
      );
    }
    if (sort === 'order') items.sort((a, b) => (a.order || 0) - (b.order || 0));
    const start = (page - 1) * limit;
    const paged = items.slice(start, start + limit);
    return { items: paged, total: items.length, page, pages: Math.ceil(items.length / limit) || 1 };
  }
}

export async function getPackage(id) {
  try {
    return await _tryRequest(`${PACKAGES_BASE}/${id}`);
  } catch (e) {
    if (e.status && e.status !== 404) throw e;
    return loadPkgs().find(p => p._id === id) || null;
  }
}

export async function createPackage(body) {
  try {
    return await _tryRequest(PACKAGES_BASE, { method: 'POST', body });
  } catch (e) {
    if (e.status && e.status !== 404) throw e;
    const list = loadPkgs();
    const doc = {
      _id: _uid(),
      order: nextPkgOrder(list),
      name: (body.name || '').trim(),
      fee: Number(body.fee) || 0,
      gender: body.gender || 'Both',
      tests: Array.isArray(body.tests) ? body.tests : [],
      panels: Array.isArray(body.panels) ? body.panels : [],
      createdAt: Date.now(),
    };
    list.push(doc);
    savePkgs(list);
    window.dispatchEvent(new CustomEvent('packages:changed', { detail: { action: 'created', id: doc._id } }));
    return doc;
  }
}

export async function updatePackage(id, body) {
  try {
    return await _tryRequest(`${PACKAGES_BASE}/${id}`, { method: 'PUT', body });
  } catch (e) {
    if (e.status && e.status !== 404) throw e;
    const list = loadPkgs();
    const idx = list.findIndex(p => p._id === id);
    if (idx === -1) throw new Error('Package not found');
    list[idx] = { ...list[idx], ...body, fee: Number(body.fee ?? list[idx].fee) || 0 };
    savePkgs(list);
    window.dispatchEvent(new CustomEvent('packages:changed', { detail: { action: 'updated', id } }));
    return list[idx];
  }
}

export async function deletePackage(id) {
  try {
    return await _tryRequest(`${PACKAGES_BASE}/${id}`, { method: 'DELETE' });
  } catch (e) {
    if (e.status && e.status !== 404) throw e;
    let list = loadPkgs();
    list = list.filter(p => p._id !== id);
    savePkgs(list);
    window.dispatchEvent(new CustomEvent('packages:changed', { detail: { action: 'deleted', id } }));
    return { ok: true };
  }
}


const SAMPLES_KEY = 'samples';
const _samplesLoad = () => lsGet(SAMPLES_KEY, []);
const _samplesSave = (list) => lsSet(SAMPLES_KEY, list);

export async function createSample(doc) {
  const list = _samplesLoad();
  const item = { _id: _uid(), createdAt: Date.now(), ...doc };     
  list.push(item);
  _samplesSave(list);
  return item;
}

export async function listSamples() {
  return _samplesLoad();
}

export async function getSample(id) {
  return _samplesLoad().find(s => s._id === id) || null;
}


export async function listReports({ q = '', status = '', from = '', to = '', page = 1, limit = 100 } = {}) {
  return _tryRequest('/api/reports', { params: { q, status, from, to, page, limit } });
}
export async function getReport(id) {
  return _tryRequest(`/api/reports/${id}`);
}
export async function createReport(body) {
  return _tryRequest('/api/reports', { method: 'POST', body });
}
export async function updateReport(id, body) {
  return _tryRequest(`/api/reports/${id}`, { method: 'PUT', body });
}
export async function deleteReport(id) {
  return _tryRequest(`/api/reports/${id}`, { method: 'DELETE' });
}
