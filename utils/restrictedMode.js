/** Global restricted mode + safe chat/contact allowlist. */
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'database', 'restricted.json');

function read() {
  try {
    const value = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    return {
      enabled: value.enabled === true,
      groups: Array.isArray(value.groups) ? value.groups : [],
      contacts: Array.isArray(value.contacts) ? value.contacts : []
    };
  } catch (_) {
    return { enabled: false, groups: [], contacts: [] };
  }
}
function write(state) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(state, null, 2) + '\n');
  return state;
}
function normalizeContact(input) {
  const value = String(input || '').trim();
  if (!value) return null;
  if (value.includes('@')) return value;
  const digits = value.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15 ? `${digits}@s.whatsapp.net` : null;
}
function add(type, jid) {
  const state = read();
  const key = type === 'group' ? 'groups' : 'contacts';
  if (!jid || state[key].includes(jid)) return false;
  state[key].push(jid);
  write(state);
  return true;
}
function remove(type, jid) {
  const state = read();
  const key = type === 'group' ? 'groups' : 'contacts';
  const before = state[key].length;
  state[key] = state[key].filter(item => item !== jid && item.split('@')[0] !== jid.split('@')[0]);
  if (state[key].length === before) return false;
  write(state);
  return true;
}
function isAllowed(chatJid, isGroup) {
  const state = read();
  if (!state.enabled) return true;
  if (isGroup) return state.groups.includes(chatJid);
  return state.contacts.includes(chatJid);
}
function setEnabled(enabled) {
  const state = read();
  state.enabled = !!enabled;
  write(state);
  return state;
}
module.exports = { read, write, normalizeContact, add, remove, isAllowed, setEnabled };
