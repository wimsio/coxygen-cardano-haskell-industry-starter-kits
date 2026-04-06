```markdown
# Security Policy

## 🔐 Overview

Security is a top priority for **Coxyfi**, especially as a blockchain-based financial application handling user wallets, transactions, and invoice data.

This document outlines how to report vulnerabilities and best practices for maintaining security.

---

## 📢 Reporting a Vulnerability

If you discover a security issue, please report it responsibly:

### Contact

- Email: your-email@example.com
- OR open a private GitHub Security Advisory

### Include:

- Description of the vulnerability
- Steps to reproduce
- Possible impact
- Suggested fix (if any)

⚠️ Please **DO NOT** open public issues for security vulnerabilities.

---

## 🛡️ Supported Versions

| Version | Supported |
|--------|----------|
| Latest | ✅ Yes   |
| Older  | ❌ No    |

---

## 🔑 Security Best Practices

### 1. API & Secrets

- Never expose API keys (e.g. Blockfrost)
- Always store secrets in `.env`
- Do not commit `.env` files to GitHub

Example:

```env
BLOCKFROST_API_KEY=your_secret_key
````

---

### 2. Backend Security

* Use prepared statements (PDO)
* Sanitize and validate all inputs
* Use HTTPS in production
* Restrict API endpoints where necessary

---

### 3. Wallet & Blockchain Safety

* Never store private keys or seed phrases
* Only interact via wallet providers (e.g. Lace)
* Verify transactions before submission

---

### 4. Frontend Security

* Avoid exposing sensitive data in JavaScript
* Validate user inputs before sending to backend
* Use secure session handling

---

### 5. Database Security

* Use strong credentials
* Limit access privileges
* Regularly back up data

---

## ⚠️ Known Risks

* Blockchain transactions are irreversible
* Incorrect wallet usage may lead to loss of funds
* Malicious browser extensions can interfere with wallets

---

## 🔄 Security Updates

Security patches will be released as needed.
Always use the latest version of the project.

---

## 🙏 Responsible Disclosure

We appreciate responsible disclosure and will acknowledge contributors who help improve security.

---

## 💬 Questions?

For any security-related concerns, contact the maintainers privately.

```

---
