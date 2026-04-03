const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
const fs = require('fs');

async function listModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    
    if (response.ok) {
        const models = data.models.map(m => m.name);
        fs.writeFileSync('C:/Users/OS/Desktop/project/backend/tmp/all_models.txt', models.join('\n'));
        console.log("Đã lưu danh sách model vào tmp/all_models.txt");
    } else {
        console.error(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("LỖI KẾT NỐI:", err);
  }
}

listModels();
