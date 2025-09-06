import { config } from 'dotenv';
config();

// Ensure OPENROUTER_API_KEY is set in environment variables
if (!process.env.OPENROUTER_API_KEY) {
  console.warn('WARNING: OPENROUTER_API_KEY environment variable is not set.');
  console.warn('Please set your OpenRouter API key in your .env file to use AI features.');
}
