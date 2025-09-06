// OpenRouter AI implementation
export interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface OpenRouterResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export const ai = {
  /**
   * Define a prompt template for OpenRouter AI
   */
  definePrompt: (config: {
    name: string;
    input: { schema: any };
    output: { schema: any };
    prompt: string;
  }) => {
    return {
      name: config.name,
      inputSchema: config.input.schema,
      outputSchema: config.output.schema,
      prompt: config.prompt,

      /**
       * Execute the prompt with the given input
       */
      execute: async (input: any) => {
        // Format the prompt with the input data
        let formattedPrompt = config.prompt;

        // Simple template replacement
        if (input.patientAge !== undefined) {
          formattedPrompt = formattedPrompt.replace('{{patientAge}}', input.patientAge.toString());
        }

        if (input.patientNotes) {
          formattedPrompt = formattedPrompt.replace('{{#if patientNotes}}', '');
          formattedPrompt = formattedPrompt.replace('{{patientNotes}}', input.patientNotes);
          formattedPrompt = formattedPrompt.replace('{{/if}}', '');
        } else {
          // Remove conditional block if patientNotes is not present
          formattedPrompt = formattedPrompt.replace(/{{#if patientNotes}}[\s\S]*?{{\/if}}/, '');
        }

        if (input.medications && input.medications.length > 0) {
          let medicationsList = '';
          input.medications.forEach((med: any) => {
            medicationsList += `- **${med.tradeName}** (`;
            if (med.scientific_names && med.scientific_names.length > 0) {
              medicationsList += `Scientific Names: ${med.scientific_names.join(', ')}`;
            }
            medicationsList += `) (${med.dosage} ${med.dosage_form})\n`;
          });

          formattedPrompt = formattedPrompt.replace('{{#each medications}}[\s\S]*?{{/each}}', medicationsList);
        }

        // Prepare the request to OpenRouter
        const request: OpenRouterRequest = {
          model: 'google/gemini-2.0-flash-exp:free',
          messages: [
            {
              role: 'user',
              content: formattedPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        };

        try {
          // Get API key from environment variables
          const apiKey = process.env.OPENROUTER_API_KEY;
          if (!apiKey) {
            throw new Error('OPENROUTER_API_KEY environment variable is not set');
          }

          // Implement retry logic with exponential backoff
          const maxRetries = 3;
          let retryCount = 0;
          let response: Response | null = null;

          while (retryCount < maxRetries) {
            try {
              // Make the API request
              response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${apiKey}`,
                  'HTTP-Referer': 'http://localhost:9002/', // Replace with your actual site URL
                  'X-Title': 'localhost', // Replace with your actual site name
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
              });

              // If successful, break out of retry loop
              if (response.ok) {
                break;
              }

              // If we get a 429 (Too Many Requests), wait and retry
              if (response.status === 429) {
                retryCount++;
                const waitTime = Math.pow(2, retryCount) * 1000; // Exponential backoff: 2s, 4s, 8s

                console.warn(`Rate limited. Retrying in ${waitTime/1000} seconds... (Attempt ${retryCount}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
              }

              // For other errors, don't retry
              throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
            } catch (fetchError) {
              // For network errors, retry
              if (retryCount < maxRetries - 1) {
                retryCount++;
                const waitTime = Math.pow(2, retryCount) * 1000;
                console.warn(`Network error. Retrying in ${waitTime/1000} seconds... (Attempt ${retryCount}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
              }
              throw fetchError;
            }
          }

          // If we exhausted all retries and still don't have a successful response
          if (!response || !response.ok) {
            throw new Error(`Failed after ${maxRetries} retries. Last error: ${response?.statusText || 'Unknown error'}`);
          }
          
          const data: OpenRouterResponse = await response.json();
          console.log('Message object:', data.choices[0].message);

          const content = data.choices[0]?.message?.content;

          if (!content) {
            throw new Error('No content in OpenRouter response');
          }

          // تنظيف الـ Markdown block
          const cleaned = content.replace(/```json\n?/, '').replace(/```$/, '').trim();

          let parsedOutput: any;
          try {
            parsedOutput = JSON.parse(cleaned);
            console.log('Parsed JSON output:', parsedOutput);
          } catch (err) {
            console.warn('Failed to parse JSON, returning raw content');
            parsedOutput = { rawResponse: content };
          }

          return { output: parsedOutput };
        } catch (error) {
          console.error('Error calling OpenRouter API:', error);
          throw error;
        }
      }
    };
  },

  /**
   * Define a flow for OpenRouter AI
   */
  defineFlow: (config: {
    name: string;
    inputSchema: any;
    outputSchema: any;
  }, handler: (input: any) => Promise<any>) => {
    return {
      name: config.name,
      inputSchema: config.inputSchema,
      outputSchema: config.outputSchema,
      execute: handler
    };
  }
};
