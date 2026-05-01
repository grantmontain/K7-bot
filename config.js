/**
 * Global Configuration for WhatsApp MD Bot
 */

module.exports = {
    // Bot Owner Configuration
    ownerNumber: ['91xxxxxxxxxxx'], // Add your number without + or spaces (e.g., 919876543210)
    ownerName: ['Montanha', 'Professor'], // Owner names corresponding to ownerNumber array
    
    // Bot Configuration
    botName: 'K7',
    prefix: '.',
    sessionName: 'session',
    sessionID: process.env.SESSION_ID || '',
    newsletterJid: '120363161513685998@newsletter', // Newsletter JID for menu forwarding
    updateZipUrl: 'https://github.com/grantmontain/K7-bot/archive/refs/heads/main.zip', // URL to latest code zip for .update command
    
    // Sticker Configuration
    packname: 'K7',
    
    // Bot Behavior
    selfMode: false, // Private mode - only owner can use commands
    autoRead: false,
    autoTyping: false,
    autoBio: false,
    autoSticker: false,
    autoReact: false,
    autoReactMode: 'bot', // set bot or all via cmd
    autoDownload: false,
    
    // Group Settings Defaults
    defaultGroupSettings: {
      antilink: false,
      antilinkAction: 'delete', // 'delete', 'kick', 'warn'
      antitag: false,
      antitagAction: 'delete',
      antiall: false, // Owner only - blocks all messages from non-admins
      antiviewonce: false,
      antibot: false,
      anticall: false, // Anti-call feature
      antigroupmention: false, // Anti-group mention feature
      antigroupmentionAction: 'delete', // 'delete', 'kick'
      welcome: false,
      welcomeMessage: '╭╼━≪•NOVO MEMBRO•≫━╾╮\n┃BEM VINDO: @user 👋\n┃Contagem de menbros: #memberCount\n┃Hora: time⏰\n╰━━━━━━━━━━━━━━━╯\n\n*@user* Bem-vindo ao *@group*! 🎉\n*Group 𝙳𝙴𝚂𝙲𝚁𝙸𝙿𝚃𝙸𝙾𝙽*\ngroupDesc\n\n> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ botName*',
      goodbye: false,
      goodbyeMessage: 'Adeus @user 👋 Nunca vamos nos esquecer de você!',
      antiSpam: false,
      antidelete: false,
      nsfw: false,
      detect: false,
      chatbot: false,
      autosticker: false // Auto-convert images/videos to stickers
    },
    
    // API Keys (add your own)
    apiKeys: {
      // Add API keys here if needed
      openai: '',
      deepai: '',
      remove_bg: ''
    },
    
    // Message Configuration
    messages: {
      wait: '⏳ Espere um pouco',
      success: '✅ Sucesso!',
      error: '❌ Ocorreu um erro!',
      ownerOnly: '👑 Esse comando é apenas para o dono do bot!',
      adminOnly: '🛡️ Esse comando é apenas para os admins do grupo!',
      groupOnly: '👥 Esse comando é apenas para grupos!',
      privateOnly: '💬 Esse comando é apenas para o privado!',
      botAdminNeeded: '🤖 Bot precisa ser adm para executar esse comando!',
      invalidCommand: '❓ Comando invalido! digite .menu para ver os comandos'
    },
    
    // Timezone
    timezone: 'America/Sao_Paulo',
    
    // Limits
    maxWarnings: 3,
    
    // Social Links (optional)
    social: {
      github: 'https://github.com/mruniquehacker',
      instagram: 'https://instagram.com/yourusername',
      youtube: 'http://youtube.com/@mr_unique_hacker'
    }
};
  
