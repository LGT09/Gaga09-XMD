const axios = require("axios");
const ytdl = require("ytdl-core");
const fs = require("fs");
const path = require("path");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");

async function handleCommand(sock, msg, text, OWNER) {
  const jid = msg.key.remoteJid;
  const isOwner = jid === OWNER;

  if (text.startsWith(".ai ")) {
    const prompt = text.slice(4);
    const res = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }]
    }, {
      headers: { Authorization: `Bearer ${process.env.OPENAI_KEY}` }
    });
    await sock.sendMessage(jid, { text: res.data.choices[0].message.content });
  }

  else if (text === ".menu") {
    await sock.sendMessage(jid, {
      text: `🤖 *Gaga09 XMD* Menu\n\n🧠 .ai [prompt]\n🖼️ .img [prompt]\n🎵 .yt [url] (video)\n🎧 .mp3 [url]\n🖼️ .sticker\n👮 .kick [@tag]\n👑 .promote [@tag]\n🔗 .pair\n\n👑 Lil Gaga Traxx09`
    });
  }

  else if (text.startsWith(".yt ")) {
    const url = text.slice(4);
    if (!ytdl.validateURL(url)) {
      return sock.sendMessage(jid, { text: "❌ Invalid YouTube URL." });
    }

    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title;
    const filePath = path.join(__dirname, "..", "media", "video.mp4");

    const stream = ytdl(url, { quality: "lowestvideo" });
    stream.pipe(fs.createWriteStream(filePath));

    stream.on("end", async () => {
      await sock.sendMessage(jid, { video: { url: filePath }, caption: `🎬 ${title}` });
      fs.unlinkSync(filePath);
    });
  }

  else if (text.startsWith(".mp3 ")) {
    const url = text.slice(5);
    if (!ytdl.validateURL(url)) {
      return sock.sendMessage(jid, { text: "❌ Invalid YouTube URL." });
    }

    const title = (await ytdl.getInfo(url)).videoDetails.title;
    const filePath = path.join(__dirname, "..", "media", "audio.mp3");

    const stream = ytdl(url, { filter: "audioonly" });
    stream.pipe(fs.createWriteStream(filePath));

    stream.on("end", async () => {
      await sock.sendMessage(jid, { audio: { url: filePath }, mimetype: 'audio/mp4' });
      fs.unlinkSync(filePath);
    });
  }

  else if (text.startsWith(".img ")) {
    const prompt = text.slice(5);
    const res = await axios.post("https://api.openai.com/v1/images/generations", {
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024"
    }, {
      headers: { Authorization: `Bearer ${process.env.OPENAI_KEY}` }
    });
    const imgUrl = res.data.data[0].url;
    await sock.sendMessage(jid, { image: { url: imgUrl }, caption: `🖼️ Generated Image: ${prompt}` });
  }

  else if (text === ".sticker" && msg.message.imageMessage) {
    const buffer = await downloadMediaMessage(msg, "buffer", {}, { reuploadRequest: sock });
    await sock.sendMessage(jid, { sticker: buffer });
  }

  else if (text === ".pair") {
    await sock.sendMessage(jid, {
      text: "🔗 *Pair Code Generated:*

*Open WhatsApp > Linked Devices > Link a Device*
Then scan the QR printed on your terminal screen."
    });
  }

  else if (text.startsWith(".kick") && msg.message.extendedTextMessage && isOwner) {
    const mentioned = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    await sock.groupParticipantsUpdate(jid, [mentioned], "remove");
    await sock.sendMessage(jid, { text: `🚫 Removed ${mentioned}` });
  }

  else if (text.startsWith(".promote") && msg.message.extendedTextMessage && isOwner) {
    const mentioned = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    await sock.groupParticipantsUpdate(jid, [mentioned], "promote");
    await sock.sendMessage(jid, { text: `✅ Promoted ${mentioned}` });
  }

  else if (text === ".restart" && isOwner) {
    await sock.sendMessage(jid, { text: "🔄 Restarting..." });
    process.exit(0);
  }
}

module.exports = { handleCommand };
