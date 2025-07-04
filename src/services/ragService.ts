
import { supabase } from "@/integrations/supabase/client";
import { ragVectorStore } from "./ragVectorStore";

// RAG Service - Main orchestrator for Retrieval-Augmented Generation
export class RAGService {
  private static instance: RAGService;
  private initialized = false;

  private constructor() {}

  public static getInstance(): RAGService {
    if (!RAGService.instance) {
      RAGService.instance = new RAGService();
    }
    return RAGService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    console.log('Initializing RAG Service...');
    await ragVectorStore.initialize();
    this.initialized = true;
  }

  // Main RAG query processing method
  async processQuery(query: string, context?: any): Promise<{
    response: string;
    sources: any[];
    confidence: number;
    fallbackUsed: boolean;
  }> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      console.log('Processing RAG query:', query);

      // Phase 1: Query preprocessing
      const processedQuery = await this.preprocessQuery(query);

      // Phase 2: Retrieve relevant content using vector store
      const retrievedContent = await this.retrieveRelevantContent(processedQuery, context);

      // Phase 3: Generate response using retrieved content
      const generatedResponse = await this.generateResponse(
        processedQuery,
        retrievedContent,
        context
      );

      return {
        response: generatedResponse.text,
        sources: retrievedContent,
        confidence: generatedResponse.confidence,
        fallbackUsed: false
      };

    } catch (error) {
      console.error('RAG processing error:', error);
      
      // Fallback to basic response
      return {
        response: `I encountered an issue processing your query: "${query}". Please try rephrasing your question or contact support if the issue persists.`,
        sources: [],
        confidence: 0,
        fallbackUsed: true
      };
    }
  }

  private async preprocessQuery(query: string): Promise<string> {
    // Clean and normalize text
    return query.trim().toLowerCase();
  }

  private async retrieveRelevantContent(
    query: string,
    context?: any
  ): Promise<any[]> {
    console.log('Retrieving relevant content for:', query);
    
    try {
      // Use hybrid search to get the best results
      const results = await ragVectorStore.hybridSearch(
        [], // Empty embedding for now (mock)
        query,
        {
          limit: 5,
          vectorWeight: 0.3,
          keywordWeight: 0.7, // Give more weight to keyword matching for now
          filter: {}
        }
      );

      console.log('Retrieved content results:', results.length);
      return results;
    } catch (error) {
      console.error('Content retrieval failed:', error);
      return [];
    }
  }

  private async generateResponse(
    query: string,
    retrievedContent: any[],
    context?: any
  ): Promise<{ text: string; confidence: number }> {
    console.log('Generating response for:', query, 'with', retrievedContent.length, 'sources');
    
    if (retrievedContent.length === 0) {
      return {
        text: `I couldn't find specific information about "${query}". Could you please rephrase your question or be more specific about what you're looking for?`,
        confidence: 0.2
      };
    }

    // Create a comprehensive response using the retrieved content
    let response = `Based on your query about **"${query}"**, here's what I found:\n\n`;
    
    // Add each retrieved document's content
    retrievedContent.forEach((result, index) => {
      const doc = result.document;
      response += `${doc.content}\n\n`;
      
      // Add separator between multiple results
      if (index < retrievedContent.length - 1) {
        response += "---\n\n";
      }
    });

    // Add summary if multiple results
    if (retrievedContent.length > 1) {
      response += `\n**Summary**: I found ${retrievedContent.length} relevant items that match your query. `;
      
      const campaignCount = retrievedContent.filter(r => r.document.metadata.type === 'campaign').length;
      const academyCount = retrievedContent.filter(r => r.document.metadata.type === 'academy').length;
      
      if (campaignCount > 0) {
        response += `${campaignCount} campaign${campaignCount > 1 ? 's' : ''} `;
      }
      if (academyCount > 0) {
        response += `${academyCount} academy article${academyCount > 1 ? 's' : ''} `;
      }
      
      response += "are available for you to explore.";
    }

    // Calculate confidence based on relevance scores
    const avgSimilarity = retrievedContent.reduce((sum, result) => sum + result.similarity, 0) / retrievedContent.length;
    const confidence = Math.min(0.95, Math.max(0.3, avgSimilarity));

    return {
      text: response,
      confidence
    };
  }

  // Health check method
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: {
      embedding: boolean;
      vectorStore: boolean;
      llm: boolean;
    };
  }> {
    try {
      await ragVectorStore.initialize();
      const stats = await ragVectorStore.getStats();
      
      return {
        status: stats.totalDocuments > 0 ? 'degraded' : 'unhealthy',
        services: {
          embedding: false, // Not implemented yet
          vectorStore: stats.totalDocuments > 0,
          llm: false // Not implemented yet
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        services: {
          embedding: false,
          vectorStore: false,
          llm: false
        }
      };
    }
  }
}

// Export singleton instance
export const ragService = RAGService.getInstance();
