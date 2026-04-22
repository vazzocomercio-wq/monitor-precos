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
const LOGO = "data:image/png;base64,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";

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
  other:  { name: "Outro",         color: "#999",    text: "#fff", short: "??" },
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
    : { background: "transparent", color: "#aaa", borderColor: "#2a2a30" }),
});
const tabStyle = (active) => ({ padding: "6px 16px", borderRadius: 7, fontSize: 13, fontWeight: active ? 600 : 400, cursor: "pointer", border: "none", background: active ? "#1e1e28" : "transparent", color: active ? "#f0ede8" : "#aaa", transition: "all .15s" });

// Subcomponentes FORA do App (fix do bug de foco)
const PlatformBadge = ({ platform }) => {
  const p = PLT[platform] || PLT.other;
  return <span style={{ background: p.color, color: p.text, fontSize: 10, fontWeight: 700, padding: "4px 7px", borderRadius: 4, letterSpacing: "0.4px", flexShrink: 0, fontFamily: "ui-monospace,monospace" }}>{p.short}</span>;
};

const Dot = ({ ok }) => <span style={{ width: 7, height: 7, borderRadius: "50%", display: "inline-block", flexShrink: 0, background: ok ? "#22c55e" : "#f97316", boxShadow: ok ? "0 0 6px #22c55e88" : "0 0 6px #f9731688" }} />;

// Formulário novo produto - com auto-fetch pelo link do próprio anúncio
const FormNovoProduto = ({ onSave, onCancel }) => {
  const [name,     setName]     = useState("");
  const [sku,      setSku]      = useState("");
  const [price,    setPrice]    = useState("");
  const [myUrl,    setMyUrl]    = useState("");
  const [seller,   setSeller]   = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchMsg, setFetchMsg] = useState("");
  const [saving,   setSaving]   = useState(false);

  const fetchFromMyUrl = async (inputUrl) => {
    const plat = detectPlatform(inputUrl);
    if (plat === "other" || !inputUrl.startsWith("http")) return;
    setFetching(true);
    setFetchMsg("Buscando dados do seu anuncio...");
    try {
      const res = await fetch(SCRAPER_URL + "/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: inputUrl }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.title && !name) setName(data.title);
        if (data.price && !price) setPrice(data.price.toFixed(2).replace(".", ","));
        if (data.seller) setSeller(data.seller);
        setFetchMsg("Dados preenchidos automaticamente!");
      } else {
        setFetchMsg("Nao foi possivel buscar. Preencha manualmente.");
      }
    } catch {
      setFetchMsg("Servidor indisponivel. Preencha manualmente.");
    }
    setFetching(false);
  };

  const handleUrlChange = (e) => {
    const val = e.target.value;
    setMyUrl(val);
    setFetchMsg("");
    if (val.length > 20 && val.startsWith("http")) {
      clearTimeout(window._scrapeMyTimer);
      window._scrapeMyTimer = setTimeout(() => fetchFromMyUrl(val), 600);
    }
  };

  const save = async () => {
    if (!name || !price) return;
    setSaving(true);
    await onSave({
      name, sku: sku || "-",
      myPrice: parseFloat(price.replace(",", ".")),
      myUrl: myUrl || "",
      seller: seller || "",
      competitors: [],
      createdAt: new Date().toISOString()
    });
    setSaving(false);
  };

  const statusColor = fetchMsg.includes("automaticamente") ? "#22c55e" : fetchMsg.includes("manual") || fetchMsg.includes("indisponivel") ? "#f97316" : ACCENT;
  const platform = detectPlatform(myUrl);

  return (
    <div style={cardStyle({ borderColor: "#00E5FF33", marginBottom: 8 })}>
      <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT, marginBottom: 4 }}>Novo produto</div>
      <div style={{ fontSize: 11, color: "#999", marginBottom: 12 }}>Cole o link do seu anuncio para preencher automaticamente</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

        {/* Link do proprio anuncio com auto-fetch */}
        <div style={{ position: "relative" }}>
          <input
            style={{ ...inputStyle, paddingRight: 100, borderColor: myUrl ? "#00E5FF44" : "#2a2a30" }}
            placeholder="Cole o link do SEU anuncio (ML, Shopee, Amazon, Magalu)"
            value={myUrl}
            onChange={handleUrlChange}
          />
          {myUrl && !fetching && (
            <button
              onClick={() => fetchFromMyUrl(myUrl)}
              style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: ACCENT, color: "#000", border: "none", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
            >Buscar</button>
          )}
        </div>

        {/* Status e plataforma */}
        {(fetching || fetchMsg) && (
          <div style={{ fontSize: 12, color: fetching ? ACCENT : statusColor }}>
            {fetching ? "⟳ Buscando titulo e preco..." : fetchMsg}
          </div>
        )}
        {myUrl && platform !== "other" && (
          <div style={{ fontSize: 12, color: "#999" }}>
            Plataforma: <span style={{ color: PLT[platform]?.color, fontWeight: 700 }}>{PLT[platform]?.name}</span>
            {" · "}<a href={myUrl} target="_blank" rel="noreferrer" style={{ color: ACCENT, fontSize: 11 }}>ver anuncio ↗</a>
          </div>
        )}

        {/* Nome do produto - preenchido automaticamente */}
        <input style={{ ...inputStyle, borderColor: name ? "#00E5FF44" : "#2a2a30" }} placeholder="Nome do produto * (preenchido automaticamente pelo link)" value={name} onChange={e => setName(e.target.value)} />

        {/* Vendedor (se disponivel) */}
        {seller && (
          <div style={{ fontSize: 12, color: "#999", padding: "6px 10px", background: "#0f0f13", borderRadius: 6 }}>
            Vendedor: <span style={{ color: "#e8e6e1", fontWeight: 600 }}>{seller}</span>
          </div>
        )}

        <input style={inputStyle} placeholder="SKU / codigo interno (opcional)" value={sku} onChange={e => setSku(e.target.value)} />
        <input style={{ ...inputStyle, borderColor: price ? "#00E5FF44" : "#2a2a30" }} placeholder="Meu preco de venda * (ex: 299,90)" value={price} onChange={e => setPrice(e.target.value)} />

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={save} style={{ ...btnStyle("primary"), opacity: (saving || fetching) ? 0.6 : 1 }} disabled={saving || fetching}>
            {saving ? "Salvando..." : "Salvar produto"}
          </button>
          <button onClick={onCancel} style={btnStyle("ghost")}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

// Formulário novo concorrente - componente separado = sem perda de foco
// URL do servidor scraper no Railway — troque pelo seu após o deploy
const SCRAPER_URL = process.env.REACT_APP_SCRAPER_URL || "https://SEU-PROJETO.up.railway.app";

const FormNovoConcorrente = ({ onSave, onCancel }) => {
  const [url,      setUrl]      = useState("");
  const [title,    setTitle]    = useState("");
  const [price,    setPrice]    = useState("");
  const [seller,   setSeller]   = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchMsg, setFetchMsg] = useState("");
  const [saving,   setSaving]   = useState(false);
  const platform = detectPlatform(url);

  // Buscar dados automaticamente ao colar o link
  const fetchFromUrl = async (inputUrl) => {
    const plat = detectPlatform(inputUrl);
    if (plat === "other" || !inputUrl.startsWith("http")) return;

    setFetching(true);
    setFetchMsg("Buscando dados do anuncio...");
    setTitle(""); setPrice(""); setSeller("");

    try {
      const res = await fetch(SCRAPER_URL + "/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: inputUrl }),
      });
      const data = await res.json();

      if (data.success) {
        setTitle(data.title || "");
        setPrice(data.price ? data.price.toFixed(2).replace(".", ",") : "");
        if (data.seller) setSeller(data.seller);
        setFetchMsg("Dados carregados automaticamente!");
      } else {
        setFetchMsg("Nao foi possivel buscar automaticamente. Preencha manualmente.");
      }
    } catch (err) {
      setFetchMsg("Servidor indisponivel. Preencha manualmente.");
    }
    setFetching(false);
  };

  const handleUrlChange = (e) => {
    const val = e.target.value;
    setUrl(val);
    setFetchMsg("");
    // Disparar busca automatica apos colar (url completa)
    if (val.length > 20 && val.startsWith("http")) {
      clearTimeout(window._scrapeTimer);
      window._scrapeTimer = setTimeout(() => fetchFromUrl(val), 600);
    }
  };

  const save = async () => {
    if (!url || !price) return;
    setSaving(true);
    const p = parseFloat(price.replace(",", "."));
    await onSave({
      id: "c" + Date.now(), platform, url,
      title: title || ("Anuncio " + (PLT[platform]?.name || "Outro")),
      seller: seller || "",
      currentPrice: p,
      history: genHistory(p, 30),
      lastChecked: new Date().toISOString(),
    });
    setSaving(false);
  };

  const statusColor = fetchMsg.includes("carregados") ? "#22c55e" : fetchMsg.includes("manual") || fetchMsg.includes("indisponivel") ? "#f97316" : ACCENT;

  return (
    <div style={cardStyle({ borderColor: "#00E5FF33" })}>
      <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT, marginBottom: 12 }}>Adicionar concorrente</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

        {/* Campo URL com botao de busca */}
        <div style={{ position: "relative" }}>
          <input
            style={{ ...inputStyle, paddingRight: 100 }}
            placeholder="Cole o link do anuncio do concorrente (ML, Shopee, Amazon, Magalu)"
            value={url}
            onChange={handleUrlChange}
          />
          {url && !fetching && (
            <button
              onClick={() => fetchFromUrl(url)}
              style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: ACCENT, color: "#000", border: "none", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
            >
              Buscar
            </button>
          )}
        </div>

        {/* Status da busca */}
        {(fetching || fetchMsg) && (
          <div style={{ fontSize: 12, color: fetching ? ACCENT : statusColor, display: "flex", alignItems: "center", gap: 6 }}>
            {fetching && <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>}
            {fetching ? "Buscando titulo e preco automaticamente..." : fetchMsg}
          </div>
        )}

        {/* Plataforma detectada e vendedor */}
        {url && platform !== "other" && (
          <div style={{ fontSize: 12, color: "#999" }}>
            Plataforma: <span style={{ color: PLT[platform]?.color, fontWeight: 700 }}>{PLT[platform]?.name}</span>
            {" · "}<a href={url} target="_blank" rel="noreferrer" style={{ color: ACCENT, fontSize: 11 }}>abrir anuncio ↗</a>
          </div>
        )}
        {seller && (
          <div style={{ fontSize: 12, color: "#777", padding: "6px 10px", background: "#0f0f13", borderRadius: 6 }}>
            Loja: <span style={{ color: ACCENT, fontWeight: 600 }}>{seller}</span>
          </div>
        )}

        {/* Titulo - preenchido automaticamente ou manual */}
        <input
          style={{ ...inputStyle, borderColor: title ? "#00E5FF44" : "#2a2a30" }}
          placeholder="Titulo do anuncio (preenchido automaticamente)"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />

        {/* Preco - preenchido automaticamente ou manual */}
        <input
          style={{ ...inputStyle, borderColor: price ? "#00E5FF44" : "#2a2a30" }}
          placeholder="Preco atual (ex: 89,90) — preenchido automaticamente"
          value={price}
          onChange={e => setPrice(e.target.value)}
        />

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={save} style={{ ...btnStyle("primary"), opacity: (saving || fetching) ? 0.6 : 1 }} disabled={saving || fetching}>
            {saving ? "Salvando..." : "Adicionar concorrente"}
          </button>
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
          { label: "Alertas ativos",   value: allAlerts.length, sub: allAlerts.length === 1 ? "concorrente abaixo" : "concorrentes abaixo", accent: "#f97316" },
          { label: "Posicao de preco", value: avgDiff > 0 ? "+" + avgDiff.toFixed(1) + "%" : avgDiff.toFixed(1) + "%", sub: avgDiff > 0 ? "acima do mercado" : "abaixo do mercado", accent: avgDiff > 0 ? "#f97316" : "#22c55e" },
          { label: "Plataformas",      value: "4",              sub: "ML · SH · AZ · MG",            accent: "#818cf8" },
        ].map(({ label, value, sub, accent }) => (
          <div key={label} style={{ ...cardStyle(), borderLeft: "3px solid " + accent, borderColor: accent + "33", borderLeftColor: accent }}>
            <div style={{ fontSize: 10, color: "#999", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.8px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
            <div style={{ ...mono, fontSize: 24, fontWeight: 700, color: accent, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={cardStyle()}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: "#f97316" }}>Concorrentes mais baratos</div>
          {allAlerts.length === 0
            ? <div style={{ textAlign: "center", padding: "20px 0", color: "#888", fontSize: 13 }}>Voce esta competitivo em todos os produtos</div>
            : allAlerts.map(a => (
              <div key={a.id} onClick={() => { setTab("products"); setSelected(a.productId); setSelComp(a.id); setAiText(""); }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#130a0033", borderRadius: 8, border: "1px solid #f9731622", cursor: "pointer", marginBottom: 8 }}>
                <PlatformBadge platform={a.platform} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.productName}</div>
                  <div style={{ fontSize: 11, color: "#999", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
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
            ? <div style={{ color: "#888", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Nenhum produto cadastrado</div>
            : products.map(p => {
              const cs = p.competitors || [];
              const minC = cs.length ? Math.min(...cs.map(c => c.currentPrice)) : p.myPrice;
              return (
                <div key={p.id} onClick={() => { setTab("products"); setSelected(p.id); setSelComp(null); setAiText(""); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, background: "#0f0f13", border: "1px solid #1e1e24", cursor: "pointer", marginBottom: 6 }}>
                  <Dot ok={!cs.some(c => c.currentPrice < p.myPrice)} />
                  <div style={{ flex: 1, fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                  <span style={{ ...mono, fontSize: 11, color: "#888" }}>min {fmt(minC)}</span>
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
            <div style={{ fontSize: 12, color: "#999", marginTop: 2, display: "flex", flexWrap: "wrap", gap: "0 14px" }}>
              {product.sku && product.sku !== "-" && <span>SKU: {product.sku}</span>}
              {product.seller && <span>Loja: <span style={{ color: ACCENT, fontWeight: 600 }}>{product.seller}</span></span>}
              <span>Meu preco: <span style={{ ...mono, color: ACCENT, fontWeight: 700 }}>{fmt(product.myPrice)}</span></span>
              {product.myUrl && <a href={product.myUrl} target="_blank" rel="noreferrer" style={{ color: ACCENT, fontSize: 11 }}>ver meu anuncio ↗</a>}
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
                  <div style={{ fontSize: 11, color: "#999", marginTop: 3 }}>{comp.title}</div>
                  {comp.seller && <div style={{ fontSize: 11, color: "#777", marginTop: 2 }}>Loja: <span style={{ color: ACCENT }}>{comp.seller}</span></div>}
                  {comp.url && <a href={comp.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: ACCENT }}>ver anuncio ↗</a>}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ ...mono, fontSize: 22, fontWeight: 700, color: isAlert ? "#f97316" : "#22c55e" }}>{fmt(comp.currentPrice)}</div>
                  <div style={{ fontSize: 11, color: "#999" }}>preco atual</div>
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
                  <div style={{ fontSize: 10, color: "#888", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.7px" }}>{label}</div>
                  <div style={{ ...mono, fontSize: 15, fontWeight: 700, color }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(aiText || aiLoading) && (
          <div style={cardStyle({ borderColor: "#00E5FF33", background: "#001a1a" })}>
            <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT, marginBottom: 10 }}>Analise de IA</div>
            {aiLoading ? <div style={{ color: "#999", fontSize: 13 }}>Analisando...</div> : <div style={{ fontSize: 13, lineHeight: 1.75, color: "#ccc", whiteSpace: "pre-wrap" }}>{aiText}</div>}
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
          <div style={{ textAlign: "center", padding: "60px 0", color: "#888" }}>
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
                  <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{p.sku} · {cs.length} concorrente{cs.length !== 1 ? "s" : ""}</div>
                </div>
                <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>{cs.map(c => <PlatformBadge key={c.id} platform={c.platform} />)}</div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: "0.7px" }}>Meu preco</div>
                  <div style={{ ...mono, fontSize: 15, fontWeight: 700 }}>{fmt(p.myPrice)}</div>
                </div>
                {cs.length > 0 && (
                  <div style={{ textAlign: "right", flexShrink: 0, minWidth: 100 }}>
                    <div style={{ fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: "0.7px" }}>Range</div>
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
      <div style={{ fontSize: 13, color: "#999", marginBottom: 16 }}>{allAlerts.length} concorrente{allAlerts.length !== 1 ? "s" : ""} com preco abaixo do seu</div>
      {allAlerts.length === 0
        ? <div style={{ textAlign: "center", padding: "60px 0", color: "#888" }}><div style={{ fontSize: 36, marginBottom: 12 }}>✓</div><div style={{ fontSize: 16, fontWeight: 700, color: "#22c55e" }}>Tudo certo!</div></div>
        : allAlerts.map(a => (
          <div key={a.id} onClick={() => { setTab("products"); setSelected(a.productId); setSelComp(a.id); setAiText(""); }} style={{ ...cardStyle({ borderColor: "#f9731633", cursor: "pointer", marginBottom: 10 }) }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <PlatformBadge platform={a.platform} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f97316" }}>{a.productName}</div>
                <div style={{ fontSize: 12, color: "#999", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 10, color: "#888", textTransform: "uppercase" }}>Concorrente</div>
                <div style={{ ...mono, fontSize: 16, fontWeight: 700, color: "#f97316" }}>{fmt(a.currentPrice)}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 10, color: "#888", textTransform: "uppercase" }}>Meu preco</div>
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
      <div style={{ padding: "0 24px", borderBottom: "1px solid #1e1e24", display: "flex", alignItems: "center", gap: 20, height: 58, background: "#09090b", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <img src={LOGO} alt="E-CLICK" style={{ height: 30, objectFit: "contain" }} />
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
            <span style={{ ...mono, fontWeight: 700, fontSize: 14, color: ACCENT, letterSpacing: "1px" }}>E-CLICK</span>
            <span style={{ fontSize: 9, color: "#888", letterSpacing: "3px", textTransform: "uppercase" }}>PriceWatch</span>
          </div>
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
      {loading ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", color: "#999", fontSize: 13 }}>Carregando...</div> : (
        <>
          {tab === "dashboard" && <Dashboard />}
          {tab === "products"  && <ProductsList />}
          {tab === "alerts"    && <AlertsView />}
        </>
      )}
    </div>
  );
}
