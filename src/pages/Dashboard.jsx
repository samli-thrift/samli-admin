import { useEffect, useState } from "react";
import { supabase } from "../supabase";

const naira = (n) => `₦${Number(n || 0).toLocaleString("en-NG")}`;

export default function Dashboard({ onEdit }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("products").select("*").order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggleSold = async (p) => {
    await supabase.from("products").update({ sold_out: !p.sold_out }).eq("id", p.id);
    load();
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    await supabase.from("products").delete().eq("id", p.id);
    load();
  };

  const sold = items.filter((p) => p.sold_out).length;

  return (
    <section className="ad_section">
      <div className="ad_head">
        <h2>Products</h2>
        <button className="btn_link" onClick={() => onEdit(null)}>+ Add product</button>
      </div>

      <ul className="ad_stats">
        <li><strong>{items.length}</strong><span>Total</span></li>
        <li><strong>{items.length - sold}</strong><span>Available</span></li>
        <li><strong>{sold}</strong><span>Sold out</span></li>
      </ul>

      {loading ? <p>Loading…</p> : items.length === 0 ? (
        <div className="ad_empty"><p>No products yet. Add your first one.</p></div>
      ) : (
        <ul className="ad_list">
          {items.map((p) => (
            <li key={p.id} className="ad_card">
              <img src={p.image} alt="" />
              <div className="info">
                <strong>{p.name}</strong>
                <span>{naira(p.price)} · {p.type && p.type !== "piece" ? `${p.type} · ${p.pieces_count} pcs` : p.size || "—"} · {p.condition}</span>
                {p.sold_out && <em className="sold">Sold out</em>}
              </div>
              <div className="acts">
                <button className="btn_link ghost" onClick={() => onEdit(p)}>Edit</button>
                <button className="btn_link ghost" onClick={() => toggleSold(p)}>
                  {p.sold_out ? "Mark available" : "Mark sold"}
                </button>
                <button className="btn_link ghost danger" onClick={() => remove(p)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
