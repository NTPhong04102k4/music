const express = require("express");
const path = require("path");
const fs = require("fs");
const serveFile = require("../utils/serveFile");

const router = express.Router();

// Phục vụ file audio
router.get("/audio/:filename", (req, res) => {
  const { filename } = req.params;

  // Thử tìm trong public/audio trước
  let filePath = path.join(
    __dirname,
    "..",
    "..",
    "public",
    "audio",
    filename + ".mp3"
  );

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
    return;
  }

  // Nếu không có, thử trong uploads
  filePath = path.join(__dirname, "..", "uploads", "audio", filename);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Error sending audio file:", err);
      res.status(404).send("File not found");
    }
  });
});

// Phục vụ file ảnh BÀI HÁT
router.get("/image/song/:filename", (req, res) => {
  const { filename } = req.params;

  // Thử tìm trong public/images/song trước
  let filePath = path.join(
    __dirname,
    "..",
    "..",
    "public",
    "images",
    "song",
    filename + ".jpg"
  );

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
    return;
  }

  // Nếu không có, thử trong uploads
  filePath = path.join(__dirname, "..", "uploads", "images", "song", filename);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Error sending song image file:", err);
      res.status(404).send("File not found");
    }
  });
});

// Phục vụ file ảnh ALBUM
router.get("/image/album/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, "..", "uploads", "images", "album", filename);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Error sending album image file:", err);
      res.status(404).send("File not found");
    }
  });
});

// Ảnh Avatar (API phục vụ file avatar)
router.get("/image/avatar/:filename", (req, res) => {
  const filePath = path.join(
    __dirname,
    "..",
    "uploads",
    "images",
    "avatar",
    req.params.filename
  );
  serveFile(res, filePath);
});

module.exports = router;


