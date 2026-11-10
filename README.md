
# SamLi Admin

1. `npm create vite@latest samli-admin -- --template react`, then copy these `src/` files over, plus `schema.sql`.
2. `npm i @supabase/supabase-js sass`
3. Copy your `scss/util` folder and `assets/fonts` into `src/scss/` and `src/assets/`.
4. Copy `.env.example` to `.env` and fill in your Supabase URL + anon key.
5. Run `schema.sql` in Supabase, create the public `product-images` bucket, add users under Authentication (disable public sign-ups).
6. `npm run dev`

## Public site: map snake_case to your shape
```js
const { data } = await supabase.from("products").select("*").eq("sold_out", false);
const products = data.map(({ sold_out, ...p }) => ({ ...p, soldOut: sold_out }));
```
