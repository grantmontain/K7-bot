// commands/fun/fakechat.js
module.exports = {
  name: 'fakechat',
  aliases: ['fake-chat', 'fq', 'fake-quote', 'f-quote', 'fk'],
  category: 'fun',
  description: 'Cria uma citação falsa mencionando um usuário',
  usage: '.fakechat @usuario / texto citado / resposta',

  async execute(sock, msg, args, extra) {
    try {
      const chatId = extra.from;

      // Junta tudo e separa pelo "/"
      const fullText = args.join(' ');
      const parts = fullText.split('/').map(p => p.trim());

      if (parts.length !== 3) {
        return await sock.sendMessage(chatId, {
          text: 'Uso incorreto.\nExemplo: .fakechat @usuario / texto citado / resposta'
        }, { quoted: msg });
      }

      const [mentionRaw, quotedText, responseText] = parts;

      // Extrai número do @
      const mentionedId = mentionRaw.replace(/[^0-9]/g, '') + '@s.whatsapp.net';

      if (quotedText.length < 2) {
        return await sock.sendMessage(chatId, {
          text: 'O texto citado deve ter pelo menos 2 caracteres.'
        }, { quoted: msg });
      }

      if (responseText.length < 2) {
        return await sock.sendMessage(chatId, {
          text: 'A resposta deve ter pelo menos 2 caracteres.'
        }, { quoted: msg });
      }

      const fakeQuoted = {
        key: {
          fromMe: false,
          participant: mentionedId,
          remoteJid: chatId,
        },
        message: {
          extendedTextMessage: {
            text: quotedText,
            contextInfo: {
              mentionedJid: [mentionedId],
            },
          },
        },
      };

      await sock.sendMessage(chatId, {
        text: responseText,
        mentions: [mentionedId]
      }, { quoted: fakeQuoted });

    } catch (error) {
      console.error('[FAKECHAT] ERROR:', error);
      await extra.reply('❌ Algo deu errado.');
    }
  }
};
