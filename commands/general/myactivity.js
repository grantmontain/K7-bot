// commands/general/myactivity.js

const { getStats, getAllTimeStats } = require('../../utils/groupStats');

module.exports = {
    name: 'myactivity',
    aliases: ['mystats', 'mymsgs', 'rank'],
    category: 'general',
    description: 'Veja suas estatísticas de atividade (hoje ou todo o tempo)',
    usage: '.myactivity [hoje|total]',
    groupOnly: true,

    async execute(sock, msg, args, extra) {
        try {
            const from = extra.from;
            const sender = extra.sender;
            
            // Verificar qual período o usuário quer (padrão: hoje)
            const period = args[0] ? args[0].toLowerCase() : 'hoje';
            let stats;
            let periodoTexto;
            
            if (period === 'total' || period === 'todo' || period === 'all' || period === 'geral') {
                stats = getAllTimeStats(from);
                periodoTexto = 'Todo o Tempo';
            } else {
                stats = getStats(from);
                periodoTexto = 'Hoje';
            }

            if (!stats || !stats.users || !stats.users[sender]) {
                if (periodoTexto === 'Hoje') {
                    return extra.reply('📊 Você ainda não enviou nenhuma mensagem hoje neste grupo!');
                } else {
                    return extra.reply('📊 Você ainda não enviou nenhuma mensagem neste grupo!');
                }
            }

            const userCount = stats.users[sender];
            const totalMessages = stats.total;
            const percentage = ((userCount / totalMessages) * 100).toFixed(1);

            // Calcular classificação
            const sortedUsers = Object.entries(stats.users)
                .sort((a, b) => b[1] - a[1]);
            
            const rank = sortedUsers.findIndex(([id]) => id === sender) + 1;

            const text = `
📊 *Sua Atividade - ${periodoTexto}*

👤 *Usuário:* @${sender.split('@')[0]}
📝 *Mensagens Enviadas:* ${userCount}
📈 *Sua Participação:* ${percentage}%
🏆 *Classificação:* #${rank} de ${sortedUsers.length}

💡 Use .myactivity total para ver estatísticas de todo o tempo
`.trim();

            await sock.sendMessage(from, {
                text,
                mentions: [sender]
            }, { quoted: msg });

        } catch (err) {
            console.error('[myactivity cmd] erro:', err);
            extra.reply('❌ Erro ao carregar suas estatísticas de atividade.');
        }
    }
};// commands/general/myactivity.js

const { getAllTimeStats } = require('../../utils/groupstats');

module.exports = {
    name: 'myactivity',
    aliases: ['mystats', 'mymsgs', 'rank'],
    category: 'general',
    description: 'Veja suas estatísticas de atividade total no grupo',
    usage: '.myactivity',
    groupOnly: true,

    async execute(sock, msg, args, extra) {
        try {
            const from = extra.from;
            const sender = extra.sender;
            const stats = getAllTimeStats(from);

            if (!stats || !stats.users || !stats.users[sender]) {
                return extra.reply('📊 Você ainda não enviou nenhuma mensagem neste grupo!');
            }

            const userCount = stats.users[sender];
            const totalMessages = stats.total;
            const percentage = ((userCount / totalMessages) * 100).toFixed(1);

            // Calcular classificação
            const sortedUsers = Object.entries(stats.users)
                .sort((a, b) => b[1] - a[1]);
            
            const rank = sortedUsers.findIndex(([id]) => id === sender) + 1;

            const text = `
📊 *Sua Atividade Total*

👤 *Usuário:* @${sender.split('@')[0]}
📝 *Mensagens Enviadas:* ${userCount}
📈 *Sua Participação:* ${percentage}%
🏆 *Classificação:* #${rank} de ${sortedUsers.length}

Continue conversando! 💬
`.trim();

            await sock.sendMessage(from, {
                text,
                mentions: [sender]
            }, { quoted: msg });

        } catch (err) {
            console.error('[myactivity cmd] erro:', err);
            extra.reply('❌ Erro ao carregar suas estatísticas de atividade.');
        }
    }
};
