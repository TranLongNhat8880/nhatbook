const { checkContentToxicity } = require("../src/utils/aiModerator");
require("dotenv").config();

async function test() {
  console.log("Đang bắt đầu test Gemini 1.5 Flash...");
  try {
    const content = "bài hát như shit";
    const result = await checkContentToxicity(content);
    console.log("KẾT QUẢ TEST:");
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("LỖI TEST CHI TIẾT:");
    console.dir(err, { depth: null });
  }
}

test();
