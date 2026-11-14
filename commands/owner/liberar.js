const restricted = require('../../utils/restrictedMode');

module.exports = {
  name: 'liberar',
  aliases: ['allowchat'],
  category: 'owner',
  description: 'Autoriza a conversa atual na lista segura (comando enviado pelo próprio bot)',
  usage: '.liberar',
  botOnly: true,
  async execute(sock, msg, args, extra) {
    const type = extra.isGroup ? 'group' : 'contact';
    const jid = extra.from;
    const added = restricted.add(type, jid);
    return extra.reply(`${added ? '✅ Conversa adicionada' : 'ℹ️ Conversa já autorizada'} na lista segura: ${jid}`);
  }
};
