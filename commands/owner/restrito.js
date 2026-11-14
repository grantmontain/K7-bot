const restricted = require('../../utils/restrictedMode');

function getTarget(msg, extra, args) {
  const raw = args[1];
  if (raw) return restricted.normalizeContact(raw);
  const ctx = msg.message?.extendedTextMessage?.contextInfo
    || msg.message?.imageMessage?.contextInfo
    || msg.message?.videoMessage?.contextInfo;
  const mentioned = ctx?.mentionedJid?.[0];
  if (mentioned) return mentioned;
  if (ctx?.participant) return ctx.participant;
  return extra.isGroup ? extra.from : extra.sender;
}

module.exports = {
  name: 'restrito',
  aliases: ['restricted', 'whitelist'],
  category: 'owner',
  description: 'Controla o modo restrito e a lista segura global',
  usage: '.restrito on|off|status|add|del|list',
  ownerOrBotOnly: true,

  async execute(sock, msg, args, extra) {
    const action = (args[0] || 'status').toLowerCase();
    const state = restricted.read();

    if (action === 'on' || action === 'off') {
      restricted.setEnabled(action === 'on');
      return extra.reply(`🔐 Modo restrito ${action === 'on' ? '*ATIVADO*' : '*DESATIVADO*'}.`);
    }
    if (action === 'status') {
      const current = restricted.read();
      return extra.reply(
        `🔐 *MODO RESTRITO: ${current.enabled ? 'ATIVADO' : 'DESATIVADO'}*\n\n` +
        `Grupos autorizados: ${current.groups.length}\n` +
        `Contatos autorizados: ${current.contacts.length}\n\n` +
        `Use .restrito on/off, .restrito add [número], .restrito del [número] ou .restrito list.`
      );
    }
    if (action === 'list' || action === 'lista') {
      const current = restricted.read();
      const groups = current.groups.length ? current.groups.map((v, i) => `${i + 1}. ${v}`).join('\n') : '—';
      const contacts = current.contacts.length ? current.contacts.map((v, i) => `${i + 1}. ${v}`).join('\n') : '—';
      return extra.reply(`🔐 *LISTA SEGURA*\n\n*Grupos*\n${groups}\n\n*Contatos privados*\n${contacts}`);
    }
    if (['add', 'adicionar', 'del', 'remove', 'remover'].includes(action)) {
      const target = getTarget(msg, extra, args);
      if (!target) return extra.reply('Número inválido. Informe o número com DDI e DDD.');
      const isGroup = target.endsWith('@g.us');
      const type = isGroup ? 'group' : 'contact';
      const changed = action === 'add' || action === 'adicionar'
        ? restricted.add(type, target)
        : restricted.remove(type, target);
      const verb = action === 'add' || action === 'adicionar' ? 'adicionado à' : 'removido da';
      return extra.reply(`${changed ? '✅' : 'ℹ️'} ${target} ${changed ? `foi ${verb}` : 'já estava nesse estado na'} lista segura.`);
    }
    return extra.reply('Uso: .restrito on|off|status|add [número]|del [número]|list');
  }
};
