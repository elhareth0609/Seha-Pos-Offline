
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
  prompt: `You are an expert Iraqi pharmacist assistant. Your task is to provide a comprehensive analysis for a list of medications based on a patient's age.

Patient's Age: {{patientAge}} years old.

Medications to process:
{{#each medications}}
- **{{tradeName}}** ({{dosage}} {{dosageForm}})
{{/each}}

Your response MUST be a valid JSON object matching the output schema.

Here are your tasks, please perform them in order and provide the output in Arabic:

1.  **Drug Interaction Check:** Analyze all medications in the list for potential interactions with each other. If you find any, describe them clearly in the 'interactions' array. If there are no interactions, return an empty array.

2.  **Individual Medication Analysis:** For each medication, create a corresponding object in the 'medicationAnalysis' array with the following details:
    a.  **suggestedDose:** Calculate and suggest an appropriate dose, frequency, and duration based on the patient's age.
    b.  **usageInstructions:** Provide important advice on how to take the medication (e.g., "يؤخذ بعد الطعام", "يجب إكمال كورس العلاج كاملاً").
    c.  **warning:** Include any critical warnings or contraindications specific to this age group (e.g., "لا يستخدم للأطفال أقل من سنتين").

Example of a good response:
{
  "interactions": ["قد يزيد دواء (أ) من تأثير دواء (ب)، مما يتطلب مراقبة ضغط الدم."],
  "medicationAnalysis": [
    {
      "tradeName": "Amoxil 250mg/5ml",
      "suggestedDose": "5 مل ثلاث مرات يوميًا لمدة 7 أيام",
      "usageInstructions": "يجب رج العلبة جيداً قبل الاستخدام. يؤخذ بعد الأكل لتقليل اضطراب المعدة.",
      "warning": "قد يسبب حساسية لدى المرضى الذين يعانون من حساسية البنسلين."
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
