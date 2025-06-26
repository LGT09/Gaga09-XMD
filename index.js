const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const { handleCommand } = require("./lib/commands");

// Ensure session folder exists
if (!fs.existsSync("./auth")) fs.mkdirSync("./auth", { recursive: true });
if (!fs.existsSync("./public")) fs.mkdirSync("./public", { recursive: true });

async function startSock() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    printQRInTerminal: true,
    auth: state,
    browser: ["Gaga09 XMD", "Chrome", "106.0.0.0"]
  });

  // Save credentials to file
  sock.ev.on("creds.update", (creds) => {
    saveCreds();
    fs.writeFileSync(
      path.join(__dirname, "public", "session.json"),
      JSON.stringify(creds, null, 2)
    );
  });

  // Write QR code to file for live pairing page
  sock.ev.on("connection.update", ({ qr }) => {
    if (qr) {
      fs.writeFileSync(path.join(__dirname, "public", "latest-qr.txt"), qr);
      console.log("📲 Scan the QR code to connect!");
    }
  });

  // Listen for messages
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key?.remoteJid === "status@broadcast") return;

    const type = Object.keys(msg.message)[0];
    const text = type === "conversation"
      ? msg.message.conversation
      : type === "extendedTextMessage"
      ? msg.message.extendedTextMessage.text
      : "";

    const OWNER = (process.env.OWNER_NUMBER || "") + "@s.whatsapp.net";

    try {
      await handleCommand(sock, msg, text, OWNER);
    } catch (err) {
      console.error("❌ Command error:", err);
    }
  });

  console.log("✅ Gaga09 XMD Bot is ready!");
}

startSock();
