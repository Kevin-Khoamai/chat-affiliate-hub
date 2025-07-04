
// RAG Embedding Service - Handles text-to-vector conversion
export class RAGEmbeddingService {
  private apiKey: string | null = null;
  private model = 'text-embedding-3-small'; // OpenAI embedding model
  private maxRetries = 3;
  private cache = new Map<string, number[]>();

  constructor() {
    // TODO: Get API key from environment or Supabase secrets
    this.apiKey = null;
  }

  // Generate embeddings for text content
  async generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error('Empty text provided for embedding');
    }

    // Check cache first
    const cacheKey = this.getCacheKey(text);
    if (this.cache.has(cacheKey)) {
      console.log('Cache hit for embedding:', text.substring(0, 50));
      return this.cache.get(cacheKey)!;
    }

    console.log('Generating embedding for text:', text.substring(0, 100));

    try {
      const embedding = await this.callEmbeddingAPI(text);
      
      // Cache the result
      this.cache.set(cacheKey, embedding);
      
      return embedding;
    } catch (error) {
      console.error('Embedding generation failed:', error);
      throw error;
    }
  }

  // Generate embeddings for multiple texts in batch
  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    console.log(`Generating batch embeddings for ${texts.length} texts`);
    
    const embeddings: number[][] = [];
    const batchSize = 10; // Process in batches to avoid rate limits

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchPromises = batch.map(text => this.generateEmbedding(text));
      
      try {
        const batchResults = await Promise.all(batchPromises);
        embeddings.push(...batchResults);
        
        // Add delay between batches to respect rate limits
        if (i + batchSize < texts.length) {
          await this.delay(1000);
        }
      } catch (error) {
        console.error(`Batch embedding failed for batch starting at ${i}:`, error);
        throw error;
      }
    }

    return embeddings;
  }

  private async callEmbeddingAPI(text: string): Promise<number[]> {
    if (!this.apiKey) {
      // TODO: Implement proper API key retrieval
      console.warn('No API key available for embedding service');
      return this.generateMockEmbedding(text);
    }

    let lastError: Error;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.model,
            input: text,
            encoding_format: 'float'
          }),
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.data || !data.data[0] || !data.data[0].embedding) {
          throw new Error('Invalid API response format');
        }

        return data.data[0].embedding;

      } catch (error) {
        lastError = error as Error;
        console.warn(`Embedding API attempt ${attempt} failed:`, error);
        
        if (attempt < this.maxRetries) {
          await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
        }
      }
    }

    throw new Error(`All embedding API attempts failed. Last error: ${lastError.message}`);
  }

  // Mock embedding for development/testing
  private generateMockEmbedding(text: string): number[] {
    console.log('Generating mock embedding for:', text.substring(0, 50));
    
    // Generate a consistent mock embedding based on text content
    const embedding: number[] = [];
    const dimension = 1536; // OpenAI embedding dimension
    
    let seed = 0;
    for (let i = 0; i < text.length; i++) {
      seed += text.charCodeAt(i);
    }
    
    for (let i = 0; i < dimension; i++) {
      // Simple pseudo-random generation based on text and position
      const value = Math.sin(seed + i) * 0.5;
      embedding.push(value);
    }
    
    return embedding;
  }

  private getCacheKey(text: string): string {
    // Simple hash function for cache key
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `${this.model}_${hash}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Clear embedding cache
  clearCache(): void {
    this.cache.clear();
    console.log('Embedding cache cleared');
  }

  // Get cache statistics
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // TODO: Implement hit rate tracking
    };
  }
}

// Export singleton instance
export const ragEmbeddingService = new RAGEmbeddingService();
