/**
 * Compliment - Send a random compliment
 */

module.exports = {
  name: 'elogie',
  aliases: ['praise', 'compliment'],
  category: 'fun',
  desc: 'Receba um elogio aleatório',
  usage: 'compliment [@user]',
  execute: async (sock, msg, args) => {
    try {
      const compliments = [
        "Você é um amigo incrível! 💙",
        "Você ilumina o ambiente! ✨",
        "Você é o motivo do sorriso de alguém! 😊",
        "Você é ainda melhor que um unicórnio! 🦄",
        "Você é um presente para quem está ao seu redor! 🎁",
        "Você é muito inteligente! 🍪",
        "Você é incrível! 🌟",
        "Você tem a melhor risada! 😄",
        "Você é lindo(a)! 💖",
        "Você é mais útil do que imagina! 🤝",
        "Você tem um ótimo senso de humor! 😂",
        "Você é realmente especial! ⭐",
        "Você é um amigo incrível! 🫂",
        "Sua perspectiva é revigorante! 🌈",
        "Você está fazendo a diferença! 🌍",
        "Você é mais forte do que pensa! 💪",
        "Seu sorriso é contagiante! 😁",
        "Você é único(a)! 💎",
        "Você tira o melhor das pessoas! 👏",
        "Você é inspirador(a)! 🌟"
      ];

      const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      const randomCompliment = compliments[Math.floor(Math.random() * compliments.length)];

      if (mentioned.length > 0) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: `${randomCompliment}`,
          mentions: mentioned
        }, { quoted: msg });
      } else {
        await sock.sendMessage(msg.key.remoteJid, {
          text: `${randomCompliment}`
        }, { quoted: msg });
      }

    } catch (error) {
      console.error('Compliment Error:', error);
      await sock.sendMessage(msg.key.remoteJid, {
        text: `❌ Erro: ${error.message}`
      }, { quoted: msg });
    }
  }
};
