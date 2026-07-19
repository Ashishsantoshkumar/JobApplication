import { OpenAI } from 'openai';

// Generates a deterministic 1536-dimensional vector for a given text (fallback)
function getDeterministicMockEmbedding(text: string): number[] {
  const size = 1536;
  const vector = new Array(size).fill(0.01); // base noise
  
  const cleanText = text.toLowerCase();
  
  // List of keywords and their target indexes
  const keyTerms: { [key: string]: number[] } = {
    'react': [10, 50, 120, 300],
    'typescript': [15, 55, 125, 305],
    'javascript': [20, 60, 130, 310],
    'node': [25, 65, 135, 315],
    'express': [30, 70, 140, 320],
    'postgres': [35, 75, 145, 325],
    'sql': [40, 80, 150, 330],
    'python': [45, 85, 155, 335],
    'fastapi': [48, 88, 158, 338],
    'aws': [90, 190, 290, 390],
    'docker': [95, 195, 295, 395],
    'tailwind': [100, 200, 300, 400],
    'css': [105, 205, 305, 405],
    'html': [110, 210, 310, 410],
    'developer': [2, 102, 202, 302],
    'engineer': [4, 104, 204, 304],
    'manager': [6, 106, 206, 306],
    'design': [8, 108, 208, 308],
  };

  // Populate vector based on keywords present in the text
  let matchCount = 0;
  for (const [term, indexes] of Object.entries(keyTerms)) {
    if (cleanText.includes(term)) {
      matchCount++;
      indexes.forEach(idx => {
        vector[idx] += 0.45; // boost key dimensions
      });
    }
  }

  // Add hash-based deterministic noise based on character codes
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const targetIdx = (charCode * (i + 1)) % size;
    vector[targetIdx] += 0.05;
  }

  // Normalize the vector (unit length) for correct cosine similarity math
  let sumSq = 0;
  for (let i = 0; i < size; i++) {
    sumSq += vector[i] * vector[i];
  }
  const magnitude = Math.sqrt(sumSq);
  
  return vector.map(val => val / magnitude);
}

export async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    return getDeterministicMockEmbedding(text);
  }

  try {
    const openai = new OpenAI({ apiKey });
    console.log('🤖 Calling OpenAI embedding endpoint (text-embedding-3-small)...');
    
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float'
    });

    console.log('✅ Embedding successfully generated.');
    return response.data[0].embedding;
  } catch (error) {
    console.error('❌ OpenAI embedding generation failed, using mock embedding generator fallback:', error);
    return getDeterministicMockEmbedding(text);
  }
}
