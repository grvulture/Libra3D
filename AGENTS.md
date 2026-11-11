Project directory: /home/grvulture/projects/libra3d

Dependencies/services installed: Python venv + pip packages from backend/requirements.txt except unavailable emergentintegrations (not imported by [server.py](http://server.py/)); Node modules via npm install --legacy-peer-deps; added ajv@8.11.0 dev dependency for Node 24 compatibility. MongoDB is required by source; using the provided Atlas connection via backend/.env (no local DB installed).

Start backend:

cd ~/projects/libra3d/backend && ./venv/bin/uvicorn server:app --host 127.0.0.1 --port 8000

Start frontend:

cd ~/projects/libra3d/frontend && npm start

Preview URLs: frontend [http://localhost:3000](http://localhost:3000/), backend [http://localhost:8000/api/](http://localhost:8000/api/)

Notes: env vars needed are MONGO\_URL, DB\_NAME, CORS\_ORIGINS; frontend needs no backend API URL. Backend currently running and verified against Mongo.

`backend/.env`** contains credentials and must not be committed or shared**.

\# Libra3D project context


\#\# Current state

- The frontend is currently a showcase/vitrine; backend-powered features are not yet connected.

- The backend uses MongoDB. Development is configured to use MongoDB Atlas through \`backend/.env\`.

- Do not commit, print, or share secrets from \`backend/.env\`.


\#\# Setup notes

- Backend Python dependencies are installed in \`backend/venv\`, except \`emergentintegrations\`, which was unavailable and is not imported by \`server.py\`.

- Frontend dependencies were installed with \`npm install --legacy-peer-deps\`.

- \`ajv@8.11.0\` was added as a dev dependency for Node 24 compatibility.


\#\# Run locally

Backend:

\`\`\`bash

cd ~/projects/libra3d/backend

./venv/bin/uvicorn server:app --host 127.0.0.1 --port 8000


Frontend, in a separate terminal:

cd ~/projects/libra3d/frontend

npm start


Frontend: http://localhost:3000  
Backend API: [http://localhost:8000/api/](http://localhost:8000/api/)


\#\# Environment  
The backend expects MONGO\_URL, DB\_NAME, and CORS\_ORIGINS in its environment. Keep credentials out of documentation and version control.

## Internationalization plan
- Current implementation uses a custom `LocaleContext` + `frontend/src/data/translations.js` (flat dotted keys, Greek/EUR default, coupled currency formatting).
- Keep this for the current Greek + English scope.
- Migrate to `react-i18next` when adding a third language (e.g. German), to benefit from tooling, lazy loading, pluralization, and translator workflows. Consider French/Spanish only later.
