
# RAG Implementation Checklist

This document outlines the necessary steps to upgrade the AI Assistant from a keyword-based system to a full Retrieval-Augmented Generation (RAG) solution using Supabase and a Large Language Model (LLM).

**Status: Not Started**

---

### Phase 1: Backend Foundation (Supabase Setup)

*   **Vector Database Setup:**
    *   [ ] Enable the `pgvector` extension in the Supabase project.
    *   [ ] Add an `embedding` column of type `vector` to the `campaigns` table.
    *   [ ] Add an `embedding` column of type `vector` to the `academy` table.

*   **Embedding Generation Service:**
    *   [ ] Create a new Supabase Edge Function (`generate-embedding`).
    *   [ ] This function will take text as input and use an external service (e.g., OpenAI's API) to generate a vector embedding.
    *   [ ] Securely store the embedding service's API key in Supabase secrets.
    *   [ ] Create a script or database function to generate embeddings for all existing content in the `campaigns` and `academy` tables.
    *   [ ] Set up database triggers to automatically generate or update embeddings whenever content is created or changed.

---

### Phase 2: Retrieval Logic (Finding Relevant Content)

*   **Similarity Search Functions (RPC):**
    *   [ ] Create a Supabase RPC function (`match_campaigns`) that takes a query embedding and returns the most similar campaigns.
    *   [ ] Create a Supabase RPC function (`match_academy`) that takes a query embedding and returns the most similar academy articles.

*   **Content Retrieval Service:**
    *   [ ] Create a new Supabase Edge Function (`retrieve-context`).
    *   [ ] This function will:
        *   [ ] Accept a user's query as input.
        *   [ ] Call the `generate-embedding` function to convert the query to a vector.
        *   [ ] Call the `match_campaigns` and `match_academy` RPC functions to find relevant documents.
        *   [ ] Consolidate and return the top 3-5 most relevant documents as the context.

---

### Phase 3: Generation & Frontend Integration

*   **Generation Service (The Core AI Logic):**
    *   [ ] Create a new Supabase Edge Function (`ask-ai-assistant`).
    *   [ ] This function will:
        *   [ ] Take the user's query as input.
        *   [ ] Call the `retrieve-context` function to get the relevant documents.
        *   [ ] Construct a detailed prompt for the LLM, combining the retrieved context with the user's original query.
        *   [ ] Securely call an external LLM provider (like OpenAI's GPT-4 or Google's Gemini).
        *   [ ] Receive the generated response from the LLM.
        *   [ ] Return the final, generated answer to the client application.

*   **Frontend Modification (`ChatbotInterface.tsx`):**
    *   [ ] Remove the existing, hardcoded `processQuery` function.
    *   [ ] When a user submits a query, call the new `ask-ai-assistant` Edge Function.
    *   [ ] Display the streaming response from the LLM in the chat window for a better user experience.
    *   [ ] Implement robust loading and error handling states for the entire RAG pipeline.

---

### Phase 4: Testing and Refinement

*   **End-to-End Testing:**
    *   [ ] Thoroughly test the full pipeline with a wide variety of user queries.
    *   [ ] Verify that the most relevant context is being retrieved for different questions.
    *   [ ] Evaluate the quality, accuracy, and helpfulness of the final generated answers.

*   **Prompt Engineering:**
    *   [ ] Iteratively refine and improve the prompt template sent to the LLM to get better, more consistent results.

*   **Performance Optimization:**
    *   [ ] Analyze and optimize the response time of the RAG pipeline.
    *   [ ] Consider implementing caching for frequently asked questions or common context retrievals.
