
````markdown
# Contributing to CoxyInsure

Thank you for your interest in contributing to **CoxyInsure**! 🚀  
We welcome contributions from developers, designers, and blockchain enthusiasts looking to improve decentralized insurance on Cardano.

Whether it's fixing bugs, improving UI/UX, enhancing smart contracts, or optimizing backend logic — your help is appreciated.

---

## 🚀 Getting Started

### 1. Fork the Repository

Click the **Fork** button at the top right of this repository to create your own copy.

---

### 2. Clone Your Fork

```bash
(https://github.com/Savissy/coxygen-cardano-haskell-industry-starter-kits.git)
cd coxygen-cardano-haskell-industry-starter-kits
````

---

### 3. Create a Branch

Always create a new branch from `main`:

```bash
git checkout -b feature/your-feature-name
```

Examples:

* `feature/claim-history-ui`
* `fix/voting-bug`
* `improvement/dashboard-stats`

---

### 4. Make Your Changes

While working on the project, ensure you:

* Follow existing code structure and naming conventions
* Keep code clean and readable
* Write meaningful commit messages
* Update UI consistently with the design system
* Maintain compatibility with wallet integrations (e.g. Lace)

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
  * Screenshots (for UI changes)

---

## 🧪 Running the Project Locally

### Frontend

Simply open:

```bash
main.html
```

Or use a local server:

```bash
php -S localhost:8000
```

---

### Backend (PHP + MySQL)

Ensure you have:

* PHP installed
* MySQL running
* Configured `config.php` correctly

Import your database and update credentials:

```php
$host = "localhost";
$db   = "coxyinsure";
$user = "root";
$pass = "";
```

---

### Blockchain / Wallet Integration

* Uses Cardano wallet connection (e.g. Lace)
* Ensure browser wallet is installed
* Test transactions on testnet where applicable

---

## 🧩 Project Structure (Overview)

```
.
├── main.html                 # Dashboard
├── claims.html               # Claims page
├── governance.html           # Voting / DAO page
├── history.html              # Transaction history
├── js/
│   └── new-app.js            # Main frontend logic
├── backend/
│   ├── config.php
│   ├── get_claims.php
│   ├── vote.php
│   ├── log_tx.php
│   └── ...
├── assets/                   # Images, icons
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

* Match UI to design system (dashboard layout)
* Avoid inline JS where possible
* Use clear DOM IDs (no conflicts)

---

### Backend (PHP)

* Use prepared statements (PDO)
* Validate all inputs
* Return consistent JSON responses

---

### Smart Contract / Blockchain

* Keep metadata within Cardano limits
* Avoid large inline data (use hashes/URLs instead)
* Test transactions before committing changes

---

## 🐛 Reporting Issues

If you find a bug:

1. Open a GitHub Issue
2. Include:

   * Description of the issue
   * Steps to reproduce
   * Screenshots or console errors

---

## 💡 Feature Requests

We welcome ideas such as:

* Improved claim validation logic
* DAO-based voting enhancements
* Better analytics dashboard
* Wallet-based identity features

---

## 🤝 Contribution Rules

* Be respectful and constructive
* Keep PRs focused (one feature/fix per PR)
* Large changes should be discussed first via Issues

---

## 💬 Need Help?

Open an Issue or Discussion in this repository.

---

## 🙌 Acknowledgment

Thanks for contributing to **CoxyInsure** — helping build decentralized insurance for the future of Africa and beyond.

```

