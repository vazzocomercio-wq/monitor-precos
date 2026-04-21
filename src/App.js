import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, CartesianGrid
} from "recharts";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const detectPlatform = (url) => {
  const u = (url || "").toLowerCase();
  if (u.includes("mercadolivre") || u.includes("mercadolibre") || u.includes("meli")) return "ml";
  if (u.includes("shopee")) return "shopee";
  if (u.includes("amazon")) return "amazon";
  if (u.includes("magazineluiza") || u.includes("magalu")) return "magalu";
  return "other";
};

const PLT = {
  ml:     { name: "Mercado Livre", color: "#FFE600", text: "#111",  short: "ML" },
  shopee: { name: "Shopee",        color: "#EE4D2D", text: "#fff",  short: "SH" },
  amazon: { name: "Amazon",        color: "#FF9900", text: "#111",  short: "AZ" },
  magalu: { name: "Magalu",        color: "#0086CC", text: "#fff",  short: "MG" },
  other:  { name: "Outro",         color: "#555",    text: "#fff",  short: "??" },
};

const fmt = (n) =>
  Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const pct = (a, b) => (((a - b) / b) * 100).toFixed(1);

const genHistory = (base, days = 30) => {
  let p = base;
  return Array.from({ length: days + 1 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - i));
    p = Math.round(p * (1 + (Math.random() - 0.48) * 0.045) * 100) / 100;
    return {
      date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      price: p,
    };
  });
};

// ─── Dados iniciais ────────────────────────────────────────────────────────────
const INIT_PRODUCTS = [
  {
    id: "1",
    name: "Fone Bluetooth JBL Tune 510BT",
    sku: "JBL-510-BT",
    myPrice: 299.9,
    competitors: [
      { id: "c1", platform: "ml",     url: "https://mercadolivre.com.br/jbl-tune-510bt",        title: "JBL Tune 510BT - Loja Oficial ML",        currentPrice: 279.9,  history: genHistory(288, 30), lastChecked: new Date() },
      { id: "c2", platform: "amazon", url: "https://amazon.com.br/jbl-fone-bluetooth",           title: "JBL Tune 510BT Bluetooth - Amazon",        currentPrice: 289.9,  history: genHistory(294, 30), lastChecked: new Date() },
      { id: "c3", platform: "magalu", url: "https://magazineluiza.com.br/jbl-tune510bt",         title: "Fone JBL Tune 510BT - Magazine Luiza",     currentPrice: 309.9,  history: genHistory(305, 30), lastChecked: new Date() },
    ],
  },
  {
    id: "2",
    name: "Cabo USB-C 2m Nylon Trançado",
    sku: "CAB-USBC-2M",
    myPrice: 49.9,
    competitors: [
      { id: "c4", platform: "shopee", url: "https://shopee.com.br/cabo-usbc-nylon-2m",           title: "Cabo USB-C Nylon 2M - Top Seller",         currentPrice: 37.9,   history: genHistory(43, 30),  lastChecked: new Date() },
      { id: "c5", platform: "magalu", url: "https://magazineluiza.com.br/cabo-usb-c-2m-nylon",   title: "Cabo USB Tipo C 2m Nylon Trançado Magalu", currentPrice: 54.9,   history: genHistory(52, 30),  lastChecked: new Date() },
      { id: "c6", platform: "ml",     url: "https://mercadolivre.com.br/cabo-usbc-nylon",        title: "Cabo USB-C 2 Metros Nylon ML",             currentPrice: 44.9,   history: genHistory(47, 30),  lastChecked: new Date() },
    ],
  },
  {
    id: "3",
    name: "Suporte Veicular Magnético Universal",
    sku: "SUP-VEI-MAG",
    myPrice: 79.9,
    competitors: [
      { id: "c7", platform: "ml",     url: "https://mercadolivre.com.br/suporte-veicular",       title: "Suporte Celular Carro Magnético - ML",     currentPrice: 84.9,   history: genHistory(82, 30),  lastChecked: new Date() },
      { id: "c8", platform: "shopee", url: "https://shopee.com.br/suporte-magnetico-carro",       title: "Suporte Magnético Universal para Carro",   currentPrice: 68.5,   history: genHistory(74, 30),  lastChecked: new Date() },
    ],
  },
  {
    id: "4",
    name: "Película Vidro Temperado iPhone 15",
    sku: "PEL-IP15-VT",
    myPrice: 34.9,
    competitors: [
      { id: "c9",  platform: "shopee", url: "https://shopee.com.br/pelicula-iphone15-vidro",     title: "Película Vidro iPhone 15 - Kit 3un",       currentPrice: 24.9,   history: genHistory(28, 30),  lastChecked: new Date() },
      { id: "c10", platform: "magalu", url: "https://magazineluiza.com.br/pelicula-iphone-15",   title: "Película Temperada iPhone 15 - Magalu",    currentPrice: 39.9,   history: genHistory(37, 30),  lastChecked: new Date() },
      { id: "c11", platform: "amazon", url: "https://amazon.com.br/pelicula-iphone15-vidro",     title: "Película Vidro iPhone 15 - Amazon Choice", currentPrice: 29.9,   history: genHistory(32, 30),  lastChecked: new Date() },
    ],
  },
];

// ─── Componentes auxiliares ────────────────────────────────────────────────────
const PlatformBadge = ({ platform, size = "sm" }) => {
  const p = PLT[platform] || PLT.other;
  const fs = size === "sm" ? 10 : 11;
  const px = size === "sm" ? "6px 8px" : "4px 10px";
  return (
    <span style={{
      background: p.color, color: p.text, fontSize: fs, fontWeight: 700,
      padding: px, borderRadius: 4, letterSpacing: "0.4px", flexShrink: 0,
      fontFamily: "ui-monospace, 'Courier New', monospace",
    }}>
      {p.short}
    </span>
  );
};

const Dot = ({ ok }) => (
  <span style={{
    width: 7, height: 7, borderRadius: "50%", display: "inline-block", flexShrink: 0,
    background: ok ? "#22c55e" : "#f97316",
    boxShadow: ok ? "0 0 6px #22c55e88" : "0 0 6px #f9731688",
  }} />
);

// ─── App principal ─────────────────────────────────────────────────────────────
export default function App() {
  const [products, setProducts]     = useState(INIT_PRODUCTS);
  const [tab, setTab]               = useState("dashboard");
  const [selected, setSelected]     = useState(null);
  const [selComp, setSelComp]       = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [aiText, setAiText]         = useState("");
  const [aiLoading, setAiLoading]   = useState(false);
  const [addingComp, setAddingComp] = useState(false);
  const [newUrl, setNewUrl]         = useState("");
  const [newTitle, setNewTitle]     = useState("");
  const [newPrice, setNewPrice]     = useState("");

  const selProduct = products.find((p) => p.id === selected);

  // Alertas globais
  const allAlerts = products
    .flatMap((p) =>
      p.competitors
        .filter((c) => c.currentPrice < p.myPrice)
        .map((c) => ({
          ...c,
          productName: p.name,
          myPrice: p.myPrice,
          productId: p.id,
          diff: p.myPrice - c.currentPrice,
          diffPct: Math.abs(parseFloat(pct(c.currentPrice, p.myPrice))),
        }))
    )
    .sort((a, b) => b.diffPct - a.diffPct);

  const totalMonitored = products.reduce((s, p) => s + p.competitors.length, 0);
  const avgDiff =
    products.reduce((s, p) => {
      const min = Math.min(...p.competitors.map((c) => c.currentPrice));
      return s + ((p.myPrice - min) / p.myPrice) * 100;
    }, 0) / products.length;

  // Simular atualização de preços
  const refresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1800));
    const now = new Date();
    setProducts((prev) =>
      prev.map((p) => ({
        ...p,
        competitors: p.competitors.map((c) => {
          const np = Math.round(c.currentPrice * (1 + (Math.random() - 0.48) * 0.06) * 100) / 100;
          const point = {
            date: now.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
            price: np,
          };
          return {
            ...c,
            previousPrice: c.currentPrice,
            currentPrice: np,
            history: [...c.history.slice(-30), point],
            lastChecked: now,
          };
        }),
      }))
    );
    setRefreshing(false);
  };

  // Análise IA
  const analyze = async (product) => {
    setAiLoading(true);
    setAiText("");
    try {
      const compData = product.competitors.map((c) => ({
        plataforma: PLT[c.platform].name,
        precoAtual: c.currentPrice,
        min30d: Math.min(...c.history.map((h) => h.price)),
        max30d: Math.max(...c.history.map((h) => h.price)),
        tendencia:
          c.history[c.history.length - 1].price > c.history[c.history.length - 7].price
            ? "alta"
            : "queda",
      }));

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 700,
          system:
            "Você é um especialista em precificação para marketplaces brasileiros (ML, Shopee, Amazon, Magalu). Analise dados e dê recomendações diretas, práticas e acionáveis em português. Use bullet points curtos. Seja objetivo e conclusivo.",
          messages: [
            {
              role: "user",
              content: `Produto: "${product.name}"
Meu preço: R$ ${product.myPrice.toFixed(2)}

Concorrentes:
${compData.map((c) => `• ${c.plataforma}: R$ ${c.precoAtual.toFixed(2)} | mín 30d: R$ ${c.min30d.toFixed(2)} | máx: R$ ${c.max30d.toFixed(2)} | tendência: ${c.tendencia}`).join("\n")}

Por favor analise:
1. Posição competitiva atual (2 frases diretas)
2. Ação recomendada imediata (1 frase)
3. Preço sugerido e por quê`,
            },
          ],
        }),
      });
      const data = await res.json();
      setAiText(data.content[0].text);
    } catch {
      setAiText("Erro ao conectar com a IA. Tente novamente.");
    }
    setAiLoading(false);
  };

  // Adicionar concorrente
  const addCompetitor = (productId) => {
    if (!newUrl || !newPrice) return;
    const platform = detectPlatform(newUrl);
    const price = parseFloat(newPrice.replace(",", "."));
    const comp = {
      id: "c" + Date.now(),
      platform,
      url: newUrl,
      title: newTitle || `Anúncio ${PLT[platform].name}`,
      currentPrice: price,
      history: genHistory(price, 30),
      lastChecked: new Date(),
    };
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, competitors: [...p.competitors, comp] } : p
      )
    );
    setNewUrl(""); setNewTitle(""); setNewPrice("");
    setAddingComp(false);
  };

  // ── Estilos ──────────────────────────────────────────────────────────────────
  const mono = { fontFamily: "ui-monospace, 'Courier New', monospace" };

  const card = (extra = {}) => ({
    background: "#111114",
    border: "1px solid #1e1e24",
    borderRadius: 12,
    padding: "16px 20px",
    ...extra,
  });

  const statCard = (accent) => ({
    ...card(),
    borderLeft: `3px solid ${accent}`,
    borderColor: `${accent}33`,
    borderLeftColor: accent,
  });

  const btn = (variant = "primary") => ({
    padding: variant === "xs" ? "4px 10px" : "7px 15px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    border: "1px solid",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    transition: "all 0.15s",
    ...(variant === "primary"
      ? { background: "#FFB800", color: "#000", borderColor: "#FFB800" }
      : variant === "ghost"
      ? { background: "transparent", color: "#666", borderColor: "#2a2a30" }
      : { background: "#1a1a20", color: "#bbb", borderColor: "#2a2a30" }),
  });

  const tabStyle = (active) => ({
    padding: "6px 16px",
    borderRadius: 7,
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
    border: "none",
    background: active ? "#1e1e28" : "transparent",
    color: active ? "#f0ede8" : "#555",
    transition: "all 0.15s",
  });

  const inputStyle = {
    background: "#0c0c0f",
    border: "1px solid #2a2a30",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 13,
    color: "#e8e6e1",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  // ── Views ────────────────────────────────────────────────────────────────────
  const Dashboard = () => (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { label: "Produtos",           value: products.length,      sub: `${totalMonitored} anúncios`,          accent: "#FFB800" },
          { label: "Alertas ativos",     value: allAlerts.length,     sub: "concorrentes abaixo",                 accent: "#f97316" },
          { label: "Posição de preço",   value: avgDiff > 0 ? `+${avgDiff.toFixed(1)}%` : `${avgDiff.toFixed(1)}%`, sub: avgDiff > 0 ? "você está acima" : "você está abaixo", accent: avgDiff > 0 ? "#f97316" : "#22c55e" },
          { label: "Plataformas",        value: "4",                  sub: "ML · SH · AZ · MG",                  accent: "#818cf8" },
        ].map(({ label, value, sub, accent }) => (
          <div key={label} style={statCard(accent)}>
            <div style={{ fontSize: 11, color: "#555", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.8px" }}>{label}</div>
            <div style={{ ...mono, fontSize: 26, fontWeight: 700, color: accent, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 12, color: "#444", marginTop: 6 }}>{sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Alertas */}
        <div style={card()}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: "#f97316", display: "flex", alignItems: "center", gap: 8 }}>
            ⚠ Concorrentes mais baratos
          </div>
          {allAlerts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#444", fontSize: 13 }}>
              ✓ Você está competitivo em todos os produtos
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {allAlerts.map((a) => (
                <div
                  key={a.id}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#130a0033", borderRadius: 8, border: "1px solid #f9731622", cursor: "pointer" }}
                  onClick={() => { setTab("products"); setSelected(a.productId); setSelComp(a.id); setAiText(""); }}
                >
                  <PlatformBadge platform={a.platform} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.productName}</div>
                    <div style={{ fontSize: 11, color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ ...mono, fontSize: 13, fontWeight: 700, color: "#f97316" }}>{fmt(a.currentPrice)}</div>
                    <div style={{ fontSize: 11, color: "#555" }}>vs {fmt(a.myPrice)}</div>
                  </div>
                  <div style={{ ...mono, fontSize: 12, color: "#f97316", fontWeight: 700, flexShrink: 0 }}>-{a.diffPct}%</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Visão geral */}
        <div style={card()}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Comparativo rápido</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {products.map((p) => {
              const minC = Math.min(...p.competitors.map((c) => c.currentPrice));
              const isAlert = minC < p.myPrice;
              return (
                <div
                  key={p.id}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, background: "#0f0f13", border: "1px solid #1e1e24", cursor: "pointer" }}
                  onClick={() => { setTab("products"); setSelected(p.id); setSelComp(null); setAiText(""); }}
                >
                  <Dot ok={!isAlert} />
                  <div style={{ flex: 1, fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
                    <span style={{ ...mono, fontSize: 11, color: "#444" }}>min {fmt(minC)}</span>
                    <span style={{ ...mono, fontSize: 13, fontWeight: 700, color: isAlert ? "#f97316" : "#22c55e" }}>{fmt(p.myPrice)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  // ── Detalhe do produto ───────────────────────────────────────────────────────
  const ProductDetail = ({ product }) => {
    const compId = selComp || product.competitors[0]?.id;
    const comp = product.competitors.find((c) => c.id === compId) || product.competitors[0];
    const isAlert = comp && comp.currentPrice < product.myPrice;
    const chartData = comp ? comp.history.slice(-21) : [];
    const minP = comp ? Math.min(...comp.history.map((h) => h.price)) : 0;
    const maxP = comp ? Math.max(...comp.history.map((h) => h.price)) : 0;
    const diffVal = comp ? comp.currentPrice - product.myPrice : 0;
    const diffPctVal = comp ? parseFloat(pct(comp.currentPrice, product.myPrice)) : 0;

    return (
      <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 0", borderBottom: "1px solid #1e1e24" }}>
          <button onClick={() => { setSelected(null); setAiText(""); }} style={btn("ghost")}>← Voltar</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{product.name}</div>
            <div style={{ fontSize: 12, color: "#555" }}>
              SKU: {product.sku} · Meu preço:{" "}
              <span style={{ ...mono, color: "#FFB800", fontWeight: 700 }}>{fmt(product.myPrice)}</span>
            </div>
          </div>
          <button
            onClick={() => analyze(product)}
            style={{ ...btn("primary"), opacity: aiLoading ? 0.7 : 1 }}
            disabled={aiLoading}
          >
            {aiLoading ? "⟳ Analisando..." : "✦ Análise com IA"}
          </button>
        </div>

        {/* Tabs concorrentes */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {product.competitors.map((c) => {
            const active = c.id === compId;
            const cheaper = c.currentPrice < product.myPrice;
            return (
              <button
                key={c.id}
                onClick={() => { setSelComp(c.id); setAiText(""); }}
                style={{
                  ...btn(active ? "secondary" : "ghost"),
                  padding: "6px 12px",
                  display: "inline-flex", alignItems: "center", gap: 6,
                  borderColor: active ? (cheaper ? "#f97316" : "#22c55e") : "#2a2a30",
                  background: active ? (cheaper ? "#130a0055" : "#002a1055") : "transparent",
                  color: active ? "#e8e6e1" : "#666",
                }}
              >
                <PlatformBadge platform={c.platform} />
                <span style={{ ...mono, fontSize: 12, fontWeight: 700, color: cheaper ? "#f97316" : "#22c55e" }}>{fmt(c.currentPrice)}</span>
              </button>
            );
          })}
          <button onClick={() => setAddingComp(true)} style={{ ...btn("ghost"), fontSize: 12, padding: "6px 12px" }}>
            + Adicionar
          </button>
        </div>

        {/* Form adicionar concorrente */}
        {addingComp && (
          <div style={card({ borderColor: "#FFB80033" })}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#FFB800", marginBottom: 12 }}>Adicionar concorrente</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input
                style={inputStyle}
                placeholder="URL do anúncio (mercadolivre.com.br, shopee.com.br, amazon.com.br...)"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
              <input
                style={inputStyle}
                placeholder="Título do anúncio (opcional)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <input
                style={inputStyle}
                placeholder="Preço atual (ex: 89,90)"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
              />
              {newUrl && (
                <div style={{ fontSize: 12, color: "#555" }}>
                  Plataforma detectada:{" "}
                  <span style={{ color: PLT[detectPlatform(newUrl)].color, fontWeight: 700 }}>
                    {PLT[detectPlatform(newUrl)].name}
                  </span>
                </div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => addCompetitor(product.id)} style={btn("primary")}>Adicionar</button>
                <button onClick={() => setAddingComp(false)} style={btn("ghost")}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {/* Gráfico + stats */}
        {comp && (
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, alignItems: "start" }}>
            {/* Gráfico */}
            <div style={card()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                    <PlatformBadge platform={comp.platform} size="md" />
                    {PLT[comp.platform].name}
                  </div>
                  <div style={{ fontSize: 11, color: "#555", marginTop: 3, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{comp.title}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ ...mono, fontSize: 22, fontWeight: 700, color: isAlert ? "#f97316" : "#22c55e" }}>{fmt(comp.currentPrice)}</div>
                  <div style={{ fontSize: 11, color: "#555" }}>preço atual</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#1e1e24" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#444", fontFamily: "ui-monospace, monospace" }}
                    tickLine={false}
                    axisLine={false}
                    interval={4}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#444", fontFamily: "ui-monospace, monospace" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `R$${v}`}
                    domain={["auto", "auto"]}
                    width={58}
                  />
                  <Tooltip
                    contentStyle={{ background: "#111114", border: "1px solid #2a2a30", borderRadius: 8, fontSize: 12, color: "#e8e6e1" }}
                    formatter={(v) => [fmt(v), "Preço"]}
                    labelStyle={{ color: "#666" }}
                  />
                  <ReferenceLine
                    y={product.myPrice}
                    stroke="#FFB800"
                    strokeDasharray="5 5"
                    label={{ value: "Meu preço", fill: "#FFB800", fontSize: 10, position: "insideTopRight" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke={isAlert ? "#f97316" : "#22c55e"}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: isAlert ? "#f97316" : "#22c55e" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Cards de métricas */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Preço mínimo (30d)", value: fmt(minP), color: "#f97316" },
                { label: "Preço máximo (30d)", value: fmt(maxP), color: "#22c55e" },
                {
                  label: "Diferença atual",
                  value: (diffVal < 0 ? "−" : "+") + fmt(Math.abs(diffVal)),
                  color: diffVal < 0 ? "#f97316" : "#22c55e",
                },
                {
                  label: "Variação percentual",
                  value: (diffPctVal < 0 ? "" : "+") + diffPctVal + "%",
                  color: diffPctVal < 0 ? "#f97316" : "#22c55e",
                },
                {
                  label: "Último check",
                  value: new Date(comp.lastChecked).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
                  color: "#818cf8",
                },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ ...card(), padding: "12px 16px" }}>
                  <div style={{ fontSize: 10, color: "#444", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.7px" }}>{label}</div>
                  <div style={{ ...mono, fontSize: 15, fontWeight: 700, color }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Análise IA */}
        {(aiText || aiLoading) && (
          <div style={card({ borderColor: "#FFB80044", background: "#0f0f00" })}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#FFB800", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <span>✦</span> Análise de Inteligência Artificial
            </div>
            {aiLoading ? (
              <div style={{ color: "#555", fontSize: 13 }}>Analisando posição competitiva...</div>
            ) : (
              <div style={{ fontSize: 13, lineHeight: 1.75, color: "#ccc", whiteSpace: "pre-wrap" }}>{aiText}</div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ── Lista de produtos ────────────────────────────────────────────────────────
  const ProductsList = () => {
    if (selProduct) return <ProductDetail product={selProduct} />;
    return (
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 10 }}>
        {products.map((p) => {
          const minC = Math.min(...p.competitors.map((c) => c.currentPrice));
          const maxC = Math.max(...p.competitors.map((c) => c.currentPrice));
          const alerts = p.competitors.filter((c) => c.currentPrice < p.myPrice);
          const isAlert = alerts.length > 0;
          return (
            <div
              key={p.id}
              style={{
                ...card({ borderColor: isAlert ? "#f9731633" : "#1e1e24", cursor: "pointer" }),
                transition: "border-color 0.15s",
              }}
              onClick={() => { setSelected(p.id); setSelComp(null); setAiText(""); }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Dot ok={!isAlert} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>
                    {p.sku} · {p.competitors.length} concorrente{p.competitors.length > 1 ? "s" : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0 }}>
                  {p.competitors.map((c) => <PlatformBadge key={c.id} platform={c.platform} />)}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: "0.7px" }}>Meu preço</div>
                  <div style={{ ...mono, fontSize: 15, fontWeight: 700 }}>{fmt(p.myPrice)}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0, minWidth: 100 }}>
                  <div style={{ fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: "0.7px" }}>Range concorrentes</div>
                  <div style={{ ...mono, fontSize: 12, color: "#666" }}>
                    <span style={{ color: "#f97316" }}>{fmt(minC)}</span> — <span style={{ color: "#22c55e" }}>{fmt(maxC)}</span>
                  </div>
                </div>
                {isAlert && (
                  <div style={{ background: "#f9731622", color: "#f97316", fontSize: 11, padding: "4px 10px", borderRadius: 6, fontWeight: 700, flexShrink: 0 }}>
                    {alerts.length} alerta{alerts.length > 1 ? "s" : ""}
                  </div>
                )}
                {!isAlert && (
                  <div style={{ background: "#22c55522", color: "#22c55e", fontSize: 11, padding: "4px 10px", borderRadius: 6, fontWeight: 700, flexShrink: 0 }}>
                    ✓ competitivo
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ── Alertas ──────────────────────────────────────────────────────────────────
  const AlertsView = () => (
    <div style={{ padding: 24 }}>
      <div style={{ fontSize: 13, color: "#555", marginBottom: 16 }}>
        {allAlerts.length} concorrente{allAlerts.length !== 1 ? "s" : ""} com preço abaixo do seu — ordenados por maior diferença percentual
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {allAlerts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#444" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#22c55e" }}>Tudo certo!</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Nenhum concorrente está com preço abaixo do seu.</div>
          </div>
        ) : (
          allAlerts.map((a) => (
            <div
              key={a.id}
              style={card({ borderColor: "#f9731633", cursor: "pointer" })}
              onClick={() => { setTab("products"); setSelected(a.productId); setSelComp(a.id); setAiText(""); }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <PlatformBadge platform={a.platform} size="md" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f97316" }}>{a.productName}</div>
                  <div style={{ fontSize: 12, color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: "0.7px" }}>Concorrente</div>
                  <div style={{ ...mono, fontSize: 16, fontWeight: 700, color: "#f97316" }}>{fmt(a.currentPrice)}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: "0.7px" }}>Meu preço</div>
                  <div style={{ ...mono, fontSize: 16, fontWeight: 700 }}>{fmt(a.myPrice)}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: "0.7px" }}>Diferença</div>
                  <div style={{ ...mono, fontSize: 16, fontWeight: 700, color: "#f97316" }}>−{fmt(a.diff)}</div>
                </div>
                <div style={{ ...mono, fontSize: 18, fontWeight: 700, color: "#f97316", minWidth: 60, textAlign: "right", flexShrink: 0 }}>
                  -{a.diffPct}%
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // ── Layout principal ─────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", background: "#09090b", minHeight: "100vh", color: "#e8e6e1" }}>
      {/* Header */}
      <div style={{ padding: "0 24px", borderBottom: "1px solid #1e1e24", display: "flex", alignItems: "center", gap: 20, height: 54, background: "#09090b", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ ...mono, fontWeight: 700, fontSize: 14, color: "#FFB800", letterSpacing: "-0.5px", flexShrink: 0 }}>◈ PriceWatch</div>
        <div style={{ display: "flex", gap: 4 }}>
          {[
            ["dashboard", "▣ Dashboard"],
            ["products",  "◎ Produtos"],
            ["alerts",    `⚠ Alertas${allAlerts.length > 0 ? ` (${allAlerts.length})` : ""}`],
          ].map(([id, label]) => (
            <button
              key={id}
              style={tabStyle(tab === id)}
              onClick={() => { setTab(id); setSelected(null); setAiText(""); }}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 11, color: "#444" }}>
          Última atualização: {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </div>
        <button onClick={refresh} style={{ ...btn("primary"), opacity: refreshing ? 0.7 : 1 }} disabled={refreshing}>
          {refreshing ? "⟳ Atualizando..." : "⟳ Atualizar preços"}
        </button>
      </div>

      {/* Content */}
      {tab === "dashboard" && <Dashboard />}
      {tab === "products"  && <ProductsList />}
      {tab === "alerts"    && <AlertsView />}
    </div>
  );
}
