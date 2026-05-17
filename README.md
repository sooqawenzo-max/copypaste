# copypast

Dark docs-style publishing site for GameSense Lua scripts and configs, with admin-only posting, profile roles, locked previews, config screenshots, and Vercel Blob storage.

## Local dev

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Default owner account:

- username: `admin`
- password: `dylan1336kuroko`

## Vercel Blob

Create a Private Blob store in Vercel Storage and make sure the project has `BLOB_READ_WRITE_TOKEN`.
The app stores the JSON database at `db/copypast.json` and uploaded files under `files/`.
Config screenshots are stored under `images/`.

Without `BLOB_READ_WRITE_TOKEN`, local dev falls back to `.data/`.
