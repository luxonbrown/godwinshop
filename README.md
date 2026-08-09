# GodwinShop

Full-stack commercial e-commerce platform — React frontend, Express REST API, MySQL database.

## Tech stack

- **Client** — React 18, React Router, Tailwind CSS, Vite, Lucide icons (`client/`)
- **Server** — Node.js / Express, session-based auth (express-session + express-mysql-session), MySQL via mysql2, multer uploads (`server/`)
- **Database** — MySQL schema and sample data in `database/schema.sql` and `server/src/seeds/`

## Project structure

```
godwinshop/
├── client/              # React (Vite) frontend
│   ├── src/
│   │   ├── components/  # Reusable UI (ProductCard, Modal, Spinner, ...)
│   │   ├── context/     # Auth, Cart, Theme, Toast
│   │   ├── pages/       # Home, Products, Cart, Checkout, admin pages, ...
│   │   ├── hooks/       # useApi, useDebounce, useDocumentTitle, ...
│   │   ├── layouts/     # Navbar, Footer, MainLayout, AdminLayout
│   │   └── utils/       # format helpers, constants
│   └── dist/            # Build output (gitignored)
├── server/              # Express REST API
│   └── src/
│       ├── config/      # env + database + session config
│       ├── controllers/ # Route handlers
│       ├── middleware/  # auth, validation, error handling, uploads
│       ├── migrations/  # DB schema runner
│       ├── routes/      # API endpoints
│       ├── seeds/       # sample data
│       ├── services/    # email, notifications
│       └── server.js    # entry point
├── database/schema.sql  # Reference SQL schema (migrations also auto-apply)
└── server/.env.example  # Environment template (copy -> server/.env)
```

## Prerequisites

- Node.js >= 18
- MySQL (local instance, or a reachable MySQL host)

## Getting started

```bash
# 1. Install dependencies
npm install                 # root (concurrently)
npm --prefix server install
npm --prefix client install

# 2. Configure environment
cp server/.env.example server/.env   # then edit server/.env with your MySQL credentials

# 3. Create the database + tables (creates DB 'godwinshop' if it doesn't exist)
npm run setup

# 4. (Optional) Seed default admin + sample products
npm run seed

# 5. Run everything (server on :5000, client on :5173)
npm run dev
```

Open http://localhost:5173

## Available scripts (root)

| Script            | Action                                              |
| ----------------- | --------------------------------------------------- |
| `npm run dev`     | Run server + client together (concurrently)         |
| `npm run dev:server` | Run only the Express API (nodemon)               |
| `npm run dev:client` | Run only the React client (Vite)                 |
| `npm run setup`   | Apply DB migrations (creates schema + tables)       |
| `npm run seed`    | Insert default admin + sample products              |
| `npm run build`   | Build the React client for production               |
| `npm start`       | Start the API in production mode                    |

## Environment variables

All configuration lives in `server/.env` (copied from `server/.env.example`). Never commit the real `.env` — it is gitignored.

| Variable                | Description                                        | Default                        |
| ----------------------- | -------------------------------------------------- | ------------------------------ |
| `PORT`                 | Server port                                        | `5000`                         |
| `NODE_ENV`             | `development` / `production`                        | `development`                  |
| `CLIENT_URL`           | CORS origin for the React app                       | `http://localhost:5173`        |
| `DB_HOST` / `DB_PORT`  | MySQL host / port                                   | `localhost` / `3306`           |
| `DB_NAME` / `DB_USER` / `DB_PASSWORD` | MySQL database / user / password    | `godwinshop` / `root` / —      |
| `SESSION_SECRET`       | Long random secret for sessions                     | (set via `.env`; server warns otherwise)  |
| `ADMIN_*`              | Default admin used by `npm run seed`                |                              |
| `EMAIL_*`              | SMTP settings (empty = dev verification mode)       | —                              |
| `MAX_UPLOAD_SIZE_MB`   | Upload limit for product images                     | `5`                            |

## Security

- `server/.env` is gitignored — real secrets are never committed.
- Passwords are hashed with bcrypt; sessions are stored in MySQL.
- Role-based routes protect admin-only endpoints on the server.

## License

Private project — all rights reserved.