 
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

  const prompt = `You are a master Iraqi pharmacist assistant. Provide a dosage analysis in Arabic for the given medications based on the patient's age and notes. Your response MUST be a valid JSON object with the following structure:
{
  "interactions": ["array of interaction descriptions"],
  "medicationAnalysis": [
    {
      "tradeName": "medication name",
      "suggestedDose": "VERY brief and direct dose and frequency. Example: '50-100 mg every 6 hours'. Do NOT mention patient age or usage instructions here.",
      "instructions": "VERY short usage instructions or warnings, 10 words or less. Example: 'After food', 'Risk of allergy', 'Avoid with dairy'."
    }
  ]
}

Patient Age: ${input.patientAge}
${input.patientNotes ? `Notes: ${input.patientNotes}` : ''}
Medications:
${medicationsText}

IMPORTANT: Keep your response extremely concise. For suggestedDose, provide only the dosage and frequency without any explanations. For instructions, use maximum 10 words.
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
        model: 'openai/gpt-4o',
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
        return DoseCalculationOutputSchema.parse(parsedResponse);
    } catch (parseError) {
        console.error('Failed to parse API response as JSON:', parseError);
        console.error('Raw content:', content);
        // If parsing fails, return a default response
        return {
          interactions: ["فشل تحليل استجابة الذكاء الاصطناعي."],
          medicationAnalysis: input.medications.map(med => ({
            tradeName: med.tradeName,
            suggestedDose: "الرجاء استشارة الصيدلي",
            instructions: "لا توجد معلومات كافية"
          }))
        };
    }
  } catch (error) {
    console.error('Error calculating dose:', error);
    // Return a default response in case of error
    return {
      interactions: [],
      medicationAnalysis: input.medications.map(med => ({
        tradeName: med.tradeName,
        suggestedDose: "الرجاء استشارة الصيدلي",
        instructions: "حدث خطأ في المعالجة"
      }))
    };
  }
}

export async function calculateDose(input: DoseCalculationInput): Promise<DoseCalculationOutput> {
  return calculateDoseWithOpenRouter(input);
}

export type { DoseCalculationInput, DoseCalculationOutput };
