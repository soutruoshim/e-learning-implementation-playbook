---
title: "Level 2 — Knowledge & Data Integration"
---

# Level 2 — Knowledge & Data Integration

## Primary Objective

Anchor generative AI outputs within verified organizational data repositories and systems of record.

---

# Core Competencies

## 1. Vector Stores & Embeddings

Learn how to store and retrieve semantic representations of organizational data.

### Key Focus

- Understand vector stores
- Understand embeddings
- Use a relational database with vector support
- Use PostgreSQL together with `pgvector`

### Example Direction

```text
Documents
   ↓
Generate embeddings
   ↓
Store vectors
   ↓
Search by semantic similarity
   ↓
Return relevant content
```

---

## 2. Data Preparation & Parsing

Learn how to prepare internal documents and other source data before retrieval.

### Key Focus

- Document ingestion
- Document parsing
- Chunking methodologies
- Metadata classification

### Conceptual Flow

```text
Source Documents
      ↓
Parse Content
      ↓
Clean / Normalize
      ↓
Split into Chunks
      ↓
Attach Metadata
      ↓
Prepare for Retrieval
```

### Metadata Examples

```text
document_id
document_type
department
version
created_at
updated_at
access_scope
```

---

## 3. Retrieval-Augmented Generation (RAG)

Learn how to ground AI responses using retrieved organizational data.

### Key Focus

- Design end-to-end retrieval architectures
- Retrieve relevant information before generation
- Combine vector search and keyword search
- Embed citations in generated answers

### High-Level RAG Flow

```text
User Question
      ↓
Query Processing
      ↓
Search Internal Knowledge
      ↓
Retrieve Relevant Content
      ↓
Provide Retrieved Context to LLM
      ↓
Generate Grounded Answer
      ↓
Return Answer + Citations
```

### Retrieval Sources May Include

```text
Internal policies
Product specifications
Technical documentation
Business procedures
Knowledge-base documents
```

---

## 4. Hybrid Retrieval

The roadmap calls for combining vector and keyword search.

### Vector Search

Useful for semantic similarity.

Example:

```text
User asks:
"How do employees request annual leave?"
```

A semantic search may retrieve content discussing:

```text
vacation request
leave approval
time-off policy
```

even when the wording is not identical.

### Keyword Search

Useful when exact words, codes, names, or identifiers matter.

Examples:

```text
POLICY-HR-001
API endpoint name
Product code
Error code
Exact configuration value
```

### Combined Retrieval

```text
User Query
   ↓
Vector Search
   +
Keyword Search
   ↓
Merge / Rank Results
   ↓
Relevant Context
```

---

## 5. Citations

Generated responses should identify where the supporting information came from.

### Goal

The user should be able to understand:

```text
What source supports this answer?
Which document was used?
Where did the information come from?
```

### Conceptual Response

```json
{
  "answer": "Employees must submit the request through the HR portal.",
  "citations": [
    {
      "document": "Employee Leave Policy",
      "section": "Annual Leave Requests"
    }
  ]
}
```

The specific citation format depends on your application design.

---

## 6. Access Control & Security

Retrieval must respect user permissions.

### Core Requirement

Apply permission-based filtering so vector searches only return content the user is authorized to access.

### Incorrect Flow

```text
User
 ↓
Search entire vector database
 ↓
Retrieve confidential documents
```

### Correct Flow

```text
Authenticated User
      ↓
Determine Permissions
      ↓
Apply Access Filters
      ↓
Search Authorized Data Only
      ↓
Retrieve Results
```

### Authorization Boundary

The retrieval layer should scope searches to authorized user boundaries.

Examples may include:

```text
department
role
team
organization
document classification
user permissions
```

---

# Level 2 Architecture

A high-level Level 2 system may look like:

```text
User
 ↓
Application API
 ↓
Authentication / Authorization
 ↓
Query Processing
 ↓
Retrieval Layer
 ├── Vector Search
 └── Keyword Search
 ↓
Permission Filtering
 ↓
Relevant Internal Content
 ↓
LLM
 ↓
Grounded Response
 ↓
Citations
```

---

# Data Ingestion Flow

A conceptual ingestion pipeline:

```text
Internal Documents
      ↓
Document Parser
      ↓
Content Cleaning
      ↓
Chunking
      ↓
Metadata Classification
      ↓
Embedding Generation
      ↓
PostgreSQL + pgvector
```

---

# Retrieval Flow

```text
User Question
      ↓
Generate Search Representation
      ↓
Vector Search
      +
Keyword Search
      ↓
Apply Access Control
      ↓
Rank Relevant Chunks
      ↓
Send Context to LLM
      ↓
Generate Answer
      ↓
Attach Citations
```

---

# Recommended Technology Direction from the Roadmap

## Database

```text
PostgreSQL
+
pgvector
```

Purpose:

```text
Store structured data
Store embeddings
Perform vector similarity search
Support retrieval workflows
```

---

# Practical Deliverable

## Document Q&A API

Construct a document Q&A API anchored in internal policy documents or product specifications.

### Example Input

```json
{
  "question": "What is the company policy for annual leave?"
}
```

### Conceptual Processing

```text
Question
   ↓
Search authorized internal documents
   ↓
Retrieve relevant policy sections
   ↓
Provide context to LLM
   ↓
Generate grounded answer
   ↓
Return citations
```

### Example Output

```json
{
  "answer": "The answer should be generated from the retrieved internal policy content.",
  "citations": [
    {
      "document": "Internal Policy Document",
      "section": "Relevant Section"
    }
  ]
}
```

---

# Level 2 Learning Checklist

Before considering Level 2 complete, you should be comfortable with:

- [ ] Understanding what embeddings are used for
- [ ] Understanding what a vector store is used for
- [ ] Using PostgreSQL with `pgvector`
- [ ] Preparing documents for retrieval
- [ ] Parsing source documents
- [ ] Applying chunking methodologies
- [ ] Attaching metadata to chunks
- [ ] Designing a retrieval pipeline
- [ ] Understanding Retrieval-Augmented Generation (RAG)
- [ ] Combining vector and keyword search
- [ ] Returning citations with generated answers
- [ ] Applying permission-based retrieval filtering
- [ ] Preventing unauthorized data retrieval
- [ ] Building a document Q&A API grounded in internal data

---

# Level 2 Final Goal

By the end of Level 2, your AI system should no longer depend only on the model's internal knowledge.

Instead:

```text
User Question
      ↓
Verified Organizational Data
      ↓
Relevant Retrieved Context
      ↓
LLM
      ↓
Grounded Answer
      ↓
Citations
```

The objective is to make generative AI responses rely on verified organizational data repositories and systems of record.
