/**
 * Instagram to Sticker Cropped Command
 * igsc - Converter mídia do Instagram em figurinha quadrada cortada
 */

const { igdl } = require('ruhend-scraper');
const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const webp = require('node-webpmux');
const crypto = require('crypto');
const config = require('../../config');
const { getTempDir, deleteTempFile } = require('../../utils/tempManager');

// Function to extract unique media URLs (same as .ig command)
function extractUniqueMedia(mediaData) {
  const uniqueMedia = [];
  const seenUrls = new Set();

  for (const media of mediaData) {
    if (!media.url) continue;

    // Only check for exact URL duplicates
    if (!seenUrls.has(media.url)) {
      seenUrls.add(media.url);
      uniqueMedia.push(media);
    }
  }

  return uniqueMedia;
}

// Extract Instagram CDN URL from proxy JWT token
function extractInstagramUrl(proxyUrl) {
  try {
    const urlObj = new URL(proxyUrl);
    const token = urlObj.searchParams.get('token');
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length < 2) return null;

    const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());

    if (payload.url && typeof payload.url === 'string' && payload.url.startsWith('http')) {
      return payload.url;
    }
  } catch (e) {}
  return null;
}

function pickMediaUrl(media) {
  if (!media) return null;

  const candidates = [
    media.downloadUrl,
    media.url,
    media.original,
    media.mediaUrl,
    media.videoUrl,
    media.imageUrl,
    media.urls?.[0]
  ];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'string' && candidate.startsWith('http')) {
      if (candidate.includes('rapidcdn.app') && candidate.includes('token=')) {
        const instagramUrl = extractInstagramUrl(candidate);
        if (instagramUrl) {
          return instagramUrl;
        }
      }
      return candidate;
    }
  }

  return null;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_DURATION_SECONDS = 5 * 60;

// ... (parte técnica mantida igual)

async function igsCommand(sock, msg, args, extra, crop = false) {
  try {
    const text = msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    args.join(' ');

    const urlMatch = text.match(/https?:\/\/\S+/);
    if (!urlMatch) {
      return extra.reply(`Envie um link de post/reel do Instagram.\nUso:\n.igs <url>\n.igsc <url>`);
    }

    await sock.sendMessage(extra.from, { react: { text: '📥', key: msg.key } });

    const downloadData = await igdl(urlMatch[0]).catch(() => null);
    if (!downloadData || !downloadData.data) {
      return extra.reply('❌ Falha ao obter mídia do link do Instagram.');
    }

    const mediaData = downloadData.data || [];
    const rawItems = mediaData.filter(m => m && pickMediaUrl(m));
    const mediaToDownload = rawItems.slice(0, 10);

    if (mediaToDownload.length === 0) {
      return extra.reply('❌ Nenhuma mídia válida encontrada. O post pode ser privado ou o scraper falhou.');
    }

    let successCount = 0;
    let failCount = 0;
    const seenHashes = new Set();

    for (let i = 0; i < mediaToDownload.length; i++) {
      try {
        const media = mediaToDownload[i];
        const mediaUrl = pickMediaUrl(media);
        if (!mediaUrl) {
          failCount++;
          continue;
        }

        const isVideo = /\.(mp4|mov|avi|mkv|webm)$/i.test(mediaUrl) ||
        media.type === 'video' ||
        urlMatch[0].includes('/reel/') ||
        urlMatch[0].includes('/tv/');

        const buffer = await fetchBufferFromUrl(mediaUrl, i);
        const contentHash = crypto.createHash('md5').update(buffer).digest('hex');

        if (seenHashes.has(contentHash)) {
          continue;
        }
        seenHashes.add(contentHash);

        let stickerBuffer = await convertBufferToStickerWebp(buffer, isVideo, crop);
        let finalSticker = stickerBuffer;

        if (finalSticker.length > 950 * 1024) {
          try {
            const fallback = await forceMiniSticker(buffer, isVideo, crop);
            if (fallback) {
              finalSticker = fallback;
            }
          } catch (e) {}
        }

        try {
          await sock.sendMessage(extra.from, { sticker: finalSticker }, { quoted: msg });
          successCount++;
        } catch (sendErr) {
          failCount++;
        }

        if (i < mediaToDownload.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 800));
        }

      } catch (mediaError) {
        failCount++;
      }
    }

  } catch (err) {
    console.error('Error in igsc command:', err);
    await extra.reply('❌ Falha ao criar figurinha a partir do link do Instagram.');
  }
}

module.exports = {
  name: 'igsc',
  aliases: ['igstickercrop'],
  description: 'Converter post/reel do Instagram em figurinha quadrada cortada',
  usage: '.igsc <link do Instagram>',
  category: 'media',

  async execute(sock, msg, args, extra) {
    await igsCommand(sock, msg, args, extra, true);
  }
};
