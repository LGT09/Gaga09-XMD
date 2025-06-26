
const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = 3000;

app.use(express.static("public"));

app.get("/qr", (req, res) => {
  const qrPath = path.join(__dirname, "public", "latest-qr.txt");
  if (fs.existsSync(qrPath)) {
    res.sendFile(qrPath);
  } else {
    res.status(404).send("QR not generated yet");
  }
});

app.listen(PORT, () => {
  console.log(`🌐 QR Server running at http://localhost:${PORT}`);
});
