
// RAG LLM Service - Handles Large Language Model interactions for response generation
export interface LLMGenerationOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  model?: string;
  systemPrompt?: string;
}

export interface LLMResponse {
  text: string;
  confidence: number;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  sources?: string[];
}

export class RAGLLMService {
  private apiKey: string | null = null;
  private defaultModel = 'gpt-4o-mini'; // Fast and cost-effective
  private maxRetries = 3;

  constructor() {
    // TODO: Get API key from environment or Supabase secrets
    this.apiKey = null;
  }

  // Generate response using retrieved context
  async generateResponse(
    query: string,
    retrievedContent: any[],
    options: LLMGenerationOptions = {}
  ): Promise<LLMResponse> {
    const {
      maxTokens = 1000,
      temperature = 0.7,
      topP = 0.9,
      model = this.defaultModel,
      systemPrompt = this.getDefaultSystemPrompt()
    } = options;

    console.log('Generating LLM response for query:', query);

    try {
      // Create context from retrieved content
      const context = this.buildContext(retrievedContent);
      
      // Create user prompt with context
      const userPrompt = this.buildUserPrompt(query, context);

      // Generate response
      const response = await this.callLLMAPI(
        systemPrompt,
        userPrompt,
        {
          model,
          maxTokens,
          temperature,
          topP
        }
      );

      return {
        text: response.text,
        confidence: this.calculateConfidence(response.text, retrievedContent),
        tokens: response.tokens,
        sources: this.extractSources(retrievedContent)
      };

    } catch (error) {
      console.error('LLM generation failed:', error);
      throw error;
    }
  }

  // Generate response for specific query types
  async generateCampaignResponse(
    query: string,
    campaigns: any[]
  ): Promise<LLMResponse> {
    const systemPrompt = `You are an AI assistant specialized in affiliate marketing campaigns. 
    Provide detailed, accurate information about campaigns including commission rates, 
    performance metrics, and optimization strategies. Use the provided campaign data 
    to give specific, actionable advice.`;

    return this.generateResponse(query, campaigns, {
      systemPrompt,
      temperature: 0.5 // Lower temperature for factual responses
    });
  }

  async generateAcademyResponse(
    query: string,
    academyContent: any[]
  ): Promise<LLMResponse> {
    const systemPrompt = `You are an educational AI assistant for affiliate marketing. 
    Help users learn and understand affiliate marketing concepts, strategies, and best practices. 
    Provide step-by-step guidance and practical examples based on the academy content provided.`;

    return this.generateResponse(query, academyContent, {
      systemPrompt,
      temperature: 0.6
    });
  }

  private async callLLMAPI(
    systemPrompt: string,
    userPrompt: string,
    options: {
      model: string;
      maxTokens: number;
      temperature: number;
      topP: number;
    }
  ): Promise<{ text: string; tokens: { input: number; output: number; total: number } }> {
    if (!this.apiKey) {
      console.warn('No API key available for LLM service');
      return this.generateMockResponse(userPrompt);
    }

    let lastError: Error;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: options.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            max_tokens: options.maxTokens,
            temperature: options.temperature,
            top_p: options.topP,
          }),
        });

        if (!response.ok) {
          throw new Error(`LLM API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          throw new Error('Invalid LLM API response format');
        }

        return {
          text: data.choices[0].message.content,
          tokens: {
            input: data.usage?.prompt_tokens || 0,
            output: data.usage?.completion_tokens || 0,
            total: data.usage?.total_tokens || 0
          }
        };

      } catch (error) {
        lastError = error as Error;
        console.warn(`LLM API attempt ${attempt} failed:`, error);
        
        if (attempt < this.maxRetries) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw new Error(`All LLM API attempts failed. Last error: ${lastError.message}`);
  }

  private buildContext(retrievedContent: any[]): string {
    if (!retrievedContent || retrievedContent.length === 0) {
      return '';
    }

    const contextSections = retrievedContent.map((item, index) => {
      if (item.document) {
        return `[Source ${index + 1}] ${item.document.metadata.title}\n${item.document.content}`;
      } else if (item.name || item.title) {
        const title = item.name || item.title;
        const content = item.description || item.content || '';
        return `[Source ${index + 1}] ${title}\n${content}`;
      }
      return `[Source ${index + 1}] ${JSON.stringify(item)}`;
    });

    return contextSections.join('\n\n');
  }

  private buildUserPrompt(query: string, context: string): string {
    if (!context || context.trim().length === 0) {
      return `User Query: ${query}

Please provide a helpful response based on your knowledge of affiliate marketing.`;
    }

    return `User Query: ${query}

Relevant Information:
${context}

Please provide a comprehensive response based on the above information and your knowledge of affiliate marketing. 
Be specific and cite the relevant sources when appropriate.`;
  }

  private getDefaultSystemPrompt(): string {
    return `You are an AI assistant specialized in affiliate marketing. You help users with:

1. Campaign information and optimization
2. Commission rates and performance metrics
3. Educational content and best practices
4. Marketing strategies and tips

Always provide accurate, helpful, and actionable advice. When you have specific data about campaigns or academy content, use it to give detailed responses. Be conversational but professional.

If you don't have enough information to answer a question completely, acknowledge this and provide what information you can, along with suggestions for getting more specific help.`;
  }

  private calculateConfidence(response: string, retrievedContent: any[]): number {
    // Simple confidence calculation based on response length and content relevance
    if (!response || response.length < 50) return 0.3;
    if (!retrievedContent || retrievedContent.length === 0) return 0.5;
    
    // Higher confidence if we have good retrieved content
    const hasGoodContent = retrievedContent.some(item => 
      item.similarity && item.similarity > 0.8
    );
    
    return hasGoodContent ? 0.9 : 0.7;
  }

  private extractSources(retrievedContent: any[]): string[] {
    return retrievedContent
      .map(item => {
        if (item.document && item.document.metadata) {
          return item.document.metadata.title;
        } else if (item.name || item.title) {
          return item.name || item.title;
        }
        return null;
      })
      .filter(Boolean) as string[];
  }

  private generateMockResponse(prompt: string): Promise<{ text: string; tokens: { input: number; output: number; total: number } }> {
    console.log('Generating mock LLM response for:', prompt.substring(0, 100));
    
    const mockResponse = `This is a mock response for development purposes. The RAG LLM service is not yet fully configured with an API key.

Your query was: "${prompt.substring(0, 100)}..."

To enable full LLM functionality, please configure the OpenAI API key in the system.`;

    return Promise.resolve({
      text: mockResponse,
      tokens: {
        input: Math.floor(prompt.length / 4),
        output: Math.floor(mockResponse.length / 4),
        total: Math.floor((prompt.length + mockResponse.length) / 4)
      }
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const ragLLMService = new RAGLLMService();
