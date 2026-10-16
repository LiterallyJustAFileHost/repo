export const STANDARD_QUOTA_BYTES = 25 * 1024 ** 3;
export const HACK_CLUB_QUOTA_BYTES = 50 * 1024 ** 3;

export function getDefaultQuota(isHackClub: boolean) {
  return isHackClub ? HACK_CLUB_QUOTA_BYTES : STANDARD_QUOTA_BYTES;
}