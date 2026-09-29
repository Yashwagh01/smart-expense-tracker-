/**
 * AI Service Client for Smart Expense Tracker
 * Interacts with the Vercel-deployed Python AI service (either via service binding proxy or public rewrite).
 */

export interface AiPredictionRequest {
  transactions?: any[];
  budgets?: any[];
  subscriptions?: any[];
  goals?: any[];
  bills?: any[];
  [key: string]: any;
}

export type AiModelType =
  | 'spending_prediction'
  | 'category_prediction'
  | 'balance_prediction'
  | 'cashflow_prediction'
  | 'savings_prediction'
  | 'anomaly_detection'
  | 'spending_habits'
  | 'smart_insights'
  | 'goal_prediction';

/**
 * Call the AI service for a specific prediction module
 */
export async function queryAiModel(model: AiModelType, payload: AiPredictionRequest): Promise<any> {
  const endpoint = `/api/ai/${model}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        script: model,
        payload,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      try {
        return JSON.parse(errText);
      } catch {
        return { success: false, error: `HTTP ${response.status}: ${errText}` };
      }
    }

    return await response.json();
  } catch (err: any) {
    return {
      success: false,
      error: `Network error reaching AI service: ${err.message}`,
    };
  }
}
