
````markdown
# Contributing to Coxyfi

Thank you for your interest in contributing to **Coxyfi**! 🚀  
We welcome contributions from developers, designers, and blockchain enthusiasts working to improve decentralized invoice financing on Cardano.

Whether it's fixing bugs, improving UI/UX, enhancing smart contracts, or optimizing backend logic — your contribution matters.

---

## 🚀 Getting Started

### 1. Fork the Repository

Click the **Fork** button at the top right of this repository.

---

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
````

---

### 3. Create a Branch

Always create a new branch from `main`:

```bash
git checkout -b feature/your-feature-name
```

Examples:

* `feature/invoice-filtering`
* `fix/wallet-connection-bug`
* `improvement/dashboard-ui`

---

### 4. Make Your Changes

While working on the project, ensure you:

* Follow existing code structure and naming conventions
* Keep code clean and readable
* Write meaningful commit messages
* Maintain UI consistency with the design system
* Ensure compatibility with Cardano wallets (e.g. Lace)

---

### 5. Commit and Push

```bash
git add .
git commit -m "Describe your change clearly"
git push origin feature/your-feature-name
```

---

### 6. Open a Pull Request

* Go to your fork on GitHub
* Click **“Compare & pull request”**
* Clearly describe:

  * What you changed
  * Why it was needed
  * Screenshots (for UI updates)

---

## 🧪 Running the Project Locally

### Frontend

Open directly:

```bash
main.html
```

Or run a local server:

```bash
php -S localhost:8000
```

---

### Backend (PHP + MySQL)

Ensure you have:

* PHP installed
* MySQL running
* Configured `.env` or `config.php`

Example:

```php
$host = "localhost";
$db   = "coxyfi";
$user = "root";
$pass = "";
```

---

### Blockchain / Wallet Integration

* Uses Cardano wallet integration (e.g. Lace)
* Ensure browser wallet is installed
* Use testnet for development

---

## 🧩 Project Structure (Overview)

```
.
├── main.html
├── js/
│   └── app.js
├── api/
│   ├── config.php
│   ├── create_invoice.php
│   ├── fund_invoice.php
│   ├── repay_invoice.php
│   └── ...
├── assets/
├── docs/
└── README.md
```

---

## ✅ Code Guidelines

### General

* Keep functions modular and reusable
* Avoid breaking existing functionality
* Comment complex logic (especially blockchain interactions)

---

### Frontend (JS / HTML)

* Follow consistent UI structure
* Avoid inline JS
* Use clear and unique DOM IDs

---

### Backend (PHP)

* Use prepared statements (PDO)
* Validate all inputs
* Use `.env` for secrets (DO NOT hardcode API keys)
* Return consistent JSON responses

---

### Blockchain / Smart Contracts

* Keep metadata optimized (Cardano limits)
* Avoid large inline data (use hashes/IPFS if needed)
* Test transactions thoroughly before deployment

---

## 🐛 Reporting Issues

If you find a bug:

1. Open a GitHub Issue
2. Include:

   * Description
   * Steps to reproduce
   * Screenshots / console logs

---

## 💡 Feature Requests

We welcome ideas like:

* Invoice risk scoring
* Secondary marketplace for invoices
* Analytics dashboard improvements
* Multi-wallet support

---

## 🤝 Contribution Rules

* Be respectful and constructive
* Keep PRs focused (one feature per PR)
* Discuss major changes via Issues first

---

## 💬 Need Help?

Open an Issue or Discussion.

---

## 🙌 Acknowledgment

Thanks for contributing to **Coxyfi** — building decentralized finance solutions for real-world business liquidity.

````
