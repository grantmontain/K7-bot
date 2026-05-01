/**
 * Pinterest Downloader - Download images/videos from Pinterest
 */

const axios = require('axios');
const config = require('../../config');

// Store processed message IDs to prevent duplicates
const processedMessages = new Set();

module.exports = {
  name: 'pinterest',
  aliases: ['pin', 'pindl', 'pinterestdl'],
  category: 'media',
  description: 'Baixar imagens/vídeos do Pinterest',
  usage: '.pinterest <URL do Pinterest>',

  async execute(sock, msg, args, extra) {
    try {
      // Check if message has already been processed
      if (processedMessages.has(msg.key.id)) {
        return;
      }

      // Add message ID to processed set
      processedMessages.add(msg.key.id);

      // Clean up old message IDs after 5 minutes
      setTimeout(() => {
        processedMessages.delete(msg.key.id);
      }, 5 * 60 * 1000);

      const text = msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      args.join(' ');

      if (!text) {
        return await extra.reply(
          '📌 *Pinterest Downloader*\n\n' +
          'Baixe imagens ou vídeos do Pinterest.\n\n' +
          `Uso: ${config.prefix}pinterest <URL do Pinterest>\n\n` +
          'Exemplo:\n' +
          `${config.prefix}pinterest https://in.pinterest.com/pin/1109363320773690068/`
        );
      }

      // Extract URL from text - match Pinterest pin URLs (including pin.it shortened URLs)
      let urlMatch = text.match(/https?:\/\/[^\s]*pinterest[^\s]*\/pin\/[^\s]+/i);

      // Also match pin.it shortened URLs
      if (!urlMatch) {
        urlMatch = text.match(/https?:\/\/pin\.it\/[^\s]+/i);
      }

      // Match pin.it without https
      if (!urlMatch) {
        urlMatch = text.match(/pin\.it\/[^\s]+/i);
      }

      if (!urlMatch) {
        return await extra.reply('❌ Por favor, forneça uma URL válida de pin do Pinterest!\n\nExemplos:\n• https://in.pinterest.com/pin/1109363320773690068/\n• https://pin.it/dddddd\n• pin.it/dddddd');
      }

      const pinterestUrl = urlMatch[0];

      await sock.sendMessage(extra.from, {
        react: { text: '📥', key: msg.key }
      });

      // Call Pinterest API
      const apiUrl = `https://api.nexray.web.id/downloader/pinterest?url=${encodeURIComponent(pinterestUrl)}`;

      let response;
      try {
        response = await axios.get(apiUrl, {
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
      } catch (error) {
        console.error('Pinterest API Error:', error);
        if (error.response) {
          const status = error.response.status;
          if (status === 400) {
            return await extra.reply('❌ Requisição inválida: URL do Pinterest inválida. Verifique o link.');
          } else if (status === 429) {
            return await extra.reply('❌ Limite de requisições excedido. Tente novamente mais tarde.');
          } else if (status === 500) {
            return await extra.reply('❌ Erro no servidor. Tente novamente mais tarde.');
          }
        }
        return await extra.reply('❌ Falha ao obter conteúdo do Pinterest. Tente novamente.');
      }

      if (!response.data || !response.data.status || !response.data.result) {
        return await extra.reply('❌ Resposta inválida da API. O pin pode não existir ou ser privado.');
      }

      const pinData = response.data.result;

      // Log full response for debugging videos
      console.log('Pinterest API Response:', JSON.stringify(pinData, null, 2));

      const isVideo = !!pinData.video;
      const imageUrl = pinData.video || pinData.image || pinData.url;
      const thumbnail = pinData.thumbnail;
      const title = pinData.title || 'Pinterest Pin';
      const author = pinData.author || 'Desconhecido';

      console.log('Media URL found:', imageUrl);
      console.log('Is video check:', {
        hasVideoField: !!pinData.video,
        hasImageField: !!pinData.image,
        isVideo: isVideo,
        url: imageUrl
      });

      if (!imageUrl) {
        console.error('Pinterest API response structure:', JSON.stringify(pinData, null, 2));
        return await extra.reply('❌ Nenhuma URL de mídia encontrada na resposta da API. O pin pode ser um vídeo ou ter um formato diferente.');
      }

      let caption = `📌 *${title}*\n\n`;
      if (author && author !== 'Desconhecido') {
        caption += `👤 Autor: ${author}\n`;
      }
      caption += `\n*Baixado por ${config.botName}*`;

      if (isVideo) {
        try {
          const videoResponse = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 120000,
            maxContentLength: 100 * 1024 * 1024,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                                                'Accept': 'video/mp4,video/*,*/*',
                                                'Referer': 'https://www.pinterest.com/'
            }
          });

          const videoBuffer = Buffer.from(videoResponse.data);

          if (!videoBuffer || videoBuffer.length === 0) {
            throw new Error('Buffer de vídeo vazio');
          }

          if (videoBuffer.length < 100) {
            throw new Error('Buffer de vídeo muito pequeno, provavelmente corrompido');
          }

          console.log(`Video downloaded successfully: ${(videoBuffer.length / 1024 / 1024).toFixed(2)}MB`);

          await sock.sendMessage(extra.from, {
            video: videoBuffer,
            caption: caption
          }, { quoted: msg });
        } catch (videoError) {
          console.error('Video download/send error:', videoError.message);
          return await extra.reply('❌ Falha ao baixar ou enviar o vídeo. O vídeo pode ter expirado ou exigir autenticação.');
        }
      } else {
        await sock.sendMessage(extra.from, {
          image: { url: imageUrl },
          caption: caption
        }, { quoted: msg });
      }

    } catch (error) {
      console.error('Error in pinterest command:', error);
      return await extra.reply(`❌ Erro: ${error.message || 'Ocorreu um erro desconhecido'}`);
    }
  },
};
