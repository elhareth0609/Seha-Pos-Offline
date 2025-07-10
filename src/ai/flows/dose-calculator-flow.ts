
'use server';
/**
 * @fileOverview An AI flow for calculating medication dosages based on patient age.
 *
 * - calculateDose: A function that handles the dose calculation process.
 * - DoseCalculationInput: The input type for the calculateDose function.
 * - DoseCalculationOutput: The return type for the calculateDose function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MedicationInfoSchema = z.object({
  tradeName: z.string().describe('The commercial trade name of the medication.'),
  dosage: z.string().describe('The dosage strength of the medication (e.g., "500mg", "100mg/5ml").'),
  dosageForm: z.string().describe('The form of the medication (e.g., "Tablet", "Syrup", "Capsule").'),
});

export const DoseCalculationInputSchema = z.object({
  patientAge: z.number().describe('The age of the patient in years.'),
  medications: z.array(MedicationInfoSchema).describe('A list of medications in the current transaction.'),
});
export type DoseCalculationInput = z.infer<typeof DoseCalculationInputSchema>;

export const DoseCalculationSchema = z.object({
    tradeName: z.string().describe('The trade name of the medication being analyzed.'),
    suggestedDose: z.string().describe('The suggested dose, frequency, and duration for the patient. For example: "نصف حبة (250mg) مرتين يوميًا لمدة 5 أيام". Be specific and clear.'),
    warning: z.string().optional().describe('Any critical warnings or contraindications for this age group, if applicable. For example: "لا يستخدم للأطفال أقل من سنتين".'),
});
export type DoseCalculation = z.infer<typeof DoseCalculationSchema>;

export const DoseCalculationOutputSchema = z.array(DoseCalculationSchema);
export type DoseCalculationOutput = z.infer<typeof DoseCalculationOutputSchema>;


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

Please provide a suggested dose for each medication based on the patient's age. The output should be in Arabic. For each medication, provide the suggested dose, frequency, and duration. Also, include any important warnings if the medication is not recommended for this age group.

IMPORTANT: Your response MUST be a valid JSON array matching the output schema. For each medication in the input, create a corresponding object in the output array.
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
