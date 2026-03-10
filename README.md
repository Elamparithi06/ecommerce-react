# NovaCart eCommerce (React + JavaScript + Tailwind + Express API)

Complete eCommerce app with:
- Home, Shop, Product Details, Cart, Checkout, 404
- Search, filter, sort, and category browsing
- Cart persistence with `localStorage`
- Express backend API (`/api/products`, `/api/products/:id`, `/api/health`)
- Pluggable catalog providers (`mock`, `fakestore`, `backend -> amazon/mock`)

## Tech Stack
- React
- React Router
- Tailwind CSS
- Vite
- Express

## Run Locally
```bash
npm install
```

Terminal 1 (backend):
```bash
npm run server
```

Terminal 2 (frontend):
```bash
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Deploy: Vercel + Render
Use `Vercel` for the frontend and `Render` for the Express API.

### 1. Push this project to GitHub
```bash
git init
git add .
git commit -m "Prepare full-stack deployment"
git branch -M main
git remote add origin https://github.com/<your-user>/<your-repo>.git
git push -u origin main
```

### 2. Deploy the backend to Render
This repo includes `render.yaml`, so Render can create the API service from the repo directly.

In Render:
- New + -> Blueprint
- Select this GitHub repo
- Confirm the `novacart-api` web service

Set these backend environment values:
```bash
CLIENT_ORIGIN=https://<your-frontend>.vercel.app
FREEAPI_FALLBACK_TO_MOCK=true
OMKAR_COUNTRY_CODE=IN
OMKAR_DEFAULT_QUERY=best sellers
OMKAR_FALLBACK_TO_FREEAPI=true
OMKAR_MAX_PAGES=50
OMKAR_CACHE_TTL_MS=180000
AMAZON_FALLBACK_TO_MOCK=true
```

Optional if you want live Amazon-scraped data:
```bash
OMKAR_API_KEY=your_key_here
```

After deploy, verify:
```bash
https://<your-render-service>.onrender.com/api/health
```

### 3. Deploy the frontend to Vercel
This repo includes `vercel.json` so client-side React routes work after refresh.

In Vercel:
- Add New -> Project
- Import the same GitHub repo
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

Set these frontend environment values:
```bash
VITE_PRODUCT_PROVIDER=backend
VITE_API_BASE_URL=https://<your-render-service>.onrender.com
VITE_BACKEND_CATALOG_PROVIDER=freeapi
VITE_BACKEND_CATALOG_LIMIT=5000
```

### 4. Final wiring
Once Vercel gives you the production URL, update `CLIENT_ORIGIN` in Render to that exact URL and redeploy the backend if needed.

If you later attach a custom domain, update:
- Render `CLIENT_ORIGIN`
- Vercel `VITE_API_BASE_URL` if your backend domain changes

## Frontend Env Configuration
Create a `.env` file from `.env.example` and set:

```bash
VITE_PRODUCT_PROVIDER=backend
VITE_API_BASE_URL=http://localhost:4000
VITE_BACKEND_CATALOG_PROVIDER=freeapi
```

`VITE_PRODUCT_PROVIDER`:
- `backend`: Uses this project's Express API (recommended)
- `mock`: Uses frontend local dataset directly
- `fakestore`: Uses public Fake Store API directly

`VITE_BACKEND_CATALOG_PROVIDER`:
- `freeapi`: Uses free APIs (DummyJSON products + JSONPlaceholder reviews)
- `omkar`: Uses omkar.cloud Amazon scraper API (free tier 1,000 req/month)
- `mock`: Backend returns local catalog
- `amazon`: Backend fetches your configured Amazon upstream and maps response

## Backend Env Configuration
Create `server/.env` from `server/.env.example`:

```bash
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
AMAZON_API_BASE_URL=
AMAZON_PRODUCTS_PATH=/products
AMAZON_ACCESS_TOKEN=
AMAZON_API_KEY=
AMAZON_FALLBACK_TO_MOCK=true
OMKAR_API_KEY=
OMKAR_COUNTRY_CODE=US
OMKAR_DEFAULT_QUERY=best sellers
OMKAR_FALLBACK_TO_FREEAPI=true
```

## Amazon Integration
Amazon does not provide a fully open free public catalog API.
This project includes an Amazon-ready backend adapter:
- Set `VITE_BACKEND_CATALOG_PROVIDER=amazon`
- Configure `server/.env` with your Amazon-compatible upstream endpoint/credentials
- Backend maps upstream response into NovaCart product format
- If upstream fails and `AMAZON_FALLBACK_TO_MOCK=true`, mock products are returned

## Omkar Integration (What You Should Do)
1. Create `server/.env` from `server/.env.example`
2. Add your key:
   - `OMKAR_API_KEY=your_key_here`
3. In frontend `.env` set:
   - `VITE_PRODUCT_PROVIDER=backend`
   - `VITE_BACKEND_CATALOG_PROVIDER=omkar`
4. Start both servers:
   - `npm run server`
   - `npm run dev`
