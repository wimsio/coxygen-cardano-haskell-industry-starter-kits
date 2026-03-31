// ============================================================================
// Script Registry - Native Script Escrow
// ============================================================================

import { TARGET_NETWORK } from './networkGuard';
import type { CardanoNetwork } from './types';

/**
 * Native script escrow: scripts are derived per-escrow from buyer/seller PKH
 * and deadline slot. No pre-deployed script or env vars needed.
 */
export interface ScriptDeployment {
  enabled: boolean;
  version: string;
  type: 'native';
}

export const ESCROW_SCRIPTS: Record<CardanoNetwork, ScriptDeployment> = {
  preprod: { enabled: true, version: '3.0.0-native', type: 'native' },
  preview: { enabled: false, version: '3.0.0-native', type: 'native' },
  mainnet: { enabled: false, version: '3.0.0-native', type: 'native' },
};

export function getActiveScript(): ScriptDeployment {
  return ESCROW_SCRIPTS[TARGET_NETWORK];
}

/** Native scripts are always deployable on enabled networks (no env vars needed) */
export function isScriptDeployed(): boolean {
  return getActiveScript().enabled;
}

// Legacy stubs kept for backward compatibility
export function getScriptBase64(): string | undefined { return undefined; }
export function getScriptAddress(): string | undefined { return undefined; }
export function getExpectedScriptHash(): string | undefined { return undefined; }
export function getComputedScriptHash(): string | undefined { return undefined; }
export function isScriptHashVerified(): boolean { return true; }

export function getScriptVerificationStatus() {
  const active = getActiveScript();
  return {
    deployed: isScriptDeployed(),
    network: TARGET_NETWORK,
    version: active.version,
    type: active.type,
    hashVerified: true,
  };
}
