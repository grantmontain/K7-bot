const crypto = require('crypto');
const {
  generateWAMessageContent,
  generateWAMessageFromContent,
  downloadContentFromMessage,
} = require('@whiskeysockets/baileys');
const { PassThrough } = require('stream');
const ffmpeg = require('fluent-ffmpeg');

// Single default color for text statuses (purple)
const PURPLE_COLOR = '#9C27B0';

module.exports = {
  name: 'groupstatus',
  aliases: ['togstatus', 'swgc', 'gs', 'gstatus'],
  description: 'Post replied media or text as a WhatsApp group status (new Group Status feature).',
  usage: '.groupstatus [caption]  (reply to image/video/audio) OR .groupstatus your text',
  category: 'admin',
  groupOnly: true,
  adminOnly: true,
  botAdminNeeded: true,

  async execute(sock, msg, args, extra) {
    try {
      const from = extra.from;

      // Only inside groups
      if (!extra.isGroup) {
        return extra.reply('👥 This command can only be used in groups.');
      }

      const caption = (args.join(' ') || '').trim();

      const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
      const hasQuoted = !!ctxInfo?.quotedMessage;

      // CASE 1: No quoted message -> treat as TEXT group status
      if (!hasQuoted) {
        if (!caption) {
          return extra.reply(
            '📝 *Group Status Usage*\n\n' +
            '• Reply to image/video/audio with:\n' +
            '  `.groupstatus [optional caption]`\n' +
            '• Or send text status only:\n' +
            '  `.groupstatus Your text here`\n\n' +
            'Text statuses use a single purple background color by default.'
          );
        }

        await extra.reply('⏳ Posting text group status...');

        try {
          await groupStatus(sock, from, {
            text: caption,
            backgroundColor: PURPLE_COLOR,
          });
          return extra.reply('✅ Text group status posted!');
        } catch (e) {
          console.error('groupstatus text error:', e);
          return extra.reply('❌ Failed to post text group status: ' + (e.message || e));
        }
      }

      // CASE 2: Quoted media -> image/video/audio group status
      const targetMessage = {
        key: {
          remoteJid: from,
          id: ctxInfo.stanzaId,
          participant: ctxInfo.participant,
        },
        message: ctxInfo.quotedMessage,
      };

      const mtype = Object.keys(targetMessage.message)[0] || '';

      const downloadBuf = async () => {
        const qmsg = targetMessage.message;
        if (/image/i.test(mtype))   return await downloadMedia(qmsg, 'image');
        if (/video/i.test(mtype))   return await downloadMedia(qmsg, 'video');
        if (/audio/i.test(mtype))   return await downloadMedia(qmsg, 'audio');
        if (/sticker/i.test(mtype)) return await downloadMedia(qmsg, 'sticker'); // download sticker correctly
        return null;
      };

      // IMAGE (also handles stickers)
      if (/image|sticker/i.test(mtype)) {
        await extra.reply('⏳ Posting image group status...');
        let buf;
        try {
          buf = await downloadBuf();
        } catch {
          return extra.reply('❌ Failed to download image');
        }
        if (!buf) return extra.reply('❌ Could not download image');

        try {
          await groupStatus(sock, from, {
            image: buf,
            caption: caption || '',
          });
          return extra.reply('✅ Image group status posted!');
        } catch (e) {
          console.error('groupstatus image error:', e);
          return extra.reply('❌ Failed to post image group status: ' + (e.message || e));
        }
      }

      // VIDEO
      if (/video/i.test(mtype)) {
        await extra.reply('⏳ Posting video group status...');
        let buf;
        try {
          buf = await downloadBuf();
        } catch {
          return extra.reply('❌ Failed to download video');
        }
        if (!buf) return extra.reply('❌ Could not download video');

        try {
          await groupStatus(sock, from, {
            video: buf,
            caption: caption || '',
          });
          return extra.reply('✅ Video group status posted!');
        } catch (e) {
          console.error('groupstatus video error:', e);
          return extra.reply('❌ Failed to post video group status: ' + (e.message || e));
        }
      }

      // AUDIO (voice-style group status)
      if (/audio/i.test(mtype)) {
        await extra.reply('⏳ Posting audio group status...');
        let buf;
        try {
          buf = await downloadBuf();
        } catch {
          return extra.reply('❌ Failed to download audio');
        }
        if (!buf) return extra.reply('❌ Could not download audio');

        let vn;
        try {
          vn = await toVN(buf);
        } catch {
          vn = buf;
        }

        let waveform;
        try {
          waveform = await generateWaveform(buf);
        } catch {
          waveform = undefined;
        }

        try {
          await groupStatus(sock, from, {
            audio: vn,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true,
            waveform,
          });
          return extra.reply('✅ Audio group status posted!');
        } catch (e) {
          console.error('groupstatus audio error:', e);
          return extra.reply('❌ Failed to post audio group status: ' + (e.message || e));
        }
      }

      return extra.reply('❌ Unsupported media type. Reply to an image, video, or audio.');
    } catch (e) {
      console.error('groupstatus command error (outer):', e);
      return extra.reply('❌ Error: ' + (e.message || e));
    }
  },
};

// ---- Helpers ----

async function downloadMedia(msg, type) {
  const mediaMsg = msg[`${type}Message`] || msg;
  const stream = await downloadContentFromMessage(mediaMsg, type);
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function groupStatus(sock, jid, content) {
  const { backgroundColor } = content;
  delete content.backgroundColor;

  const inside = await generateWAMessageContent(content, {
    upload: sock.waUploadToServer,
    backgroundColor: backgroundColor || PURPLE_COLOR,
  });

  const secret = crypto.randomBytes(32);

  const msg = generateWAMessageFromContent(
    jid,
    {
      messageContextInfo: { messageSecret: secret },
      groupStatusMessageV2: {
        message: {
          ...inside,
          messageContextInfo: { messageSecret: secret },
        },
      },
    },
    {}
  );

  await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
  return msg;
}

function toVN(buffer) {
  return new Promise((resolve, reject) => {
    const input = new PassThrough();
    const output = new PassThrough();
    const chunks = [];

    input.end(buffer);

    ffmpeg(input)
      .noVideo()
      .audioCodec('libopus')
      .format('ogg')
      .audioChannels(1)
      .audioFrequency(48000)
      .on('error', reject)
      .on('end', () => resolve(Buffer.concat(chunks)))
      .pipe(output);

    output.on('data', (c) => chunks.push(c));
  });
}

function generateWaveform(buffer, bars = 64) {
  return new Promise((resolve, reject) => {
    const input = new PassThrough();
    input.end(buffer);

    const chunks = [];

    ffmpeg(input)
      .audioChannels(1)
      .audioFrequency(16000)
      .format('s16le')
      .on('error', reject)
      .on('end', () => {
        const raw = Buffer.concat(chunks);
        const samples = raw.length / 2;
        const amps = [];

        for (let i = 0; i < samples; i++) {
          amps.push(Math.abs(raw.readInt16LE(i * 2)) / 32768);
        }

        const size = Math.floor(amps.length / bars);
        if (size === 0) return resolve(undefined);

        const avg = Array.from({ length: bars }, (_, i) =>
          amps
            .slice(i * size, (i + 1) * size)
            .reduce((a, b) => a + b, 0) / size
        );

        const max = Math.max(...avg);
        if (max === 0) return resolve(undefined);

        resolve(
          Buffer.from(
            avg.map((v) => Math.floor((v / max) * 100))
          ).toString('base64')
        );
      })
      .pipe()
      .on('data', (c) => chunks.push(c));
  });
}// commands/admin/groupstatus.js

const crypto = require('crypto');
const {
  generateWAMessageContent,
  generateWAMessageFromContent,
  downloadContentFromMessage,
} = require('@whiskeysockets/baileys');
const { PassThrough } = require('stream');
const ffmpeg = require('fluent-ffmpeg');

// Cor padrão para status de texto (roxo)
const PURPLE_COLOR = '#9C27B0';

module.exports = {
  name: 'groupstatus',
  aliases: ['togstatus', 'swgc', 'gs', 'gstatus'],
  description: 'Posta mídia ou texto respondido como status do grupo WhatsApp (novo recurso de Status do Grupo).',
  usage: '.groupstatus [legenda] (responda a imagem/vídeo/áudio) OU .groupstatus seu texto',
  category: 'admin',
  groupOnly: true,
  adminOnly: true,
  botAdminNeeded: true,

  async execute(sock, msg, args, extra) {
    try {
      const from = extra.from;

      // Apenas em grupos
      if (!extra.isGroup) {
        return extra.reply('👥 Este comando só pode ser usado em grupos.');
      }

      const caption = (args.join(' ') || '').trim();

      const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
      const hasQuoted = !!ctxInfo?.quotedMessage;

      // CASO 1: Sem mensagem respondida -> postar como STATUS DE TEXTO
      if (!hasQuoted) {
        if (!caption) {
          return extra.reply(
            '📝 *Como usar o Status do Grupo*\n\n' +
            '• Responda a imagem/vídeo/áudio com:\n' +
            '  `.groupstatus [legenda opcional]`\n' +
            '• Ou envie apenas texto:\n' +
            '  `.groupstatus Seu texto aqui`\n\n' +
            'Status de texto usam fundo roxo por padrão.'
          );
        }

        await extra.reply('⏳ Postando status de texto do grupo...');

        try {
          await groupStatus(sock, from, {
            text: caption,
            backgroundColor: PURPLE_COLOR,
          });
          return extra.reply('✅ Status de texto postado!');
        } catch (e) {
          console.error('groupstatus erro no texto:', e);
          return extra.reply('❌ Falha ao postar status de texto: ' + (e.message || e));
        }
      }

      // CASO 2: Mídia respondida -> imagem/vídeo/áudio como status do grupo
      const targetMessage = {
        key: {
          remoteJid: from,
          id: ctxInfo.stanzaId,
          participant: ctxInfo.participant,
        },
        message: ctxInfo.quotedMessage,
      };

      const mtype = Object.keys(targetMessage.message)[0] || '';

      const downloadBuf = async () => {
        const qmsg = targetMessage.message;
        if (/image/i.test(mtype))   return await downloadMedia(qmsg, 'image');
        if (/video/i.test(mtype))   return await downloadMedia(qmsg, 'video');
        if (/audio/i.test(mtype))   return await downloadMedia(qmsg, 'audio');
        if (/sticker/i.test(mtype)) return await downloadMedia(qmsg, 'sticker');
        return null;
      };

      // IMAGEM (também lida com figurinhas)
      if (/image|sticker/i.test(mtype)) {
        await extra.reply('⏳ Postando status de imagem do grupo...');
        let buf;
        try {
          buf = await downloadBuf();
        } catch {
          return extra.reply('❌ Falha ao baixar a imagem');
        }
        if (!buf) return extra.reply('❌ Não foi possível baixar a imagem');

        try {
          await groupStatus(sock, from, {
            image: buf,
            caption: caption || '',
          });
          return extra.reply('✅ Status de imagem postado!');
        } catch (e) {
          console.error('groupstatus erro na imagem:', e);
          return extra.reply('❌ Falha ao postar status de imagem: ' + (e.message || e));
        }
      }

      // VÍDEO
      if (/video/i.test(mtype)) {
        await extra.reply('⏳ Postando status de vídeo do grupo...');
        let buf;
        try {
          buf = await downloadBuf();
        } catch {
          return extra.reply('❌ Falha ao baixar o vídeo');
        }
        if (!buf) return extra.reply('❌ Não foi possível baixar o vídeo');

        try {
          await groupStatus(sock, from, {
            video: buf,
            caption: caption || '',
          });
          return extra.reply('✅ Status de vídeo postado!');
        } catch (e) {
          console.error('groupstatus erro no vídeo:', e);
          return extra.reply('❌ Falha ao postar status de vídeo: ' + (e.message || e));
        }
      }

      // ÁUDIO (estilo nota de voz para status do grupo)
      if (/audio/i.test(mtype)) {
        await extra.reply('⏳ Postando status de áudio do grupo...');
        let buf;
        try {
          buf = await downloadBuf();
        } catch {
          return extra.reply('❌ Falha ao baixar o áudio');
        }
        if (!buf) return extra.reply('❌ Não foi possível baixar o áudio');

        let vn;
        try {
          vn = await toVN(buf);
        } catch {
          vn = buf;
        }

        let waveform;
        try {
          waveform = await generateWaveform(buf);
        } catch {
          waveform = undefined;
        }

        try {
          await groupStatus(sock, from, {
            audio: vn,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true,
            waveform,
          });
          return extra.reply('✅ Status de áudio postado!');
        } catch (e) {
          console.error('groupstatus erro no áudio:', e);
          return extra.reply('❌ Falha ao postar status de áudio: ' + (e.message || e));
        }
      }

      return extra.reply('❌ Tipo de mídia não suportado. Responda a uma imagem, vídeo ou áudio.');
    } catch (e) {
      console.error('groupstatus erro geral:', e);
      return extra.reply('❌ Erro: ' + (e.message || e));
    }
  },
};

// ---- Funções auxiliares ----

async function downloadMedia(msg, type) {
  const mediaMsg = msg[`${type}Message`] || msg;
  const stream = await downloadContentFromMessage(mediaMsg, type);
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function groupStatus(sock, jid, content) {
  const { backgroundColor } = content;
  delete content.backgroundColor;

  const inside = await generateWAMessageContent(content, {
    upload: sock.waUploadToServer,
    backgroundColor: backgroundColor || PURPLE_COLOR,
  });

  const secret = crypto.randomBytes(32);

  const msg = generateWAMessageFromContent(
    jid,
    {
      messageContextInfo: { messageSecret: secret },
      groupStatusMessageV2: {
        message: {
          ...inside,
          messageContextInfo: { messageSecret: secret },
        },
      },
    },
    {}
  );

  await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
  return msg;
}

function toVN(buffer) {
  return new Promise((resolve, reject) => {
    const input = new PassThrough();
    const output = new PassThrough();
    const chunks = [];

    input.end(buffer);

    ffmpeg(input)
      .noVideo()
      .audioCodec('libopus')
      .format('ogg')
      .audioChannels(1)
      .audioFrequency(48000)
      .on('error', reject)
      .on('end', () => resolve(Buffer.concat(chunks)))
      .pipe(output);

    output.on('data', (c) => chunks.push(c));
  });
}

function generateWaveform(buffer, bars = 64) {
  return new Promise((resolve, reject) => {
    const input = new PassThrough();
    input.end(buffer);

    const chunks = [];

    ffmpeg(input)
      .audioChannels(1)
      .audioFrequency(16000)
      .format('s16le')
      .on('error', reject)
      .on('end', () => {
        const raw = Buffer.concat(chunks);
        const samples = raw.length / 2;
        const amps = [];

        for (let i = 0; i < samples; i++) {
          amps.push(Math.abs(raw.readInt16LE(i * 2)) / 32768);
        }

        const size = Math.floor(amps.length / bars);
        if (size === 0) return resolve(undefined);

        const avg = Array.from({ length: bars }, (_, i) =>
          amps
            .slice(i * size, (i + 1) * size)
            .reduce((a, b) => a + b, 0) / size
        );

        const max = Math.max(...avg);
        if (max === 0) return resolve(undefined);

        resolve(
          Buffer.from(
            avg.map((v) => Math.floor((v / max) * 100))
          ).toString('base64')
        );
      })
      .pipe()
      .on('data', (c) => chunks.push(c));
  });
}const crypto = require('crypto');
const {
  generateWAMessageContent,
  generateWAMessageFromContent,
  downloadContentFromMessage,
} = require('@whiskeysockets/baileys');
const { PassThrough } = require('stream');
const ffmpeg = require('fluent-ffmpeg');

// Single default color for text statuses (purple)
const PURPLE_COLOR = '#9C27B0';

module.exports = {
  name: 'groupstatus',
  aliases: ['togstatus', 'swgc', 'gs', 'gstatus'],
  description: 'Post replied media or text as a WhatsApp group status (new Group Status feature).',
  usage: '.groupstatus [caption]  (reply to image/video/audio) OR .groupstatus your text',
  category: 'admin',
  groupOnly: true,
  adminOnly: true,
  botAdminNeeded: true,

  async execute(sock, msg, args, extra) {
    try {
      const from = extra.from;

      // Only inside groups
      if (!extra.isGroup) {
        return extra.reply('👥 This command can only be used in groups.');
      }

      const caption = (args.join(' ') || '').trim();

      const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
      const hasQuoted = !!ctxInfo?.quotedMessage;

      // CASE 1: No quoted message -> treat as TEXT group status
      if (!hasQuoted) {
        if (!caption) {
          return extra.reply(
            '📝 *Group Status Usage*\n\n' +
            '• Reply to image/video/audio with:\n' +
            '  `.groupstatus [optional caption]`\n' +
            '• Or send text status only:\n' +
            '  `.groupstatus Your text here`\n\n' +
            'Text statuses use a single purple background color by default.'
          );
        }

        await extra.reply('⏳ Posting text group status...');

        try {
          await groupStatus(sock, from, {
            text: caption,
            backgroundColor: PURPLE_COLOR,
          });
          return extra.reply('✅ Text group status posted!');
        } catch (e) {
          console.error('groupstatus text error:', e);
          return extra.reply('❌ Failed to post text group status: ' + (e.message || e));
        }
      }

      // CASE 2: Quoted media -> image/video/audio group status
      const targetMessage = {
        key: {
          remoteJid: from,
          id: ctxInfo.stanzaId,
          participant: ctxInfo.participant,
        },
        message: ctxInfo.quotedMessage,
      };

      const mtype = Object.keys(targetMessage.message)[0] || '';

      const downloadBuf = async () => {
        const qmsg = targetMessage.message;
        if (/image/i.test(mtype))   return await downloadMedia(qmsg, 'image');
        if (/video/i.test(mtype))   return await downloadMedia(qmsg, 'video');
        if (/audio/i.test(mtype))   return await downloadMedia(qmsg, 'audio');
        if (/sticker/i.test(mtype)) return await downloadMedia(qmsg, 'sticker'); // download sticker correctly
        return null;
      };

      // IMAGE (also handles stickers)
      if (/image|sticker/i.test(mtype)) {
        await extra.reply('⏳ Posting image group status...');
        let buf;
        try {
          buf = await downloadBuf();
        } catch {
          return extra.reply('❌ Failed to download image');
        }
        if (!buf) return extra.reply('❌ Could not download image');

        try {
          await groupStatus(sock, from, {
            image: buf,
            caption: caption || '',
          });
          return extra.reply('✅ Image group status posted!');
        } catch (e) {
          console.error('groupstatus image error:', e);
          return extra.reply('❌ Failed to post image group status: ' + (e.message || e));
        }
      }

      // VIDEO
      if (/video/i.test(mtype)) {
        await extra.reply('⏳ Posting video group status...');
        let buf;
        try {
          buf = await downloadBuf();
        } catch {
          return extra.reply('❌ Failed to download video');
        }
        if (!buf) return extra.reply('❌ Could not download video');

        try {
          await groupStatus(sock, from, {
            video: buf,
            caption: caption || '',
          });
          return extra.reply('✅ Video group status posted!');
        } catch (e) {
          console.error('groupstatus video error:', e);
          return extra.reply('❌ Failed to post video group status: ' + (e.message || e));
        }
      }

      // AUDIO (voice-style group status)
      if (/audio/i.test(mtype)) {
        await extra.reply('⏳ Posting audio group status...');
        let buf;
        try {
          buf = await downloadBuf();
        } catch {
          return extra.reply('❌ Failed to download audio');
        }
        if (!buf) return extra.reply('❌ Could not download audio');

        let vn;
        try {
          vn = await toVN(buf);
        } catch {
          vn = buf;
        }

        let waveform;
        try {
          waveform = await generateWaveform(buf);
        } catch {
          waveform = undefined;
        }

        try {
          await groupStatus(sock, from, {
            audio: vn,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true,
            waveform,
          });
          return extra.reply('✅ Audio group status posted!');
        } catch (e) {
          console.error('groupstatus audio error:', e);
          return extra.reply('❌ Failed to post audio group status: ' + (e.message || e));
        }
      }

      return extra.reply('❌ Unsupported media type. Reply to an image, video, or audio.');
    } catch (e) {
      console.error('groupstatus command error (outer):', e);
      return extra.reply('❌ Error: ' + (e.message || e));
    }
  },
};

// ---- Helpers ----

async function downloadMedia(msg, type) {
  const mediaMsg = msg[`${type}Message`] || msg;
  const stream = await downloadContentFromMessage(mediaMsg, type);
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function groupStatus(sock, jid, content) {
  const { backgroundColor } = content;
  delete content.backgroundColor;

  const inside = await generateWAMessageContent(content, {
    upload: sock.waUploadToServer,
    backgroundColor: backgroundColor || PURPLE_COLOR,
  });

  const secret = crypto.randomBytes(32);

  const msg = generateWAMessageFromContent(
    jid,
    {
      messageContextInfo: { messageSecret: secret },
      groupStatusMessageV2: {
        message: {
          ...inside,
          messageContextInfo: { messageSecret: secret },
        },
      },
    },
    {}
  );

  await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
  return msg;
}

function toVN(buffer) {
  return new Promise((resolve, reject) => {
    const input = new PassThrough();
    const output = new PassThrough();
    const chunks = [];

    input.end(buffer);

    ffmpeg(input)
      .noVideo()
      .audioCodec('libopus')
      .format('ogg')
      .audioChannels(1)
      .audioFrequency(48000)
      .on('error', reject)
      .on('end', () => resolve(Buffer.concat(chunks)))
      .pipe(output);

    output.on('data', (c) => chunks.push(c));
  });
}

function generateWaveform(buffer, bars = 64) {
  return new Promise((resolve, reject) => {
    const input = new PassThrough();
    input.end(buffer);

    const chunks = [];

    ffmpeg(input)
      .audioChannels(1)
      .audioFrequency(16000)
      .format('s16le')
      .on('error', reject)
      .on('end', () => {
        const raw = Buffer.concat(chunks);
        const samples = raw.length / 2;
        const amps = [];

        for (let i = 0; i < samples; i++) {
          amps.push(Math.abs(raw.readInt16LE(i * 2)) / 32768);
        }

        const size = Math.floor(amps.length / bars);
        if (size === 0) return resolve(undefined);

        const avg = Array.from({ length: bars }, (_, i) =>
          amps
            .slice(i * size, (i + 1) * size)
            .reduce((a, b) => a + b, 0) / size
        );

        const max = Math.max(...avg);
        if (max === 0) return resolve(undefined);

        resolve(
          Buffer.from(
            avg.map((v) => Math.floor((v / max) * 100))
          ).toString('base64')
        );
      })
      .pipe()
      .on('data', (c) => chunks.push(c));
  });
}
