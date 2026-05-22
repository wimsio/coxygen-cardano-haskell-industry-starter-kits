# EduCredentials — Design Document

## 1. System architecture

```
┌─────────────────────────────────────────────────────┐
│                   Browser (client)                  │
│  index.html  issuer.html  student.html  verifier.html│
│                 assets/app.js  assets/style.css      │
└────────────────────────┬────────────────────────────┘
                         │ HTTPS / JSON API
┌────────────────────────▼────────────────────────────┐
│              Node.js / Express backend              │
│   /api/auth   /api/credentials   /api/verify        │
│                                                     │
│   JWT auth  │  Hash utility  │  Cardano SDK (Lucid) │
└──────┬──────────────────────────────────┬───────────┘
       │                                  │
┌──────▼──────┐                  ┌────────▼──────────┐
│    MySQL    │                  │  Blockfrost API   │
│  (off-chain │                  │  (Cardano chain   │
│   private   │                  │   query layer)    │
│    data)    │                  └────────┬──────────┘
└─────────────┘                          │
                                ┌────────▼──────────┐
                                │ Cardano blockchain│
                                │ Plutus minting    │
                                │ policy + UTxO     │
                                └───────────────────┘
```

---

## 2. On-chain / off-chain boundary

### What is stored on-chain

| Data | Format | Why |
|---|---|---|
| Credential hash | 28-byte hex (token name) | Immutable proof of issuance |
| Issuer wallet address | bech32 | Proves who authorised the issuance |
| PolicyId | 56-byte hex | Identifies the issuing institution's contract |
| Transaction metadata | Optional JSON | Non-PII metadata only |

### What is stored off-chain (MySQL only)

| Data | Why off-chain |
|---|---|
| Student full name | PII — must not be public |
| Student email address | PII |
| Date of birth | PII |
| Grade / classification | Sensitive academic data |
| Credential description | Mutable; may be corrected |
| Claim token | Security token — must be private |
| Issuer admin credentials | Passwords, internal IDs |

**Privacy guarantee:** A Cardano block explorer shows only the credential
hash and the issuing wallet address. It is computationally infeasible to
reverse a SHA-256 hash to recover the original student data.

---

## 3. Credential data model

### On-chain token

```
PolicyId:  <compiled from issuer PubKeyHash>
TokenName: <28-byte SHA-256 hash of canonical payload>
Quantity:  1
Datum:     none (token name IS the reference)
```

### Off-chain credential record (MySQL)

```sql
credentials (
  id               CHAR(36)    UUID primary key
  credential_type  ENUM        diploma | certificate | micro_credential
  title            VARCHAR     e.g. "Bachelor of Science"
  institution_id   CHAR(36)    FK → institutions
  holder_name      VARCHAR     PII — student full name
  holder_email     VARCHAR     PII — used to deliver claim link
  holder_wallet    VARCHAR     optional Cardano address
  issue_date       DATE
  expiry_date      DATE        optional
  grade            VARCHAR     optional
  metadata_json    JSON        any extra fields
  credential_hash  CHAR(56)    56-hex = 28 bytes — on-chain reference
  tx_hash          CHAR(64)    Cardano transaction hash (set after mint)
  policy_id        CHAR(56)    Plutus PolicyId
  status           ENUM        draft | issued | revoked
  claim_token      CHAR(64)    one-time random token for student claim link
  claim_expires_at DATETIME
  claimed_at       DATETIME
  revoked_at       DATETIME
  revocation_reason VARCHAR
)
```

### Canonical hash payload

The credential hash is computed from this fixed-field JSON:

```json
{
  "institution": "<institution slug>",
  "type":        "<credential_type>",
  "title":       "<title>",
  "holder_email":"<holder_email>",
  "issue_date":  "<YYYY-MM-DD>",
  "grade":       "<grade or null>"
}
```

Fields are in this fixed order. Any change to a field produces a completely
different hash. The hash is computed with SHA-256 and truncated to 28 bytes
(56 hex characters) to match Cardano's token name length limit.

---

## 4. Plutus smart contract

### Contract: `CredentialPolicy.hs`

Type: **Parameterised minting policy** (PlutusV2)

Parameter: `CredentialParams { authorizedIssuer :: PubKeyHash }`

Each institution compiles their own instance of the policy with their
issuer wallet's PubKeyHash. This produces a unique PolicyId per institution.

### Rules enforced on-chain

| Rule | Checked in contract |
|---|---|
| Only the authorised issuer can mint | `txSignedBy txInfo (authorizedIssuer params)` |
| Token name must be exactly 28 bytes | `lengthOfByteString credHash == 28` |
| Exactly one token minted per tx | `totalMinted ownSymbol == 1` |
| Revocation (burn) requires issuer signature | `txSignedBy txInfo (authorizedIssuer params)` |

### Off-chain transaction flow

1. Backend generates credential hash
2. Backend builds an unsigned transaction body (via Lucid SDK)
3. Frontend wallet (CIP-30) signs the transaction
4. Frontend submits the signed tx to the network
5. Backend receives the tx hash and stores it against the credential record

---

## 5. Authentication and security

### Issuer authentication

- Email + bcrypt password (12 rounds)
- JWT (HS256, 8-hour expiry)
- All credential management endpoints require `Authorization: Bearer <token>`

### Wallet-based authentication (future)

CIP-30 wallet signature verification is prepared in the codebase but not
enforced in this starter kit version. The wallet address is stored and
associated with the institution record.

### API security measures

- Helmet.js sets security headers (CSP, HSTS, X-Frame-Options etc.)
- CORS restricted to configured origins
- Rate limiting: 200 req/15 min general; 20 req/15 min for login; 60 req/min for verify
- Input validation on all endpoints via express-validator
- SQL injection prevented by parameterised queries (mysql2 prepared statements)

---

## 6. Privacy strategy

1. **Hash-only on-chain** — no name, email, or grade is included in any on-chain data.
2. **Canonical payload is deterministic** — verification does not require querying the database; anyone with the original credential fields can recompute the hash independently.
3. **Claim tokens are single-use and time-limited** — 72-hour expiry by default.
4. **Verification logs contain no PII** — only credential hash, IP address, and result are logged.
5. **Passwords are bcrypt-hashed** — raw passwords never stored.

---

## 7. Key tradeoffs

| Decision | Alternative considered | Why we chose this |
|---|---|---|
| SHA-256 for hashing | Blake2b-224 (native Cardano) | SHA-256 available natively in Node.js; saves a native module dependency |
| JWT for auth | Session cookies | JWT is stateless — works cleanly with Tobb Technologies hosting |
| Unsigned tx returned to frontend for wallet signing | Backend holds signing key | Keeps private keys off the server; more secure by default |
| MySQL | PostgreSQL | MySQL is explicitly supported by Tobb Technologies hosting |
| Token name = hash | Datum | Simpler to query via Blockfrost asset endpoint without UTxO traversal |