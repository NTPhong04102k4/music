require("dotenv").config();

const app = require("./app");
const { PORT, BASE_URL } = require("./config");

app.listen(PORT, () => {
  console.log(`✅ Server đang chạy tại: ${BASE_URL}`);
});
