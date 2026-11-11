


import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProductForm from "./pages/ProductForm";

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [view, setView] = useState({ page: "list", product: null });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (session === undefined) return null;
  if (!session) return <Login />;

  return (
    <main className="Admin">
      <header className="ad_bar">
        <strong>SamLi Thrift · <span>Admin</span></strong>
        <button className="btn_link ghost" onClick={() => supabase.auth.signOut()}>
          Log out
        </button>
      </header>
      {view.page === "list" ? (
        <Dashboard onEdit={(product) => setView({ page: "form", product })} />
      ) : (
        <ProductForm
          product={view.product}
          onDone={() => setView({ page: "list", product: null })}
        />
      )}
    </main>
  );
}
