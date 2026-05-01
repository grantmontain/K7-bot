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

      const headers = {
        'User-Agent': 'Mozilla/5.0'
      };

      // API 1
      try {
        const res = await axios.get(`https://api.vreden.my.id/api/lyrics`, {
          params: { query },
          headers
        });

        console.log('Vreden:', res.data);

        if (res.data?.result?.lyrics) {
          lyricsData = {
            title: res.data.result.title,
            artist: res.data.result.artist,
            lyrics: res.data.result.lyrics,
            thumbnail: res.data.result.thumbnail
          };
        }
      } catch (e) {
        console.log('Vreden morreu:', e.message);
      }

      // API 2
      if (!lyricsData) {
        try {
          const res = await axios.get(`https://api.siputzx.my.id/api/s/lyrics`, {
            params: { query },
            headers
          });

          console.log('Siputzx:', res.data);

          if (res.data?.data?.lyrics) {
            lyricsData = {
              title: res.data.data.title,
              artist: res.data.data.artist,
              lyrics: res.data.data.lyrics,
              thumbnail: res.data.data.image
            };
          }
        } catch (e) {
          console.log('Siputzx morreu:', e.message);
        }
      }

      if (!lyricsData) {
        return await sock.sendMessage(msg.key.remoteJid, {
          text: '❌ Não foi possível encontrar a letra dessa música!'
        });
      }

      let lyrics = lyricsData.lyrics;
      if (lyrics.length > 4000) {
        lyrics = lyrics.slice(0, 4000) + '\n\n(...continua)';
      }

      const caption =
      `🎵 *${lyricsData.title}*
      👤 *Artista:* ${lyricsData.artist}

      📝 *Letra:*
      ${lyrics}

      _Obtido por ${config.botName}_`;

      await sock.sendMessage(msg.key.remoteJid, {
        image: lyricsData.thumbnail ? { url: lyricsData.thumbnail } : undefined,
        caption
      });

    } catch (error) {
      console.error('Lyrics error:', error);
      await sock.sendMessage(msg.key.remoteJid, {
        text: '❌ Erro ao buscar a letra!'
      });
    }
  }
};
