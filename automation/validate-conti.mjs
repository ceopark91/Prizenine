// PrizeNine's portable production gate. Shared by local workers on every PC.
const roles = [
  'problem_hook', 'product_first_impression', 'multi_angle_closeup',
  'real_use', 'honest_limit_or_check', 'cta'
];
const sceneFields = [
  'time', 'sceneRole', 'assetType', 'camera', 'visual', 'narration',
  'captionText', 'captionStyle', 'captionPosition', 'captionSafeArea', 'transition'
];
const topFields = ['title', 'cta', 'tone', 'voice', 'format', 'concept'];

function timeRange(scene) {
  const match = String(scene.time || '').match(/^(?:00:)?(\d{1,2})(?::(\d{2}))?\s*[-–~]\s*(?:00:)?(\d{1,2})(?::(\d{2}))?(?:초)?$/);
  if (!match) return null;
  const start = match[2] == null ? Number(match[1]) : Number(match[1]) * 60 + Number(match[2]);
  const end = match[4] == null ? Number(match[3]) : Number(match[3]) * 60 + Number(match[4]);
  return { start, end };
}

export function validateConti(script, { productNumber, reviews, autoProduction = true } = {}) {
  const errors = [];
  if (!script || typeof script !== 'object') return ['SCRIPT_MISSING'];
  for (const key of topFields) if (!String(script[key] || '').trim()) errors.push(`TOP_${key.toUpperCase()}_MISSING`);
  if (!Array.isArray(script.limitations) || !script.limitations.some(x => String(x).trim())) errors.push('LIMITATIONS_MISSING');
  if (!Array.isArray(script.pronunciationRules) || !script.pronunciationRules.some(x => String(x).trim())) errors.push('PRONUNCIATION_RULES_MISSING');
  if (!Array.isArray(script.scenes) || script.scenes.length < 6 || script.scenes.length > 8) return [...errors, 'SCENE_COUNT_MUST_BE_6_TO_8'];

  let end = 0;
  const seenRoles = new Set();
  const seenAssets = new Set();
  for (const [index, scene] of script.scenes.entries()) {
    const prefix = `SCENE_${index + 1}`;
    for (const field of sceneFields) if (!String(scene?.[field] || '').trim()) errors.push(`${prefix}_${field.toUpperCase()}_MISSING`);
    const range = timeRange(scene);
    if (!range || range.start !== end || range.end <= range.start || range.end - range.start > 8) errors.push(`${prefix}_TIME_INVALID`);
    else end = range.end;
    if (String(scene.visual || '').trim().length < 45) errors.push(`${prefix}_VISUAL_TOO_GENERIC`);
    if (String(scene.narration || '').trim().length < 12) errors.push(`${prefix}_NARRATION_TOO_SHORT`);
    seenRoles.add(scene.sceneRole);
    seenAssets.add(scene.assetType);
  }
  if (end < 28 || end > 40) errors.push('DURATION_MUST_BE_28_TO_40_SECONDS');
  for (const role of roles) if (!seenRoles.has(role)) errors.push(`ROLE_${role.toUpperCase()}_MISSING`);
  if (seenAssets.size < 3) errors.push('ASSET_VARIETY_TOO_LOW');
  const cta = `${script.cta || ''} ${script.scenes.at(-1)?.narration || ''} ${script.scenes.at(-1)?.captionText || ''}`;
  if (!cta.includes('프로필 링크') || !cta.includes('상품번호')) errors.push('PROFILE_PRODUCT_NUMBER_CTA_MISSING');
  if (productNumber && !cta.includes(String(productNumber))) errors.push('INTERNAL_PRODUCT_NUMBER_CTA_MISMATCH');
  const itemBodies = Array.isArray(reviews?.items) ? reviews.items.filter(item =>
    item && typeof item === 'object' && String(item.bodyExcerpt || '').trim().length >= 25 &&
    String(item.date || '').trim() && String(item.option || '').trim()
  ) : [];
  if (autoProduction && itemBodies.length < 2) errors.push('REVIEW_BODIES_NOT_VERIFIED');
  if (autoProduction && !script.scenes.some(scene => scene.sceneRole === 'real_use' && /후기|사용자|구매자/.test(scene.narration))) errors.push('REVIEW_INSIGHT_SCENE_MISSING');
  return errors;
}

export function assertConti(script, context) {
  const errors = validateConti(script, context);
  if (errors.length) throw Error(`CONTI_QUALITY_FAILED:${errors.join(',')}`);
}
