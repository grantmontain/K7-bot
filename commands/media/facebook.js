/**
 * Facebook Downloader - Baixar vídeos do Facebook
 */

const { facebookdl } = require('@bochilteam/scraper-facebook');
const axios = require('axios');
const config = require('../../config');

// Store processed message IDs to prevent duplicates
const processedMessages = new Set();

module.exports = {
  name: 'facebook',
  aliases: ['fb', 'fbdl', 'facebookdl'],
  category: 'media',
  description: 'Baixar vídeos do Facebook',
  usage: '.facebook <URL do Facebook>',

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
        return await extra.reply('Por favor, forneça um link do Facebook para o vídeo.');
      }

      // Extract URL from command
      const url = text.split(' ').slice(1).join(' ').trim();

      if (!url) {
        return await extra.reply('Por favor, forneça um link do Facebook para o vídeo.');
      }

      // Check for various Facebook URL formats
      const facebookPatterns = [
        /https?:\/\/(?:www\.|m\.)?facebook\.com\//,
        /https?:\/\/(?:www\.|m\.)?fb\.com\//,
        /https?:\/\/fb\.watch\//,
        /https?:\/\/(?:www\.)?facebook\.com\/watch/,
        /https?:\/\/(?:www\.)?facebook\.com\/.*\/videos\//
      ];

      const isValidUrl = facebookPatterns.some(pattern => pattern.test(url));

      if (!isValidUrl) {
        return await extra.reply('Isso não é um link válido do Facebook. Por favor, forneça um link válido de vídeo do Facebook.');
      }

      await sock.sendMessage(extra.from, {
        react: { text: '🔄', key: msg.key }
      });

      try {
        // Use @bochilteam/scraper-facebook
        const data = await facebookdl(url);

        if (!data || !data.video || !Array.isArray(data.video) || data.video.length === 0) {
          throw new Error('Nenhum dado de vídeo encontrado');
        }

        // Get the highest quality video (first in array is usually highest)
        const videoOption = data.video[0];
        if (!videoOption || !videoOption.download) {
          throw new Error('Nenhuma função de download de vídeo encontrada');
        }

        // Call the download function to get the video URL or buffer
        const videoData = await videoOption.download();

        let videoUrl = null;
        let videoBuffer = null;

        // Check if it's a URL or buffer
        if (typeof videoData === 'string') {
          videoUrl = videoData;
        } else if (Buffer.isBuffer(videoData)) {
          videoBuffer = videoData;
        } else if (videoData && videoData.url) {
          videoUrl = videoData.url;
        } else if (videoData && videoData.data) {
          videoBuffer = Buffer.from(videoData.data);
        } else {
          throw new Error('Formato de dados de vídeo inválido');
        }

        // Build caption with video info
        const botName = config.botName.toUpperCase();
        let caption = `*BAIXADO POR ${botName}*`;

        const parts = [];

        if (data.duration) {
          parts.push(`⏱️ Duração: ${data.duration}`);
        }

        if (videoOption.quality) {
          parts.push(`📹 Qualidade: ${videoOption.quality}`);
        }

        if (parts.length > 0) {
          caption += '\n\n' + parts.join('\n');
        }

        // Send video
        if (videoBuffer) {
          // Send as buffer
          await sock.sendMessage(extra.from, {
            video: videoBuffer,
            mimetype: 'video/mp4',
            caption: caption
          }, { quoted: msg });
        } else if (videoUrl) {
          // Try URL first
          try {
            await sock.sendMessage(extra.from, {
              video: { url: videoUrl },
              mimetype: 'video/mp4',
              caption: caption
            }, { quoted: msg });
          } catch (urlError) {
            // If URL fails, download and send as buffer
            console.error('Envio por URL falhou, tentando método buffer:', urlError.message);
            try {
              const videoResponse = await axios.get(videoUrl, {
                responseType: 'arraybuffer',
                timeout: 60000,
                maxContentLength: 100 * 1024 * 1024,
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                                                    'Referer': 'https://www.facebook.com/'
                }
              });

              const buffer = Buffer.from(videoResponse.data);
              await sock.sendMessage(extra.from, {
                video: buffer,
                mimetype: 'video/mp4',
                caption: caption
              }, { quoted: msg });
            } catch (bufferError) {
              console.error('Método buffer também falhou:', bufferError.message);
              throw new Error('Falha ao enviar vídeo');
            }
          }
        } else {
          throw new Error('Nenhuma URL ou buffer de vídeo encontrado');
        }

      } catch (error) {
        console.error('Erro no download do Facebook:', error);
        await extra.reply(`❌ Falha ao baixar o vídeo do Facebook.\n\nErro: ${error.message}\n\nTente novamente com outro link.`);
      }
    } catch (error) {
      console.error('Erro no comando Facebook:', error);
      await extra.reply('Ocorreu um erro ao processar a solicitação. Tente novamente mais tarde.');
    }
  }
};
