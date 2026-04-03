const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Khởi tạo Gemini với API Key từ file .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Hàm kiểm duyệt nội dung bằng AI Gemini 1.5 Flash
 * @param {string} content - Nội dung cần kiểm duyệt
 * @returns {Promise<{isToxic: boolean, reason: string}>}
 */
const checkContentToxicity = async (content) => {
  try {
    if (!content || content.trim() === "") {
      return { isToxic: false, reason: "" };
    }

    // Thử dùng model 'models/gemini-2.5-flash' mới nhất để check quota
    const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });

    const prompt = `
      Bạn là một chuyên gia kiểm duyệt nội dung cho mạng xã hội NhatBook. 
      Hãy phân tích nội dung sau đây (bằng tiếng Việt) để phát hiện các hành vi vi phạm:
      - Chửi bới, xúc phạm người khác.
      - Ngôn từ thù ghét, phân biệt đối xử.
      - Ngôn từ thiếu văn hóa, thô tục.
      - Nội dung nhạy cảm, đồi trụy.
      - Spam hoặc lừa đảo.
      - Những từ ngữ mang tính chất bạo lực hoặc phân biệt chủng tộc.

      Nội dung: "${content}"

      Yêu cầu phản hồi DUY NHẤT dưới dạng JSON với cấu trúc sau:
      {
        "isToxic": boolean,
        "reason": "Giải thích ngắn gọn lý do nếu vi phạm (tiếng Việt), nếu không vi phạm hãy để trống"
      }
    `;

    // Thêm timeout 20 giây để tránh treo request nếu Gemini phản hồi chậm (Phòng hờ mạng lag)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Gemini timeout")), 20000)
    );

    const result = await Promise.race([
      model.generateContent(prompt),
      timeoutPromise
    ]);

    const response = await result.response;
    const text = response.text();

    // Loại bỏ markdown code blocks nếu AI trả về (ví dụ: ```json ... ```)
    const jsonString = text.replace(/```json|```/gi, "").trim();

    try {
      const parsedContent = JSON.parse(jsonString);
      return {
        isToxic: !!parsedContent.isToxic,
        reason: parsedContent.reason || ""
      };
    } catch (parseError) {
      console.error("Lỗi parse JSON từ Gemini. Raw text:", text);
      // Fallback nếu AI không trả đúng định dạng JSON
      return { isToxic: false, reason: "" };
    }
  } catch (error) {
    console.error("Lỗi AI Moderator:", error);
    // Nếu có lỗi API, cho phép nội dung đi qua để tránh treo hệ thống
    return { isToxic: false, reason: "Lỗi kết nối AI" };
  }
};

module.exports = { checkContentToxicity };
