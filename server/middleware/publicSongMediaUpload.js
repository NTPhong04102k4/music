const multer = require("multer");
const path = require("path");
const fs = require("fs");

function ensureDir(dirPath) {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
  } catch (e) {
    // ignore
  }
}

function safeExtFromOriginal(originalname, fallbackExt) {
  const ext = path.extname(originalname || "").toLowerCase();
  if (ext && ext.length <= 10) return ext;
  return fallbackExt;
}

function isLikelyImageByExt(originalname) {
  const ext = path.extname(originalname || "").toLowerCase();
  return [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"].includes(
    ext
  );
}

function isLikelyAudioByExt(originalname) {
  const ext = path.extname(originalname || "").toLowerCase();
  return [".mp3", ".m4a", ".aac", ".wav", ".flac", ".ogg", ".mp4"].includes(
    ext
  );
}

function createPublicSongMediaUpload() {
  const audioDir = path.join(__dirname, "..", "..", "public", "audio");
  const imageDir = path.join(__dirname, "..", "..", "public", "images", "song");
  ensureDir(audioDir);
  ensureDir(imageDir);

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === "audioFile") return cb(null, audioDir);
      if (file.fieldname === "imageFile") return cb(null, imageDir);
      return cb(new Error("Unsupported upload field: " + file.fieldname));
    },
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

      if (file.fieldname === "audioFile") {
        const ext = safeExtFromOriginal(file.originalname, ".mp3");
        return cb(null, `${unique}${ext}`);
      }
      if (file.fieldname === "imageFile") {
        const ext = safeExtFromOriginal(file.originalname, ".jpg");
        return cb(null, `${unique}${ext}`);
      }
      return cb(new Error("Unsupported upload field: " + file.fieldname));
    },
  });

  const fileFilter = (req, file, cb) => {
    if (!file || !file.mimetype) return cb(null, false);

    if (file.fieldname === "imageFile") {
      const okMime = file.mimetype.startsWith("image/");
      // Some clients (especially on Windows) may send application/octet-stream for images.
      const okOctetStream =
        file.mimetype === "application/octet-stream" &&
        isLikelyImageByExt(file.originalname);
      if (!okMime && !okOctetStream) {
        return cb(new Error("Only image files are allowed"), false);
      }
      return cb(null, true);
    }

    if (file.fieldname === "audioFile") {
      // Some browsers may use "audio/*" or specific codecs; also allow common extensions as fallback.
      const okMime =
        file.mimetype.startsWith("audio/") ||
        file.mimetype === "audio/mp4" ||
        file.mimetype === "video/mp4" ||
        file.mimetype === "application/octet-stream";
      const okOctetStream =
        file.mimetype === "application/octet-stream" &&
        isLikelyAudioByExt(file.originalname);
      if (!okMime && !okOctetStream) {
        return cb(new Error("Only audio files are allowed"), false);
      }
      return cb(null, true);
    }

    return cb(new Error("Unsupported upload field: " + file.fieldname), false);
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 500 * 1024 * 1024, // 500MB per file
      files: 2,
    },
  });
}

module.exports = { createPublicSongMediaUpload };
