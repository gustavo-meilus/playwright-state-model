# Security Policy

## Supported Versions

We actively support security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not** open a public issue. Instead, please report it via one of the following methods:

1. **Email**: [INSERT YOUR EMAIL]
2. **GitHub Security Advisory**: Use the [Security tab](https://github.com/gustavo-meilus/playwright-state-model/security/advisories/new) in the repository

Please include the following information in your report:

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if any)

We will acknowledge receipt of your report within 48 hours and provide an update on the status of the vulnerability within 7 days.

## Security Best Practices

When using this library:

- Always keep your dependencies up to date
- Review the peer dependencies (`@playwright/test` and `xstate`) for their own security advisories
- Never commit sensitive data (API keys, passwords, etc.) in your test code
- Use environment variables for configuration secrets

## Disclosure Policy

- Security vulnerabilities will be disclosed after a fix has been released
- We will credit security researchers who responsibly disclose vulnerabilities
- Critical vulnerabilities will be patched and released as soon as possible

