// API client for backend communication

const API_URL = 'http://localhost:8000';

export interface PredictionResponse {
  prediction: 'real' | 'fake';
  probability: number;
  tokens: string[];
  display_tokens?: string[];
  scores: number[];
  attentions: number[][][];
}

export async function detectFakeNews(
  text: string, 
  abortSignal?: AbortSignal
): Promise<PredictionResponse> {
  const response = await fetch(`${API_URL}/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
    signal: abortSignal // Add abort signal to allow cancellation
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return await response.json();
}



