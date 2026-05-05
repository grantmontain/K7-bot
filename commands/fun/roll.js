// commands/fun/roll.js
module.exports = {
    name: 'roll',
    aliases: ['rode', 'r'],
    category: 'fun',
    description: 'Rola dados no formato XdY (ex: 2d20)',
    usage: '.roll 2d20',

    async execute(sock, msg, args, extra) {
        try {
            const chatId = extra.from;
            const input = args[0];

            if (!input || !input.includes('d')) {
                return await sock.sendMessage(chatId, {
                    text: 'Use o formato correto: .roll 2d20'
                }, { quoted: msg });
            }

            const [diceStr, sidesStr] = input.toLowerCase().split('d');

            const dice = parseInt(diceStr);
            const sides = parseInt(sidesStr);

            if (!dice || !sides || dice < 1 || sides < 2) {
                return await sock.sendMessage(chatId, {
                    text: 'Valores inválidos. Exemplo válido: 2d20'
                }, { quoted: msg });
            }

            if (dice > 50) {
                return await sock.sendMessage(chatId, {
                    text: 'Calma lá, você não está jogando Warhammer. Máximo: 50 dados.'
                }, { quoted: msg });
            }

            await sock.sendMessage(chatId, {
                text: '🎲 Rolando os dados...'
            }, { quoted: msg });

            const results = [];
            let total = 0;

            for (let i = 0; i < dice; i++) {
                const roll = Math.floor(Math.random() * sides) + 1;
                results.push(roll);
                total += roll;
            }

            const senderName = msg.pushName || 'Usuário';

            let response = `🎲 *${senderName} rolou ${dice}d${sides}*\n\n`;

            response += `Resultados: [ ${results.join(', ')} ]\n`;
            response += `Total: *${total}*`;

            // pequeno drama se for 1d20
            if (dice === 1 && sides === 20) {
                if (results[0] === 20) {
                    response += '\n\n🔥 CRÍTICO!';
                } else if (results[0] === 1) {
                    response += '\n\n💀 FALHA CRÍTICA!';
                }
            }

            await sock.sendMessage(chatId, {
                text: response
            }, { quoted: msg });

        } catch (error) {
            console.error('[ROLL] ERROR:', error);
            await extra.reply('❌ Algo deu errado.');
        }
    }
};
