const express = require("express");
const path = require("path");
const fs = require("fs");
const serveFile = require("../utils/serveFile");

const router = express.Router();

// Phục vụ file audio
router.get("/audio/:filename", (req, res) => {
  const { filename } = req.params;

  const ext = path.extname(filename);
  const candidates = ext
    ? [filename]
    : [
        `${filename}.mp3`,
        `${filename}.mp4`,
        `${filename}.m4a`,
        `${filename}.wav`,
        `${filename}.ogg`,
      ];

  // 1) Thử tìm trong public/audio trước
  for (const name of candidates) {
    const publicPath = path.join(
      __dirname,
      "..",
      "..",
      "public",
      "audio",
      name
    );
    if (fs.existsSync(publicPath)) {
      res.sendFile(publicPath);
      return;
    }
  }

  // 2) Nếu không có, thử trong uploads/audio
  for (const name of candidates) {
    const uploadPath = path.join(__dirname, "..", "uploads", "audio", name);
    if (fs.existsSync(uploadPath)) {
      res.sendFile(uploadPath);
      return;
    }
  }

  res.status(404).send("File not found");
});

// Phục vụ file ảnh BÀI HÁT
router.get("/image/song/:filename", (req, res) => {
  const { filename } = req.params;

  const ext = path.extname(filename);
  const candidates = ext
    ? [filename]
    : [
        `${filename}.jpg`,
        `${filename}.png`,
        `${filename}.jpeg`,
        `${filename}.webp`,
      ];

  // 1) Thử tìm trong public/images/song trước
  for (const name of candidates) {
    const publicPath = path.join(
      __dirname,
      "..",
      "..",
      "public",
      "images",
      "song",
      name
    );
    if (fs.existsSync(publicPath)) {
      res.sendFile(publicPath);
      return;
    }
  }

  // 2) Nếu không có, thử trong uploads/images/song
  for (const name of candidates) {
    const uploadPath = path.join(
      __dirname,
      "..",
      "uploads",
      "images",
      "song",
      name
    );
    if (fs.existsSync(uploadPath)) {
      res.sendFile(uploadPath);
      return;
    }
  }

  res.status(404).send("File not found");
});

// Phục vụ file ảnh ALBUM
router.get("/image/album/:filename", (req, res) => {
  const { filename } = req.params;

  // Hỗ trợ cả trường hợp filename có extension hoặc không có extension
  const ext = path.extname(filename);
  const candidates = ext
    ? [filename]
    : [
        `${filename}.jpg`,
        `${filename}.png`,
        `${filename}.jpeg`,
        `${filename}.webp`,
      ];

  // 1) Thử tìm trong public/images/album trước
  for (const name of candidates) {
    const publicPath = path.join(
      __dirname,
      "..",
      "..",
      "public",
      "images",
      "album",
      name
    );
    if (fs.existsSync(publicPath)) {
      res.sendFile(publicPath);
      return;
    }
  }

  // 2) Nếu không có, thử trong uploads/images/album
  for (const name of candidates) {
    const uploadPath = path.join(
      __dirname,
      "..",
      "uploads",
      "images",
      "album",
      name
    );
    if (fs.existsSync(uploadPath)) {
      res.sendFile(uploadPath);
      return;
    }
  }

  res.status(404).send("File not found");
});

// Phục vụ file ảnh NGHỆ SĨ
router.get("/image/artist/:filename", (req, res) => {
  const { filename } = req.params;

  const ext = path.extname(filename);
  const candidates = ext
    ? [filename]
    : [
        `${filename}.jpg`,
        `${filename}.png`,
        `${filename}.jpeg`,
        `${filename}.webp`,
      ];

  // 1) Thử trong public/images/artist
  for (const name of candidates) {
    const publicPath = path.join(
      __dirname,
      "..",
      "..",
      "public",
      "images",
      "artist",
      name
    );
    if (fs.existsSync(publicPath)) {
      res.sendFile(publicPath);
      return;
    }
  }

  // 2) Thử trong uploads/images/artist
  for (const name of candidates) {
    const uploadPath = path.join(
      __dirname,
      "..",
      "uploads",
      "images",
      "artist",
      name
    );
    if (fs.existsSync(uploadPath)) {
      res.sendFile(uploadPath);
      return;
    }
  }

  res.status(404).send("File not found");
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
