import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

Click **Commit new file**.

---

### Step 6 — Add your app component as `src/App.jsx`

Click **Add file → Create new file**. Name it `src/App.jsx`. Copy the **entire contents** of your `notebook-ui.jsx` from the `eln` repo and paste it here.

Click **Commit new file**.

---

### Step 7 — Fix Vercel's build settings

Go to **vercel.com → your `eln-deploy` project → Settings → General**. Scroll to **Build & Development Settings** and confirm these are set:

| Setting | Value |
|---|---|
| Framework Preset | **Vite** |
| Build Command | `vite build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

Save if you changed anything.

---

### Step 8 — Trigger a redeploy

Go to **Vercel → your project → Deployments**, click the three dots on the latest deployment, and hit **Redeploy**. Or just make any small edit to a file in `eln-deploy` — Vercel will pick it up automatically.

---

Your final `eln-deploy` repo structure should look like this before Vercel builds:
```
eln-deploy/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx
    └── App.jsx
