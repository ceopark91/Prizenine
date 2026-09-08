export type ReviewSentiment = 'positive' | 'negative' | 'mixed' | 'neutral';

export type ReviewRecord = {
  id: string;
  text: string;
  rating?: number;
  title?: string;
  author?: string;
  date?: string;
  sourceUrl: string;
  verified?: boolean;
};

export type ReviewInsight = {
  reviewId: string;
  sentiment: ReviewSentiment;
  score: number;
  topics: string[];
  pros: string[];
  cons: string[];
  evidence: string[];
};

export type ReviewAnalysis = {
  total: number;
  analyzed: number;
  sentiment: { positive: number; negative: number; mixed: number; neutral: number };
  topics: Array<{ topic: string; mentions: number; sentiment: ReviewSentiment }>;
  pros: Array<{ text: string; mentions: number; evidence: string[] }>;
  cons: Array<{ text: string; mentions: number; evidence: string[] }>;
  reviews: ReviewInsight[];
};

const TOPICS: Record<string, string[]> = {
  사용성: ['사용하기 쉽', '간편', '편하', '조작', '설명서'],
  성능: ['성능', '잘 되', '효과', '잘 작동', '속도', '화력'],
  품질: ['품질', '튼튼', '내구', '마감', '고장', '견고'],
  가격: ['가격', '가성비', '비싸', '저렴', '돈 아깝'],
  배송: ['배송', '포장', '도착', '빠르', '늦'],
  청소: ['청소', '세척', '물때', '먼지', '관리'],
  크기: ['크기', '작다', '크다', '공간', '용량'],
  소음: ['소음', '시끄', '조용'],
};
const POSITIVE = ['좋', '만족', '추천', '편하', '간편', '튼튼', '빠르', '깔끔', '잘 되', '가성비', '저렴', '조용'];
const NEGATIVE = ['아쉽', '불편', '비싸', '고장', '소음', '시끄', '늦', '작다', '부족', '냄새', '누수', '어렵', '별로', '환불'];

function sentences(text: string) { return text.split(/[.!?。！？\n]+/).map((s) => s.trim()).filter(Boolean); }
function hits(text: string, words: string[]) { return words.filter((word) => text.includes(word)).length; }
function sentiment(text: string, rating?: number): ReviewSentiment {
  const positive = hits(text, POSITIVE) + (rating && rating >= 4 ? 2 : 0);
  const negative = hits(text, NEGATIVE) + (rating && rating <= 2 ? 2 : 0);
  if (positive && negative) return 'mixed';
  if (positive > negative) return 'positive';
  if (negative > positive) return 'negative';
  return 'neutral';
}
function evidenceFor(text: string, words: string[]) { return sentences(text).filter((line) => words.some((word) => line.includes(word))).slice(0, 3); }

export function analyzeReview(review: ReviewRecord): ReviewInsight {
  const text = `${review.title || ''} ${review.text}`.trim();
  const topics = Object.entries(TOPICS).filter(([, words]) => hits(text, words) > 0).map(([topic]) => topic);
  const pros = evidenceFor(text, POSITIVE);
  const cons = evidenceFor(text, NEGATIVE);
  const current = sentiment(text, review.rating);
  return { reviewId: review.id, sentiment: current, score: Math.max(-1, Math.min(1, (hits(text, POSITIVE) - hits(text, NEGATIVE)) / 5)), topics, pros, cons, evidence: [...pros, ...cons].slice(0, 5) };
}

export function aggregateReviews(reviews: ReviewRecord[]): ReviewAnalysis {
  const insights = reviews.map(analyzeReview);
  const sentimentCounts = { positive: 0, negative: 0, mixed: 0, neutral: 0 };
  const topicMap = new Map<string, { mentions: number; scores: number[] }>();
  const pros = new Map<string, { mentions: number; evidence: string[] }>();
  const cons = new Map<string, { mentions: number; evidence: string[] }>();
  for (const insight of insights) {
    sentimentCounts[insight.sentiment] += 1;
    for (const topic of insight.topics) { const row = topicMap.get(topic) || { mentions: 0, scores: [] }; row.mentions += 1; row.scores.push(insight.score); topicMap.set(topic, row); }
    for (const line of insight.pros) { const key = line.replace(/\s+/g, ' ').slice(0, 80); const row = pros.get(key) || { mentions: 0, evidence: [] }; row.mentions += 1; row.evidence.push(line); pros.set(key, row); }
    for (const line of insight.cons) { const key = line.replace(/\s+/g, ' ').slice(0, 80); const row = cons.get(key) || { mentions: 0, evidence: [] }; row.mentions += 1; row.evidence.push(line); cons.set(key, row); }
  }
  const ranked = (map: Map<string, { mentions: number; evidence: string[] }>) => [...map.entries()].sort((a, b) => b[1].mentions - a[1].mentions).slice(0, 10).map(([text, value]) => ({ text, mentions: value.mentions, evidence: [...new Set(value.evidence)].slice(0, 3) }));
  return { total: reviews.length, analyzed: insights.length, sentiment: sentimentCounts, topics: [...topicMap.entries()].sort((a, b) => b[1].mentions - a[1].mentions).map(([topic, value]) => ({ topic, mentions: value.mentions, sentiment: value.scores.reduce((a, b) => a + b, 0) > 0 ? 'positive' : value.scores.reduce((a, b) => a + b, 0) < 0 ? 'negative' : 'neutral' })), pros: ranked(pros), cons: ranked(cons), reviews: insights };
}
