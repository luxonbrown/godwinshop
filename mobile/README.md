# Godwinshop — Android App

Native Android client for Godwinshop, built with **Expo SDK 57** (React Native 0.86, TypeScript, React Navigation v7). It talks to the same production API (`https://godwinshop-api.onrender.com`) and MySQL database as the web store — no new backend code required.

## Features

- Account system: register, email verification, login (cookie session), change password
- Home: greeting, categories, new arrivals, quick links
- Shop: search, sorting (newest / price / name), min–max price filters, infinite scroll, pull-to-refresh
- Categories screen with product counts
- Product detail: image, price + discount, stock, quantity selector, add to cart
- Cart: quantities, remove, delivery fee logic (RWF 2,500, free over RWF 50,000), badge count on tab
- Checkout: delivery details, order creation, verification-aware
- Orders: list with status chips (Pending → Confirmed → … → Delivered), order detail, cancel while pending
- Notifications: unread count badge, list of notifications
- Profile: edit name/phone/address/city, change password, about/contact/how-it-works

Dark theme matches the web store (`#0B0B0B` base, `#F5C400` accent, RWF currency).

## How session auth works

The backend uses HTTP-only cookie sessions (`godwinshop.sid`). The app stores the cookie value in **expo-secure-store** and re-sends it as a `Cookie` header on every request. A `401` clears the stored session and returns the user to the login screen.

## Project structure

```
mobile/
  App.tsx                  Provider + navigation root
  app.json                 Expo config (android.package: com.godwinshop.app)
  eas.json                 EAS build profiles (preview = APK, production = AAB)
  src/
    config/api.ts          Base URL, image URL resolver, delivery fee constants
    lib/http.ts            Fetch wrapper: cookie header, Set-Cookie capture, 401 handling
    lib/secureStorage.ts   SecureStore helpers for session cookie + cached user
    lib/format.ts          RWF money + date formatting
    api/index.ts           Typed client for every backend endpoint
    types/index.ts         Shared TS types (User, Product, Order, …)
    theme/index.ts         Colors + status-label maps
    context/               AuthContext, CartContext
    components/            Button, Field, Loading, EmptyState, ProductCard, …
    navigation/            RootNavigator, TabNavigator, navigation types
    screens/               17 screens
```

## Getting started

```bash
# from the mobile/ folder
npm install

# point the app at a different API (optional)
# copy .env.example to .env and set EXPO_PUBLIC_API_URL
# (defaults to the production API)

# run in Expo Go / web / emulator
npx expo start
```

## Building an Android APK / AAB (EAS)

Requires an Expo account and the API base URL baked in as `EXPO_PUBLIC_API_URL` (EAS injects it from `.env`).

```bash
npx eas-cli login

# debug APK (fastest, for testing)
npx eas-cli build --platform android --profile preview

# store release (Play Store AAB)
npx eas-cli build --platform android --profile production
```

`eas.json` profiles: `development` (dev client), `preview` (`apk`), `production` (`app-bundle`).

## Typecheck & bundle check

```bash
npx tsc --noEmit          # full typecheck
npx expo export --platform android   # verifies Metro can bundle
```

## Notes

- The app talks to the same REST API as `client/`; no server changes were needed.
- Email verification uses the web client's verify page (`CLIENT_SITE_URL/verify?token=…`).
- Placeholder product images fall back to `/uploads/placeholder.svg` on the API.