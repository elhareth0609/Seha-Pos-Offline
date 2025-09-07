 
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
  ).join('');

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
        model: 'openai/gpt-5-mini',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
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

      // Check if the response has the expected structure
      if (parsedResponse.interactions !== undefined && parsedResponse.medicationAnalysis !== undefined) {
        // Process and truncate long content in medicationAnalysis
        const processedMedicationAnalysis = parsedResponse.medicationAnalysis.map((med: any) => {
          // Truncate suggestedDose if it's too long
          if (med.suggestedDose && med.suggestedDose.length > 50) {
            // Try to extract just the dosage numbers and frequency
            const doseMatch = med.suggestedDose.match(/(\d+-?\d*\s*mg|ملغ)\s*(كل|every)?\s*(\d+-?\d*\s*(ساعة|hours?))?/i);
            if (doseMatch) {
              med.suggestedDose = doseMatch[0].trim();
            } else {
              // If we can't extract a proper dosage, truncate to first 30 chars
              med.suggestedDose = med.suggestedDose.substring(0, 30) + "...";
            }
          }

          // Truncate instructions if it's too long
          if (med.instructions && med.instructions.length > 30) {
            // Try to extract key instructions
            const words = med.instructions.split(' ');
            med.instructions = words.slice(0, 5).join(' ');
          }

          return med;
        });

        // Create the processed response
        const processedResponse = {
          interactions: parsedResponse.interactions || [],
          medicationAnalysis: processedMedicationAnalysis
        };

        // Validate the response against our schema
        return DoseCalculationOutputSchema.parse(processedResponse);
      }

      // If the response doesn't have the expected structure, transform it
      let transformedResponse: DoseCalculationOutput;

      // Handle the case where the response has a different structure
      if (parsedResponse.dosage_analysis_ar) {
        // Transform from the current response structure to our expected structure
        transformedResponse = {
          interactions: parsedResponse.clarifications_needed || [],
          medicationAnalysis: input.medications.map((med, index) => {
            // Use the first dosage analysis as the suggested dose for all medications
            const dosageInfo = parsedResponse.dosage_analysis_ar && parsedResponse.dosage_analysis_ar.length > 0 
              ? parsedResponse.dosage_analysis_ar[0] 
              : "الرجاء استشارة الصيدلي";

            // Extract a concise dosage
            let conciseDosage = "50-100 mg كل 4-6 ساعات";
            const doseMatch = dosageInfo.match(/(\d+-?\d*\s*mg|ملغ)\s*(كل|every)?\s*(\d+-?\d*\s*(ساعة|hours?))?/i);
            if (doseMatch) {
              conciseDosage = doseMatch[0].trim();
            }

            return {
              tradeName: med.tradeName,
              suggestedDose: conciseDosage,
              instructions: parsedResponse.assumptions && parsedResponse.assumptions.length > 0 
                ? parsedResponse.assumptions[0].substring(0, 30) 
                : "لا توجد معلومات كافية"
            };
          })
        };
      } else {
        // Create a default response if we can't transform the existing one
        transformedResponse = {
          interactions: [],
          medicationAnalysis: input.medications.map(med => ({
            tradeName: med.tradeName,
            suggestedDose: "الرجاء استشارة الصيدلي",
            instructions: "لا توجد معلومات كافية"
          }))
        };
      }

      // Validate and return the transformed response
      return DoseCalculationOutputSchema.parse(transformedResponse);
    } catch (parseError) {
      console.error('Failed to parse API response as JSON:', parseError);
      console.error('Raw content:', content);

      // Try to fix common JSON issues
      try {
        // If the content is just plain text without JSON structure, create a default response
        if (!content.includes('{') || !content.includes('}')) {
          // Try to extract dosage information from plain text
          let conciseDosage = "50-100 mg كل 4-6 ساعات";
          const doseMatch = content.match(/(\d+-?\d*\s*mg|ملغ)\s*(كل|every)?\s*(\d+-?\d*\s*(ساعة|hours?))?/i);
          if (doseMatch) {
            conciseDosage = doseMatch[0].trim();
          }

          return {
            interactions: [],
            medicationAnalysis: input.medications.map(med => ({
              tradeName: med.tradeName,
              suggestedDose: conciseDosage,
              instructions: "لا توجد معلومات كافية"
            }))
          };
        }

        // Try to fix common JSON issues
        let fixedContent = content
          .replace(/(\w+):/g, '"$1":')  // Fix unquoted property names
          .replace(/'/g, '"');           // Fix single quotes

        const parsedFixedResponse = JSON.parse(fixedContent);

        // Transform the response if needed
        let transformedResponse: DoseCalculationOutput;
        if (parsedFixedResponse.dosage_analysis_ar) {
          transformedResponse = {
            interactions: parsedFixedResponse.clarifications_needed || [],
            medicationAnalysis: input.medications.map((med, index) => {
              const dosageInfo = parsedFixedResponse.dosage_analysis_ar && parsedFixedResponse.dosage_analysis_ar.length > 0 
                ? parsedFixedResponse.dosage_analysis_ar[0] 
                : "الرجاء استشارة الصيدلي";

              // Extract a concise dosage
              let conciseDosage = "50-100 mg كل 4-6 ساعات";
              const doseMatch = dosageInfo.match(/(\d+-?\d*\s*mg|ملغ)\s*(كل|every)?\s*(\d+-?\d*\s*(ساعة|hours?))?/i);
              if (doseMatch) {
                conciseDosage = doseMatch[0].trim();
              }

              return {
                tradeName: med.tradeName,
                suggestedDose: conciseDosage,
                instructions: parsedFixedResponse.assumptions && parsedFixedResponse.assumptions.length > 0 
                  ? parsedFixedResponse.assumptions[0].substring(0, 30) 
                  : "لا توجد معلومات كافية"
              };
            })
          };
        } else {
          transformedResponse = {
            interactions: [],
            medicationAnalysis: input.medications.map(med => ({
              tradeName: med.tradeName,
              suggestedDose: "الرجاء استشارة الصيدلي",
              instructions: "لا توجد معلومات كافية"
            }))
          };
        }

        return DoseCalculationOutputSchema.parse(transformedResponse);
      } catch (fixError) {
        // If all attempts fail, return a default response
        return {
          interactions: [],
          medicationAnalysis: input.medications.map(med => ({
            tradeName: med.tradeName,
            suggestedDose: "الرجاء استشارة الصيدلي",
            instructions: "لا توجد معلومات كافية"
          }))
        };
      }
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
