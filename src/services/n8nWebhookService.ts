
export interface N8nWebhookPayload {
  action: string;
  sessionId: string;
  chatInput: string;
  timestamp: string;
  userContext?: {
    userId?: string;
    userName?: string;
    email?: string;
  };
  ragContext?: {
    retrievedSources?: any[];
    confidence?: number;
    fallbackUsed?: boolean;
  };
  metadata?: {
    source: string;
    version: string;
  };
}

export interface N8nWebhookHeaders {
  'X-Instance-Id'?: string;
  'Content-Type': string;
  'X-Session-Id': string;
  'X-Timestamp': string;
  [key: string]: string | undefined;
}

export class N8nWebhookService {
  private static instance: N8nWebhookService;
  private webhookUrl = 'https://workflow.asean-accesstrade.net/webhook/d79c84a1-dd21-4e37-9056-bc5cb58adb83/chat';
  private retryCount = 3;
  private timeout = 10000; // 10 seconds

  private constructor() {}

  public static getInstance(): N8nWebhookService {
    if (!N8nWebhookService.instance) {
      N8nWebhookService.instance = new N8nWebhookService();
    }
    return N8nWebhookService.instance;
  }

  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - webhook took too long to respond');
      }
      throw error;
    }
  }

  async sendMessage(
    sessionId: string, 
    chatInput: string, 
    instanceId?: string,
    userContext?: any,
    ragContext?: any
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    retryAttempts?: number;
  }> {
    let lastError: string = '';
    
    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        const timestamp = new Date().toISOString();
        
        const payload: N8nWebhookPayload = {
          action: 'sendMessage',
          sessionId,
          chatInput,
          timestamp,
          userContext: userContext ? {
            userId: userContext.id,
            userName: userContext.name,
            email: userContext.email
          } : undefined,
          ragContext: ragContext ? {
            retrievedSources: ragContext.sources,
            confidence: ragContext.confidence,
            fallbackUsed: ragContext.fallbackUsed
          } : undefined,
          metadata: {
            source: 'ChatAffHub-RAG',
            version: '1.0'
          }
        };

        const headers: N8nWebhookHeaders = {
          'Content-Type': 'application/json',
          'X-Session-Id': sessionId,
          'X-Timestamp': timestamp,
          'User-Agent': 'ChatAffHub-RAG/1.0'
        };

        if (instanceId) {
          headers['X-Instance-Id'] = instanceId;
        }

        console.log(`n8n webhook attempt ${attempt}/${this.retryCount}:`, {
          url: this.webhookUrl,
          method: 'POST',
          timeout: this.timeout,
          payload: {
            ...payload,
            userContext: payload.userContext ? { 
              userId: payload.userContext.userId, 
              userName: payload.userContext.userName 
            } : undefined
          }
        });

        const response = await this.fetchWithTimeout(this.webhookUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const responseData = await response.json();
        
        console.log('n8n webhook success:', {
          attempt,
          status: response.status,
          data: responseData
        });

        return {
          success: true,
          data: responseData,
          retryAttempts: attempt
        };

      } catch (error: any) {
        lastError = error.message || 'Unknown error';
        
        console.error(`n8n webhook attempt ${attempt} failed:`, {
          error: lastError,
          sessionId,
          chatInput: chatInput.substring(0, 100) + '...',
          attempt,
          maxAttempts: this.retryCount
        });
        
        // Don't retry on certain errors
        if (lastError.includes('timeout') || lastError.includes('abort')) {
          console.warn('Webhook timeout - stopping retries');
          break;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < this.retryCount) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    return {
      success: false,
      error: `Failed after ${this.retryCount} attempts: ${lastError}`,
      retryAttempts: this.retryCount
    };
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency?: number;
    response?: any;
    error?: string;
  }> {
    try {
      const startTime = Date.now();
      const timestamp = new Date().toISOString();
      
      const payload: N8nWebhookPayload = {
        action: 'healthCheck',
        sessionId: 'health-check',
        chatInput: 'ping',
        timestamp,
        metadata: {
          source: 'ChatAffHub-RAG',
          version: '1.0'
        }
      };

      console.log('n8n health check starting...', {
        url: this.webhookUrl,
        timeout: this.timeout
      });

      const response = await this.fetchWithTimeout(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': 'health-check',
          'X-Timestamp': timestamp,
          'User-Agent': 'ChatAffHub-RAG/1.0'
        },
        body: JSON.stringify(payload)
      });

      const latency = Date.now() - startTime;
      let responseData = null;

      try {
        responseData = await response.json();
      } catch (parseError) {
        console.warn('Could not parse health check response as JSON');
      }

      const result = {
        status: response.ok ? 'healthy' as const : 'unhealthy' as const,
        latency,
        response: responseData
      };

      console.log('n8n health check completed:', result);
      return result;

    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      console.error('n8n webhook health check failed:', {
        error: errorMessage,
        url: this.webhookUrl
      });
      
      return {
        status: 'unhealthy',
        error: errorMessage
      };
    }
  }

  async testWebhook(): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    diagnostics?: any;
  }> {
    const testData = {
      sessionId: `test-${Date.now()}`,
      chatInput: 'What are the best affiliate marketing strategies for beginners?',
      userContext: {
        id: 'test-user',
        name: 'Test User',
        email: 'test@example.com'
      },
      ragContext: {
        sources: [
          { name: 'Affiliate Marketing Basics', confidence: 0.85 },
          { name: 'Conversion Optimization', confidence: 0.78 }
        ],
        confidence: 0.85,
        fallbackUsed: false
      }
    };

    console.log('Starting webhook test with comprehensive data...');

    const result = await this.sendMessage(
      testData.sessionId,
      testData.chatInput,
      'test-instance',
      testData.userContext,
      testData.ragContext
    );

    return {
      ...result,
      diagnostics: {
        webhookUrl: this.webhookUrl,
        timeout: this.timeout,
        retryCount: this.retryCount,
        testPayload: testData
      }
    };
  }
}

// Export singleton instance
export const n8nWebhookService = N8nWebhookService.getInstance();
