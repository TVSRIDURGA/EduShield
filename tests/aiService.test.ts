import { describe, it, expect } from 'vitest';
import { aiService } from '../src/services/aiService';
import { SEED_POLICIES, SEED_CLAIMS } from '../src/utils/seedData';

describe('EduShield Continuity Intelligence (AI Service)', () => {
  const policy = SEED_POLICIES[0];
  const claim = SEED_CLAIMS[0];

  it('grounds policy coverage answers in verified clauses and limits', async () => {
    const result = await aiService.explainPolicy('What does my policy cover and what is the limit?', policy);
    expect(result.groundedInPolicy).toBe(true);
    expect(result.citedClauses.some(c => c.includes('Clause 3.1'))).toBe(true);
    expect(result.answer).toContain('12,00,000');
  });

  it('grounds policy exclusion queries with explicit non-covered clauses', async () => {
    const result = await aiService.explainPolicy('What are the policy exclusions?', policy);
    expect(result.citedClauses.some(c => c.includes('Clause 7.4'))).toBe(true);
    expect(result.answer.toLowerCase()).toContain('exclusion');
  });

  it('explains waiting periods with exact inception dates and countdowns', async () => {
    const result = await aiService.explainPolicy('What is my waiting period?', policy);
    expect(result.citedClauses.some(c => c.includes('Clause 2.3'))).toBe(true);
    expect(result.waitingPeriodStatus).toBeDefined();
  });

  it('performs structured document triage and checklist completion', async () => {
    const result = await aiService.analyzeClaimDocuments(claim, policy);
    expect(result.claimReadinessScore).toBeGreaterThan(0);
    expect(result.identifiedDocTypes.length).toBeGreaterThan(0);
    expect(result.summary).toBeDefined();
  });
});
