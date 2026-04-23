import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * AI Service for Structural Analysis
 */
export async function analyzeDrawing(apiKey, imageBase64, mode = 'plan') {
  if (!apiKey) throw new Error("Missing Gemini API Key");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

  const prompt = mode === 'plan' 
    ? `คุณคือวิศวกรโครงสร้างผู้เชี่ยวชาญ (Senior Structural Engineer) 
       ภารกิจของคุณคืออ่าน "แบบแปลนคานพื้น" (Structural Floor Plan) ที่แนบมานี้ 
       และสรุปรายการคานทั้งหมดที่ปรากฏในภาพ
       
       เกณฑ์การวิเคราะห์:
       1. ระบุชื่อเบอร์คาน (Label) เช่น B1, B2, GB1
       2. หาระยะความยาว (Length) ของคาน: 
          - ให้ความสำคัญสูงสุดกับตัวเลขที่อยู่ "ต่อท้ายเบอร์คาน" (เช่น "B4 4.15" หมายถึง B4 ยาว 4.15 เมตร)
          - หากไม่มี ให้ดูจากเส้นบอกระยะ (Dimension lines) หรือระยะ Grid
       3. สำหรับคานที่ต่อเนื่องกัน ให้แยกแต่ละช่วงตามระยะที่กำกับไว้ในภาพ
       
       ให้ตอบกลับเฉพาะ JSON array ของ object ดังนี้เท่านั้น (ห้ามมีข้อความอื่น):
       [
         { "label": "B1", "length": 3.50, "coords": [x1, y1, x2, y2] }
       ]
       โดยที่ x1, y1, x2, y2 เป็นพิกัด 0-1000 (0=บนซ้าย, 1000=ล่างขวา)`
    : `คุณคือวิศวกรโครงสร้างผู้เชี่ยวชาญ (Senior Structural Engineer)
       ภารกิจของคุณคืออ่าน "แบบขยายการเสริมเหล็กคาน" (Beam Reinforcement Details) ที่แนบมานี้
       และสกัดข้อมูลทางวิศวกรรมสำหรับคาน "ทุกประเภท" ที่ปรากฏในภาพ (เช่น GB1, GB2, GB3, B1, B2 เป็นต้น)
       
       ข้อมูลที่ต้องการสกัด (ต่อหนึ่งเบอร์คาน):
       - width (m), depth (m)
       - topBars: [ { count, size, zone: "mid" | "sup" } ] (รายการเหล็กบนทั้งหมด แยกตามขนาดและโซน)
       - bottomBars: [ { count, size, zone: "mid" | "sup" } ] (รายการเหล็กล่างทั้งหมด แยกตามขนาดและโซน)
       - stirrupSize (ขนาดเหล็กปลอก)
       - stirrupSpacing (เมตร)
       
       สำคัญ: หากในหนึ่งหน้าตัดมีเหล็กหลายขนาด (เช่น 3 DB16 + 2 DB12) ให้แยก object ใน array ห้ามเอามารวมกัน
       
       ให้ตอบกลับเฉพาะ JSON object ที่ใช้ Label เป็น key ดังนี้เท่านั้น:
       {
         "B5": {
           "width": 0.20, "depth": 0.50,
           "topBars": [{ "count": 2, "size": "DB16", "zone": "mid" }, { "count": 3, "size": "DB16", "zone": "sup" }, { "count": 2, "size": "DB12", "zone": "sup" }],
           "bottomBars": [...],
           "stirrupSize": "RB9", "stirrupSpacing": 0.125
         }
       }`;

  const mimeType = imageBase64.split(';')[0].split(':')[1];

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: imageBase64.split(',')[1],
        mimeType: mimeType || "image/jpeg",
      },
    },
  ]);

  const response = await result.response;
  const text = response.text();
  
  // Clean JSON response (remove markdown code blocks if any)
  const jsonMatch = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI did not return valid JSON: " + text);
  
  return JSON.parse(jsonMatch[0]);
}
