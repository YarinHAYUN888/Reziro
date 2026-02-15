
  # Get's New CRM MODEL

  This is a code bundle for Get's New CRM MODEL. The original project is available at https://www.figma.com/design/2T8tJfg2ugdvz2UQCNfv5O/Get-s-New-CRM-MODEL.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Deploying to Netlify (with Supabase)

  For data to save to Supabase from your Netlify URL, set these **Environment variables** in Netlify (Site settings → Environment variables), then trigger a new deploy:

  - `VITE_SUPABASE_URL` = your Supabase project URL (e.g. `https://xxxx.supabase.co`)
  - `VITE_SUPABASE_ANON_KEY` = your Supabase anon/public key

  Vite bakes these in at **build time**, so they must be set in Netlify before the build runs. After adding them, redeploy the site.
  