'use strict';
const { BlockFrostAPI } = require('@blockfrost/blockfrost-js');

let _api = null;
function getAPI() {
  if (!_api) _api = new BlockFrostAPI({ projectId: process.env.BLOCKFROST_PROJECT_ID });
  return _api;
}

async function checkCredentialOnChain(credentialHash) {
  const api      = getAPI();
  const policyId = process.env.PLUTUS_POLICY_ID;
  if (!policyId) return { found: false, txHash: null, quantity: '0' };
  try {
    const assetId   = policyId + credentialHash;
    const asset     = await api.assetsById(assetId);
    if (!asset || asset.quantity === '0') return { found: false, txHash: null, quantity: '0' };
    const txHistory = await api.assetsTxs(assetId, { count: 1, order: 'asc' });
    const txHash    = txHistory.length > 0 ? txHistory[0].tx_hash : null;
    return { found: true, txHash, quantity: asset.quantity };
  } catch (err) {
    if (err.status_code === 404) return { found: false, txHash: null, quantity: '0' };
    throw new Error('Chain query failed');
  }
}

async function submitTransaction(signedTxCbor) {
  return await getAPI().txSubmit(Buffer.from(signedTxCbor, 'hex'));
}

module.exports = { checkCredentialOnChain, submitTransaction };
