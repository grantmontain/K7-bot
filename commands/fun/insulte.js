// commands/fun/insult.js
module.exports = {
  name: 'insulte',
  aliases: ['insultme','burn'],
  category: 'fun',
  description: 'Dê um insulto bobo a um usuário. Responda ou mencione para escolher alguém.',
  usage: '.insulte (responda ou @usuário)',

  async execute(sock, msg, args, extra) {
    try {
      const ctx = msg.message?.extendedTextMessage?.contextInfo || {};
      const mentioned = ctx.mentionedJid || [];
      let targetId = null;
      if (mentioned.length) targetId = mentioned[0];
      else if (ctx.participant) targetId = ctx.participant;
      else targetId = extra.sender;

      const targetTag = `@${(targetId || extra.sender).split('@')[0]}`;

      const insults = [
        "Você é tão útil quanto um lápis de cor branco.",
        "Eu diria que você é afiado, mas isso seria uma ofensa aos lápis.",
        "Você é como uma nuvem. Quando desaparece, o dia fica lindo.",
        "Você traz tanta alegria para todos... quando sai do ambiente.",
        "Se preguiça fosse um esporte olímpico, você ficaria em quarto — só pra não ter que subir no pódio."
      ];

      const line = insults[Math.floor(Math.random() * insults.length)];
      await sock.sendMessage(extra.from, { text: `${line}`, mentions: [targetId] }, { quoted: msg });
    } catch (error) {
      console.error('[insult] ERROR:', error);
      await extra.reply('❌ Algo deu errado.');
    }
  }
};
