export const QUARTER_HOUR_CAPE_ITEM_ID = "quarter_hour_cape";
export const QUARTER_HOUR_CAPE_ARM_WRESTLING_RESCUE_GAUGE = -55;

export function hasQuarterHourCape(equipment: readonly string[]): boolean {
  return equipment.includes(QUARTER_HOUR_CAPE_ITEM_ID);
}
