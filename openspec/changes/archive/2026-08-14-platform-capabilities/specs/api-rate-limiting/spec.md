## Purpose

Protects the CMS API from abuse by enforcing configurable request rate limits per IP, API key, or user, with clear response headers and optional blocking of repeat offenders.

> ❌ **ARCHITECTURE CONFLICT: NOT APPLICABLE — CLIENT-SIDE ONLY**
>
> Rate limiting is a server-side concept requiring a centralized request gateway. In a client-side-only architecture, all data access goes directly through the Firebase client SDK to Firestore. There is no application-level API to rate-limit. Firebase/Firestore has its own built-in rate limiting, quotas, and abuse prevention at the platform level.
>
> **Recommendation:** Remove this capability from the roadmap. If server-side middleware is introduced in the future, this spec should be revisited.

## ADDED Requirements

### Requirement: Rate limits are applied to API routes

The system SHALL track request counts per client identifier within configurable time windows.

#### Scenario: Request counted against limit

- **WHEN** a client sends a request to `/api/collections/posts`
- **THEN** the system increments the request counter for that client's IP address

#### Scenario: Limit exceeded returns 429

- **WHEN** a client exceeds the configured rate limit
- **THEN** the system returns 429 Too Many Requests

#### Scenario: Rate limit headers on every response

- **WHEN** a client sends any API request
- **THEN** the response includes `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers

### Requirement: Rate limits are configurable per route

The system SHALL allow configuring different rate limits for different route groups.

#### Scenario: Public routes have stricter limits

- **WHEN** an admin configures `rateLimit.public: { windowMs: 60000, max: 10 }` and `rateLimit.authenticated: { windowMs: 60000, max: 100 }`
- **THEN** unauthenticated requests allow 10 requests/minute and authenticated allow 100

#### Scenario: Specific routes can be exempted

- **WHEN** a route is added to `rateLimit.exemptRoutes` (e.g., an image transformation endpoint)
- **THEN** that route does not count toward rate limits

### Requirement: Rate limit state is stored persistently

The system SHALL persist rate limit counters so limits survive server restarts.

#### Scenario: Counter persists across restart

- **WHEN** a client makes 5 requests, the server restarts, and the client makes 5 more in the same window
- **THEN** the counter resumes from 5 (not reset to 0)

#### Scenario: Counter expires after the window

- **WHEN** the rate limit window expires
- **THEN** the counter resets to 0

### Requirement: Authenticated clients can have higher limits

The system SHALL apply higher rate limits to authenticated users and API keys, with identity derived from the session or API key header.

#### Scenario: Authenticated user gets higher limit

- **WHEN** an authenticated user sends a request
- **THEN** the rate limit for their user ID is used, which is higher than the anonymous limit

#### Scenario: API key identified requests

- **WHEN** a request includes an `X-API-Key` header
- **THEN** the request is rate-limited by the API key identity, not the IP

### Requirement: Rate limit violations can trigger blocking

The system SHALL optionally block clients who exceed limits repeatedly within a sliding window.

#### Scenario: Auto-block after repeated violations

- **WHEN** a client exceeds the rate limit 3 times within 1 hour
- **THEN** the client is blocked for 24 hours and receives 403 Forbidden on all subsequent requests
