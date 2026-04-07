import type { SkillRequirements, SkillStatusEntry } from '@clawwork/shared';

type TFn = (key: string, opts?: Record<string, unknown>) => string;

export function summarizeSkillMissing(requirements: SkillRequirements, t: TFn, keyPrefix: string): string | null {
  const parts: string[] = [];
  if (requirements.bins.length > 0) parts.push(t(`${keyPrefix}MissingBins`, { count: requirements.bins.length }));
  if (requirements.anyBins.length > 0)
    parts.push(t(`${keyPrefix}MissingAnyBins`, { count: requirements.anyBins.length }));
  if (requirements.env.length > 0) parts.push(t(`${keyPrefix}MissingEnv`, { count: requirements.env.length }));
  if (requirements.config.length > 0) parts.push(t(`${keyPrefix}MissingConfig`, { count: requirements.config.length }));
  if (requirements.os.length > 0) parts.push(t(`${keyPrefix}MissingOs`));
  return parts.length > 0 ? parts.join(' \u2022 ') : null;
}

export function getSkillReason(skill: SkillStatusEntry, t: TFn, keyPrefix: string): string | null {
  if (skill.disabled) return t(`${keyPrefix}ReasonDisabled`);
  if (skill.blockedByAllowlist) return t(`${keyPrefix}ReasonBlocked`);
  const failedConfigChecks = skill.configChecks.filter((c) => !c.satisfied).length;
  if (failedConfigChecks > 0) return t(`${keyPrefix}ReasonConfig`, { count: failedConfigChecks });
  return summarizeSkillMissing(skill.missing, t, keyPrefix);
}
