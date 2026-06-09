const VILLAGE_DISCOVERY_STORAGE_KEY = "grodor_has_discovered_village";

let discoveredVillage = loadVillageDiscovery();

export function hasDiscoveredVillage(): boolean {
  return discoveredVillage;
}

export function markVillageDiscovered(): boolean {
  discoveredVillage = true;
  saveVillageDiscovery(discoveredVillage);
  return discoveredVillage;
}

export function resetVillageDiscoveryDebug(): boolean {
  discoveredVillage = false;
  saveVillageDiscovery(discoveredVillage);
  return discoveredVillage;
}

function loadVillageDiscovery(): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return false;
    }

    return window.localStorage.getItem(VILLAGE_DISCOVERY_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function saveVillageDiscovery(value: boolean): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }

    window.localStorage.setItem(VILLAGE_DISCOVERY_STORAGE_KEY, String(value));
  } catch {
    // localStorage can be blocked; keep discovery in memory for this session.
  }
}
