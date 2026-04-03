const { checkContentToxicity } = require("../src/utils/aiModerator");

async function test() {
  console.log("Đang kiểm tra AI Moderator...");
  const content = "Thằng ngu này, cút đi!";
  console.log(`Nội dung test: "${content}"`);
  
  const result = await checkContentToxicity(content);
  console.log("Kết quả:", JSON.stringify(result, null, 2));
}

test();
