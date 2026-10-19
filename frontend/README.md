# Maison fashion store

A React storefront and admin workspace for a fashion shop. Customers can browse published products, sign in, manage an account-specific shopping bag, place cash-on-delivery orders, and review their own order history. Administrators manage products, inventory, and order fulfillment.

## Run locally

1. Install dependencies with `npm install` from this directory.
2. Copy `.env.example` to `.env.local` and provide the Firebase web app configuration.
3. Configure the server-only Firebase Admin credentials and ImgBB key in the local environment when using admin product/image APIs.
4. Enable Email/Password sign-in in Firebase Authentication and create a Firestore database. Deploy the root `firestore.rules`.
5. Grant administrator accounts the Firebase custom claim `admin: true` using a trusted server-side process.
6. Start the Vite development server with `npm run dev`; use `npm run vercel:dev` to run the API functions locally through Vercel.

For production, configure the same variables in the hosting provider. Never expose Firebase Admin credentials or the ImgBB API key through `VITE_` variables. The API verifies Firebase ID tokens, derives the customer account from the verified identity, and calculates order prices and stock changes on the server.

## Checks

- `npm run lint`
- `npm run build`
