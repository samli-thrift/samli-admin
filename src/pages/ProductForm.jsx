import { useEffect, useState } from "react";
import { supabase } from "../supabase";

const TYPES = { piece: "Single piece", slot: "Slot (bundle)", bale: "Bale (bulk pack)" };
const CONDITIONS = ["New", "Like new", "Good", "Fair"];
const GRADES = ["Grade A", "Grade B", "Grade C", "Mixed"];
const DEFAULT_TAGS = ["men", "women", "unisex", "kids", "hot", "casual", "vintage", "formal"];

const EMPTY = {
  type: "piece", name: "", price: "", size: "", condition: "Good", status: "",
  environment: "", description: "", pieces_count: "", weight_kg: "", grade: "Grade A",
  category: [], style: [], variants: [],
};

const clean = (t) => t.trim().toLowerCase().replace(/\s+/g, "-");
const show = (t) => t.replace(/-/g, " ");

function TagPicker({ title, value, onChange, suggestions }) {
  const [draft, setDraft] = useState("");
  const options = [...new Set([...suggestions, ...value])];

  const toggle = (t) =>
    onChange(value.includes(t) ? value.filter((v) => v !== t) : [...value, t]);

  const add = () => {
    const t = clean(draft);
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft("");
  };

  return (
    <div className="wide">
      <span className="lbl">{title}</span>
      <div className="ad_chips">
        {options.map((t) => (
          <button type="button" key={t} className={value.includes(t) ? "on" : ""} onClick={() => toggle(t)}>
            {show(t)}
          </button>
        ))}
      </div>
      <div className="ad_addtag">
        <input value={draft} placeholder="Add a new one…" onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())} />
        <button type="button" className="btn_link ghost" onClick={add}>Add</button>
      </div>
    </div>
  );
}

export default function ProductForm({ product, onDone }) {
  const [form, setForm] = useState(
    product
      ? { ...EMPTY, ...product, category: product.category || [], style: product.style || [],
          variants: product.variants || [], pieces_count: product.pieces_count ?? "",
          weight_kg: product.weight_kg ?? "", grade: product.grade || "Grade A" }
      : EMPTY
  );
  const [existing, setExisting] = useState(product?.images || []);
  const [files, setFiles] = useState([]);
  const [known, setKnown] = useState({ category: [], style: [] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Tags already used on other products become one-tap chips
  useEffect(() => {
    supabase.from("products").select("category, style").then(({ data }) => {
      const pick = (k) => [...new Set((data || []).flatMap((p) => p[k] || []))];
      setKnown({ category: pick("category"), style: pick("style") });
    });
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const isPiece = form.type === "piece";

  const setVariant = (i, k, v) =>
    setForm({ ...form, variants: form.variants.map((r, j) => (j === i ? { ...r, [k]: v } : r)) });
  const addVariant = () =>
    setForm({ ...form, variants: [...form.variants, { size: "", color: "", stock: 1 }] });
  const removeVariant = (i) =>
    setForm({ ...form, variants: form.variants.filter((_, j) => j !== i) });

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
    if (!isPiece && !form.pieces_count) return setError("Enter how many pieces are inside.");
    setBusy(true);
    try {
      const uploaded = await Promise.all(files.map(upload));
      const images = [...existing, ...uploaded];
      const variants = isPiece
        ? form.variants.filter((v) => v.size || v.color).map((v) => ({ ...v, stock: Number(v.stock) || 0 }))
        : [];
      const row = {
        type: form.type,
        name: form.name.trim(),
        price: Number(form.price),
        size: isPiece ? form.size : null,
        condition: isPiece ? form.condition : form.grade || "Mixed",
        status: form.status,
        category: form.category,
        style: form.style,
        environment: form.environment,
        description: form.description,
        pieces_count: isPiece ? null : Number(form.pieces_count),
        weight_kg: form.type === "bale" && form.weight_kg ? Number(form.weight_kg) : null,
        grade: isPiece ? null : form.grade,
        variants,
        image: images[0],
        images,
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
        <label className="wide">What are you listing?
          <select value={form.type} onChange={set("type")}>
            {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>

        <label>Name<input value={form.name} onChange={set("name")} required /></label>
        <label>Price (₦)<input type="number" min="0" value={form.price} onChange={set("price")} required /></label>

        {isPiece ? (
          <>
            <label>Size<input value={form.size} onChange={set("size")} placeholder="Leave empty if using variations" /></label>
            <label>Condition
              <select value={form.condition} onChange={set("condition")}>
                {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
          </>
        ) : (
          <>
            <label>Pieces inside<input type="number" min="1" value={form.pieces_count} onChange={set("pieces_count")} required /></label>
            <label>Grade
              <select value={form.grade} onChange={set("grade")}>
                {GRADES.map((g) => <option key={g}>{g}</option>)}
              </select>
            </label>
            {form.type === "bale" && (
              <label>Weight (kg)<input type="number" min="0" step="0.1" value={form.weight_kg} onChange={set("weight_kg")} /></label>
            )}
          </>
        )}

        <label>Status badge<input value={form.status} onChange={set("status")} placeholder="e.g. New arrival" /></label>
        <label>Environment<input value={form.environment} onChange={set("environment")} /></label>

        <TagPicker title="Categories (pick all that apply)" value={form.category}
          suggestions={[...DEFAULT_TAGS, ...known.category]} onChange={(category) => setForm({ ...form, category })} />
        <TagPicker title="Styles (pick all that apply)" value={form.style}
          suggestions={known.style} onChange={(style) => setForm({ ...form, style })} />

        {isPiece && (
          <div className="wide">
            <span className="lbl">Variations (optional: different sizes or colours)</span>
            {form.variants.map((v, i) => (
              <div className="ad_variant" key={i}>
                <input placeholder="Size" value={v.size} onChange={(e) => setVariant(i, "size", e.target.value)} />
                <input placeholder="Colour" value={v.color} onChange={(e) => setVariant(i, "color", e.target.value)} />
                <input type="number" min="0" placeholder="Stock" value={v.stock} onChange={(e) => setVariant(i, "stock", e.target.value)} />
                <button type="button" className="btn_link ghost danger" onClick={() => removeVariant(i)}>×</button>
              </div>
            ))}
            <button type="button" className="btn_link ghost" onClick={addVariant}>+ Add variation</button>
          </div>
        )}

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
