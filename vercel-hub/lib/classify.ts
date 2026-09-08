const rules: Array<[string, RegExp]> = [
  ['뷰티', /화장품|선크림|크림|세럼|샴푸|향수|뷰티|스킨케어|립스틱/i],
  ['테크', /스피커|블루투스|충전|케이블|카메라|이어폰|키보드|마우스|전자|노트북|테크/i],
  ['주방', /주방|텀블러|냄비|프라이팬|식기|수납|정리|트레이|도마/i],
  ['여행', /여행|파우치|캐리어|백팩|캠핑|등산/i],
  ['패션', /의류|티셔츠|바지|신발|가방|지갑|패션|시계/i],
  ['스포츠', /운동|요가|헬스|골프|러닝|자전거/i],
];

export function classifyCategory(name: string, description = ''): string {
  const text = `${name} ${description}`;
  return rules.find(([, pattern]) => pattern.test(text))?.[0] ?? '생활';
}
