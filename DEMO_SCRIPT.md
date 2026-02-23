# Demo Script — Ethereum Canonical Registry

**Runtime:** ~3.5 min  
**Audience:** Developers / protocol builders  
**Setup before recording:**
- Local node running with test tokens minted
- Web app running at `localhost:3000`
- Wallet connected to local network with test tokens
- A GitHub account with admin access to at least one repo

---

## Scene 1 — The problem (45s)

> Narrate over a blank browser or the homepage.

"Most open-source projects have no Ethereum address. If a protocol wants to fund `ethereum/go-ethereum`, it needs the maintainers to register first — which they haven't. This registry solves that."

"ENS gets you close — but it requires the owner to register a name before anything resolves. If the maintainers haven't touched Ethereum yet, there's nothing to send to."

"Drips solves this for GitHub specifically — it reads a `FUNDING.json` file from the repo via an oracle and pre-funds a counterfactual address. But it's GitHub-only, the address derivation is Drips-specific, and every upstream protocol has to know about Drips to use it. This registry generalises the same idea: any namespace, any verifier, and the deposit address is a plain Ethereum address that any protocol can transfer tokens to without knowing the registry exists."

---

## Scene 2 — Resolve any identifier (45s)

1. Open `localhost:3000`
2. Type `ethereum/go-ethereum` in the input, click **Resolve**
3. Point out:
   - The **deposit address** — deterministic, derived before anyone has claimed
   - **Owner: Unclaimed** — the amber dot and message
   - **Balance: 0 DAI** (no funds yet)

> "This address exists right now, on-chain, even though nobody from the Ethereum Foundation has ever touched this site."

---

## Scene 3 — Fund the identifier (45s)

1. Enter `10` in the amount field, click **Send**
2. Confirm the transaction in the wallet popup
3. Wait ~3s for the balance to refresh
4. Show the balance now reads **10 DAI**

> "Anyone can send tokens here — no registry interaction, no coordination with the maintainer. Just a standard ERC-20 transfer."

---

## Scene 4 — Prove and claim ownership (45s)

1. Navigate to `/prove`
2. **GitHub flow:**
   - Click **Connect with GitHub**, complete OAuth
   - Select your demo repo from the list
   - Click **Generate proof** — show the signed proof bytes appear
   - Click **Claim on-chain**, confirm in wallet
3. Go back to `/` and resolve the same identifier
4. Show **Owner** is now your wallet address

> "The owner proves GitHub admin access via OAuth. The backend signs a proof. The contract verifies the signature — no trust beyond the signing key."

---

## Scene 5 — Withdraw funds (15s)

1. With the identifier still resolved, scroll to the **Withdraw** row
2. Click **Withdraw to owner**, confirm in wallet
3. Show the balance drops to **0 DAI**

> "Anyone can call withdraw — funds always go to the registered owner, not the caller. A keeper or frontend can sweep on the owner's behalf."

---

## Closing (15s)

> "One registry, deployed once per chain. Any protocol can address any identifier before the owner exists on-chain. The owner claims whenever they're ready."

Point to the repo URL / docs site.
