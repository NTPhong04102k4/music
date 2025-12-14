module.exports = function serveFile(res, filePath) {
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).send("File not found");
    }
  });
};
