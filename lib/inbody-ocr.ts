// Shared InBody OCR contract: the prompt + result shape, imported by both the
// API route (app/api/inbody/analyze) and the offline accuracy test harness so
// they can never drift.

// Shape returned to the coach-confirmation screen. Every measured field is
// nullable: OCR may miss a value on a folded/blurry printout and the coach fills
// the gap. `warnings` lists fields the model was unsure about so the UI can
// highlight them.
export interface InBodyOcrResult {
  date: string | null // ISO YYYY-MM-DD
  weight: number | null
  skeletalMuscleMass: number | null
  bodyFat: number | null // PBF %
  bmr: number | null // kcal
  visceralFatLevel: number | null // 內臟脂肪「級別/等級」(InBody 270/370)
  visceralFatArea: number | null // VFA cm² (InBody 770), when no level is shown
  height: number | null // cm
  age: number | null
  gender: 'male' | 'female' | null
  inbodyScore: number | null // /100
  bmi: number | null
  machineModel: string | null // e.g. "InBody270"
  confidence: number // 0..1 overall
  warnings: string[]
}

export const INBODY_OCR_PROMPT = `You are reading an InBody body-composition printout (machines: InBody 270 / 370 / 570 / 770, Chinese or English layout). Extract the measured values and return ONLY a JSON object — no markdown, no commentary.

Return this exact shape:
{
  "date": "YYYY-MM-DD or null",
  "weight": number or null,
  "skeletalMuscleMass": number or null,
  "bodyFat": number or null,
  "bmr": number or null,
  "visceralFatLevel": number or null,
  "visceralFatArea": number or null,
  "height": number or null,
  "age": number or null,
  "gender": "male" | "female" | null,
  "inbodyScore": number or null,
  "bmi": number or null,
  "machineModel": "string or null",
  "confidence": number,
  "warnings": ["field names you are unsure about"]
}

FIELD MAP (Chinese label → field):
- 體重 / Weight (kg) → weight
- 骨骼肌量 / 骨骼肌重 / SMM / Skeletal Muscle Mass (kg) → skeletalMuscleMass
- 體脂肪率 / 體脂肪率(%) / PBF / Percent Body Fat → bodyFat
- 基礎代謝率 / Basal Metabolic Rate (kcal) → bmr
- 內臟脂肪級別 / 內臟脂肪等級 / Visceral Fat Level (a small integer, usually 1-20) → visceralFatLevel
- 內臟脂肪面積 / Visceral Fat Area / VFA (cm2) → visceralFatArea
- 身高 / Height (cm) → height
- 年齡 / Age → age
- 性別 / Gender (男/Male->"male", 女/Female->"female") → gender
- InBody 評分 / InBody Score (the big "/100" number) → inbodyScore
- 體質量指數 / BMI / Body Mass Index → bmi
- machineModel: read the model name in the header, e.g. "InBody270", "InBody370", "InBody770".

DATE PARSING (critical — formats differ by machine):
- Dotted format like "05.02.2024" or "4.13.2023" is MONTH.DAY.YEAR -> "2024-05-02", "2023-04-13".
- Format like "2017.03.08" is YEAR.MONTH.DAY -> "2017-03-08".
- Use the 檢測日期 / Test Date field, ignore the time.

RULES:
- Read ONLY the machine-printed values. IGNORE any handwriting, pen marks, circles, or arrows on the paper.
- For visceral fat: if the sheet shows a LEVEL (級別/等級, small integer) use visceralFatLevel; if it shows only an AREA in cm2 (面積/VFA) use visceralFatArea. Set the other to null.
- Numbers only (no units) in numeric fields.
- If a value is folded, cut off, or unreadable, set it to null and add the field name to "warnings".
- confidence: 1.0 = all key fields clearly read; lower it if the image is blurry/folded.`
