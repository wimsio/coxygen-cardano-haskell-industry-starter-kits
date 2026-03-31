import { EscrowDatum, EscrowTransaction, CreateEscrowParams, EscrowStatus } from '@/types/escrow';

// Generate transaction hash (for local tracking - real txs come from blockchain)
export const generateTxHash = (): string => {
  const chars = 'abcdef0123456789';
  let hash = '';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
};

// Escrow storage (in a real app, this would be on-chain data)
const ESCROWS_KEY = 'cardano_escrows';
const TRANSACTIONS_KEY = 'cardano_transactions';

// Get all escrows from storage
export const getStoredEscrows = (): EscrowDatum[] => {
  const stored = localStorage.getItem(ESCROWS_KEY);
  if (!stored) return [];
  const escrows = JSON.parse(stored);
  return escrows.map((e: any) => ({
    ...e,
    deadline: new Date(e.deadline),
    createdAt: new Date(e.createdAt),
    updatedAt: new Date(e.updatedAt),
  }));
};

// Save escrows to storage
export const saveEscrows = (escrows: EscrowDatum[]): void => {
  localStorage.setItem(ESCROWS_KEY, JSON.stringify(escrows));
};

// Get transactions from storage
export const getStoredTransactions = (): EscrowTransaction[] => {
  const stored = localStorage.getItem(TRANSACTIONS_KEY);
  if (!stored) return [];
  const txs = JSON.parse(stored);
  return txs.map((t: any) => ({
    ...t,
    timestamp: new Date(t.timestamp),
  }));
};

// Save transactions to storage
export const saveTransactions = (transactions: EscrowTransaction[]): void => {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
};

// Create a new escrow (stores locally - in production, this submits to blockchain)
export const createEscrow = async (
  buyerAddress: string,
  params: CreateEscrowParams,
  txHash?: string
): Promise<{ escrow: EscrowDatum; transaction: EscrowTransaction }> => {
  const escrowId = `escrow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();

  const escrow: EscrowDatum = {
    id: escrowId,
    buyer: buyerAddress,
    seller: params.seller,
    amount: params.amount,
    deadline: params.deadline,
    status: 'active',
    description: params.description,
    createdAt: now,
    updatedAt: now,
  };

  const transaction: EscrowTransaction = {
    id: `tx_${Date.now()}`,
    escrowId,
    type: 'funded',
    from: buyerAddress,
    amount: params.amount,
    timestamp: now,
    txHash: txHash || generateTxHash(),
  };

  // Update storage
  const escrows = getStoredEscrows();
  escrows.push(escrow);
  saveEscrows(escrows);

  const transactions = getStoredTransactions();
  transactions.push(transaction);
  saveTransactions(transactions);

  return { escrow, transaction };
};

// Release escrow funds to seller
export const releaseEscrow = async (
  escrowId: string,
  buyerAddress: string,
  txHash?: string
): Promise<{ escrow: EscrowDatum; transaction: EscrowTransaction }> => {
  const escrows = getStoredEscrows();
  const escrowIndex = escrows.findIndex(e => e.id === escrowId);
  
  if (escrowIndex === -1) throw new Error('Escrow not found');
  
  const escrow = escrows[escrowIndex];
  if (escrow.status !== 'active') throw new Error('Escrow is not active');
  if (escrow.buyer !== buyerAddress) throw new Error('Only buyer can release funds');

  escrow.status = 'completed';
  escrow.updatedAt = new Date();
  escrows[escrowIndex] = escrow;
  saveEscrows(escrows);

  const transaction: EscrowTransaction = {
    id: `tx_${Date.now()}`,
    escrowId,
    type: 'released',
    from: escrow.buyer,
    to: escrow.seller,
    amount: escrow.amount,
    timestamp: new Date(),
    txHash: txHash || generateTxHash(),
  };

  const transactions = getStoredTransactions();
  transactions.push(transaction);
  saveTransactions(transactions);

  return { escrow, transaction };
};

// Refund escrow to buyer
export const refundEscrow = async (
  escrowId: string,
  requesterAddress: string,
  txHash?: string
): Promise<{ escrow: EscrowDatum; transaction: EscrowTransaction }> => {
  const escrows = getStoredEscrows();
  const escrowIndex = escrows.findIndex(e => e.id === escrowId);
  
  if (escrowIndex === -1) throw new Error('Escrow not found');
  
  const escrow = escrows[escrowIndex];
  if (escrow.status !== 'active') throw new Error('Escrow is not active');
  
  // Check if deadline has passed for buyer to refund
  const now = new Date();
  if (escrow.buyer === requesterAddress && now < escrow.deadline) {
    throw new Error('Cannot refund before deadline');
  }

  escrow.status = 'refunded';
  escrow.updatedAt = new Date();
  escrows[escrowIndex] = escrow;
  saveEscrows(escrows);

  const transaction: EscrowTransaction = {
    id: `tx_${Date.now()}`,
    escrowId,
    type: 'refunded',
    from: 'escrow_script',
    to: escrow.buyer,
    amount: escrow.amount,
    timestamp: new Date(),
    txHash: txHash || generateTxHash(),
  };

  const transactions = getStoredTransactions();
  transactions.push(transaction);
  saveTransactions(transactions);

  return { escrow, transaction };
};

// Get escrows for a specific address
export const getEscrowsForAddress = (address: string): EscrowDatum[] => {
  const escrows = getStoredEscrows();
  return escrows.filter(e => e.buyer === address || e.seller === address);
};

// Get transactions for a specific escrow
export const getTransactionsForEscrow = (escrowId: string): EscrowTransaction[] => {
  const transactions = getStoredTransactions();
  return transactions.filter(t => t.escrowId === escrowId);
};

// Get a single escrow by ID
export const getEscrowById = (escrowId: string): EscrowDatum | undefined => {
  const escrows = getStoredEscrows();
  return escrows.find(e => e.id === escrowId);
};

// Clear all escrow data (for testing)
export const clearAllData = (): void => {
  localStorage.removeItem(ESCROWS_KEY);
  localStorage.removeItem(TRANSACTIONS_KEY);
};
