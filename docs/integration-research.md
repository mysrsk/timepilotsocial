# Publishing Integration Research

## Official capability findings

| Platform | Confirmed publishing approach | Important SaaS constraints |
| --- | --- | --- |
| Instagram | Meta Content Publishing API creates a media container then publishes it to an Instagram professional account. | Requires a Meta login flow, appropriate publishing permissions, and publicly accessible media at publish time. Instagram accounts are subject to API publishing limits, so the product must enforce per-account safeguards. |
| Facebook | Meta’s publishing ecosystem requires an authorized business integration and page-level permission model. | The connection layer must retain token health and authorization state without exposing raw credentials to the browser. |
| LinkedIn | LinkedIn Posts API can create organic text, image, video, document, multi-image, poll, and article content. | The current API requires version headers and appropriate member or organization publishing permission. Some scopes require platform approval. |
| X | The product will use an adapter boundary for X publishing pending the customer’s X developer application and chosen API access tier. | Capability and commercial terms must be confirmed against the developer account before enabling production publishing. |

## Implementation implications

TimePilot stores planned instants as UTC timestamps alongside the user-selected IANA zone and local-wall-time intent. The application delegates offset and daylight-saving-time resolution to the IANA time-zone database in the runtime, rather than storing manual UTC offsets. Scheduled publishing must be idempotent; a job will claim a due post atomically, publish through a platform adapter, persist an auditable attempt record, and create an in-app notification for success or failure.

## Sources

1. [Meta Content Publishing documentation](https://developers.facebook.com/documentation/instagram-platform/content-publishing)
2. [LinkedIn Posts API documentation](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?view=li-lms-2026-07)
