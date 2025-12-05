// 'use server';
// Note: This AI dose calculator feature is disabled in production builds
// because it requires server-side API calls with the OpenRouter API key.
// To enable it, you would need to set up a proper API route.

import {
  DoseCalculationInputSchema,
  DoseCalculationOutputSchema,
  type DoseCalculationInput,
  type DoseCalculationOutput
} from '@/lib/types';

// Disabled for static export - would need API route implementation
export async function calculateDose(input: DoseCalculationInput): Promise<DoseCalculationOutput> {
  // Return a placeholder response
  return {
    medicationAnalysis: input.medications.map(med => ({
      tradeName: med.tradeName,
      suggestedDose: "الرجاء استشارة الصيدلي",
      instructions: "ميزة حساب الجرعة غير متاحة في وضع عدم الاتصال"
    }))
  };
}

export type { DoseCalculationInput, DoseCalculationOutput };