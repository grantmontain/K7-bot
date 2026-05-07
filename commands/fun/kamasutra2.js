// commands/fun/kamasutra2.js

const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, '../../database/kamasutra2.json');
if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify([], null, 2));
}
const isAdmin = extra.isAdmin || extra.isGroupAdmin || false;

module.exports = {
    name: 'kamasutra2',
    aliases: ['ks2'],
    category: 'fun',
    description: 'Sistema de frases/anotações',
    usage: '.ks2 | .ks2 add [frase] | .ks2 list',

    async execute(sock, msg, args, extra) {
        try {
            let frases = JSON.parse(fs.readFileSync(dbPath));
            if (args[0]?.toLowerCase() === 'add') {

                if (!isAdmin) {
                    return await extra.reply('❌ Apenas admins podem adicionar frases.');
                }
                const frase = args.slice(1).join(' ').trim();

                if (!frase) {
                    return await extra.reply('❌ Digite uma frase para adicionar.');
                }

                if (frases.includes(frase)) {
                    return await extra.reply('Calma ae porra, essa frase já existe');
                }

                frases.push(frase);

                fs.writeFileSync(dbPath, JSON.stringify(frases, null, 2));

                return await extra.reply('✅ Frase adicionada ao *KAMASUTRA 2*');
            }

            if (args[0]?.toLowerCase() === 'list') {

                if (!frases.length) {
                    return await extra.reply('📭 Nenhuma frase');
                }

                const lista = [...frases].sort((a, b) => a.localeCompare(b));

                let texto = '📚 Lista de frases:\n\n';

                lista.forEach((frase, index) => {
                    texto += `${index + 1}. ${frase}\n`;
                });

                return await sock.sendMessage(
                    extra.from,
                    { text: texto },
                    { quoted: msg }
                );
            }
            if (!frases.length) {
                return await extra.reply('não há nada');
            }

            const fraseAleatoria =
            frases[Math.floor(Math.random() * frases.length)];

            await sock.sendMessage(
                extra.from,
                { text: `💬 ${fraseAleatoria}` },
                { quoted: msg }
            );

        } catch (error) {
            console.error('[kamasutra2] ERROR:', error);
            await extra.reply('❌ Algo deu errado.');
        }
    }
};
