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
            const input = args.join('').toLowerCase();

            let dicePart = input;
            let bonus = 0;

            if (input.includes('+')) {
                const parts = input.split('+');
                dicePart = parts[0];
                bonus = parseInt(parts[1]);

                if (isNaN(bonus)) bonus = 0;
            }

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

            //if (dice > 50) {
            //    return await sock.sendMessage(chatId, {
                    text: 'Máximo: 50 dados.'
            //    }, { quoted: msg });
            //}

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
            const ctx = msg.message?.extendedTextMessage?.contextInfo || {};
            const mentioned = ctx.mentionedJid || [];

            let targetId = null;

            if (mentioned.length) targetId = mentioned[0];
            else if (ctx.participant) targetId = ctx.participant;
            else targetId = extra.sender;

            const targetTag = `@${targetId.split('@')[0]}`;

            let response = `🎲 *${targetTag} rolou ${dice}d${sides}*\n\n`;

            total += bonus;

            response += `Resultados: [ ${results.join(', ')} ]\n`;
            //response += `Total: *${total}*`;
            response += `Subtotal: ${results.join(' + ')}`;

            if (bonus > 0) {
                response += ` + ${bonus}`;
            }

            response += `\nTotal: *${total}*`;

            if (dice === 1 && sides === 20) {
                if (results[0] === 20) {
                    response += '\n\n🔥 CRÍTICO!';
                } else if (results[0] === 1) {
                    response += '\n\n💀 FALHA CRÍTICA!';
                }
            }

            await sock.sendMessage(chatId, {
                text: response,
                mentions: [targetId]
            }, { quoted: msg });

        } catch (error) {
            console.error('[ROLL] ERROR:', error);
            await extra.reply('❌ Algo deu errado.');
        }
    }
};
