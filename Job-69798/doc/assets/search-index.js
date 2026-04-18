window.MANUAL_INDEX = [
  {
    "title": "Welcome to the CoxyInsure User Manual",
    "url": "index.html",
    "keywords": " PLACEHOLDER: CoxyInsure Logo / Banner Author: CoxyInsure Product & Support Team Last Updated: April 15, 2026 CoxyInsure is a Cardano-based DeFi insurance dApp that combines membership identity, capital pooling, cover purchase, claim submission, community voting, and administrator review into one coordinated platform. This manual is meant to help new users enter the system with confidence and help existing users understand the full lifecycle of liquidity provision, policy management, and claims governance. The guide is arranged in the same order that most users encounter the product: public landing page, wallet connection, membership, pools, buy cover, claims, governance, history, and the admin monitoring layer. 💡 Tip: Use the navigation panel on the left to move chapter by chapter, or open the search box at the top and search keywords like wallet , membership , deposit , cover , claim ,"
  },
  {
    "title": "Get Started",
    "url": "getting-started.html",
    "keywords": " Before using CoxyInsure, make sure you have three things ready: a supported browser, a supported Cardano wallet extension, and access to the correct user account that matches your intended wallet address. 2.1 Before You Begin Use a modern desktop browser such as Chrome, Edge, or Brave. Install a Cardano wallet extension supported by your dApp setup, such as Lace. Keep your wallet seed phrase private and never paste it into the dApp. Ensure you are signing in with the correct application account before connecting a wallet. 2.2 Typical First-Time User Flow Open the public landing page. Click Learn More for guidance or Launch App to begin using the protocol. Sign in or register if your deployment requires account authentication. Connect your wallet. Verify or bind the correct wallet to your account. Mint membership if required. Choose whether to provide liquidity, buy cover, or both. 2.3 C"
  },
  {
    "title": "Connect Wallet and Verify Access",
    "url": "connect-wallet.html",
    "keywords": " Wallet connection is the gate between the browser and the Cardano blockchain. In CoxyInsure, connecting a wallet is not only about reading balances. It also determines whether you can submit transactions, mint membership, deposit to pools, buy cover, and participate in governance. 3.1 Connect Wallet Click the Connect Wallet button in the top navigation. Choose your wallet provider. Approve the connection request in the wallet popup. Wait for the UI to refresh and display the connected state. 3.2 Wallet Binding and Verification Some deployments of CoxyInsure use a wallet binding flow. In that flow, the backend checks whether the currently connected wallet matches the wallet approved for the signed-in account. If not, the user may be prompted to sign a nonce-based challenge to establish or confirm wallet ownership. 🔐 Security note: The dApp should never ask for your seed phrase. The only "
  },
  {
    "title": "Membership and Identity",
    "url": "membership.html",
    "keywords": " CoxyInsure uses a membership identity layer to gate protected actions such as pool participation, claims governance, and other trusted protocol actions. Membership acts both as an access token and as a trust signal inside the dApp. 4.1 Why Membership Matters It verifies that the user has completed the protocol’s required onboarding step. It unlocks protected features that should not be available to anonymous visitors. It provides a clear visual status badge in the user interface. 4.2 Minting Membership Open the Membership page from the side navigation. Review the explanatory banner and requirements. Click the mint button. Approve the wallet transaction. Wait for confirmation and refresh the page if the status badge does not update immediately. 4.3 Membership Status Indicators Verified: you can access protected sections and proceed to liquidity or governance actions. Not minted: the dApp"
  },
  {
    "title": "Capital Pools and Deposits",
    "url": "pools.html",
    "keywords": " The Pools page is the liquidity side of the protocol. Here, users deposit ADA into the shared insurance pool, receive pool share representation, and monitor pool-level statistics such as liquidity, claims submitted, claims executed, and total withdrawn value. 5.1 Deposit ADA into the Pool Navigate to the Pools page. Enter the ADA amount you want to deposit. Use the MAX shortcut if you want to fill the input with the available amount shown. Click Deposit ADA . Approve the wallet transaction and wait for confirmation. 5.2 Pool Share Balance After a successful deposit, the dApp updates the user’s share balance and pool share metrics. These values help the user understand how much of the pool they currently represent. 5.3 Withdrawals and Cover Locking 🪙 Important: If a user has an active purchased cover, the protocol may disable withdrawal so the user cannot remove supporting liquidity whil"
  },
  {
    "title": "Buy Cover and Active Cover Tracking",
    "url": "buy-cover.html",
    "keywords": " The Buy Cover page is where the user purchases insurance protection. In your current implementation, cover purchase is based on predefined protocol-specific plans rather than open-ended freeform calculation. 6.1 Cover Purchase Model Minswap uses a fixed duration and tiered coverage ranges. Indigo uses a different fixed duration and its own premium ranges. Liqwid uses the longest duration and corresponding premium tiers. 6.2 How to Buy Cover Open the Buy Cover page. Select a protocol card. Choose a coverage tier from the dropdown menu. Review the automatically displayed premium. Click Purchase Cover . Approve the wallet transaction. The premium is deposited into the pool and the cover purchase is saved in the backend. 6.3 Active Cover Tracking Once purchased, the cover appears in the active cover panel. Cover records typically show protocol, coverage amount, premium amount, status, and e"
  },
  {
    "title": "Submit and Track Claims",
    "url": "claims.html",
    "keywords": " The Claims page allows users to submit a claim against an insured event and track previously submitted documents. This area combines document upload, description capture, on-chain claim transaction handling, and backend record storage. 7.1 Before You Submit a Claim Make sure the wallet has an active or valid cover where required by protocol rules. Prepare a clear supporting document such as an image or PDF. Write a concise claim description explaining the insured event. 7.2 Submit Claim Flow Open the Claims page. Select or upload the evidence document. Enter the claim description and required claim amount details. Submit the claim and approve the blockchain action if requested. Wait for the claim to appear in your submission history. 7.3 Claim History and Documents The page should show the current wallet’s submitted claims, including document name, size, creation date, and a document vi"
  },
  {
    "title": "Governance and Voting",
    "url": "governance.html",
    "keywords": " CoxyInsure uses a governance layer to review submitted claims. This gives the community and the admin team a structured way to approve, reject, or execute payouts after claim review. 8.1 Public Governance Page Users can view pending claims that require community voting. Each pending claim should show claimant information, amount, vote progress, and document details. Claims that reach the threshold move to the ready-for-execution queue. 8.2 Voting on Pending Claims Connect the correct wallet. Open the Governance page. Review the claim amount, claimant identity, and threshold progress. Click the vote button to cast an approval vote. 8.3 Admin Review and Final Actions On the admin governance page, claims that have passed threshold can be executed or rejected. Rejected claims should be removed from the executable queue in public governance. Executed claims should also be excluded from pendi"
  },
  {
    "title": "History and Audit",
    "url": "history.html",
    "keywords": " The history and audit surfaces give users and administrators visibility into what has happened in the protocol. These views are important because blockchain confirmation alone is not enough for a user-friendly operational dashboard. 9.1 User History View recent pool activity. Inspect deposit, withdrawal, cover, and claim-related records. Search by wallet address when supported. 9.2 Audit and Reporting Audit-facing pages can summarize claim submissions, payouts, governance decisions, and other protocol events. They are useful for compliance-style review and support operations. 9.3 What to Look For Transaction hash Use it to verify on-chain actions if needed. Status Watch for submitted, confirmed, rejected, or executed states. Actor wallet Useful for tracing deposits, claims, and admin decisions. Screenshot Placeholder I — History / Audit Page Insert a screenshot showing the recent activi"
  },
  {
    "title": "Admin Portal Overview",
    "url": "admin-portal.html",
    "keywords": " The admin portal is the oversight layer of CoxyInsure. It combines live metrics, cover monitoring, claim review, governance execution, and membership visibility into a centralized management interface. 10.1 Admin Dashboard Review total value locked, total active risk, total members, and payout ratio. Monitor recent activity and active covers. Copy wallet addresses directly from live tables. 10.2 Admin Claims and Governance Claims pages show submitted evidence, descriptions, claim amounts, and current admin review state. Governance pages allow approved admins to execute payouts or reject claims. Reviewer roles can reject claims without executing payouts if your role model permits that separation. 10.3 Membership Oversight The membership page should show registered users, wallet addresses, number of purchased covers, and latest cover deadlines. This helps the admin verify coverage pattern"
  },
  {
    "title": "Help, Safety, and FAQ",
    "url": "help-faq.html",
    "keywords": " 11.1 Safety Rules Never share your seed phrase. Only approve transactions you understand. Check that the connected wallet is the correct one before performing protected actions. Read all confirmation states and logs before retrying a failed action. 11.2 Common Questions Why can’t I deposit or vote? You may need to mint membership first or connect the approved wallet. Why is withdrawal disabled? Your wallet may have an active cover and the system may be locking withdrawal to prevent abuse. Why does my claim not appear? Refresh the page and confirm that both the document upload and the claim transaction completed successfully. Why was a claim removed from governance? It may have been rejected or executed by admin review and therefore filtered from the public queue. 11.3 Support Contacts Email: admin@coxygen.co WhatsApp: +27 73 182 0631 🛠️ If a page behaves unexpectedly, capture a screensh"
  }
];