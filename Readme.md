<div align="center">

## K7 BOT

[![Made with Baileys](https://img.shields.io/badge/Made%20with-Baileys-00bcd4?style=for-the-badge)](https://github.com/WhiskeySockets/Baileys)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

<img src="utils/bot_image.jpg" alt="Knight Bot Mini" width="260">

</div>

K7 é um bot para WhatsApp construído sobre a biblioteca **Baileys**.
Ele foi projetado para ser rápido, leve e fácil de personalizar sem precisar mexer no código principal.
Este projeto é **totalmente open source** — você pode modificá-lo, rebatizá-lo e criar seu **próprio bot** a partir deste código **gratuitamente**, sem precisar de qualquer permissão da nossa parte.
Todos os comandos e a estrutura geral foram escritos de forma que a personalização (imagem do bot, prefixo, nome, funcionalidades, etc.) seja o mais simples possível.

---

## ✨ Funcionalidades

* **Totalmente Open Source** – todo o código pode ser editado; hospede onde quiser (Heroku, painel, VPS, etc.).
* **Personalização Fácil via Comandos** – altere **imagem do bot**, **prefixo**, **canal/newsletter**, **nome do bot**, etc. com comandos simples.
* **Sistema de Comandos Modular** – os comandos são organizados na pasta `commands` para fácil edição.
* **Otimizado para Estabilidade** – gerenciamento de mídia otimizado em RAM (streaming, limpeza temporária), melhor controle de sessão via `sessionID` em `config.js`.
* **Utilidades para o Dono** – reiniciar, atualizar via ZIP e outras ferramentas exclusivas para o proprietário.

---

## 🛠 Configuração Local

### 1️⃣ Clonar o repositório

```bash
git clone https://github.com/grantmontain/K7-bot.git
cd K7-bot
```

### 2️⃣ Instalar dependências

```bash
npm install
```

### 3️⃣ Configurar sessão

Edite `config.js`:

* **Opção A: Usar string de sessão**

  ```js
  sessionID: 'KnightBot!H4.....'
  ```

* **Opção B: Escanear QR**

  ```js
  sessionID: ''
  ```

  Execute o bot e escaneie o QR pelo terminal.

### 4️⃣ Executar o bot

```bash
node index.js
```

Quando o bot iniciar:

* Se `sessionID` estiver vazio, um **QR code** aparecerá no terminal – escaneie usando **Dispositivos Conectados** no WhatsApp.
* Se `sessionID` estiver definido, ele fará login usando essa string de sessão.

---

## 🙏 Créditos

* **Montanha** - Desenvolvedor e mantenedor desse folk
* **Mr Unique Hacker** – Desenvolvedor principal e mantenedor do bot original
* **Baileys** – Biblioteca da API do WhatsApp Web (`@whiskeysockets/baileys`)
* Outras bibliotecas open source listadas em `package.json`

---

## ☕ Apoie os desenvolvedores originais

<div align="center">

<a href="https://buymeacoffee.com/mruniquehacker" target="_blank">
  <img src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Support%20Developer-FF813F?style=for-the-badge&logo=buy-me-a-coffee&logoColor=white" alt="Buy Me a Coffee">
</a>

</div>

Se você achou este projeto útil e quer apoiar o desenvolvedor, considere pagar um café! 

<div align="center">

<img src="utils/bmc_qr.png" alt="Buy Me a Coffee QR Code" width="200">

</div>

---

## ⚠️ Aviso Importante

* Este bot foi criado **apenas para fins educacionais**.
* Este **NÃO** é um bot oficial do WhatsApp.
* O uso de bots de terceiros **pode violar os Termos de Serviço do WhatsApp** e pode resultar no **banimento** da sua conta.

> Você usa este bot **por sua conta e risco**.
> Os desenvolvedores **não são responsáveis** por quaisquer banimentos, problemas ou danos decorrentes do uso.

---

## 📝 Legal

* Este projeto **não é afiliado, autorizado, mantido, patrocinado ou endossado** pela WhatsApp Inc. ou qualquer uma de suas afiliadas ou subsidiárias.
* Este é um software **independente e não oficial**.
* **Não faça spam** usando este bot.
* **Não** utilize este bot para envio em massa, assédio ou quaisquer **atividades ilegais**.
* Os desenvolvedores não assumem **qualquer responsabilidade** por uso indevido ou danos causados por este programa.

---

## 📄 Licença (MIT)

Este projeto está licenciado sob a **Licença MIT**.

Você deve:

* Usar este software em conformidade com **todas as leis e regulamentos aplicáveis**.
* Manter os avisos de **licença original e direitos autorais**.
* **Dar crédito aos autores originais**.
* **Não** usar para spam, abuso ou fins maliciosos.

---

## 📜 Aviso de Direitos Autorais

Copyright (c) **2026 Professor**.
Todos os direitos reservados.

Este projeto contém código de vários projetos open source e ferramentas de IA, incluindo, mas não se limitando a:

* **Baileys** – Licença MIT
* Outras bibliotecas conforme listado em `package.json`

