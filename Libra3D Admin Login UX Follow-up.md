# Libra3D Admin Login and Request Latency Follow-up

Owner observed slow login, ticket list/detail, and duplicate identical API calls in browser Network panel. On a single ticket view, two identical ticket GETs each took roughly 6 seconds; two identical `/api/auth/me` requests each took roughly 7 seconds. Screenshot initiators point to `tickets.js` and `auth.js`. This is direct evidence of duplicate frontend requests and slow individual responses, but not yet proof of MongoDB as the cause. Calls may overlap, so summed durations are not necessarily sequential user-perceived wait.
Follow up:

*   Inspect React StrictMode/dev effect behavior, duplicate component/provider mounts, useEffect dependencies, and request/cache deduplication. Ensure one logical page load triggers one request per resource; do not merely disable StrictMode as a fix without evaluating consequences.
    
*   Diagnose why each endpoint itself takes seconds. Add privacy-safe timings for backend handler and individual Mongo operations; examine client/pool reuse, server-selection/network delay, queries/indexes, serial calls, and blocking work. Do not log tokens, credentials, user PII, database URIs, or message content.
    
*   Provide immediate UI loading feedback and actionable timeout/network errors; prevent repeated user submits. Do not weaken auth hashing, rate limits, or security to improve perceived speed.
    
*   Test request counts/navigation behavior and benchmark before/after where possible; distinguish development-only duplication from production behavior.