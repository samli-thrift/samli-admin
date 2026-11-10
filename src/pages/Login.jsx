

import { useState } from "react";
import { supabase } from "../supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError("Wrong email or password.");
    setBusy(false);
  };

  return (
    <main className="Admin ad_login">
      <form className="ad_card" onSubmit={submit}>
        <h1>Admin login</h1>
        <label>Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <p className="ad_error">{error}</p>}
        <button className="btn_link" disabled={busy}>{busy ? "Signing in…" : "Log in"}</button>
      </form>
    </main>
  );
}
