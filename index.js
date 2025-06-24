const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const { handleCommand } = require("./lib/commands");
const { OWNER_NUMBER } = require("./config");

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ["Gaga09 XMD", "Chrome", "121.0.0.1"]
  });

  sock.ev.on("connection.update", update => {
    const { connection, qr } = update;
    if (qr) {
      qrcode.generate(qr, { small: true });
      console.log("🔗 Scan QR with WhatsApp...");
    }
    if (connection === "open") {
      console.log("✅ Connected as Gaga09 XMD");
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const content = msg.message.conversation || msg.message.extendedTextMessage?.text;
    if (!content) return;

    await handleCommand(sock, msg, content.trim(), OWNER_NUMBER);
  });
}

startBot();