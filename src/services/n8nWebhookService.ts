
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

  private constructor() {}

  public static getInstance(): N8nWebhookService {
    if (!N8nWebhookService.instance) {
      N8nWebhookService.instance = new N8nWebhookService();
    }
    return N8nWebhookService.instance;
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
  }> {
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
        'X-Timestamp': timestamp
      };

      // Add X-Instance-Id header if provided
      if (instanceId) {
        headers['X-Instance-Id'] = instanceId;
      }

      console.log('Sending enhanced message to n8n webhook:', {
        url: this.webhookUrl,
        payload: {
          ...payload,
          // Log without sensitive data
          userContext: payload.userContext ? { userId: payload.userContext.userId, userName: payload.userContext.userName } : undefined
        },
        headers: {
          ...headers,
          // Don't log sensitive headers
        }
      });

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }

      const responseData = await response.json();
      
      console.log('n8n webhook response:', responseData);

      return {
        success: true,
        data: responseData
      };

    } catch (error: any) {
      console.error('n8n webhook error:', {
        error: error.message,
        sessionId,
        chatInput: chatInput.substring(0, 100) + '...' // Log first 100 chars only
      });
      
      return {
        success: false,
        error: error.message || 'Failed to send message to n8n webhook'
      };
    }
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency?: number;
    response?: any;
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

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': 'health-check',
          'X-Timestamp': timestamp
        },
        body: JSON.stringify(payload)
      });

      const latency = Date.now() - startTime;
      let responseData = null;

      try {
        responseData = await response.json();
      } catch (parseError) {
        console.warn('Could not parse n8n health check response as JSON');
      }

      return {
        status: response.ok ? 'healthy' : 'unhealthy',
        latency,
        response: responseData
      };

    } catch (error) {
      console.error('n8n webhook health check failed:', error);
      return {
        status: 'unhealthy'
      };
    }
  }

  // New method to test webhook with sample data
  async testWebhook(): Promise<{
    success: boolean;
    data?: any;
    error?: string;
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

    return await this.sendMessage(
      testData.sessionId,
      testData.chatInput,
      'test-instance',
      testData.userContext,
      testData.ragContext
    );
  }
}

// Export singleton instance
export const n8nWebhookService = N8nWebhookService.getInstance();
