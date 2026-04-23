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
       - width (ความกว้างคาน เป็นเมตร เช่น 0.20)
       - depth (ความลึกคาน เป็นเมตร เช่น 0.40)
       - topMainCount (จำนวนเหล็กแกนบน)
       - topMainSize (ขนาดเหล็กแกนบน เช่น DB12, DB16)
       - bottomMainCount (จำนวนเหล็กแกนล่าง)
       - bottomMainSize (ขนาดเหล็กแกนล่าง เช่น DB12, DB16)
       - stirrupSize (ขนาดเหล็กปลอก เช่น RB6, RB9)
       - stirrupSpacing (ระยะห่างเหล็กปลอก เป็นเมตร เช่น 0.15 หรือ 0.20)
       
       ให้ตอบกลับเฉพาะ JSON object ที่ใช้ Label เป็น key ดังนี้เท่านั้น (ห้ามมีข้อความอื่น):
       {
         "GB1": {
           "width": 0.20,
           "depth": 0.40,
           "topMainCount": 2,
           "topMainSize": "DB12",
           "bottomMainCount": 3,
           "bottomMainSize": "DB12",
           "stirrupSize": "RB6",
           "stirrupSpacing": 0.15
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
