# VPN Application

This is a secure VPN application built with React Native and Express.js.

## Features

- License key validation
- Stripe payment integration
- VPN server connection simulation
- Cross-platform support (Web, iOS, Android)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Add your Stripe secret key and webhook secret

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Start the backend server:
   ```bash
   npm run server
   ```

## Testing

Use these test license keys:
- `TEST-1234-ABCD-5678` (valid)
- `TEST-5678-EFGH-9012` (expired)

For Stripe testing, use these card numbers:
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002

## License

MIT