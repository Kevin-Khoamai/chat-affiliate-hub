
export interface N8nWebhookPayload {
  action: string;
  sessionId: string;
  chatInput: string;
}

export interface N8nWebhookHeaders {
  'X-Instance-Id'?: string;
  'Content-Type': string;
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

  async sendMessage(sessionId: string, chatInput: string, instanceId?: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const payload: N8nWebhookPayload = {
        action: 'sendMessage',
        sessionId,
        chatInput
      };

      const headers: N8nWebhookHeaders = {
        'Content-Type': 'application/json'
      };

      // Add X-Instance-Id header if provided
      if (instanceId) {
        headers['X-Instance-Id'] = instanceId;
      }

      console.log('Sending message to n8n webhook:', {
        url: this.webhookUrl,
        payload,
        headers
      });

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      
      console.log('n8n webhook response:', responseData);

      return {
        success: true,
        data: responseData
      };

    } catch (error: any) {
      console.error('n8n webhook error:', error);
      
      return {
        success: false,
        error: error.message || 'Failed to send message to n8n webhook'
      };
    }
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency?: number;
  }> {
    try {
      const startTime = Date.now();
      
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'healthCheck',
          sessionId: 'health-check',
          chatInput: 'ping'
        })
      });

      const latency = Date.now() - startTime;

      return {
        status: response.ok ? 'healthy' : 'unhealthy',
        latency
      };

    } catch (error) {
      console.error('n8n webhook health check failed:', error);
      return {
        status: 'unhealthy'
      };
    }
  }
}

// Export singleton instance
export const n8nWebhookService = N8nWebhookService.getInstance();
