
'use server';
/**
 * @fileOverview An AI flow for calculating medication dosages based on patient age.
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
  prompt: `You are an expert Iraqi pharmacist assistant. Your task is to calculate and suggest appropriate medication dosages for a patient of a specific age.

Patient's Age: {{patientAge}} years old.

Medications to process:
{{#each medications}}
- **{{tradeName}}** ({{dosage}} {{dosageForm}})
{{/each}}

Please provide a suggested dose for each medication based on the patient's age. The output should be in Arabic. For each medication, create a corresponding object in the output array with the suggested dose, frequency, and duration. Also, include any important warnings if the medication is not recommended for this age group.

IMPORTANT: Your response MUST be a valid JSON array matching the output schema.
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
