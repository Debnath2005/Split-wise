# 0015. Settle up through a UPI deep link, recorded on trust

- **Status:** Accepted
- **Date:** 2026-10-01

## Context
Indian users pay each other by UPI. A payment gateway needs merchant KYC, fees and webhooks, which is too much for an MVP.

## Decision
- **Mobile:** open `upi://pay?pa=&pn=&am=&cu=INR&tn=`, built in `src/lib/money/upi.ts`.
- **Desktop:** show the same URI as a QR code.
- After the user comes back and confirms, call `record_settlement(method='upi')`. Cash payments can be recorded directly.
- The payee's VPA is optional profile data, validated by regex. We also provide a copy-VPA fallback.

## Consequences
- ➕ No fees or gateway, and it works with any UPI app.
- ➖ Payments can't be verified, so the record depends on trust. The UI says so.
- ➖ Some UPI apps restrict P2P intent links.

## Alternatives considered
- **A payment gateway (Razorpay, etc.):** verifiable, but needs KYC, fees and a webhook server.
