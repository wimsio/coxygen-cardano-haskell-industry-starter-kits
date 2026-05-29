# EduCredentials — User Manual

## Getting started

Open the application in your browser. You will see the login page.
The verifier page (`verifier.html`) is public — no login is needed to verify a credential.

---

## Issuer guide

### Logging in

1. Go to the app URL (e.g. `https://yourapp.tobb.co.za`)
2. Make sure the **Issuer** tab is selected
3. Enter your institution email and password
4. Click **Sign in**

You will be taken to the Issuer Dashboard.

---

### Issuing a credential

1. Click **Issue Credential** in the left sidebar
2. Fill in the form:
   - **Credential type** — Diploma, Certificate, or Micro-credential
   - **Issue date** — the official award date
   - **Credential title** — e.g. "Bachelor of Science in Computer Science"
   - **Student full name** — the student's legal name
   - **Student email** — where the claim link will be sent
   - **Grade** — optional (e.g. "First Class Honours")
   - **Expiry date** — optional, leave blank for non-expiring credentials
3. Click **Issue credential**

A success window will appear showing:
- The credential hash (the on-chain reference)
- A QR code
- A claim link

**Copy the claim link and email it to the student.** The link expires after 72 hours by default.

---

### Viewing issued credentials

1. Click **All Credentials** in the sidebar
2. Use the search bar to find by student name, email, or title
3. Filter by status (Issued / Revoked) or type
4. Click **View** on any row to see full details

---

### Revoking a credential

1. Go to **All Credentials**
2. Find the credential and click **Revoke**
3. Optionally enter a reason (e.g. "Issued in error")
4. Click **Confirm revoke**

The credential status changes to Revoked immediately. Any future verification
of that hash will show a revoked result.

> ⚠ Revocation cannot be undone through the UI in this starter kit version.

---

## Student guide

### Claiming your credential

When your institution issues you a credential, you will receive an email
containing a claim link that looks like:

```
https://yourapp.tobb.co.za/student.html?token=abc123...
```

1. Click the link or paste it into your browser
2. Your credential details will be displayed automatically
3. You will see:
   - Credential title and type
   - Your name
   - Issue date and grade
   - The credential hash
   - A link to verify on the Cardano blockchain (if minted)

---

### Sharing your credential for verification

From the credential view, copy the **verification link** and share it with
an employer or institution. It looks like:

```
https://yourapp.tobb.co.za/verifier.html?hash=a3f9c2d1...
```

The person receiving this link can instantly verify your credential without
needing a login.

---

## Verifier guide

### Verifying a credential

Go directly to: `https://yourapp.tobb.co.za/verifier.html`

**No login required.**

You can verify a credential in two ways:

**Option A — Paste a hash:**
1. Paste the 56-character credential hash into the input field
2. Click **Verify**

**Option B — Open a shared link:**
If someone sent you a link like `verifier.html?hash=...`, simply open it
in your browser — the verification runs automatically.

---

### Reading the result

| Result | Meaning |
|---|---|
| ✓ **Credential verified** | The credential is in the database, has not been revoked, and (if on-chain) is confirmed on Cardano |
| ⊘ **Credential revoked** | The credential was deliberately revoked by the issuing institution |
| ⏱ **Credential expired** | The credential has passed its stated expiry date |
| ✗ **Not found** | No credential with this hash exists in the system |

A verified result also shows:
- The Cardano transaction hash (click to open in a blockchain explorer)
- The issuing institution name
- The credential type, title, and issue date
- The holder's name

---

## Frequently asked questions

**Can I verify a credential without internet access?**
No. The system requires a connection to check the database and optionally
the Cardano chain.

**What if the claim link has expired?**
Contact your institution and ask them to issue a new claim link. Your
credential record is not deleted — only the link expires.

**Is my personal data on the blockchain?**
No. Only a hash of your credential is on-chain. Your name, email address,
and grade are stored privately in the institution's database only.

**What does "Database verified (chain pending)" mean?**
The credential exists in the database and has been issued, but the on-chain
minting transaction has not been confirmed yet (or the Blockfrost API was
temporarily unavailable). The credential is still valid.