# EduCredentials — Customer-Facing Specification

## 1. Problem statement

Educational institutions issue thousands of paper and PDF certificates every
year. These documents are easy to forge, difficult to verify, and hard to
share securely. Employers and institutions that receive them have no reliable
way to confirm authenticity without contacting the issuing body directly.

EduCredentials solves this by anchoring a tamper-proof hash of every
credential on the Cardano blockchain. Anyone can verify a credential
instantly — without contacting the institution — by checking the hash
against the public ledger.

---

## 2. Scope

This starter kit covers:

- Issuance of diplomas, certificates, and micro-credentials
- On-chain hash anchoring via a Cardano Plutus minting policy
- Student credential claiming via a one-time secure link
- Public verification by hash or QR code
- Credential revocation by the issuing institution
- Role-based web dashboards for all four user types

Out of scope for this starter kit:

- Multi-institution federation
- Student wallet-based self-sovereign identity (SSI)
- GDPR deletion workflows (right to erasure)
- Mobile native application

---

## 3. User roles

### 3.1 Issuer (institution / registrar)

An authorised staff member at a university, college, or training provider.

**Responsibilities:**
- Log in with email and password
- Issue new credentials to students
- View and search all issued credentials
- Revoke credentials when required
- Monitor on-chain confirmation status

### 3.2 Student (credential holder)

A person who has been awarded a credential by an institution.

**Responsibilities:**
- Receive a claim link by email from the institution
- View their credential details
- Share a public verification link with employers
- Optionally connect a Cardano wallet to receive the on-chain token

### 3.3 Verifier (employer / third party)

Any person or organisation that needs to confirm a credential is genuine.

**Responsibilities:**
- Receive a credential hash or QR code from a student
- Paste the hash or scan the QR code on the verifier page
- Read the verification result (valid / revoked / not found)
- No login required

### 3.4 Administrator

A super-admin user who manages institutions on the platform.

**Responsibilities:**
- Create institution records
- Assign institution admin users
- Monitor system health

---

## 4. User journeys

### 4.1 Issuing a credential

1. Issuer logs in at `index.html`
2. Navigates to "Issue Credential"
3. Fills in: credential type, title, student name, student email, issue date, grade (optional)
4. Submits the form
5. System generates a SHA-256 hash of the credential data
6. Hash is stored in MySQL and submitted to Cardano as a minting transaction
7. System generates a QR code and a one-time claim link
8. Issuer copies the claim link and emails it to the student

### 4.2 Student claiming a credential

1. Student receives the claim link by email
2. Opens the link in a browser
3. Credential details are displayed on the student portal
4. Student can view the credential hash and on-chain transaction reference
5. Student copies the verification link to share with employers

### 4.3 Verifier checking a credential

1. Verifier opens `verifier.html` (no login required)
2. Pastes the credential hash or scans a QR code
3. System checks the hash against the database and the Cardano chain
4. Result is displayed: ✓ Valid, ⊘ Revoked, or ✗ Not found
5. If valid, credential details and Cardano explorer link are shown

### 4.4 Revoking a credential

1. Issuer navigates to "All Credentials"
2. Finds the credential and clicks "Revoke"
3. Enters an optional reason
4. Confirms the revocation
5. Status is immediately updated to "Revoked"
6. Any future verification of that hash returns "Revoked"

---

## 5. Constraints

- No personally identifiable information (PII) may be stored on the Cardano blockchain
- The credential hash must be reproducible from the original credential fields
- Verification must work without the verifier having a Cardano wallet
- The system must function on Cardano Preview testnet and be upgradeable to mainnet
- All core workflows must be completable through the web UI without using a command line

---

## 6. Acceptance criteria

| # | Criterion | How verified |
|---|---|---|
| AC-1 | Issuer can issue a credential and receive a QR code | Manually tested via issuer dashboard |
| AC-2 | Student can claim credential using the claim link | Manually tested via student portal |
| AC-3 | Verifier can verify a valid credential without login | Manually tested via verifier page |
| AC-4 | Verifier sees "Revoked" after issuer revokes | End-to-end test |
| AC-5 | No PII appears in any Cardano transaction | Blockfrost explorer inspection |
| AC-6 | Credential hash matches SHA-256 of canonical credential fields | Unit test |
| AC-7 | Unauthorised users cannot issue credentials | API returns 401 without valid JWT |
| AC-8 | All core flows work on mobile screen sizes | Responsive layout verified |