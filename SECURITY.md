# Security Policy

## Supported Versions

Only the latest **major version** of CmpStr is actively supported with security updates.

| Version | Supported |
| ------- | --------- |
| 3.2.x   | ✅ Yes     |
| < 3.2   | ❌ No      |

If you are using an unsupported version, please upgrade before reporting a security issue.

## Reporting a Vulnerability

If you discover a potential security vulnerability in CmpStr, please report it **privately and responsibly**.

- **Do not** open a public GitHub issue for security-related reports.
- Send your report via **GitHub Security Advisories** or contact the maintainer directly.

Your report should include, if possible:

- A clear description of the issue
- Affected versions
- Steps to reproduce or a minimal proof of concept
- Potential impact assessment

## Disclosure Process

- Reports will be reviewed as soon as reasonably possible.
- Valid vulnerabilities will be acknowledged and investigated.
- If confirmed, a fix will be prepared and released.
- Coordinated disclosure is preferred; public disclosure should wait until a fix is available.

## Scope

The security policy applies to:

- The core CmpStr library
- Official builds and published npm packages

The following are **out of scope**:

- Usage errors or misconfiguration
- Vulnerabilities in third-party software or user code
- Performance issues or algorithmic complexity concerns unless they lead to a denial-of-service risk

## Security Design Notes

CmpStr is a dependency-free library and does not perform any network, filesystem, or process-level operations. Its primary attack surface is limited to input handling and algorithmic behavior.

Nevertheless, issues such as excessive resource consumption, unexpected crashes, or malformed input handling are treated seriously if they pose a security risk.

---

Thank you for helping to keep CmpStr safe and reliable.
