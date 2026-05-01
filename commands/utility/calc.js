/**
 * Calculator Command - Perform math calculations
 */

const { evaluate } = require('mathjs');

module.exports = {
  name: 'calc',
  aliases: ['calculate', 'math'],
  category: 'utility',
  description: 'Calcular expressões matemáticas avançadas',
  usage: '.calc <expressão>',

  async execute(sock, msg, args, extra) {
    try {
      if (args.length === 0) {
        return extra.reply('❌ Uso: .calc <expressão>\n\nExemplo: .calc 5 + 3 * 2');
      }

      const expression = args.join(' ');

      try {
        const result = evaluate(expression);

        let text = `🧮 *Calculadora*\n\n`;
        text += `📝 Expressão: ${expression}\n`;
        text += `✅ Resultado: ${result}`;

        await extra.reply(text);
      } catch (evalError) {
        await extra.reply('❌ Expressão matemática inválida!');
      }

    } catch (error) {
      await extra.reply(`❌ Erro: ${error.message}`);
    }
  }
};
