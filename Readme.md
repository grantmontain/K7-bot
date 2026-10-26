 <div align="center">

## K7

[![Feito com Baileys](https://img.shields.io/badge/Feito%20com-Baileys-00bcd4?style=for-the-badge)](https://github.com/WhiskeySockets/Baileys)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Licença: MIT](https://img.shields.io/badge/Licen%C3%A7a-MIT-yellow.svg?style=for-the-badge)](LICENSE)

<img src="utils/bot_image.jpg" alt="K7 Bot" width="260">

</div>

O **K7** é um bot de WhatsApp MD desenvolvido com a biblioteca **Baileys** e um fork do projeto **Knightbot**.

O projeto foi desenvolvido para ser rápido, leve e fácil de personalizar, sem a necessidade de modificar o código principal.

Este projeto é **totalmente de código aberto**. Você pode modificá-lo, alterar sua identidade visual e criar seu próprio bot gratuitamente, sem precisar de autorização dos desenvolvedores originais.

Os comandos e a estrutura do projeto foram organizados para facilitar a personalização da imagem, do prefixo, do nome, dos recursos e de outras funcionalidades.

---

## ✨ Funcionalidades

- **Totalmente de código aberto:** todo o código pode ser editado, e o bot pode ser hospedado em diferentes ambientes, como Heroku, painéis de hospedagem e servidores VPS.
- **Personalização por comandos:** altere a imagem do bot, o prefixo, o canal de notícias, o nome e outras configurações usando comandos simples.
- **Sistema modular de comandos:** os comandos ficam organizados na pasta `commands`, facilitando a edição e a criação de novas funcionalidades.
- **Otimizado para estabilidade:** gerenciamento de memória RAM, processamento de mídias por streaming, limpeza de arquivos temporários e gerenciamento de sessões por meio do `sessionID` em `config.js`.
- **Ferramentas exclusivas do proprietário:** reinicialização do bot, atualização por arquivo ZIP e outras funcionalidades administrativas.

---

## Faça um fork do repositório original

<div align="center">

<a href="https://github.com/mruniquehacker/Knightbot-MD/fork" target="_blank">
  <img src="https://img.shields.io/badge/Fazer%20Fork-GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="Fazer fork no GitHub">
</a>

</div>

Isso criará uma cópia própria do repositório `Knightbot-MD` na sua conta do GitHub, permitindo que você modifique o projeto e mantenha suas próprias alterações.

---

## 🛠 Instalação local

### 1. Clone o repositório

Execute os comandos abaixo no terminal:

```bash
git clone https://github.com/grantmontain/K7-bot.git
cd K7-bot
```

### 2. Instale as dependências

```bash
npm install
```


### 3. Inicie o bot pela primeira vez

Execute:

```bash
node index.js
```

Quando o bot iniciar:

- Se `sessionID` estiver vazio, um QR Code aparecerá no terminal. Escaneie-o usando a opção **Aparelhos conectados** do WhatsApp.

Aguarde a conclusão da autenticação e confirme que o bot está funcionando corretamente.

**Mantenha esse terminal aberto durante a primeira execução.** Depois de concluir a configuração inicial, interrompa o processo com `Ctrl + C` antes de continuar.

### 4. Instale o PM2

O PM2 é um gerenciador de processos para aplicações Node.js. Ele permite manter o bot em execução em segundo plano, consultar seus logs e reiniciá-lo sem precisar deixar um terminal aberto.

Instale-o globalmente:

```bash
npm install -g pm2
```

Verifique a instalação:

```bash
pm2 --version
```

### 5. Inicie o bot pelo PM2 com o nome `K7-bot`

Dentro da pasta do projeto, execute:

```bash
pm2 start index.js --name K7-bot
```

O PM2 iniciará o bot em segundo plano e registrará o processo com o nome `K7-bot`.

Verifique se ele está em execução:

```bash
pm2 status
```

Para consultar os logs do bot em tempo real:

```bash
pm2 logs K7-bot
```

Para reiniciar o bot:

```bash
pm2 restart K7-bot
```

Para interromper a execução:

```bash
pm2 stop K7-bot
```

Para iniciar novamente um processo que foi interrompido:

```bash
pm2 start K7-bot
```

Para remover o processo do gerenciamento do PM2:

```bash
pm2 delete K7-bot
```

**Atenção:** o comando `pm2 delete` remove o processo do gerenciamento, mas não apaga os arquivos do bot.

### 6. Configure a inicialização automática

Por padrão, iniciar um processo com PM2 não garante que ele será iniciado automaticamente após uma reinicialização do servidor. Para configurar isso, execute:

```bash
pm2 startup
```

O PM2 exibirá um comando específico para o seu sistema operacional. **Copie e execute exatamente o comando apresentado no terminal**, pois ele pode exigir privilégios administrativos.

Em seguida, salve a lista atual de processos:

```bash
pm2 save
```

Com isso, o PM2 poderá restaurar o processo `K7-bot` após a reinicialização do servidor, desde que o mecanismo de inicialização tenha sido configurado corretamente.

---

## 🌐 Comunidade

<div align="center">

<a href="https://t.me/+3QhFUZHx-nhhZmY1" target="_blank">
  <img src="https://img.shields.io/badge/Entrar-Telegram-0088cc?style=for-the-badge&logo=telegram&logoColor=white" alt="Entrar no Telegram">
</a>

<a href="https://whatsapp.com/channel/0029Va90zAnIHphOuO8Msp3A" target="_blank">
  <img src="https://img.shields.io/badge/Entrar-Canal%20do%20WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="Entrar no canal do WhatsApp">
</a>

</div>

---

## 🙏 Créditos

- **Mr Unique Hacker:** desenvolvedor principal e mantenedor do projeto original.
- **Montanha:** desenvolvedor e mantenedor desse fork.
- **Baileys:** biblioteca de API do WhatsApp Web (`@whiskeysockets/baileys`).
- **Outras bibliotecas de código aberto:** listadas no arquivo `package.json`.

---

## ⚠️ Aviso importante

- Este bot foi desenvolvido **apenas para fins educacionais**.
- Este **não é um bot oficial do WhatsApp**.
- O uso de bots de terceiros pode violar os Termos de Serviço do WhatsApp e resultar no banimento da sua conta.

> Utilize este bot por sua própria conta e risco. Os desenvolvedores não se responsabilizam por banimentos, problemas ou danos decorrentes do uso do programa.

---

## 📝 Aviso legal

- Este projeto não é afiliado, autorizado, mantido, patrocinado ou endossado pela WhatsApp Inc. ou por suas afiliadas e subsidiárias.
- Trata-se de um software independente e não oficial.
- **Não utilize o bot para enviar spam.**
- Não utilize o programa para envio massivo de mensagens, assédio ou qualquer atividade ilegal.
- Os desenvolvedores não assumem responsabilidade por usos indevidos ou danos causados pelo programa.

---

## 📄 Licença MIT

Este projeto está licenciado sob a **Licença MIT**.

Ao utilizar o software, você deve:

- Cumprir todas as leis e regulamentações aplicáveis.
- Preservar os avisos originais de licença e direitos autorais.
- Dar os devidos créditos aos autores originais.
- Não utilizar o programa para spam, abuso ou atividades maliciosas.

---

## 📜 Aviso de direitos autorais

Copyright (c) **2026 Professor**.

Todos os direitos reservados, conforme os termos aplicáveis ao projeto e às suas contribuições.

Este projeto contém código proveniente de diferentes projetos de código aberto e ferramentas de inteligência artificial, incluindo, entre outros:

- **Baileys:** licença MIT.
- **Outras bibliotecas:** conforme listado no arquivo `package.json`.
