# CommunityERP Super Admin Portal

Vercel-compatible demo for the supplied CommunityERP login and OTP screens.

## Included
- Super Admin login screen
- Generate OTP API
- 6-digit OTP verification screen
- Resend OTP countdown
- OTP verification backend
- Simple authenticated dashboard
- Responsive UI
- No external database required for the demo

## API
- `POST /api/generate-otp` with `{ "identifier": "admin@communityerp.com" }`
- `POST /api/verify-otp` with `{ "otp": "123456", "verificationToken": "..." }`

For this demo the generated OTP is returned to the frontend so the flow can be tested without an email/SMS provider. For production, replace this with a real email/SMS service and persistent session storage.

## Deploy
Upload this project to GitHub and import the repository into Vercel. Add an optional environment variable:
`OTP_SECRET=<long-random-secret>`

The project intentionally uses plain HTML/CSS/JavaScript plus Vercel serverless functions so it can be deployed quickly without a build step.
