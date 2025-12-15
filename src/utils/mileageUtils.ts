/**
 * 里程工具函数
 * 用于处理掌子面里程的格式化和转换
 */

/**
 * 将 dkilo 数值拆分为公里数和米数
 * @param dkilo 里程数值（如 180972）
 * @returns { km: number, m: number }
 */
export const splitMileage = (dkilo: number | undefined | null): { km: number; m: number } => {
  if (dkilo === undefined || dkilo === null) {
    return { km: 0, m: 0 };
  }
  const km = Math.floor(dkilo / 1000);
  const m = dkilo % 1000;
  return { km, m };
};

/**
 * 将公里数和米数合并为 dkilo 数值
 * @param km 公里数
 * @param m 米数
 * @returns dkilo 数值
 */
export const mergeMileage = (km: number | undefined, m: number | undefined): number => {
  const kmVal = km || 0;
  const mVal = m || 0;
  return kmVal * 1000 + mVal;
};

/**
 * 格式化里程显示（用于列表展示）
 * @param dkilo 里程数值（如 180972）
 * @param dkname 里程冠号（如 "DK"）
 * @returns 格式化后的字符串（如 "DK180+972"）
 */
export const formatMileageDisplay = (
  dkilo: number | string | undefined | null,
  dkname?: string
): string => {
  if (dkilo === undefined || dkilo === null || dkilo === '') return '-';
  const numVal = Number(dkilo);
  if (isNaN(numVal)) return String(dkilo);

  const prefix = dkname || 'DK';
  const km = Math.floor(numVal / 1000);
  const m = numVal % 1000;

  // 如果有小数部分，保留小数
  if (numVal % 1 !== 0) {
    const mWithDecimal = (numVal % 1000).toFixed(1);
    return `${prefix}${km}+${mWithDecimal}`;
  }

  return `${prefix}${km}+${m}`;
};
