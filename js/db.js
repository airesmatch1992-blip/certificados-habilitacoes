/* Base de dados embutida (IndexedDB): guardada no perfil da própria aplicação, sem servidor nem instalação. */
'use strict';
const DBN = 'certificados-liceu', STORES = ['kv', 'usuarios', 'perfis', 'cursos', 'disciplinas', 'alunos', 'funcionarios'], KP = { kv: 'key', disciplinas: 'codigo' };
const idb = {
  db: null,
  open() {
    return new Promise((res, rej) => {
      const r = indexedDB.open(DBN, 2);
      r.onupgradeneeded = () => { const d = r.result;
        STORES.forEach(s => { if (d.objectStoreNames.contains(s)) return; const st = d.createObjectStore(s, { keyPath: KP[s] || 'id' }); if (s == 'usuarios') st.createIndex('utilizador', 'utilizador', { unique: true }); }); };
      r.onsuccess = () => { this.db = r.result; res(); };
      r.onerror = () => rej(r.error);
    });
  },
  tx(s, m, fn) {
    return new Promise((res, rej) => {
      const t = this.db.transaction(s, m), q = fn(t.objectStore(s));
      t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
    });
  },
  all(s) { return this.tx(s, 'readonly', st => st.getAll()); },
  put(s, v) { return this.tx(s, 'readwrite', st => st.put(v)); },
  putMany(s, L) { return this.tx(s, 'readwrite', st => { L.forEach(v => st.put(v)); }); },
  del(s, k) { return this.tx(s, 'readwrite', st => st.delete(k)); },
  delMany(s, K) { return this.tx(s, 'readwrite', st => { K.forEach(k => st.delete(k)); }); },
  clear(s) { return this.tx(s, 'readwrite', st => st.clear()); },
  async dump() { const o = {}; for (const s of STORES) o[s] = await this.all(s); return { versao: 1, data: new Date().toISOString(), stores: o }; },
  async restore(o) { for (const s of STORES) { await this.clear(s); await this.putMany(s, (o.stores || {})[s] || []); } }
};
