
'use server';
/**
 * @fileOverview An AI flow for calculating medication dosages based on patient age,
 * checking for drug interactions, and providing usage instructions.
 *
 * - calculateDose: A function that handles the dose calculation process.
 * - DoseCalculationInput: The input type for the calculateDose function.
 * - DoseCalculationOutput: The return type for the calculateDose function.
 */

import { ai } from '@/ai/genkit';
import { DoseCalculationInputSchema, DoseCalculationOutputSchema, type DoseCalculationInput, type DoseCalculationOutput } from '@/lib/types';


const prompt = ai.definePrompt({
  name: 'doseCalculationPrompt',
  input: { schema: DoseCalculationInputSchema },
  output: { schema: DoseCalculationOutputSchema },
  prompt: `You are an expert Iraqi pharmacist assistant. Your task is to provide a comprehensive analysis for a list of medications based on a patient's age. Some medications may be compound drugs with multiple scientific names.

Patient's Age: {{patientAge}} years old.

Medications to process:
{{#each medications}}
- **{{tradeName}}** ({{#if scientificNames}}Scientific Names: {{#each scientificNames}}{{.}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}) ({{dosage}} {{dosageForm}})
{{/each}}

Your response MUST be a valid JSON object matching the output schema.

Here are your tasks, please perform them in order and provide the output in Arabic:

1.  **Drug Interaction Check:** Analyze all medications in the list for potential interactions with each other. Pay close attention to the individual scientific names in compound drugs. If you find any, describe them clearly in the 'interactions' array. If there are no interactions, return an empty array.

2.  **Individual Medication Analysis:** For each medication, create a corresponding object in the 'medicationAnalysis' array with the following details:
    a.  **tradeName:** Use the provided trade name for the medication.
    b.  **suggestedDose:** Calculate and suggest an appropriate dose, frequency, and duration based on the patient's age. For compound drugs, the dose should be appropriate for the combination of active ingredients.
    c.  **usageInstructions:** Provide important advice on how to take the medication (e.g., "يؤخذ بعد الطعام", "يجب إكمال كورس العلاج كاملاً").
    d.  **warning:** Include any critical warnings or contraindications specific to this age group (e.g., "لا يستخدم للأطفال أقل من سنتين").

Example of a good response for a compound drug:
{
  "interactions": [],
  "medicationAnalysis": [
    {
      "tradeName": "Augmentin 375mg",
      "suggestedDose": "قرص واحد كل 12 ساعة لمدة 7 أيام",
      "usageInstructions": "يؤخذ مع بداية الطعام لتقليل اضطراب المعدة. يجب إكمال كورس العلاج كاملاً حتى لو شعرت بتحسن.",
      "warning": "يحتوي على Amoxicillin و Clavulanic acid. قد يسبب حساسية لدى المرضى الذين يعانون من حساسية البنسلين."
    }
  ]
}
`,
});

const calculateDoseFlow = ai.defineFlow(
  {
    name: 'calculateDoseFlow',
    inputSchema: DoseCalculationInputSchema,
    outputSchema: DoseCalculationOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);


export async function calculateDose(input: DoseCalculationInput): Promise<DoseCalculationOutput> {
  return calculateDoseFlow(input);
}
