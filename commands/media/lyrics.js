/**
 * Lyrics Finder
 */

const axios = require('axios');
const config = require('../../config');

module.exports = {
  name: 'lyrics',
  aliases: ['lyric', 'lirik'],
  category: 'media',
  description: 'Obter a letra de uma música',
  usage: '<nome da música>',

  async execute(sock, msg, args) {
    try {
      if (args.length === 0) {
        return await sock.sendMessage(msg.key.remoteJid, {
          text: `❌ Por favor, forneça o nome de uma música!\n\nExemplo: ${config.prefix}lyrics Despacito`
        });
      }

      const query = args.join(' ');

      let lyricsData = null;

      // API 1: Vreden
      try {
        const response = await axios.get(`https://api.vreden.my.id/api/lyrics?query=${encodeURIComponent(query)}`);
        if (response.data && response.data.result) {
          lyricsData = {
            title: response.data.result.title,
            artist: response.data.result.artist,
            lyrics: response.data.result.lyrics,
            thumbnail: response.data.result.thumbnail
          };
        }
      } catch (err) {
        console.log('Vreden API failed, trying next...');
      }

      // API 2: Siputzx (fallback)
      if (!lyricsData) {
        try {
          const response = await axios.get(`https://api.siputzx.my.id/api/s/lyrics?query=${encodeURIComponent(query)}`);
          if (response.data && response.data.status && response.data.data) {
            lyricsData = {
              title: response.data.data.title,
              artist: response.data.data.artist,
              lyrics: response.data.data.lyrics,
              thumbnail: response.data.data.image
            };
          }
        } catch (err) {
          console.log('Siputzx API failed');
        }
      }

      if (!lyricsData) {
        return await sock.sendMessage(msg.key.remoteJid, {
          text: '❌ Não foi possível encontrar a letra dessa música!'
        });
      }

      // Format lyrics (limit to prevent message too long)
      let lyrics = lyricsData.lyrics;
      if (lyrics.length > 4000) {
        lyrics = lyrics.substring(0, 4000) + '...\n\n_Letra muito longa, exibindo apenas a primeira parte_';
      }

      const caption = `🎵 *${lyricsData.title}*\n` +
      `👤 *Artista:* ${lyricsData.artist}\n\n` +
      `📝 *Letra:*\n${lyrics}\n\n` +
      `_Obtido por ${config.botName}_`;

      if (lyricsData.thumbnail) {
        await sock.sendMessage(msg.key.remoteJid, {
          image: { url: lyricsData.thumbnail },
          caption: caption
        });
      } else {
        await sock.sendMessage(msg.key.remoteJid, { text: caption });
      }

    } catch (error) {
      console.error('Lyrics command error:', error);
      await sock.sendMessage(msg.key.remoteJid, {
        text: '❌ Ocorreu um erro ao buscar a letra!'
      });
    }
  }
};
