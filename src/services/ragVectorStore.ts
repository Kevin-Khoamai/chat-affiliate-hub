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
  // For now, we'll use existing tables until we create the proper RAG embeddings table
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('Initializing RAG Vector Store...');
    
    // TODO: Create vector storage table via SQL migration
    // For now, we'll work with mock data until the proper table is created
    
    this.initialized = true;
  }

  // Store a single document with its embedding
  async storeDocument(document: VectorDocument): Promise<void> {
    try {
      console.log('Document would be stored:', document.id);
      // TODO: Implement actual storage once rag_embeddings table is created
      
      // For now, we'll just log the operation
      console.log('Mock storage - Document stored successfully:', document.id);
    } catch (error) {
      console.error('Error storing document:', error);
      throw error;
    }
  }

  // Store multiple documents in batch
  async storeBatch(documents: VectorDocument[]): Promise<void> {
    console.log(`Storing batch of ${documents.length} documents`);

    try {
      // TODO: Implement actual batch storage once rag_embeddings table is created
      
      // For now, process each document individually as mock operations
      for (const doc of documents) {
        await this.storeDocument(doc);
      }
      
      console.log('Mock batch storage completed successfully');
    } catch (error) {
      console.error('Error storing batch:', error);
      throw error;
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

      // TODO: Implement actual vector similarity search once pgvector is set up
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
    // For now, search existing campaign and academy data
    console.log('Performing keyword search for:', queryText);
    
    try {
      const campaignResults = await this.searchCampaigns(queryText, options);
      const academyResults = await this.searchAcademy(queryText, options);
      
      return [...campaignResults, ...academyResults];
    } catch (error) {
      console.error('Keyword search failed:', error);
      return [];
    }
  }

  private formatCampaignContent(campaign: any): string {
    const metrics = campaign.performance_metrics || {};
    const conversionRate = metrics.conversion_rate || 0;
    const clicks = metrics.clicks || 0;
    const sales = metrics.sales || 0;

    return `**${campaign.name}**

**Commission Rate:** ${campaign.commission_rate}%

**Description:** ${campaign.description || 'No description available'}

**Performance Metrics:**
• Conversion Rate: ${conversionRate}%
• Clicks: ${clicks}
• Sales: ${sales}`;
  }

  private isSpecificCampaignQuery(queryText: string, campaignName: string): boolean {
    const query = queryText.toLowerCase();
    const name = campaignName.toLowerCase();
    
    console.log('Checking specific campaign query:', query, 'against:', name);
    
    // Check if the campaign name appears in the query text
    if (query.includes(name)) {
      console.log('Campaign name found in query');
      return true;
    }

    // Check common query patterns
    const patterns = [
      'show me',
      'details',
      'campaign',
      'tell me about',
      'what is',
      'information'
    ];
    
    const hasPattern = patterns.some(pattern => query.includes(pattern));
    const hasName = query.includes(name);
    
    const isSpecific = hasPattern && hasName;
    console.log('Pattern check result:', { hasPattern, hasName, isSpecific });
    
    return isSpecific;
  }

  private async searchCampaigns(
    queryText: string,
    options: any
  ): Promise<SimilaritySearchResult[]> {
    try {
      console.log('Searching campaigns with query:', queryText);
      
      // Get all campaigns first, then filter
      const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select('*');

      if (error) {
        console.error('Campaign search error:', error);
        throw error;
      }

      console.log('Found campaigns:', campaigns?.length || 0);

      if (!campaigns || campaigns.length === 0) {
        return [];
      }

      // Check if this is a specific campaign query
      console.log('Checking for specific campaign matches...');
      for (const campaign of campaigns) {
        console.log('Testing campaign:', campaign.name);
        if (this.isSpecificCampaignQuery(queryText, campaign.name)) {
          console.log('Found specific campaign match:', campaign.name);
          return [{
            document: {
              id: campaign.id,
              content: this.formatCampaignContent(campaign),
              embedding: [], // Mock embedding
              metadata: {
                type: 'campaign' as const,
                title: campaign.name,
                source_id: campaign.id,
                created_at: campaign.created_at || new Date().toISOString(),
                updated_at: campaign.updated_at || new Date().toISOString(),
                commission_rate: campaign.commission_rate,
                performance_metrics: campaign.performance_metrics,
                category: this.getCampaignCategory(campaign.name)
              }
            },
            similarity: 0.95, // High similarity for exact match
            rank: 1
          }];
        }
      }

      // Filter campaigns based on query text for general searches
      const filteredCampaigns = campaigns.filter(campaign => {
        const searchText = queryText.toLowerCase();
        const nameMatch = campaign.name?.toLowerCase().includes(searchText);
        const descMatch = campaign.description?.toLowerCase().includes(searchText);
        
        return nameMatch || descMatch;
      });

      console.log('Filtered campaigns:', filteredCampaigns.length);

      return filteredCampaigns.map((campaign, index) => ({
        document: {
          id: campaign.id,
          content: this.formatCampaignContent(campaign),
          embedding: [], // Mock embedding
          metadata: {
            type: 'campaign' as const,
            title: campaign.name,
            source_id: campaign.id,
            created_at: campaign.created_at || new Date().toISOString(),
            updated_at: campaign.updated_at || new Date().toISOString(),
            commission_rate: campaign.commission_rate,
            performance_metrics: campaign.performance_metrics,
            category: this.getCampaignCategory(campaign.name)
          }
        },
        similarity: 0.8 - (index * 0.05), // Mock similarity score with decreasing relevance
        rank: index + 1
      }));
    } catch (error) {
      console.error('Campaign search failed:', error);
      return [];
    }
  }

  private getCampaignCategory(campaignName: string): string {
    const name = campaignName.toLowerCase();
    if (name.includes('fashion') || name.includes('clothing')) return 'Fashion';
    if (name.includes('tech') || name.includes('gadget')) return 'Technology';
    if (name.includes('home') || name.includes('garden')) return 'Home & Garden';
    if (name.includes('beauty') || name.includes('cosmetic')) return 'Beauty';
    if (name.includes('fitness') || name.includes('health')) return 'Health & Fitness';
    return 'General';
  }

  private async searchAcademy(
    queryText: string,
    options: any
  ): Promise<SimilaritySearchResult[]> {
    try {
      console.log('Searching academy with query:', queryText);
      
      // Get all academy items first, then filter
      const { data: academyItems, error } = await supabase
        .from('academy')
        .select('*');

      if (error) {
        console.error('Academy search error:', error);
        throw error;
      }

      console.log('Found academy items:', academyItems?.length || 0);

      if (!academyItems || academyItems.length === 0) {
        return [];
      }

      // Filter academy items based on query text
      const filteredAcademy = academyItems.filter(item => {
        const searchText = queryText.toLowerCase();
        const titleMatch = item.title?.toLowerCase().includes(searchText);
        const contentMatch = item.content?.toLowerCase().includes(searchText);
        
        return titleMatch || contentMatch;
      });

      console.log('Filtered academy items:', filteredAcademy.length);

      return filteredAcademy.map((item, index) => ({
        document: {
          id: item.id,
          content: `**Academy: ${item.title}**

**Content:** ${item.content || 'No content available'}

**Category:** ${item.category || 'General'}

**URL:** ${item.url || 'No URL available'}`,
          embedding: [], // Mock embedding
          metadata: {
            type: 'academy' as const,
            title: item.title,
            source_id: item.id,
            category: item.category,
            created_at: item.created_at || new Date().toISOString(),
            updated_at: item.updated_at || new Date().toISOString(),
            url: item.url
          }
        },
        similarity: 0.75 - (index * 0.05), // Mock similarity score with decreasing relevance
        rank: index + 1
      }));
    } catch (error) {
      console.error('Academy search failed:', error);
      return [];
    }
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
    console.log('Using mock similarity search');
    
    // Get real data for mock results
    try {
      const { data: campaigns } = await supabase.from('campaigns').select('*').limit(5);
      const { data: academy } = await supabase.from('academy').select('*').limit(3);
      
      const mockResults: SimilaritySearchResult[] = [];
      
      // Add campaign results with consistent formatting
      if (campaigns && campaigns.length > 0) {
        campaigns.forEach((campaign, index) => {
          mockResults.push({
            document: {
              id: campaign.id,
              content: this.formatCampaignContent(campaign),
              embedding: queryEmbedding,
              metadata: {
                type: 'campaign' as const,
                title: campaign.name,
                source_id: campaign.id,
                created_at: campaign.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString(),
                commission_rate: campaign.commission_rate,
                category: this.getCampaignCategory(campaign.name)
              }
            },
            similarity: 0.95 - (index * 0.05),
            rank: index + 1
          });
        });
      }
      
      // Add academy results with consistent formatting
      if (academy && academy.length > 0) {
        academy.forEach((item, index) => {
          mockResults.push({
            document: {
              id: item.id,
              content: `**Academy: ${item.title}**

**Content:** ${item.content || 'No content available'}

**Category:** ${item.category || 'General'}

**URL:** ${item.url || 'No URL available'}`,
              embedding: queryEmbedding,
              metadata: {
                type: 'academy' as const,
                title: item.title,
                source_id: item.id,
                created_at: item.created_at || new Date().toISOString(),
                updated_at: item.updated_at || new Date().toISOString(),
                category: item.category
              }
            },
            similarity: 0.85 - (index * 0.05),
            rank: campaigns ? campaigns.length + index + 1 : index + 1
          });
        });
      }
      
      return mockResults;
    } catch (error) {
      console.error('Error getting mock data:', error);
      return [];
    }
  }

  // Delete documents by filter (mock implementation)
  async deleteDocuments(filter: {
    type?: string;
    source_id?: string;
    [key: string]: any;
  }): Promise<number> {
    console.log('Mock delete operation for filter:', filter);
    // TODO: Implement actual deletion once rag_embeddings table is created
    return 0;
  }

  // Get vector store statistics
  async getStats(): Promise<{
    totalDocuments: number;
    documentsByType: Record<string, number>;
    lastUpdated: string;
  }> {
    try {
      // Get stats from existing tables for now
      const { count: campaignCount } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true });

      const { count: academyCount } = await supabase
        .from('academy')
        .select('*', { count: 'exact', head: true });

      return {
        totalDocuments: (campaignCount || 0) + (academyCount || 0),
        documentsByType: {
          campaign: campaignCount || 0,
          academy: academyCount || 0
        },
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
