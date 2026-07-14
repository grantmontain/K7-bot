/**
 * TikTok Downloader - Download TikTok videos
 */

const { ttdl } = require('ruhend-scraper');
const axios = require('axios');
const APIs = require('../../utils/api');
const config = require('../../config');

// Store processed message IDs to prevent duplicates
const processedMessages = new Set();

module.exports = {
  name: 'tiktok',
  aliases: ['tt', 'ttdl', 'tiktokdl'],
  category: 'media',
  description: 'Baixar vídeos do TikTok',
  usage: '.tiktok <URL do TikTok>',

  async execute(sock, msg, args) {
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
        return await sock.sendMessage(msg.key.remoteJid, {
          text: 'Por favor, forneça um link do TikTok para o vídeo.'
        }, { quoted: msg });
      }

      // Extract URL from command
      const url = text.split(' ').slice(1).join(' ').trim();

      if (!url) {
        return await sock.sendMessage(msg.key.remoteJid, {
          text: 'Por favor, forneça um link do TikTok para o vídeo.'
        }, { quoted: msg });
      }

      // Check for various TikTok URL formats
      const tiktokPatterns = [
        /https?:\/\/(?:www\.)?tiktok\.com\//,
        /https?:\/\/(?:vm\.)?tiktok\.com\//,
        /https?:\/\/(?:vt\.)?tiktok\.com\//,
        /https?:\/\/(?:www\.)?tiktok\.com\/@/,
        /https?:\/\/(?:www\.)?tiktok\.com\/t\//
      ];

      const isValidUrl = tiktokPatterns.some(pattern => pattern.test(url));

      if (!isValidUrl) {
        return await sock.sendMessage(msg.key.remoteJid, {
          text: 'Este não é um link válido do TikTok. Por favor, forneça um link de vídeo do TikTok válido.'
        }, { quoted: msg });
      }

      await sock.sendMessage(msg.key.remoteJid, {
        react: { text: '🔄', key: msg.key }
      });

      try {
        let videoUrl = null;
        let title = null;

        // Try Siputzx API first
        try {
          const result = await APIs.getTikTokDownload(url);
          videoUrl = result.videoUrl;
          title = result.title;
        } catch (apiError) {
          console.error(`Siputzx API failed: ${apiError.message}`);
        }

        // If Siputzx API didn't work, try ttdl method
        if (!videoUrl) {
          try {
            let downloadData = await ttdl(url);
            if (downloadData && downloadData.data && downloadData.data.length > 0) {
              const mediaData = downloadData.data;
              for (let i = 0; i < Math.min(20, mediaData.length); i++) {
                const media = mediaData[i];
                const mediaUrl = media.url;
                const isVideo = /\.(mp4|mov|avi|mkv|webm)$/i.test(mediaUrl) || media.type === 'video';

                if (isVideo) {
                  await sock.sendMessage(msg.key.remoteJid, {
                    video: { url: mediaUrl },
                    mimetype: 'video/mp4',
                    caption: `*BAIXADO POR ${config.botName.toUpperCase()}*`
                  }, { quoted: msg });
                } else {
                  await sock.sendMessage(msg.key.remoteJid, {
                    image: { url: mediaUrl },
                    caption: `*BAIXADO POR ${config.botName.toUpperCase()}*`
                  }, { quoted: msg });
                }
              }
              return;
            }
          } catch (ttdlError) {
            console.error('ttdl fallback also failed:', ttdlError.message);
          }
        }

        // Send the video if we got a URL
        if (videoUrl) {
          try {
            // Download video as buffer
            const videoResponse = await axios.get(videoUrl, {
              responseType: 'arraybuffer',
              timeout: 60000,
              maxContentLength: 100 * 1024 * 1024, // 100MB limit
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                                                  'Accept': 'video/mp4,video/*,*/*;q=0.9',
                                                  'Accept-Language': 'en-US,en;q=0.9',
                                                  'Accept-Encoding': 'gzip, deflate, br',
                                                  'Connection': 'keep-alive',
                                                  'Referer': 'https://www.tiktok.com/'
              }
            });

            const videoBuffer = Buffer.from(videoResponse.data);

            if (videoBuffer.length === 0) {
              throw new Error('O buffer de vídeo está vazio');
            }

            const botName = config.botName.toUpperCase();
            const caption = title ? `*BAIXADO POR ${botName}*\n\n📝 Título: ${title}` : `*BAIXADO POR ${botName}*`;

            await sock.sendMessage(msg.key.remoteJid, {
              video: videoBuffer,
              mimetype: 'video/mp4',
              caption: caption
            }, { quoted: msg });

            return;
          } catch (downloadError) {
            console.error(`Failed to download video: ${downloadError.message}`);
            // Fallback to URL method
            try {
              const botName = config.botName.toUpperCase();
              const caption = title ? `*BAIXADO POR ${botName}*\n\n📝 Título: ${title}` : `*BAIXADO POR ${botName}*`;

              await sock.sendMessage(msg.key.remoteJid, {
                video: { url: videoUrl },
                mimetype: 'video/mp4',
                caption: caption
              }, { quoted: msg });
              return;
            } catch (urlError) {
              console.error(`URL method also failed: ${urlError.message}`);
            }
          }
        }

        // If we reach here, no method worked
        return await sock.sendMessage(msg.key.remoteJid, {
          text: '❌ Falha ao baixar o vídeo do TikTok. Todos os métodos falharam. Tente novamente com outro link.'
        }, { quoted: msg });

      } catch (error) {
        console.error('Error in TikTok download:', error);
        await sock.sendMessage(msg.key.remoteJid, {
          text: 'Falha ao baixar o vídeo do TikTok. Tente novamente com outro link.'
        }, { quoted: msg });
      }
    } catch (error) {
      console.error('Error in TikTok command:', error);
      await sock.sendMessage(msg.key.remoteJid, {
        text: 'Ocorreu um erro ao processar a solicitação. Tente novamente mais tarde.'
      }, { quoted: msg });
    }
  }
};