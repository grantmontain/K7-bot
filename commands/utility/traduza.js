/**
 * Translate Command - Translate text to different languages
 */

const fetch = require('node-fetch');

module.exports = {
  name: 'traduza',
  aliases: ['trt', 'tr'],
  category: 'utility',
  description: 'Traduzir texto para diferentes idiomas',
  usage: '.traduza <texto> <idioma> ou .traduza <idioma> (respondendo a uma mensagem)',

  async execute(sock, msg, args) {
    try {
      const chatId = msg.key.remoteJid;

      // Show typing indicator
      await sock.sendPresenceUpdate('composing', chatId);

      let textToTranslate = '';
      let lang = '';

      // Check if it's a reply
      const quotedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

      if (quotedMessage) {
        // Get text from quoted message
        textToTranslate = quotedMessage.conversation ||
        quotedMessage.extendedTextMessage?.text ||
        quotedMessage.imageMessage?.caption ||
        quotedMessage.videoMessage?.caption ||
        '';

  // Get language from command
  lang = args.join(' ').trim();
      } else {
        // Parse command arguments for direct message
        if (args.length < 2) {
          return await sock.sendMessage(chatId, {
            text: `*TRADUTOR*\n\n` +
            `Uso:\n` +
            `1. Responda a uma mensagem com: .translate <idioma> ou .trt <idioma>\n` +
            `2. Ou digite: .translate <texto> <idioma> ou .trt <texto> <idioma>\n\n` +
            `Exemplo:\n` +
            `.translate hello fr\n` +
            `.trt hello fr\n\n` +
            `Códigos de idioma:\n` +
            `fr - Francês, es - Espanhol, de - Alemão, it - Italiano\n` +
            `pt - Português, ru - Russo, ja - Japonês, ko - Coreano\n` +
            `zh - Chinês, ar - Árabe, hi - Hindi`
          }, { quoted: msg });
        }

        lang = args.pop(); // Get language code
        textToTranslate = args.join(' '); // Get text to translate
      }

      if (!textToTranslate) {
        return await sock.sendMessage(chatId, {
          text: '❌ Nenhum texto encontrado para traduzir. Forneça um texto ou responda a uma mensagem.'
        }, { quoted: msg });
      }

      if (!lang) {
        return await sock.sendMessage(chatId, {
          text: '❌ Por favor, especifique um código de idioma.\n\nExemplo: .translate hello fr'
        }, { quoted: msg });
      }

      // Try multiple translation APIs in sequence
      let translatedText = null;

      // Try API 1 (Google Translate API)
      try {
        const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(textToTranslate)}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data[0] && data[0][0] && data[0][0][0]) {
            translatedText = data[0][0][0];
          }
        }
      } catch (e) {
        // Continue to next API
      }

      // If API 1 fails, try API 2
      if (!translatedText) {
        try {
          const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=auto|${lang}`);
          if (response.ok) {
            const data = await response.json();
            if (data && data.responseData && data.responseData.translatedText) {
              translatedText = data.responseData.translatedText;
            }
          }
        } catch (e) {
          // Continue to next API
        }
      }

      // If API 2 fails, try API 3
      if (!translatedText) {
        try {
          const response = await fetch(`https://api.dreaded.site/api/translate?text=${encodeURIComponent(textToTranslate)}&lang=${lang}`);
          if (response.ok) {
            const data = await response.json();
            if (data && data.translated) {
              translatedText = data.translated;
            }
          }
        } catch (e) {
          // All APIs failed
        }
      }

      if (!translatedText) {
        return await sock.sendMessage(chatId, {
          text: '❌ Falha ao traduzir o texto. Tente novamente mais tarde.'
        }, { quoted: msg });
      }

      // Send translation
      await sock.sendMessage(chatId, {
        text: `${translatedText}`
      }, { quoted: msg });

    } catch (error) {
      console.error('❌ Error in translate command:', error);
      await sock.sendMessage(msg.key.remoteJid, {
        text: '❌ Falha ao traduzir o texto. Tente novamente mais tarde.'
      }, { quoted: msg });
    }
  }
};
