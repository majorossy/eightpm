# Production Security Checklist

Items below are intentional development choices that must be hardened before any production deployment.

## Authentication & Access Control

- [ ] **Enable Magento 2FA** — Currently disabled for dev convenience. Enable `Magento_TwoFactorAuth` module
- [ ] **Change admin credentials** — Replace `john.smith` / `password123` with strong unique credentials
- [ ] **Reduce auth token lifetime** — `magentoAuth.ts:24` sets 30-day expiry; reduce to 7 days max
- [ ] **Migrate customer auth to httpOnly cookies** — Currently stored in localStorage, vulnerable to XSS token theft

## Database & Service Credentials

- [ ] **MySQL** — Replace default `magento`/`magento` credentials in `env/db.env`
- [ ] **Redis/Valkey** — Add `requirepass` authentication (currently open on port 6380)
- [ ] **RabbitMQ** — Replace default credentials in `env/rabbitmq.env`
- [ ] **OpenSearch** — Enable security plugin (currently runs without authentication on port 9201)

## TLS & Transport Security

- [ ] **Remove `NODE_TLS_REJECT_UNAUTHORIZED=0`** — In `frontend/.env.local`; needed for self-signed dev certs but disables all TLS verification
- [ ] **Use real TLS certificates** — Replace self-signed dev cert with CA-signed certificate

## Exposed Services

- [ ] **Disable phpMyAdmin** — Remove from `compose.dev.yaml` or don't include in production compose
- [ ] **Disable Mailcatcher** — Dev-only email capture; remove for production
- [ ] **Disable RabbitMQ Management UI** — Port 15673 exposes admin interface without network restrictions

## Application Configuration

- [ ] **Set Magento to production mode** — Currently in developer mode (`bin/magento deploy:mode:set production`)
- [ ] **MCP server credentials** — Move hardcoded connection strings in `mcp/*/` to environment variables
- [ ] **CSP headers** — `unsafe-eval` is now dev-only (auto-excluded in production build); verify with `npm run build`

## Monitoring

- [ ] **Review log verbosity** — Debug mode logging may expose sensitive data in production
- [ ] **Set up error alerting** — Exception logs should trigger alerts, not sit in files
