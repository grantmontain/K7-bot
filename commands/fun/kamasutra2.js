// commands/fun/kamasutra2.js

const fs = require('fs');
const path = require('path');

// Caminho do banco
const dbPath = path.join(__dirname, '../../database/kamasutra2.json');

// Cria o banco caso não exista
if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify([], null, 2));
}

module.exports = {
    name: 'kamasutra2',
    aliases: ['ks2'],
    category: 'fun',
    description: 'Sistema de frases/anotações',
    usage: '.ks2 | .ks2 add [frase] | .ks2 list',

    async execute(sock, msg, args, extra) {
        try {
            let frases = JSON.parse(fs.readFileSync(dbPath));

            let isAdmin = false;
            if (extra.isGroup) {

                const groupMetadata = await sock.groupMetadata(extra.from);

                const admins = groupMetadata.participants
                .filter(p => p.admin !== null)
                .map(p => p.id);

                isAdmin = admins.includes(extra.sender);
            }

            if (args[0]?.toLowerCase() === 'add') {

                if (!isAdmin) {
                    return await extra.reply('❌ Apenas admins podem adicionar frases.');
                }

                const frase = args.slice(1).join(' ').trim();

                if (!frase) {
                    return await extra.reply('❌ Digite uma frase.');
                }

                // Evita duplicatas
                if (frases.includes(frase)) {
                    return await extra.reply('⚠️ Essa frase já existe.');
                }

                frases.push(frase);

                fs.writeFileSync(dbPath, JSON.stringify(frases, null, 2));

                return await extra.reply('✅ Frase adicionada.');
            }

            // =========================
            // .ks2 del
            // =========================
            if (
                args[0]?.toLowerCase() === 'del' ||
                args[0]?.toLowerCase() === 'delete' ||
                args[0]?.toLowerCase() === 'remove'
            ) {

                if (!isAdmin) {
                    return await extra.reply(
                        '❌ Apenas admins podem apagar frases.'
                    );
                }

                if (!frases.length) {
                    return await extra.reply(
                        'Nenhuma frase cadastrada.'
                    );
                }

                const lista = [...frases].sort((a, b) =>
                a.localeCompare(b)
                );

                const numero = parseInt(args[1]);

                if (isNaN(numero) || numero < 1 || numero > lista.length) {
                    let texto = '❌ Número inválido.\n\n';
                    texto += 'Lista de frases:\n\n';

                    lista.forEach((frase, index) => {
                        texto += `${index + 1}. ${frase}\n`;
                    });

                    return await sock.sendMessage(
                        extra.from,
                        { text: texto },
                        { quoted: msg }
                    );
                }

                const fraseRemovida = lista[numero - 1];


                frases = frases.filter(f => f !== fraseRemovida);

                fs.writeFileSync(
                    dbPath,
                    JSON.stringify(frases, null, 2)
                );

                return await extra.reply(
                    `Frase removida:\n\n"${fraseRemovida}"`
                );
            }

            if (args[0]?.toLowerCase() === 'list') {

                if (!frases.length) {
                    return await extra.reply('📭 Nenhuma frase cadastrada.');
                }

                const lista = [...frases].sort((a, b) =>
                a.localeCompare(b)
                );

                let texto = 'Lista de frases:\n\n';

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
                return await extra.reply('O banco de dados está vazio.');
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

            await extra.reply(
                '❌ Algo deu errado no comando.'
            );
        }
    }
};
