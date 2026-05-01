/**
 * Bomb Game - Interactive number guessing game
 * Thanks To Kasan
 */

// Store game state per user
const gameState = new Map();

module.exports = {
  gameState, // Export for handler access
  name: 'bomba',
  aliases: ['bom'],
  category: 'fun',
  description: 'Jogue o jogo da bomba - escolha números de 1 a 9, evite a bomba!',
  usage: '.bomba',

  async execute(sock, msg, args, extra) {
    try {
      const sender = extra.sender;
      const timeout = 180000; // 3 minutes

      // Check if user already has an active game
      if (gameState.has(sender)) {
        const game = gameState.get(sender);

        // Check if user wants to surrender
        const text = msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        '';

  if (text.toLowerCase().trim() === 'suren' || text.toLowerCase().trim() === 'surrender') {
    const bombBox = game.array.find(v => v.emot === '💥');
    await extra.reply(`*Você desistiu!* 💣\n\nA bomba estava na caixa número ${bombBox.number}.`, { quoted: game.msg });
    clearTimeout(game.timeoutId);
    gameState.delete(sender);
    return;
  }

  // Check if user sent a number (1-9)
  const number = parseInt(text.trim());
  if (isNaN(number) || number < 1 || number > 9) {
    return; // Ignore non-number messages during game
  }

  // Find the box at this position
  const selectedBox = game.array.find(v => v.position === number);
  if (!selectedBox || selectedBox.state) {
    return; // Box already opened or invalid
  }

  // Mark box as opened
  selectedBox.state = true;

  // Check if it's the bomb
  if (selectedBox.emot === '💥') {
    // Game over - hit the bomb!
    let teks = `💥 *B O M B A  E X P L O D I U!*\n\n`;
    teks += `Você selecionou a caixa número ${selectedBox.number} e...\n\n`;
    teks += `💣 *BOOM!* 💣\n\n`;
    teks += `Fim de jogo! Pontos foram removidos.\n\n`;
    teks += `*Resultado final:*\n`;
    for (let i = 0; i < game.array.length; i += 3) {
      teks += game.array.slice(i, i + 3).map(v => v.emot).join('') + '\n';
    }

    await sock.sendMessage(extra.from, { text: teks }, { quoted: game.msg });
    clearTimeout(game.timeoutId);
    gameState.delete(sender);
    return;
  }

  // Check if all safe boxes are opened (win condition)
  const safeBoxes = game.array.filter(v => v.emot === '✅');
  const openedSafeBoxes = safeBoxes.filter(v => v.state);

  if (openedSafeBoxes.length === safeBoxes.length) {
    // Win! All safe boxes opened
    let teks = `🎉 *VOCÊ VENCEU!*\n\n`;
    teks += `Parabéns! Você abriu todas as caixas seguras!\n\n`;
    teks += `*Resultado final:*\n`;
    for (let i = 0; i < game.array.length; i += 3) {
      teks += game.array.slice(i, i + 3).map(v => v.emot).join('') + '\n';
    }
    teks += `\n✅ Pontos adicionados!`;

    await sock.sendMessage(extra.from, { text: teks }, { quoted: game.msg });
    clearTimeout(game.timeoutId);
    gameState.delete(sender);
    return;
  }

  // Update game board
  let teks = `乂  *B O M B A*\n\n`;
  teks += `Caixa número ${selectedBox.number} aberta: ${selectedBox.emot}\n\n`;
  teks += `Envie um número de *1* a *9* para abrir uma caixa:\n\n`;
  for (let i = 0; i < game.array.length; i += 3) {
    teks += game.array.slice(i, i + 3).map(v => v.state ? v.emot : v.number).join('') + '\n';
  }
  teks += `\nTempo limite : [ *${((timeout / 1000) / 60)} minutos* ]\n`;
  teks += `Digite *suren* para desistir.`;

  await sock.sendMessage(extra.from, { text: teks }, { quoted: game.msg });
  return;
      }

      // Start new game
      const bom = ['💥', '✅', '✅', '✅', '✅', '✅', '✅', '✅', '✅'].sort(() => Math.random() - 0.5);
      const number = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
      const array = bom.map((v, i) => ({
        emot: v,
        number: number[i],
        position: i + 1,
        state: false
      }));

      let teks = `乂  *B O M B A*\n\n`;
      teks += `Envie um número de *1* a *9* para abrir as *9* caixas abaixo:\n\n`;
      for (let i = 0; i < array.length; i += 3) {
        teks += array.slice(i, i + 3).map(v => v.state ? v.emot : v.number).join('') + '\n';
      }
      teks += `\nTempo limite : [ *${((timeout / 1000) / 60)} minutos* ]\n`;
      teks += `Se você pegar a caixa com a bomba, pontos serão removidos. Digite *suren* para desistir.`;

      const gameMsg = await sock.sendMessage(extra.from, {
        text: teks,
        contextInfo: {
          externalAdReply: {
            title: "Jogo da Bomba",
            body: 'Evite a bomba!',
            thumbnailUrl: "https://telegra.ph/file/b3138928493e78b55526f.jpg",
            sourceUrl: "",
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      }, { quoted: msg });

      // Set timeout
      const timeoutId = setTimeout(() => {
        if (gameState.has(sender)) {
          const game = gameState.get(sender);
          const bombBox = game.array.find(v => v.emot === '💥');
          sock.sendMessage(extra.from, {
            text: `*Tempo esgotado!* ⏰\n\nA bomba estava na caixa número ${bombBox.number}.`
          }, { quoted: game.msg });
          gameState.delete(sender);
        }
      }, timeout);

      // Store game state
      gameState.set(sender, {
        msg: gameMsg,
        array: array,
        timeoutId: timeoutId
      });

      // Cleanup game state after timeout + 1 minute
      setTimeout(() => {
        if (gameState.has(sender)) {
          gameState.delete(sender);
        }
      }, timeout + 60000);

    } catch (error) {
      console.error('Error in bomb command:', error);
      return extra.reply('❌ Erro: ' + (error.message || 'Ocorreu um erro desconhecido'));
    }
  },
};
