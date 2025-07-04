
import { supabase } from "@/integrations/supabase/client";

// RAG Vector Store - Handles vector storage and similarity search
export interface VectorDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    type: 'campaign' | 'academy' | 'general';
    category?: string;
    title: string;
    source_id?: string;
    created_at: string;
    updated_at: string;
    [key: string]: any;
  };
}

export interface SimilaritySearchResult {
  document: VectorDocument;
  similarity: number;
  rank: number;
}

export class RAGVectorStore {
  private tableName = 'rag_embeddings';
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('Initializing RAG Vector Store...');
    
    // TODO: Ensure vector storage table exists
    // This will be created via SQL migration
    
    this.initialized = true;
  }

  // Store a single document with its embedding
  async storeDocument(document: VectorDocument): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .upsert({
          id: document.id,
          content: document.content,
          embedding: JSON.stringify(document.embedding),
          metadata: document.metadata,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw new Error(`Failed to store document: ${error.message}`);
      }

      console.log('Document stored successfully:', document.id);
    } catch (error) {
      console.error('Error storing document:', error);
      throw error;
    }
  }

  // Store multiple documents in batch
  async storeBatch(documents: VectorDocument[]): Promise<void> {
    console.log(`Storing batch of ${documents.length} documents`);

    const batchSize = 50; // Process in smaller batches for reliability
    
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      
      try {
        const { error } = await supabase
          .from(this.tableName)
          .upsert(
            batch.map(doc => ({
              id: doc.id,
              content: doc.content,
              embedding: JSON.stringify(doc.embedding),
              metadata: doc.metadata,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }))
          );

        if (error) {
          throw new Error(`Batch insert failed: ${error.message}`);
        }

        console.log(`Batch ${Math.floor(i / batchSize) + 1} stored successfully`);
      } catch (error) {
        console.error(`Error storing batch starting at ${i}:`, error);
        throw error;
      }
    }
  }

  // Perform similarity search using vector similarity
  async similaritySearch(
    queryEmbedding: number[],
    options: {
      limit?: number;
      threshold?: number;
      filter?: {
        type?: string;
        category?: string;
        [key: string]: any;
      };
    } = {}
  ): Promise<SimilaritySearchResult[]> {
    const {
      limit = 10,
      threshold = 0.7,
      filter = {}
    } = options;

    try {
      console.log('Performing similarity search with options:', options);

      // TODO: Implement actual vector similarity search
      // For now, return mock results based on current data
      const mockResults = await this.getMockSimilarityResults(queryEmbedding, options);
      
      return mockResults
        .filter(result => result.similarity >= threshold)
        .slice(0, limit);

    } catch (error) {
      console.error('Similarity search failed:', error);
      throw error;
    }
  }

  // Hybrid search combining vector similarity and keyword matching
  async hybridSearch(
    queryEmbedding: number[],
    queryText: string,
    options: {
      limit?: number;
      vectorWeight?: number;
      keywordWeight?: number;
      filter?: {
        type?: string;
        category?: string;
        [key: string]: any;
      };
    } = {}
  ): Promise<SimilaritySearchResult[]> {
    const {
      limit = 10,
      vectorWeight = 0.7,
      keywordWeight = 0.3,
      filter = {}
    } = options;

    console.log('Performing hybrid search for:', queryText);

    try {
      // Get vector similarity results
      const vectorResults = await this.similaritySearch(queryEmbedding, {
        limit: limit * 2, // Get more candidates for re-ranking
        filter
      });

      // Get keyword search results
      const keywordResults = await this.keywordSearch(queryText, {
        limit: limit * 2,
        filter
      });

      // Combine and re-rank results
      const combinedResults = this.combineSearchResults(
        vectorResults,
        keywordResults,
        vectorWeight,
        keywordWeight
      );

      return combinedResults.slice(0, limit);

    } catch (error) {
      console.error('Hybrid search failed:', error);
      throw error;
    }
  }

  // Keyword-based search for fallback and hybrid search
  private async keywordSearch(
    queryText: string,
    options: {
      limit?: number;
      filter?: {
        type?: string;
        category?: string;
        [key: string]: any;
      };
    } = {}
  ): Promise<SimilaritySearchResult[]> {
    // TODO: Implement full-text search
    console.log('Performing keyword search for:', queryText);
    return []; // Placeholder
  }

  // Combine vector and keyword search results
  private combineSearchResults(
    vectorResults: SimilaritySearchResult[],
    keywordResults: SimilaritySearchResult[],
    vectorWeight: number,
    keywordWeight: number
  ): SimilaritySearchResult[] {
    const combinedMap = new Map<string, SimilaritySearchResult>();

    // Add vector results
    vectorResults.forEach(result => {
      combinedMap.set(result.document.id, {
        ...result,
        similarity: result.similarity * vectorWeight
      });
    });

    // Add keyword results and combine scores
    keywordResults.forEach(result => {
      const existing = combinedMap.get(result.document.id);
      if (existing) {
        existing.similarity += result.similarity * keywordWeight;
      } else {
        combinedMap.set(result.document.id, {
          ...result,
          similarity: result.similarity * keywordWeight
        });
      }
    });

    // Sort by combined similarity score
    return Array.from(combinedMap.values())
      .sort((a, b) => b.similarity - a.similarity)
      .map((result, index) => ({
        ...result,
        rank: index + 1
      }));
  }

  // Mock similarity search for development
  private async getMockSimilarityResults(
    queryEmbedding: number[],
    options: any
  ): Promise<SimilaritySearchResult[]> {
    // TODO: Replace with actual vector search once pgvector is set up
    console.log('Using mock similarity search');
    
    return [
      {
        document: {
          id: 'mock-1',
          content: 'Mock relevant content for testing',
          embedding: queryEmbedding,
          metadata: {
            type: 'campaign' as const,
            title: 'Mock Campaign',
            source_id: '1',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        },
        similarity: 0.95,
        rank: 1
      }
    ];
  }

  // Delete documents by filter
  async deleteDocuments(filter: {
    type?: string;
    source_id?: string;
    [key: string]: any;
  }): Promise<number> {
    try {
      let query = supabase.from(this.tableName).delete();

      // Apply filters
      Object.entries(filter).forEach(([key, value]) => {
        if (key === 'type' || key === 'source_id') {
          query = query.eq(`metadata->>${key}`, value);
        }
      });

      const { error, count } = await query;

      if (error) {
        throw new Error(`Failed to delete documents: ${error.message}`);
      }

      console.log(`Deleted ${count || 0} documents`);
      return count || 0;
    } catch (error) {
      console.error('Error deleting documents:', error);
      throw error;
    }
  }

  // Get vector store statistics
  async getStats(): Promise<{
    totalDocuments: number;
    documentsByType: Record<string, number>;
    lastUpdated: string;
  }> {
    try {
      const { count, error } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        throw new Error(`Failed to get stats: ${error.message}`);
      }

      return {
        totalDocuments: count || 0,
        documentsByType: {}, // TODO: Implement type breakdown
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting vector store stats:', error);
      return {
        totalDocuments: 0,
        documentsByType: {},
        lastUpdated: new Date().toISOString()
      };
    }
  }
}

// Export singleton instance
export const ragVectorStore = new RAGVectorStore();
