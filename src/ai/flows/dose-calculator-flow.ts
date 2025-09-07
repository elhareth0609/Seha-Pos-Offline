'use server';

import {
    DoseCalculationInputSchema,
    DoseCalculationOutputSchema,
    type DoseCalculationInput,
    type DoseCalculationOutput
} from '@/lib/types';

// Function to calculate dose using direct API call to OpenRouter
async function calculateDoseWithOpenRouter(input: DoseCalculationInput): Promise<DoseCalculationOutput> {
  // Format the prompt based on the input
  const medicationsText = input.medications.map(med => 
    `- ${med.tradeName} (${med.scientific_names ? med.scientific_names.join(', ') : 'N/A'})`
  ).join('\n');

  const prompt = `أنت مساعد صيدلي عراقي خبير. قدم تحليل جرعات باللغة العربية للأدوية المعطاة بناءً على عمر المريض وملاحظاته. يجب أن يكون ردك بصيغة JSON صالحة تماماً.

المطلوب منك إرجاع JSON بالتنسيق التالي بالضبط:
{
  "medicationAnalysis": [
    {
      "tradeName": "اسم الدواء",
      "suggestedDose": "جرعة مباشرة ومختصرة جداً مع التكرار. مثال: 'قرص واحد يومياً'. لا تذكر عمر المريض أو تعليمات الاستخدام هنا.",
      "instructions": "تعليمات استخدام أو تحذيرات قصيرة جداً، 10 كلمات أو أقل. مثال: 'بعد الطعام'، 'خطر الحساسية'، 'تجنب مع مشتقات الألبان'."
    }
  ],
  "interactions": []
}

عمر المريض: ${input.patientAge}
${input.patientNotes ? `ملاحظات: ${input.patientNotes}` : ''}
الأدوية:
${medicationsText}

مهم جداً: 
1. كن مبدعاً في إجاباتك ولا تقم بنسخ الأمثلة المذكورة أعلاه
2. حافظ على إجاباتك موجزة للغاية
3. يجب أن يتضمن الرد حقل "interactions" حتى لو كان فارغاً
4. لا تضع أي نص خارج JSON
`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:9002/',
        'X-Title': 'Seha-Pos',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-mini',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;

    console.log('OpenRouter response:', content);
    
    // Clean up content to handle potential formatting issues
    content = content.trim();

    // Try to extract JSON if it's wrapped in markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      content = jsonMatch[1];
    }

    // Try to parse the response as JSON
    try {
      const parsedResponse = JSON.parse(content);
      
      // Ensure the response has the required structure
      if (!parsedResponse.interactions) {
        parsedResponse.interactions = [];
      }
      
      // Validate the response structure
      const validatedResponse = DoseCalculationOutputSchema.parse(parsedResponse);
      return validatedResponse;
    } catch (parseError) {
        console.error('Failed to parse API response as JSON:', parseError);
        console.error('Raw content:', content);
        
        // If parsing fails, try to construct a valid response from the partial data
        if (content.includes('medicationAnalysis')) {
          try {
            const partialResponse = JSON.parse(content);
            if (partialResponse.medicationAnalysis) {
              return {
                medicationAnalysis: partialResponse.medicationAnalysis,
                interactions: []
              };
            }
          } catch (e) {
            console.error('Failed to parse partial response:', e);
          }
        }
        
        // If all parsing attempts fail, return a default response
        return {
          medicationAnalysis: input.medications.map(med => ({
            tradeName: med.tradeName,
            suggestedDose: "الرجاء استشارة الصيدلي",
            instructions: "لا توجد معلومات كافية"
          })),
          interactions: []
        };
    }
  } catch (error) {
    console.error('Error calculating dose:', error);
    // Return a default response in case of error
    return {
      medicationAnalysis: input.medications.map(med => ({
        tradeName: med.tradeName,
        suggestedDose: "الرجاء استشارة الصيدلي",
        instructions: "حدث خطأ في المعالجة"
      })),
      interactions: []
    };
  }
}

export async function calculateDose(input: DoseCalculationInput): Promise<DoseCalculationOutput> {
  return calculateDoseWithOpenRouter(input);
}

export type { DoseCalculationInput, DoseCalculationOutput };