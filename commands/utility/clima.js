/**
 * Weather Command - Get weather information using OpenWeather API
 */

const axios = require('axios');

module.exports = {
  name: 'clima',
  aliases: ['w', 'clima'],
  category: 'utility',
  description: 'Obter o clima de uma cidade',
  usage: '.clima <cidade>',

  async execute(sock, msg, args) {
    try {
      if (args.length === 0) {
        return await sock.sendMessage(msg.key.remoteJid, {
          text: '❌ Uso: .clima <cidade>\n\nExemplo: .clima Londres'
        }, { quoted: msg });
      }

      const city = args.join(' ');
      const apiKey = '4902c0f2550f58298ad4146a92b65e10';

      const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
      const weather = response.data;

      const weatherText = `Clima em ${weather.name}: ${weather.weather[0].description}. Temperatura: ${weather.main.temp}°C.`;

      await sock.sendMessage(msg.key.remoteJid, { text: weatherText }, { quoted: msg });

    } catch (error) {
      console.error('Error fetching weather:', error);
      await sock.sendMessage(msg.key.remoteJid, { text: 'Desculpe, não consegui obter o clima agora.' }, { quoted: msg });
    }
  }
};
