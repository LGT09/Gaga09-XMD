
const { default: makeWASocket, useSingleFileAuthState } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const fs = require("fs");
const chalk = require("chalk");

const { state, saveState } = useSingleFileAuthState("./session.json");

async function startBot() {
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on("creds.update", saveState);

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    const m = messages[0];
    if (!m.message) return;

    const sender = m.key.remoteJid;
    const msgType = Object.keys(m.message)[0];
    const text = m.message.conversation || m.message[msgType]?.text;

    if (!text) return;

    console.log(chalk.green(`📥 Message from ${sender}: ${text}`));

    // Example commands
    if (text === "hi" || text === "Hi") {
      await sock.sendMessage(sender, { text: "👋 Hello! I am your Baileys bot." });
    }

    if (text === ".menu") {
      await sock.sendMessage(sender, {
        text: `✨ *Gaga09 XMD Menu*\n\n1. .play\n2. .sticker\n3. .ban\n4. .help\n\nCreated by *Lil Gaga Traxx09*`,
      });
    }
  });

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("Connection closed. Reconnecting...", shouldReconnect);
      if (shouldReconnect) startBot();
    } else if (connection === "open") {
      console.log("✅ Connected to WhatsApp!");
    }
  });
}

startBot();


