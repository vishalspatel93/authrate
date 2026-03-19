import { Insight } from '@/types';

const PROXY_URL = '/api/claude';

export async function generateInsights(payload: object): Promise<Insight[]> {
  const systemPrompt = `You are a senior payments optimization analyst with deep expertise in authorization rate optimization, card network rules, issuer behavior, and payment technology (tokenization, 3DS, retry logic, routing).

You are analyzing synthetic transaction data from a payment platform. Your job is to identify the top 5-7 optimization opportunities ranked by estimated revenue impact.

Rules:
- Ground every recommendation in the specific data provided — no generic advice
- Provide specific, actionable recommendations
- Quantify estimated monthly revenue impact where possible (assume $85 average transaction value and 500K monthly transaction volume if not provided)
- Flag confidence level: "high" if the data strongly supports it, "medium" if the signal is clear but sample is smaller, "low" if it's inferential
- Return ONLY a valid JSON array of Insight objects — no markdown, no explanation outside the JSON
- Do not include an "id" field (it will be generated)

Each insight must match this TypeScript interface:
{
  id: string;              // leave as empty string ""
  category: "tokenization" | "retry_logic" | "routing" | "fraud_tuning" | "3ds_optimization" | "issuer_specific" | "general";
  title: string;
  description: string;     // 2-3 sentences explaining the finding with specific data references
  currentMetric: string;   // e.g. "Raw PAN auth rate: 91.2%"
  projectedMetric: string; // e.g. "Projected with network tokens: 96.8%"
  estimatedImpact: string; // e.g. "~$142K monthly revenue recovery"
  action: string;          // Specific recommended action
  confidence: "high" | "medium" | "low";
  supportingData: string;  // Key data points supporting this insight
}`;

  const userMessage = `Analyze this payment authorization data and return a JSON array of 5-7 insights:

${JSON.stringify(payload, null, 2)}`;

  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text ?? '';

  // Parse JSON — strip any accidental markdown fencing
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const insights: Omit<Insight, 'id'>[] = JSON.parse(cleaned);

  return insights.map((ins, i) => ({ ...ins, id: `insight_${Date.now()}_${i}` }));
}

export async function generateSimulationNarrative(scenario: object, result: object): Promise<string> {
  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `You are a payments analyst. In 2-3 sentences, explain this authorization rate simulation result in plain English. Be specific about the numbers and what they mean for the business. No headers or bullet points — just prose.

Scenario: ${JSON.stringify(scenario)}
Result: ${JSON.stringify(result)}`,
        },
      ],
    }),
  });

  if (!response.ok) throw new Error(`API error ${response.status}`);
  const data = await response.json();
  return data.content?.[0]?.text ?? '';
}
