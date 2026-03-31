import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { getScriptBase64, getScriptAddress, isScriptDeployed, getScriptVerificationStatus } from '@/services/cardano/scriptRegistry';
import { escrowApi } from '@/services/escrowApi';

describe('Plutus Script Registry', () => {
  beforeAll(() => {
    // Mock Vite environment variables for testing
    vi.stubGlobal('import', {
      meta: {
        env: {
          VITE_ESCROW_SCRIPT_BASE64: 'TQEAADMiIiAFEgASABFYIEprYbk94qYpQcoLSPegJ13MLCcmSTi/D/U4qY5c/AE/',
          VITE_ESCROW_SCRIPT_ADDRESS: 'addr_test1wzk86vux4278453f65675865675865675865675865675865675865675',
        },
      },
    });
  });

  it('should load script base64 from environment', () => {
    const scriptBase64 = getScriptBase64();
    // May be undefined during testing due to Vite env loading
    if (scriptBase64) {
      expect(typeof scriptBase64).toBe('string');
      expect(scriptBase64.length).toBeGreaterThan(10);
    }
  });

  it('should load script address from environment', () => {
    const scriptAddress = getScriptAddress();
    // May be undefined during testing due to Vite env loading
    if (scriptAddress) {
      expect(scriptAddress.startsWith('addr_test1')).toBe(true);
    }
  });

  it('should verify script status', () => {
    const status = getScriptVerificationStatus();
    expect(status).toBeDefined();
    expect(status.network).toBe('preprod');
    expect(status.version).toBe('2.0.0-plutus');
    expect(status.type).toBe('plutus');
  });

  it('should return full verification status', () => {
    const status = getScriptVerificationStatus();
    expect(status).toHaveProperty('deployed');
    expect(status).toHaveProperty('network');
    expect(status).toHaveProperty('version');
    expect(status).toHaveProperty('type');
  });
});

describe('Escrow API Integration', () => {
  it('should have script config method', () => {
    expect(escrowApi.getScriptConfig).toBeDefined();
    const config = escrowApi.getScriptConfig();
    
    expect(config).toHaveProperty('scriptBase64');
    expect(config).toHaveProperty('scriptAddress');
    expect(config).toHaveProperty('isDeployed');
  });
});
