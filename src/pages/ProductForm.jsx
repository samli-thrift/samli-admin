


import { useState } from "react";
import { supabase } from "../supabase";

const CONDITIONS = ["New", "Like new", "Good", "Fair"];
const EMPTY = {
  name: "", price: "", size: "", condition: "Good", status: "",
  category: "", style: "", environment: "", description: "",
};

export default function ProductForm({ product, onDone }) {
  const [form, setForm] = useState(
    product ? { ...EMPTY, ...product } : EMPTY
  );
  const [existing, setExisting] = useState(product?.images || []);
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const upload = async (file) => {
    const path = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) throw error;
    return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!existing.length && !files.length) return setError("Add at least one photo.");
    setBusy(true);
    try {
      const uploaded = await Promise.all(files.map(upload));
      const images = [...existing, ...uploaded];
      const row = {
        name: form.name.trim(),
        price: Number(form.price),
        size: form.size, condition: form.condition, status: form.status,
        category: form.category.trim().toLowerCase().replace(/\s+/g, "-"),
        style: form.style, environment: form.environment,
        description: form.description,
        image: images[0], images,
      };
      const { error } = product
        ? await supabase.from("products").update(row).eq("id", product.id)
        : await supabase.from("products").insert(row);
      if (error) throw error;
      onDone();
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
      setBusy(false);
    }
  };

  return (
    <section className="ad_section">
      <h2>{product ? "Edit product" : "Add product"}</h2>
      <form className="ad_card ad_form" onSubmit={submit}>
        <label>Name<input value={form.name} onChange={set("name")} required /></label>
        <label>Price (₦)<input type="number" min="0" value={form.price} onChange={set("price")} required /></label>
        <label>Size<input value={form.size} onChange={set("size")} placeholder="e.g. M, 42, UK 8" /></label>
        <label>Condition
          <select value={form.condition} onChange={set("condition")}>
            {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label>Status badge<input value={form.status} onChange={set("status")} placeholder="e.g. New arrival" /></label>
        <label>Category<input value={form.category} onChange={set("category")} placeholder="e.g. t-shirts" /></label>
        <label>Style<input value={form.style} onChange={set("style")} /></label>
        <label>Environment<input value={form.environment} onChange={set("environment")} /></label>
        <label className="wide">Description
          <textarea rows="4" value={form.description} onChange={set("description")} />
        </label>

        <div className="wide">
          <span className="lbl">Photos (first one is the main photo)</span>
          <ul className="ad_thumbs">
            {existing.map((src) => (
              <li key={src}>
                <img src={src} alt="" />
                <button type="button" onClick={() => setExisting(existing.filter((s) => s !== src))}>×</button>
              </li>
            ))}
            {files.map((f, i) => (
              <li key={f.name + i}>
                <img src={URL.createObjectURL(f)} alt="" />
                <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))}>×</button>
              </li>
            ))}
          </ul>
          <input type="file" accept="image/*" multiple
            onChange={(e) => setFiles([...files, ...e.target.files])} />
        </div>

        {error && <p className="ad_error wide">{error}</p>}
        <div className="wide ad_actions">
          <button className="btn_link" disabled={busy}>{busy ? "Saving…" : "Save product"}</button>
          <button type="button" className="btn_link ghost" onClick={onDone}>Cancel</button>
        </div>
      </form>
    </section>
  );
}
