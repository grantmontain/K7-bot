// commands/admin/groupstats.js

const { getStats, getAllTimeStats } = require('../../utils/groupstats');

module.exports = {
    name: 'groupstats',
    aliases: ['stats', 'leaderboard', 'gstats', 'topmembers', 'msgs', 'messagestats'],
    category: 'general',
    description: 'Mostra estatísticas do grupo (hoje ou todo o tempo)',
    usage: '.groupstats [hoje|total]',
    groupOnly: true,

    async execute(sock, msg, args, extra) {
        try {
            const from = extra.from;
            
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

            if (!stats || stats.total === 0) {
                if (periodoTexto === 'Hoje') {
                    return extra.reply('📊 Nenhuma atividade registrada hoje.');
                } else {
                    return extra.reply('📊 Nenhuma atividade registrada neste grupo ainda.');
                }
            }

            const { total, users } = stats;

            // Top membros (top 5)
            const sortedUsers = Object.entries(users)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

            let topText = sortedUsers.length
                ? sortedUsers.map(([id, count], i) => `${i + 1}) @${id.split('@')[0]} — ${count} ${count === 1 ? 'msg' : 'msgs'}`).join('\n')
                : 'Nenhum usuário ativo ainda.';

            const text = `
📊 *Estatísticas do Grupo — ${periodoTexto}*

📌 *Total de Mensagens:* ${total}

👥 *Membros Mais Ativos:*
${topText}

💡 Use .myactivity para ver suas estatísticas.
💡 Use .groupstats total para ver estatísticas de todo o tempo.
`.trim();

            await sock.sendMessage(from, {
                text,
                mentions: sortedUsers.map(u => u[0])
            }, { quoted: msg });

        } catch (err) {
            console.error('[groupstats cmd] erro:', err);
            extra.reply('❌ Erro ao carregar as estatísticas.');
        }
    }
};
