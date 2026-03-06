# WorldFirst MCP Server

MCP server that gives AI agents access to WorldFirst cross-border payment APIs. Built for the [Model Context Protocol](https://modelcontextprotocol.io).

## What it does

Lets any MCP-compatible AI agent (Claude, OpenAI, LangChain, etc.) autonomously:

- **Check balances** across 20+ currencies in your World Account
- **Get FX quotes** and **lock rates** for cross-currency payments
- **Manage suppliers** — add, list, and verify beneficiaries
- **Make payments** — send CNY to Chinese suppliers with same-day settlement
- **Pull statements** — transaction history for reconciliation and auditing

## Tools

| Tool | Description |
|---|---|
| `check_balance` | Query World Account balances by currency |
| `get_fx_rate` | Get indicative FX rate (informational) |
| `get_fx_quote` | Get tradeable FX quote with price and expiry |
| `lock_fx_rate` | Accept a quote and lock the rate |
| `list_beneficiaries` | List saved suppliers/payees |
| `add_beneficiary` | Register a new supplier for payments |
| `verify_supplier` | Verify supplier bank account against business registration |
| `create_payment` | Send payment to a registered beneficiary |
| `check_payment_status` | Track payment settlement status |
| `get_statement` | Pull transaction history with date/currency filters |

## Setup

### 1. Get WorldFirst API credentials

Contact WorldFirst to get:
- **Client ID** — your partner identifier
- **RSA key pair** — generate locally, share public key with WorldFirst

```bash
# Generate RSA key pair
openssl genrsa -out private_key.pem 2048
openssl rsa -in private_key.pem -pubout -out public_key.pem
# Send public_key.pem to WorldFirst Technical Support
```

### 2. Install

```bash
npm install worldfirst-mcp-server
```

### 3. Configure in Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "worldfirst": {
      "command": "npx",
      "args": ["worldfirst-mcp-server"],
      "env": {
        "WORLDFIRST_CLIENT_ID": "your_client_id",
        "WORLDFIRST_PRIVATE_KEY": "-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----",
        "WORLDFIRST_ENVIRONMENT": "sandbox",
        "WORLDFIRST_REGION": "sg"
      }
    }
  }
}
```

### 4. Configure in Claude Code

```bash
claude mcp add worldfirst -- npx worldfirst-mcp-server
```

Set environment variables:
```bash
export WORLDFIRST_CLIENT_ID=your_client_id
export WORLDFIRST_PRIVATE_KEY="$(cat private_key.pem)"
export WORLDFIRST_ENVIRONMENT=sandbox
export WORLDFIRST_REGION=sg
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `WORLDFIRST_CLIENT_ID` | Yes | — | Your WorldFirst Client ID |
| `WORLDFIRST_PRIVATE_KEY` | Yes | — | RSA private key (PEM format) |
| `WORLDFIRST_ENVIRONMENT` | No | `sandbox` | `sandbox` or `production` |
| `WORLDFIRST_REGION` | No | `sg` | `sg`, `eu`, or `us` |

## Example: AI agent pays a Chinese supplier

```
Agent: "Pay our Shenzhen electronics supplier $5,000 USD worth of CNY"

1. check_balance(currency: "USD")           → $12,450 available
2. get_fx_quote(sell: "USD", buy: "CNY")    → 1 USD = 7.24 CNY, expires in 30s
3. lock_fx_rate(quote_id: "Q123")           → Rate locked
4. verify_supplier(beneficiary_id: "B456")  → Verified ✓
5. create_payment(amount: "36200.00",
     currency: "CNY", beneficiary: "B456",
     quote: "Q123")                          → Payment initiated
6. check_payment_status(payment: "P789")    → Settled (same-day)
```

## Development

```bash
git clone <repo>
cd worldfirst-mcp-server
npm install
npm run dev    # Run with tsx (hot reload)
npm run build  # Compile TypeScript
```

## License

MIT
