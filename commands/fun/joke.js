/**
 * Joke Command - Send random jokes
 */

const APIs = require('../../utils/api');

module.exports = {
  name: 'joke',
  aliases: ['jokes'],
  category: 'fun',
  description: 'Get random joke',
  usage: '.joke',
  
  async execute(sock, msg, args, extra) {
  try {
    const joke = await APIs.getJoke();
      
    let text;

    if (joke.type === 'single') {
      text = joke.joke;
    } else {
      text = `${joke.setup}\n\n${joke.delivery}`;
    }
      
    await extra.reply(text);
      
  } catch (error) {
    await extra.reply(`❌ Error: ${error.message}`);
  }
}
};
