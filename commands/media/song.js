/**
 * Song Downloader - Download audio from YouTube
 */

const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const APIs = require('../../utils/api');
const { toAudio } = require('../../utils/converter');

const AXIOS_DEFAULTS = {
  timeout: 60000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*'
  }
};

module.exports = {
  name: 'song',
  aliases: ['play', 'music', 'yta'],
  category: 'media',
  description: 'Baixar áudio do YouTube',
  usage: '.song <nome da música ou link do YouTube>',

  async execute(sock, msg, args) {
    try {
      const text = args.join(' ');
      const chatId = msg.key.remoteJid;

      if (!text) {
        return await sock.sendMessage(chatId, {
          text: 'Uso: .song <nome da música ou link do YouTube>'
        }, { quoted: msg });
      }

      let video;

      if (text.includes('youtube.com') || text.includes('youtu.be')) {
        video = { url: text };
      } else {
        const search = await yts(text);
        if (!search || !search.videos.length) {
          return await sock.sendMessage(chatId, {
            text: 'Nenhum resultado encontrado.'
          }, { quoted: msg });
        }
        video = search.videos[0];
      }

      // Inform user
      await sock.sendMessage(chatId, {
        image: { url: video.thumbnail },
        caption: `🎵 Baixando: *${video.title}*\n⏱ Duração: ${video.timestamp}`
      }, { quoted: msg });

      // Try multiple APIs with fallback chain
      let audioData;
      let audioBuffer;
      let downloadSuccess = false;

      // List of API methods to try
      const apiMethods = [
        { name: 'EliteProTech', method: () => APIs.getEliteProTechDownloadByUrl(video.url) },
        { name: 'Yupra', method: () => APIs.getYupraDownloadByUrl(video.url) },
        { name: 'Okatsu', method: () => APIs.getOkatsuDownloadByUrl(video.url) },
        { name: 'Izumi', method: () => APIs.getIzumiDownloadByUrl(video.url) }
      ];

      // Try each API until we successfully download audio
      for (const apiMethod of apiMethods) {
        try {
          audioData = await apiMethod.method();
          const audioUrl = audioData.download || audioData.dl || audioData.url;

          if (!audioUrl) {
            console.log(`${apiMethod.name} returned no download URL, trying next API...`);
            continue; // Try next API
          }

          // Try to download the audio file - arraybuffer first
          try {
            const audioResponse = await axios.get(audioUrl, {
              responseType: 'arraybuffer',
              timeout: 90000,
              maxContentLength: Infinity,
              maxBodyLength: Infinity,
              decompress: true,
              validateStatus: s => s >= 200 && s < 400,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                                                  'Accept': '*/*',
                                                  'Accept-Encoding': 'identity'
              }
            });
            audioBuffer = Buffer.from(audioResponse.data);

            // Validate buffer
            if (audioBuffer && audioBuffer.length > 0) {
              downloadSuccess = true;
              break; // Success! Exit the loop
            }
          } catch (downloadErr) {
            // Check if it's a 451 error or other client/server error
            const statusCode = downloadErr.response?.status || downloadErr.status;
            if (statusCode === 451) {
              console.log(`Download blocked (451) from ${apiMethod.name}, trying next API...`);
              continue; // Try next API
            }

            // Try stream mode as fallback for this URL
            try {
              const audioResponse = await axios.get(audioUrl, {
                responseType: 'stream',
                timeout: 90000,
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                validateStatus: s => s >= 200 && s < 400,
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                                                    'Accept': '*/*',
                                                    'Accept-Encoding': 'identity'
                }
              });
              const chunks = [];
              await new Promise((resolve, reject) => {
                audioResponse.data.on('data', c => chunks.push(c));
                audioResponse.data.on('end', resolve);
                audioResponse.data.on('error', reject);
              });
              audioBuffer = Buffer.concat(chunks);

              if (audioBuffer && audioBuffer.length > 0) {
                downloadSuccess = true;
                break; // Success! Exit the loop
              }
            } catch (streamErr) {
              // Stream mode also failed, try next API
              const streamStatusCode = streamErr.response?.status || streamErr.status;
              if (streamStatusCode === 451) {
                console.log(`Stream download blocked (451) from ${apiMethod.name}, trying next API...`);
              } else {
                console.log(`Stream download failed from ${apiMethod.name}:`, streamErr.message);
              }
              continue; // Try next API
            }
          }
        } catch (apiErr) {
          // API call failed, try next API
          console.log(`${apiMethod.name} API failed:`, apiErr.message);
          continue;
        }
      }

      // If all APIs failed, throw error
      if (!downloadSuccess || !audioBuffer) {
        throw new Error('Todas as fontes de download falharam. O conteúdo pode estar indisponível ou bloqueado na sua região.');
      }

      // Validate buffer
      if (!audioBuffer || audioBuffer.length === 0) {
        throw new Error('O buffer de áudio baixado está vazio');
      }

      // Detect actual file format from signature
      const firstBytes = audioBuffer.slice(0, 12);
      const hexSignature = firstBytes.toString('hex');
      const asciiSignature = firstBytes.toString('ascii', 4, 8);

      let actualMimetype = 'audio/mpeg';
      let fileExtension = 'mp3';
      let detectedFormat = 'unknown';

      // Check for MP4/M4A (ftyp box)
      if (asciiSignature === 'ftyp' || hexSignature.startsWith('000000')) {
        const ftypBox = audioBuffer.slice(4, 8).toString('ascii');
        if (ftypBox === 'ftyp') {
          detectedFormat = 'M4A/MP4';
          actualMimetype = 'audio/mp4';
          fileExtension = 'm4a';
        }
      }
      else if (audioBuffer.toString('ascii', 0, 3) === 'ID3' ||
        (audioBuffer[0] === 0xFF && (audioBuffer[1] & 0xE0) === 0xE0)) {
        detectedFormat = 'MP3';
      actualMimetype = 'audio/mpeg';
      fileExtension = 'mp3';
        }
        else if (audioBuffer.toString('ascii', 0, 4) === 'OggS') {
          detectedFormat = 'OGG/Opus';
          actualMimetype = 'audio/ogg; codecs=opus';
          fileExtension = 'ogg';
        }
        else if (audioBuffer.toString('ascii', 0, 4) === 'RIFF') {
          detectedFormat = 'WAV';
          actualMimetype = 'audio/wav';
          fileExtension = 'wav';
        }
        else {
          actualMimetype = 'audio/mp4';
          fileExtension = 'm4a';
          detectedFormat = 'Desconhecido (padrão para M4A)';
        }

        let finalBuffer = audioBuffer;
        let finalMimetype = 'audio/mpeg';
        let finalExtension = 'mp3';

        if (fileExtension !== 'mp3') {
          try {
            finalBuffer = await toAudio(audioBuffer, fileExtension);
            if (!finalBuffer || finalBuffer.length === 0) {
              throw new Error('A conversão retornou um buffer vazio');
            }
            finalMimetype = 'audio/mpeg';
            finalExtension = 'mp3';
          } catch (convErr) {
            throw new Error(`Falha ao converter ${detectedFormat} para MP3: ${convErr.message}`);
          }
        }

        await sock.sendMessage(chatId, {
          audio: finalBuffer,
          mimetype: finalMimetype,
          fileName: `${(audioData.title || video.title || 'musica').replace(/[^\w\s-]/g, '')}.${finalExtension}`,
                               ptt: false
        }, { quoted: msg });

        try {
          const tempDir = path.join(__dirname, '../../temp');
          if (fs.existsSync(tempDir)) {
            const files = fs.readdirSync(tempDir);
            const now = Date.now();
            files.forEach(file => {
              const filePath = path.join(tempDir, file);
              try {
                const stats = fs.statSync(filePath);
                if (now - stats.mtimeMs > 10000) {
                  if (file.endsWith('.mp3') || file.endsWith('.m4a') || /^\d+\.(mp3|m4a)$/.test(file)) {
                    fs.unlinkSync(filePath);
                  }
                }
              } catch (e) {}
            });
          }
        } catch (cleanupErr) {}

    } catch (err) {
      console.error('Song command error:', err);

      let errorMessage = '❌ Falha ao baixar a música.';
      if (err.message && err.message.includes('blocked')) {
        errorMessage = '❌ Download bloqueado. O conteúdo pode estar indisponível na sua região ou por restrições legais.';
      } else if (err.response?.status === 451 || err.status === 451) {
        errorMessage = '❌ Conteúdo indisponível (451). Pode ser devido a restrições legais ou bloqueio regional.';
      } else if (err.message && err.message.includes('All download sources failed')) {
        errorMessage = '❌ Todas as fontes de download falharam. O conteúdo pode estar indisponível ou bloqueado.';
      }

      await sock.sendMessage(msg.key.remoteJid, {
        text: errorMessage
      }, { quoted: msg });
    }
  }
};