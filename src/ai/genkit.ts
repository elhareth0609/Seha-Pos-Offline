import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {openai} from 'genkitx-openai';
import dotenv from 'dotenv';

dotenv.config();

export const ai = genkit({
  plugins: [
    openai({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseUrl: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'http://localhost:9002/',
        'X-Title': 'midgram',
      },
    }),
  ],
  model: 'openai/gpt-4o',
});
