# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Security Scope

This MCP server is designed for **trusted network environments** (localhost, LAN, VPN). It does NOT include built-in authentication or rate limiting by design - these are expected to be provided by a reverse proxy layer.

### Known Limitations

1. **No Built-in Authentication**: The `/mcp` endpoint has no authentication by default
2. **No Rate Limiting**: API abuse prevention must be implemented upstream
3. **Binds to 0.0.0.0**: Required for cross-platform compatibility (WSL2 ↔ Windows)
4. **No HTTPS**: Expects HTTPS termination at reverse proxy

## Production Deployment Best Practices

### ⚠️ DO NOT expose directly to the Internet without

1. **Reverse Proxy with Authentication**

   ```nginx
   location /mcp {
     auth_request /auth;
     proxy_pass http://localhost:3000/mcp;
   }
   ```

2. **Rate Limiting**

   ```nginx
   limit_req_zone $binary_remote_addr zone=mcp:10m rate=10r/s;
   limit_req zone=mcp burst=20;
   ```

3. **HTTPS Enforcement**

   ```nginx
   ssl_certificate /path/to/cert.pem;
   ssl_certificate_key /path/to/key.pem;
   ```

4. **Network Isolation**
   - Use firewall rules to restrict access
   - Deploy in private VPC/subnet
   - Use VPN for remote access

### Recommended Architecture

```text
Internet → Cloudflare/CDN → Nginx (HTTPS + Auth + Rate Limit) → MCP Server (localhost:3000)
```

## Security Features (v1.0)

### Implemented Protections

- ✅ **Path Traversal Prevention**: URL decoding + validation
- ✅ **ReDoS Protection**: Query length limit (500 chars)
- ✅ **Input Validation**: PORT range check (1-65535)
- ✅ **Type Safety**: No `as any` casts, strict TypeScript
- ✅ **Request Size Limit**: 10MB body-parser limit
- ✅ **Soft Delete**: Files moved to trash by default

### Threat Model

**In Scope**:

- Path traversal attacks
- ReDoS (Regular Expression Denial of Service)
- API abuse via malformed inputs
- Accidental data loss

**Out of Scope** (User Responsibility):

- Authentication/authorization
- Rate limiting
- HTTPS/TLS encryption
- DDoS protection
- Network-level security

## Reporting a Vulnerability

**DO**:

- Email security issues to the maintainer (see GitHub profile)
- Provide detailed reproduction steps
- Allow 90 days for fix before public disclosure

**DON'T**:

- Open public GitHub issues for security vulnerabilities
- Exploit vulnerabilities in production systems
- Test on systems you don't own

### Response Timeline

- **Initial Response**: 48 hours
- **Fix Timeline**: 7-30 days (depending on severity)
- **Public Disclosure**: After fix is released + 14 days

### Severity Levels

- **Critical**: RCE, authentication bypass, data exfiltration
- **High**: Path traversal, DoS, privilege escalation
- **Medium**: Information disclosure, ReDoS
- **Low**: Error message leaks, minor input validation

## Security Checklist for Deployment

Before deploying to production:

- [ ] Review and understand threat model (trusted network only)
- [ ] Configure reverse proxy with authentication
- [ ] Enable HTTPS/TLS
- [ ] Set up rate limiting
- [ ] Configure firewall rules
- [ ] Use non-root user for server process
- [ ] Enable logging and monitoring
- [ ] Set up alerting for suspicious activity
- [ ] Rotate Obsidian API keys regularly
- [ ] Review `.env` file is gitignored
- [ ] Test security controls (auth bypass, path traversal)

## Vulnerability History

### v1.0 (2025-11-04)

**Fixed**:

- Path traversal via URL encoding bypass
- ReDoS potential with unbounded regex
- Missing PORT validation

**Outstanding** (Accepted Risk for Trusted Network Scope):

- No built-in authentication (use reverse proxy)
- No rate limiting (use nginx/cloudflare)
- Binds to 0.0.0.0 (required for WSL2 compatibility)

---

**Last Updated**: 2025-11-06
**Maintained by**: Community + Claude (AI Assistant)
**License**: MIT
