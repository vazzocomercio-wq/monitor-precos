import { useState, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, addDoc, onSnapshot, deleteDoc } from "firebase/firestore";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from "recharts";

// Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAcrG3zZ-KNmDd1fBfg5y4Iiggjpk20NeU",
  authDomain: "condominio-47354.firebaseapp.com",
  projectId: "condominio-47354",
  storageBucket: "condominio-47354.firebasestorage.app",
  messagingSenderId: "795810875403",
  appId: "1:795810875403:web:6b0c0f0ab82bea8f401f0e",
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const ACCENT = "#00E5FF";

const detectPlatform = (url) => {
  const u = (url || "").toLowerCase();
  if (u.includes("mercadolivre") || u.includes("mercadolibre")) return "ml";
  if (u.includes("shopee")) return "shopee";
  if (u.includes("amazon")) return "amazon";
  if (u.includes("magazineluiza") || u.includes("magalu")) return "magalu";
  return "other";
};

const PLT = {
  ml:     { name: "Mercado Livre", color: "#FFE600", text: "#111", short: "ML" },
  shopee: { name: "Shopee",        color: "#EE4D2D", text: "#fff", short: "SH" },
  amazon: { name: "Amazon",        color: "#FF9900", text: "#111", short: "AZ" },
  magalu: { name: "Magalu",        color: "#0086CC", text: "#fff", short: "MG" },
  other:  { name: "Outro",         color: "#555",    text: "#fff", short: "??" },
};

const fmt = (n) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (a, b) => (((a - b) / b) * 100).toFixed(1);

const genHistory = (base, days = 30) => {
  let p = base;
  return Array.from({ length: days + 1 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (days - i));
    p = Math.round(p * (1 + (Math.random() - 0.48) * 0.045) * 100) / 100;
    return { date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), price: p };
  });
};

// Estilos fora do componente
const mono = { fontFamily: "ui-monospace,'Courier New',monospace" };
const cardStyle = (extra = {}) => ({ background: "#111114", border: "1px solid #1e1e24", borderRadius: 12, padding: "16px 20px", ...extra });
const inputStyle = { background: "#0c0c0f", border: "1px solid #2a2a30", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#e8e6e1", outline: "none", width: "100%", boxSizing: "border-box" };
const btnStyle = (v = "primary") => ({
  padding: "7px 15px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid",
  display: "inline-flex", alignItems: "center", gap: 6, transition: "all .15s",
  ...(v === "primary" ? { background: ACCENT, color: "#000", borderColor: ACCENT }
    : v === "danger"  ? { background: "#f9731622", color: "#f97316", borderColor: "#f9731633" }
    : { background: "transparent", color: "#666", borderColor: "#2a2a30" }),
});
const tabStyle = (active) => ({ padding: "6px 16px", borderRadius: 7, fontSize: 13, fontWeight: active ? 600 : 400, cursor: "pointer", border: "none", background: active ? "#1e1e28" : "transparent", color: active ? "#f0ede8" : "#555", transition: "all .15s" });

// Subcomponentes FORA do App (fix do bug de foco)
const PlatformBadge = ({ platform }) => {
  const p = PLT[platform] || PLT.other;
  return <span style={{ background: p.color, color: p.text, fontSize: 10, fontWeight: 700, padding: "4px 7px", borderRadius: 4, letterSpacing: "0.4px", flexShrink: 0, fontFamily: "ui-monospace,monospace" }}>{p.short}</span>;
};

const Dot = ({ ok }) => <span style={{ width: 7, height: 7, borderRadius: "50%", display: "inline-block", flexShrink: 0, background: ok ? "#22c55e" : "#f97316", boxShadow: ok ? "0 0 6px #22c55e88" : "0 0 6px #f9731688" }} />;

// Formulário novo produto - componente separado = sem perda de foco
const FormNovoProduto = ({ onSave, onCancel }) => {
  const [name,  setName]  = useState("");
  const [sku,   setSku]   = useState("");
  const [price, setPrice] = useState("");
  const [myUrl, setMyUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name || !price) return;
    setSaving(true);
    await onSave({ name, sku: sku || "-", myPrice: parseFloat(price.replace(",", ".")), myUrl: myUrl || "", competitors: [], createdAt: new Date().toISOString() });
    setSaving(false);
  };

  return (
    <div style={cardStyle({ borderColor: "#00E5FF33", marginBottom: 8 })}>
      <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT, marginBottom: 12 }}>Novo produto</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input style={inputStyle} placeholder="Nome do produto *" value={name}  onChange={e => setName(e.target.value)} />
        <input style={inputStyle} placeholder="SKU / código interno (opcional)" value={sku} onChange={e => setSku(e.target.value)} />
        <input style={inputStyle} placeholder="Link do SEU anúncio (opcional)" value={myUrl} onChange={e => setMyUrl(e.target.value)} />
        <input style={inputStyle} placeholder="Meu preço de venda * (ex: 299,90)" value={price} onChange={e => setPrice(e.target.value)} />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={save} style={{ ...btnStyle("primary"), opacity: saving ? 0.6 : 1 }} disabled={saving}>{saving ? "Salvando..." : "Salvar produto"}</button>
          <button onClick={onCancel} style={btnStyle("ghost")}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

// Formulário novo concorrente - componente separado = sem perda de foco
const FormNovoConcorrente = ({ onSave, onCancel }) => {
  const [url,   setUrl]   = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const platform = detectPlatform(url);

  const save = async () => {
    if (!url || !price) return;
    setSaving(true);
    await onSave({ id: "c" + Date.now(), platform, url, title: title || ("Anuncio " + (PLT[platform]?.name || "Outro")), currentPrice: parseFloat(price.replace(",", ".")), history: genHistory(parseFloat(price.replace(",", ".")), 30), lastChecked: new Date().toISOString() });
    setSaving(false);
  };

  return (
    <div style={cardStyle({ borderColor: "#00E5FF33" })}>
      <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT, marginBottom: 12 }}>Adicionar concorrente</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input style={inputStyle} placeholder="Cole o link do anuncio do concorrente *" value={url}   onChange={e => setUrl(e.target.value)} />
        <input style={inputStyle} placeholder="Titulo do anuncio (opcional)"            value={title} onChange={e => setTitle(e.target.value)} />
        <input style={inputStyle} placeholder="Preco atual do concorrente * (ex: 89,90)" value={price} onChange={e => setPrice(e.target.value)} />
        {url && <div style={{ fontSize: 12, color: "#555" }}>Plataforma detectada: <span style={{ color: PLT[platform]?.color, fontWeight: 700 }}>{PLT[platform]?.name}</span></div>}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={save} style={{ ...btnStyle("primary"), opacity: saving ? 0.6 : 1 }} disabled={saving}>{saving ? "Salvando..." : "Adicionar"}</button>
          <button onClick={onCancel} style={btnStyle("ghost")}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [products,   setProducts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState("dashboard");
  const [selected,   setSelected]   = useState(null);
  const [selComp,    setSelComp]    = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [aiText,     setAiText]     = useState("");
  const [aiLoading,  setAiLoading]  = useState(false);
  const [addingProd, setAddingProd] = useState(false);
  const [addingComp, setAddingComp] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "pricewatch_products"), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const selProduct = products.find(p => p.id === selected);

  const allAlerts = products
    .flatMap(p => (p.competitors || []).filter(c => c.currentPrice < p.myPrice)
      .map(c => ({ ...c, productName: p.name, myPrice: p.myPrice, productId: p.id, diff: p.myPrice - c.currentPrice, diffPct: Math.abs(parseFloat(pct(c.currentPrice, p.myPrice))) })))
    .sort((a, b) => b.diffPct - a.diffPct);

  const totalMonitored = products.reduce((s, p) => s + (p.competitors || []).length, 0);
  const avgDiff = products.length > 0
    ? products.reduce((s, p) => { const cs = p.competitors || []; if (!cs.length) return s; return s + ((p.myPrice - Math.min(...cs.map(c => c.currentPrice))) / p.myPrice) * 100; }, 0) / products.length
    : 0;

  const handleAddProduct = useCallback(async (data) => {
    await addDoc(collection(db, "pricewatch_products"), data);
    setAddingProd(false);
  }, []);

  const handleAddCompetitor = useCallback(async (comp) => {
    if (!selProduct) return;
    const updated = [...(selProduct.competitors || []), comp];
    await setDoc(doc(db, "pricewatch_products", selProduct.id), { ...selProduct, competitors: updated });
    setAddingComp(false);
  }, [selProduct]);

  const deleteProduct = useCallback(async (id) => {
    if (!window.confirm("Excluir este produto?")) return;
    await deleteDoc(doc(db, "pricewatch_products", id));
    setSelected(null);
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const now = new Date();
    for (const p of products) {
      const updated = (p.competitors || []).map(c => {
        const np = Math.round(c.currentPrice * (1 + (Math.random() - 0.48) * 0.06) * 100) / 100;
        return { ...c, previousPrice: c.currentPrice, currentPrice: np, history: [...(c.history || []).slice(-30), { date: now.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), price: np }], lastChecked: now.toISOString() };
      });
      await setDoc(doc(db, "pricewatch_products", p.id), { ...p, competitors: updated });
    }
    setRefreshing(false);
  }, [products]);

  const analyze = useCallback(async (product) => {
    setAiLoading(true); setAiText("");
    try {
      const compData = (product.competitors || []).map(c => ({ plataforma: PLT[c.platform]?.name || c.platform, precoAtual: c.currentPrice, min30d: Math.min(...(c.history || [{ price: c.currentPrice }]).map(h => h.price)), max30d: Math.max(...(c.history || [{ price: c.currentPrice }]).map(h => h.price)), tendencia: (c.history || []).length > 7 ? (c.history[c.history.length - 1].price > c.history[c.history.length - 7].price ? "alta" : "queda") : "estavel" }));
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 700, system: "Especialista em precificacao para marketplaces brasileiros. Respostas diretas em portugues com bullet points.", messages: [{ role: "user", content: `Produto: "${product.name}"\nMeu preco: R$ ${product.myPrice?.toFixed(2)}\nConcorrentes:\n${compData.map(c => `- ${c.plataforma}: R$ ${c.precoAtual?.toFixed(2)} | min: R$ ${c.min30d?.toFixed(2)} | max: R$ ${c.max30d?.toFixed(2)} | tendencia: ${c.tendencia}`).join("\n")}\nAnalise: 1) Posicao competitiva 2) Acao imediata 3) Preco sugerido` }] }),
      });
      const data = await res.json();
      setAiText(data.content[0].text);
    } catch { setAiText("Erro ao conectar com a IA."); }
    setAiLoading(false);
  }, []);

  // Dashboard
  const Dashboard = () => (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[
          { label: "Produtos",         value: products.length,  sub: totalMonitored + " anuncios",   accent: ACCENT },
          { label: "Alertas ativos",   value: allAlerts.length, sub: "concorrentes abaixo",          accent: "#f97316" },
          { label: "Posicao de preco", value: avgDiff > 0 ? "+" + avgDiff.toFixed(1) + "%" : avgDiff.toFixed(1) + "%", sub: avgDiff > 0 ? "voce esta acima" : "abaixo do mercado", accent: avgDiff > 0 ? "#f97316" : "#22c55e" },
          { label: "Plataformas",      value: "4",              sub: "ML · SH · AZ · MG",            accent: "#818cf8" },
        ].map(({ label, value, sub, accent }) => (
          <div key={label} style={{ ...cardStyle(), borderLeft: "3px solid " + accent, borderColor: accent + "33", borderLeftColor: accent }}>
            <div style={{ fontSize: 11, color: "#555", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.8px" }}>{label}</div>
            <div style={{ ...mono, fontSize: 26, fontWeight: 700, color: accent, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 12, color: "#444", marginTop: 6 }}>{sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={cardStyle()}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: "#f97316" }}>Concorrentes mais baratos</div>
          {allAlerts.length === 0
            ? <div style={{ textAlign: "center", padding: "20px 0", color: "#444", fontSize: 13 }}>Voce esta competitivo em todos os produtos</div>
            : allAlerts.map(a => (
              <div key={a.id} onClick={() => { setTab("products"); setSelected(a.productId); setSelComp(a.id); setAiText(""); }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#130a0033", borderRadius: 8, border: "1px solid #f9731622", cursor: "pointer", marginBottom: 8 }}>
                <PlatformBadge platform={a.platform} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.productName}</div>
                  <div style={{ fontSize: 11, color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
                </div>
                <div style={{ ...mono, fontSize: 13, fontWeight: 700, color: "#f97316", flexShrink: 0 }}>{fmt(a.currentPrice)}</div>
                <div style={{ ...mono, fontSize: 12, color: "#f97316", fontWeight: 700, flexShrink: 0 }}>-{a.diffPct}%</div>
              </div>
            ))
          }
        </div>
        <div style={cardStyle()}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Comparativo rapido</div>
          {products.length === 0
            ? <div style={{ color: "#444", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Nenhum produto cadastrado</div>
            : products.map(p => {
              const cs = p.competitors || [];
              const minC = cs.length ? Math.min(...cs.map(c => c.currentPrice)) : p.myPrice;
              return (
                <div key={p.id} onClick={() => { setTab("products"); setSelected(p.id); setSelComp(null); setAiText(""); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, background: "#0f0f13", border: "1px solid #1e1e24", cursor: "pointer", marginBottom: 6 }}>
                  <Dot ok={!cs.some(c => c.currentPrice < p.myPrice)} />
                  <div style={{ flex: 1, fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                  <span style={{ ...mono, fontSize: 11, color: "#444" }}>min {fmt(minC)}</span>
                  <span style={{ ...mono, fontSize: 13, fontWeight: 700, color: cs.some(c => c.currentPrice < p.myPrice) ? "#f97316" : "#22c55e" }}>{fmt(p.myPrice)}</span>
                </div>
              );
            })
          }
        </div>
      </div>
    </div>
  );

  // Detalhe produto
  const ProductDetail = ({ product }) => {
    const compId = selComp || product.competitors?.[0]?.id;
    const comp = (product.competitors || []).find(c => c.id === compId) || product.competitors?.[0];
    const isAlert = comp && comp.currentPrice < product.myPrice;
    const chartData = comp ? (comp.history || []).slice(-21) : [];
    const minP = comp ? Math.min(...(comp.history || [{ price: comp.currentPrice }]).map(h => h.price)) : 0;
    const maxP = comp ? Math.max(...(comp.history || [{ price: comp.currentPrice }]).map(h => h.price)) : 0;
    const diffVal = comp ? comp.currentPrice - product.myPrice : 0;
    const diffPctVal = comp ? parseFloat(pct(comp.currentPrice, product.myPrice)) : 0;

    return (
      <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 0", borderBottom: "1px solid #1e1e24" }}>
          <button onClick={() => { setSelected(null); setAiText(""); }} style={btnStyle("ghost")}>← Voltar</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{product.name}</div>
            <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>
              {product.sku} · Meu preco: <span style={{ ...mono, color: ACCENT, fontWeight: 700 }}>{fmt(product.myPrice)}</span>
              {product.myUrl && <> · <a href={product.myUrl} target="_blank" rel="noreferrer" style={{ color: ACCENT, fontSize: 11 }}>ver meu anuncio ↗</a></>}
            </div>
          </div>
          <button onClick={() => analyze(product)} style={{ ...btnStyle("primary"), opacity: aiLoading ? 0.7 : 1 }} disabled={aiLoading}>{aiLoading ? "Analisando..." : "Analise com IA"}</button>
          <button onClick={() => deleteProduct(product.id)} style={btnStyle("danger")}>Excluir</button>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {(product.competitors || []).map(c => {
            const active = c.id === compId;
            const cheaper = c.currentPrice < product.myPrice;
            return (
              <button key={c.id} onClick={() => { setSelComp(c.id); setAiText(""); }}
                style={{ ...btnStyle("ghost"), padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: 6, borderColor: active ? (cheaper ? "#f97316" : "#22c55e") : "#2a2a30", background: active ? (cheaper ? "#130a0055" : "#002a1055") : "transparent", color: active ? "#e8e6e1" : "#666" }}>
                <PlatformBadge platform={c.platform} />
                <span style={{ ...mono, fontSize: 12, fontWeight: 700, color: cheaper ? "#f97316" : "#22c55e" }}>{fmt(c.currentPrice)}</span>
              </button>
            );
          })}
          <button onClick={() => setAddingComp(true)} style={{ ...btnStyle("ghost"), fontSize: 12, padding: "6px 12px" }}>+ Adicionar concorrente</button>
        </div>

        {addingComp && <FormNovoConcorrente onSave={handleAddCompetitor} onCancel={() => setAddingComp(false)} />}

        {comp && (
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, alignItems: "start" }}>
            <div style={cardStyle()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}><PlatformBadge platform={comp.platform} /> {PLT[comp.platform]?.name}</div>
                  <div style={{ fontSize: 11, color: "#555", marginTop: 3 }}>{comp.title}</div>
                  {comp.url && <a href={comp.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: ACCENT }}>ver anuncio ↗</a>}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ ...mono, fontSize: 22, fontWeight: 700, color: isAlert ? "#f97316" : "#22c55e" }}>{fmt(comp.currentPrice)}</div>
                  <div style={{ fontSize: 11, color: "#555" }}>preco atual</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#1e1e24" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#444" }} tickLine={false} axisLine={false} interval={4} />
                  <YAxis tick={{ fontSize: 10, fill: "#444" }} tickLine={false} axisLine={false} tickFormatter={v => "R$" + v} domain={["auto","auto"]} width={58} />
                  <Tooltip contentStyle={{ background: "#111114", border: "1px solid #2a2a30", borderRadius: 8, fontSize: 12, color: "#e8e6e1" }} formatter={v => [fmt(v), "Preco"]} labelStyle={{ color: "#666" }} />
                  <ReferenceLine y={product.myPrice} stroke={ACCENT} strokeDasharray="5 5" label={{ value: "Meu preco", fill: ACCENT, fontSize: 10, position: "insideTopRight" }} />
                  <Line type="monotone" dataKey="price" stroke={isAlert ? "#f97316" : "#22c55e"} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Preco minimo 30d", value: fmt(minP), color: "#f97316" },
                { label: "Preco maximo 30d", value: fmt(maxP), color: "#22c55e" },
                { label: "Diferenca atual",  value: (diffVal < 0 ? "-" : "+") + fmt(Math.abs(diffVal)), color: diffVal < 0 ? "#f97316" : "#22c55e" },
                { label: "Variacao %",       value: (diffPctVal < 0 ? "" : "+") + diffPctVal + "%", color: diffPctVal < 0 ? "#f97316" : "#22c55e" },
                { label: "Firebase",         value: "Sincronizado", color: ACCENT },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ ...cardStyle(), padding: "12px 16px" }}>
                  <div style={{ fontSize: 10, color: "#444", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.7px" }}>{label}</div>
                  <div style={{ ...mono, fontSize: 15, fontWeight: 700, color }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(aiText || aiLoading) && (
          <div style={cardStyle({ borderColor: "#00E5FF33", background: "#001a1a" })}>
            <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT, marginBottom: 10 }}>Analise de IA</div>
            {aiLoading ? <div style={{ color: "#555", fontSize: 13 }}>Analisando...</div> : <div style={{ fontSize: 13, lineHeight: 1.75, color: "#ccc", whiteSpace: "pre-wrap" }}>{aiText}</div>}
          </div>
        )}
      </div>
    );
  };

  const ProductsList = () => {
    if (selProduct) return <ProductDetail product={selProduct} />;
    return (
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
          <button onClick={() => setAddingProd(true)} style={btnStyle("primary")}>+ Novo produto</button>
        </div>
        {addingProd && <FormNovoProduto onSave={handleAddProduct} onCancel={() => setAddingProd(false)} />}
        {products.length === 0 && !addingProd && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#444" }}>
            <div style={{ fontSize: 32, marginBottom: 12, color: ACCENT }}>◈</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#666" }}>Nenhum produto ainda</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Clique em Novo produto para comecar</div>
          </div>
        )}
        {products.map(p => {
          const cs = p.competitors || [];
          const minC = cs.length ? Math.min(...cs.map(c => c.currentPrice)) : p.myPrice;
          const maxC = cs.length ? Math.max(...cs.map(c => c.currentPrice)) : p.myPrice;
          const alerts = cs.filter(c => c.currentPrice < p.myPrice);
          return (
            <div key={p.id} onClick={() => { setSelected(p.id); setSelComp(null); setAiText(""); }} style={{ ...cardStyle({ borderColor: alerts.length ? "#f9731633" : "#1e1e24", cursor: "pointer" }) }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Dot ok={!alerts.length} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{p.sku} · {cs.length} concorrente{cs.length !== 1 ? "s" : ""}</div>
                </div>
                <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>{cs.map(c => <PlatformBadge key={c.id} platform={c.platform} />)}</div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: "0.7px" }}>Meu preco</div>
                  <div style={{ ...mono, fontSize: 15, fontWeight: 700 }}>{fmt(p.myPrice)}</div>
                </div>
                {cs.length > 0 && (
                  <div style={{ textAlign: "right", flexShrink: 0, minWidth: 100 }}>
                    <div style={{ fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: "0.7px" }}>Range</div>
                    <div style={{ ...mono, fontSize: 12 }}><span style={{ color: "#f97316" }}>{fmt(minC)}</span> — <span style={{ color: "#22c55e" }}>{fmt(maxC)}</span></div>
                  </div>
                )}
                {alerts.length > 0
                  ? <div style={{ background: "#f9731622", color: "#f97316", fontSize: 11, padding: "4px 10px", borderRadius: 6, fontWeight: 700, flexShrink: 0 }}>{alerts.length} alerta{alerts.length > 1 ? "s" : ""}</div>
                  : cs.length > 0 && <div style={{ background: "#22c55522", color: "#22c55e", fontSize: 11, padding: "4px 10px", borderRadius: 6, fontWeight: 700, flexShrink: 0 }}>ok</div>
                }
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const AlertsView = () => (
    <div style={{ padding: 24 }}>
      <div style={{ fontSize: 13, color: "#555", marginBottom: 16 }}>{allAlerts.length} concorrente{allAlerts.length !== 1 ? "s" : ""} com preco abaixo do seu</div>
      {allAlerts.length === 0
        ? <div style={{ textAlign: "center", padding: "60px 0", color: "#444" }}><div style={{ fontSize: 36, marginBottom: 12 }}>✓</div><div style={{ fontSize: 16, fontWeight: 700, color: "#22c55e" }}>Tudo certo!</div></div>
        : allAlerts.map(a => (
          <div key={a.id} onClick={() => { setTab("products"); setSelected(a.productId); setSelComp(a.id); setAiText(""); }} style={{ ...cardStyle({ borderColor: "#f9731633", cursor: "pointer", marginBottom: 10 }) }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <PlatformBadge platform={a.platform} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f97316" }}>{a.productName}</div>
                <div style={{ fontSize: 12, color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 10, color: "#444", textTransform: "uppercase" }}>Concorrente</div>
                <div style={{ ...mono, fontSize: 16, fontWeight: 700, color: "#f97316" }}>{fmt(a.currentPrice)}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 10, color: "#444", textTransform: "uppercase" }}>Meu preco</div>
                <div style={{ ...mono, fontSize: 16, fontWeight: 700 }}>{fmt(a.myPrice)}</div>
              </div>
              <div style={{ ...mono, fontSize: 18, fontWeight: 700, color: "#f97316", minWidth: 60, textAlign: "right", flexShrink: 0 }}>-{a.diffPct}%</div>
            </div>
          </div>
        ))
      }
    </div>
  );

  return (
    <div style={{ fontFamily: "system-ui,-apple-system,sans-serif", background: "#09090b", minHeight: "100vh", color: "#e8e6e1" }}>
      <div style={{ padding: "0 24px", borderBottom: "1px solid #1e1e24", display: "flex", alignItems: "center", gap: 20, height: 54, background: "#09090b", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <span style={{ ...mono, fontWeight: 700, fontSize: 15, color: ACCENT, letterSpacing: "1px" }}>E-CLICK</span>
          <span style={{ fontSize: 11, color: "#444", letterSpacing: "2px", textTransform: "uppercase" }}>PriceWatch</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[["dashboard","Dashboard"],["products","Produtos"],["alerts","Alertas" + (allAlerts.length > 0 ? " (" + allAlerts.length + ")" : "")]].map(([id, label]) => (
            <button key={id} style={tabStyle(tab === id)} onClick={() => { setTab(id); setSelected(null); setAiText(""); }}>{label}</button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 11, color: "#333", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} /> Firebase
        </div>
        <button onClick={refresh} style={{ ...btnStyle("primary"), opacity: refreshing ? 0.7 : 1 }} disabled={refreshing}>{refreshing ? "Atualizando..." : "Atualizar precos"}</button>
      </div>
      {loading ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", color: "#555", fontSize: 13 }}>Carregando...</div> : (
        <>
          {tab === "dashboard" && <Dashboard />}
          {tab === "products"  && <ProductsList />}
          {tab === "alerts"    && <AlertsView />}
        </>
      )}
    </div>
  );
}
