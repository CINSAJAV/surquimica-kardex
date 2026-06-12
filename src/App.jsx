import { useState, useEffect, useMemo } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  bg:      "#07111E",
  surface: "#0D1F33",
  card:    "#102340",
  border:  "#1B3A6B44",
  line:    "#1B3A6B",
  navy:    "#1B3A6B",
  accent:  "#1E7FC2",
  teal:    "#0ECFB4",
  green:   "#4CAF50",
  amber:   "#D29922",
  red:     "#F85149",
  text:    "#E6EDF3",
  sub:     "#8B9DB5",
  muted:   "#4A5A70",
};
const FONT = "'IBM Plex Sans', 'Segoe UI', sans-serif";
const MONO = "'IBM Plex Mono', 'Fira Code', monospace";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const clp = (n) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n ?? 0);
const num = (n, dec = 0) =>
  new Intl.NumberFormat("es-CL", { maximumFractionDigits: dec }).format(n ?? 0);
const fmtFecha = (iso) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
};
const clienteCorto = (s) =>
  s.replace("SERVICIOS SANITARIOS ", "SS ")
   .replace(" S.A", "").replace(" LTDA", "").replace(" SPA", "").trim();

// ─── LOGO ─────────────────────────────────────────────────────────────────────
function Logo({ size = 28 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0,
      fontWeight: 900, fontSize: size * 0.5, lineHeight: 1 }}>
      <span style={{ color: C.navy, background: "#fff",
        padding: `${size * 0.1}px ${size * 0.2}px`, borderRadius: `${size * 0.15}px 0 0 ${size * 0.15}px` }}>
        Sur
      </span>
      <span style={{ color: "#fff", background: C.accent,
        padding: `${size * 0.1}px ${size * 0.15}px` }}>
        Q
      </span>
      <span style={{ color: C.navy, background: "#fff",
        padding: `${size * 0.1}px ${size * 0.2}px`, borderRadius: `0 ${size * 0.15}px ${size * 0.15}px 0` }}>
        uímica
      </span>
    </div>
  );
}

// ─── COMPONENTES BASE ─────────────────────────────────────────────────────────
function Tag({ label }) {
  const s = label === "Venta"
    ? { bg: "#0D2A1A", color: C.green,  border: "#1A4A2A" }
    : { bg: "#0D1F3A", color: C.accent, border: "#1A3A5A" };
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700,
      fontFamily: MONO, letterSpacing: 0.5 }}>{label}</span>
  );
}

function KPI({ label, value, sub, color, mono }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
      padding: "14px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2 }}>{label}</div>
      <div style={{ color: color ?? C.text, fontWeight: 800, fontSize: 18,
        fontFamily: mono ? MONO : FONT }}>{value}</div>
      {sub && <div style={{ color: C.sub, fontSize: 11 }}>{sub}</div>}
    </div>
  );
}

function Spark({ points, color, h = 32, w = 100 }) {
  if (!points || points.length < 2) return null;
  const max = Math.max(...points), min = Math.min(...points);
  const range = max - min || 1;
  const xs = points.map((_, i) => (i / (points.length - 1)) * w);
  const ys = points.map((p) => h - ((p - min) / range) * (h - 4) - 2);
  const d = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r={2.5} fill={color} />
    </svg>
  );
}

// ─── VISTA RESUMEN ────────────────────────────────────────────────────────────
function VistaResumen({ producto }) {
  const { movimientos, stockActual, pmpActual, saldoActualPesos, totalSalidas, unidad } = producto;
  const ventas  = movimientos.filter((m) => m.tipo === "Venta");
  const compras = movimientos.filter((m) => m.tipo === "Compra");

  const porCliente = {};
  ventas.forEach((v) => {
    if (!porCliente[v.cliente]) porCliente[v.cliente] = { vol: 0, monto: 0, n: 0 };
    porCliente[v.cliente].vol   += v.salida;
    porCliente[v.cliente].monto += v.haber;
    porCliente[v.cliente].n     += 1;
  });
  const clientesArr = Object.entries(porCliente)
    .map(([k, v]) => ({ cliente: k, ...v }))
    .sort((a, b) => b.vol - a.vol);
  const maxVol = clientesArr[0]?.vol || 1;

  const totalHaber = ventas.reduce((s, v) => s + v.haber, 0);
  const costoApx   = ventas.reduce((s, v) => s + v.salida * v.pmp, 0);
  const margen     = totalHaber - costoApx;
  const margenPct  = totalHaber > 0 ? (margen / totalHaber) * 100 : 0;

  const saldoEvol = movimientos.filter((m) => m.saldo_kg != null).map((m) => m.saldo_kg);
  const pmpEvol   = movimientos.filter((m) => m.pmp > 0).map((m) => m.pmp);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        <KPI label="Stock actual" value={`${num(stockActual)} ${unidad}`}
          sub={`Saldo: ${clp(saldoActualPesos)}`} color={C.teal} />
        <KPI label="PMP actual" value={`$${num(pmpActual, 2)}/${unidad}`}
          sub="Precio medio ponderado" color={C.accent} mono />
        <KPI label={`Vol. vendido 2026`} value={`${num(totalSalidas)} ${unidad}`}
          sub={`${ventas.length} movimientos`} color={C.green} />
        <KPI label="Margen bruto est." value={`${margenPct.toFixed(1)}%`}
          sub={clp(margen)} color={margenPct > 20 ? C.green : C.amber} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 14 }}>
            Volumen entregado por cliente
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {clientesArr.map((c) => (
              <div key={c.cliente}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: C.text, fontSize: 12, fontWeight: 600 }}>{clienteCorto(c.cliente)}</span>
                  <span style={{ color: C.sub, fontSize: 11, fontFamily: MONO }}>
                    {num(c.vol)} {unidad} · {clp(c.monto)}
                  </span>
                </div>
                <div style={{ background: C.line, borderRadius: 99, height: 5, overflow: "hidden" }}>
                  <div style={{ width: `${(c.vol / maxVol) * 100}%`, height: "100%", borderRadius: 99,
                    background: `linear-gradient(90deg, ${C.accent}, ${C.teal})` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, flex: 1 }}>
            <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>
              Evolución stock ({unidad})
            </div>
            <Spark points={saldoEvol} color={C.teal} h={50} w={220} />
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, flex: 1 }}>
            <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>
              Evolución PMP ($/{unidad})
            </div>
            <Spark points={pmpEvol} color={C.amber} h={50} w={220} />
            {pmpEvol.length > 0 && (
              <div style={{ color: C.muted, fontSize: 10, marginTop: 6 }}>
                Rango: ${num(Math.min(...pmpEvol), 0)} – ${num(Math.max(...pmpEvol), 0)}
              </div>
            )}
          </div>
        </div>
      </div>

      {compras.length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>
            Compras / Entradas
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {compras.map((c, i) => (
              <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: "10px 14px", minWidth: 160, flex: "1 1 160px" }}>
                <div style={{ color: C.accent, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
                  {clienteCorto(c.cliente)}
                </div>
                <div style={{ color: C.text, fontSize: 16, fontWeight: 800, fontFamily: MONO }}>
                  {num(c.entrada)} {unidad}
                </div>
                <div style={{ color: C.sub, fontSize: 11, marginTop: 2 }}>{fmtFecha(c.fecha)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── VISTA MOVIMIENTOS ────────────────────────────────────────────────────────
function VistaMovimientos({ producto }) {
  const { movimientos, unidad } = producto;
  const [filtroTipo, setFiltroTipo]     = useState("Todos");
  const [filtroCliente, setFiltroCliente] = useState("Todos");
  const [buscar, setBuscar]             = useState("");

  const clientes = useMemo(() =>
    ["Todos", ...Array.from(new Set(movimientos.map((m) => m.cliente))).sort()],
    [movimientos]
  );

  const filtered = useMemo(() => {
    let r = [...movimientos].reverse();
    if (filtroTipo !== "Todos") r = r.filter((m) => m.tipo === filtroTipo);
    if (filtroCliente !== "Todos") r = r.filter((m) => m.cliente === filtroCliente);
    if (buscar) r = r.filter((m) =>
      m.detalle.toLowerCase().includes(buscar.toLowerCase()) ||
      m.cliente.toLowerCase().includes(buscar.toLowerCase())
    );
    return r;
  }, [filtroTipo, filtroCliente, buscar, movimientos]);

  const GRID = "90px 65px 140px 1fr 90px 90px 90px 110px";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input value={buscar} onChange={(e) => setBuscar(e.target.value)}
          placeholder="Buscar cliente u OC..."
          style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text,
            borderRadius: 8, padding: "7px 12px", fontSize: 12, fontFamily: FONT,
            outline: "none", width: 200 }} />
        <div style={{ display: "flex", gap: 4 }}>
          {["Todos", "Venta", "Compra"].map((f) => (
            <button key={f} onClick={() => setFiltroTipo(f)}
              style={{ background: filtroTipo === f ? C.accent + "22" : "transparent",
                border: `1px solid ${filtroTipo === f ? C.accent : "transparent"}`,
                color: filtroTipo === f ? C.accent : C.muted,
                borderRadius: 6, padding: "5px 12px", fontSize: 11, fontFamily: FONT,
                cursor: "pointer", fontWeight: 600 }}>{f}</button>
          ))}
        </div>
        <select value={filtroCliente} onChange={(e) => setFiltroCliente(e.target.value)}
          style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text,
            borderRadius: 8, padding: "6px 10px", fontSize: 11, fontFamily: FONT,
            outline: "none", maxWidth: 220 }}>
          {clientes.map((c) => <option key={c} value={c}>{clienteCorto(c)}</option>)}
        </select>
        <div style={{ color: C.muted, fontSize: 11, marginLeft: "auto" }}>{filtered.length} mov.</div>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: GRID, padding: "8px 14px",
          borderBottom: `1px solid ${C.border}`, background: C.surface }}>
          {["Fecha", "Tipo", "Cliente", "Detalle", `Mov. (${unidad})`, `Saldo (${unidad})`, `PMP $/${unidad}`, "Monto $"].map((h) => (
            <div key={h} style={{ color: C.muted, fontSize: 10, textTransform: "uppercase",
              letterSpacing: 0.8, fontFamily: MONO }}>{h}</div>
          ))}
        </div>
        <div style={{ maxHeight: 480, overflowY: "auto" }}>
          {filtered.map((m, i) => {
            const esVenta = m.tipo === "Venta";
            return (
              <div key={i}
                style={{ display: "grid", gridTemplateColumns: GRID,
                  padding: "9px 14px", borderBottom: `1px solid ${C.border}22`,
                  background: i % 2 === 0 ? "transparent" : "#ffffff03",
                  transition: "background 0.1s", cursor: "default" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.surface)}
                onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "#ffffff03")}>
                <div style={{ color: C.sub, fontSize: 11, fontFamily: MONO }}>{fmtFecha(m.fecha)}</div>
                <div><Tag label={m.tipo} /></div>
                <div style={{ color: C.text, fontSize: 11, fontWeight: 600,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {clienteCorto(m.cliente)}
                </div>
                <div style={{ color: C.muted, fontSize: 10,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {m.detalle}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 12,
                  color: esVenta ? C.red + "CC" : C.green }}>
                  {esVenta ? `−${num(m.salida)}` : `+${num(m.entrada)}`}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 12, color: C.text }}>
                  {m.saldo_kg != null ? num(m.saldo_kg) : "—"}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: C.sub }}>
                  {m.pmp > 0 ? `$${num(m.pmp, 0)}` : "—"}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 11,
                  color: esVenta ? C.green : C.accent }}>
                  {esVenta ? clp(m.haber) : "—"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── VISTA MÁRGENES ───────────────────────────────────────────────────────────
function VistaMargen({ producto }) {
  const { movimientos, unidad } = producto;
  const ventas = movimientos.filter((m) => m.tipo === "Venta");

  const porCliente = {};
  ventas.forEach((v) => {
    if (!porCliente[v.cliente]) porCliente[v.cliente] = { vol: 0, monto: 0, costo: 0, n: 0 };
    porCliente[v.cliente].vol   += v.salida;
    porCliente[v.cliente].monto += v.haber;
    porCliente[v.cliente].costo += v.salida * v.pmp;
    porCliente[v.cliente].n     += 1;
  });

  const arr = Object.entries(porCliente).map(([k, v]) => ({
    cliente: k, ...v,
    margen:    v.monto - v.costo,
    margenPct: v.monto > 0 ? ((v.monto - v.costo) / v.monto) * 100 : 0,
    precioMed: v.vol > 0 ? v.monto / v.vol : 0,
  })).sort((a, b) => b.monto - a.monto);

  const totalMonto  = arr.reduce((s, r) => s + r.monto, 0);
  const totalCosto  = arr.reduce((s, r) => s + r.costo, 0);
  const totalMargen = totalMonto - totalCosto;
  const totalPct    = totalMonto > 0 ? (totalMargen / totalMonto) * 100 : 0;

  const GRID = "1.6fr 80px 110px 110px 80px 110px 100px";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ background: "#0A1F0A", border: `1px solid #2A5A2A`, borderRadius: 8,
        padding: "10px 14px", fontSize: 12, color: "#6EE68E" }}>
        El margen se calcula como: precio real de venta (haber/salida del Kardex) menos costo PMP al momento de cada venta.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        <KPI label="Margen bruto total" value={clp(totalMargen)}
          sub={`${totalPct.toFixed(1)}% sobre ventas`} color={totalPct > 20 ? C.green : C.amber} />
        <KPI label="Ingresos totales" value={clp(totalMonto)}
          sub={`${num(ventas.reduce((s, v) => s + v.salida, 0))} ${unidad} vendidos`} color={C.accent} />
        <KPI label="Costo estimado" value={clp(totalCosto)}
          sub="Vol × PMP al momento de venta" color={C.sub} />
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: GRID,
          padding: "8px 16px", borderBottom: `1px solid ${C.border}`, background: C.surface }}>
          {["Cliente", `Vol (${unidad})`, "Ingreso", "Costo", `P. Vta /$${unidad}`, "Margen $", "Margen %"].map((h) => (
            <div key={h} style={{ color: C.muted, fontSize: 10, textTransform: "uppercase",
              letterSpacing: 0.8, fontFamily: MONO }}>{h}</div>
          ))}
        </div>
        {arr.map((r, i) => (
          <div key={r.cliente} style={{ display: "grid", gridTemplateColumns: GRID,
            padding: "11px 16px", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}22` : "none",
            background: i % 2 === 0 ? "transparent" : "#ffffff03" }}>
            <div style={{ color: C.text, fontWeight: 600, fontSize: 12 }}>{clienteCorto(r.cliente)}</div>
            <div style={{ fontFamily: MONO, fontSize: 12, color: C.sub }}>{num(r.vol)}</div>
            <div style={{ fontFamily: MONO, fontSize: 12, color: C.text }}>{clp(r.monto)}</div>
            <div style={{ fontFamily: MONO, fontSize: 12, color: C.muted }}>{clp(r.costo)}</div>
            <div style={{ fontFamily: MONO, fontSize: 12, color: C.accent }}>${num(r.precioMed, 0)}</div>
            <div style={{ fontFamily: MONO, fontSize: 12,
              color: r.margen >= 0 ? C.green : C.red }}>{clp(r.margen)}</div>
            <div>
              <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 800,
                color: r.margenPct >= 25 ? C.green : r.margenPct >= 10 ? C.amber : C.red }}>
                {r.margenPct.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
        <div style={{ display: "grid", gridTemplateColumns: GRID,
          padding: "11px 16px", background: C.surface, borderTop: `1px solid ${C.border}` }}>
          <div style={{ color: C.text, fontWeight: 800 }}>TOTAL</div>
          <div style={{ fontFamily: MONO, fontWeight: 700, color: C.text }}>{num(arr.reduce((s, r) => s + r.vol, 0))}</div>
          <div style={{ fontFamily: MONO, fontWeight: 700, color: C.text }}>{clp(totalMonto)}</div>
          <div style={{ fontFamily: MONO, fontWeight: 700, color: C.muted }}>{clp(totalCosto)}</div>
          <div />
          <div style={{ fontFamily: MONO, fontWeight: 700, color: C.green }}>{clp(totalMargen)}</div>
          <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 800,
            color: totalPct >= 20 ? C.green : C.amber }}>{totalPct.toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ productos, seleccionado, onSelect }) {
  const [buscar, setBuscar] = useState("");

  const filtrados = useMemo(() =>
    productos.filter((p) =>
      p.nombre.toLowerCase().includes(buscar.toLowerCase()) ||
      p.codigo.toLowerCase().includes(buscar.toLowerCase())
    ), [productos, buscar]
  );

  const totalStock = productos.reduce((s, p) => s + (p.totalHaber || 0), 0);

  return (
    <div style={{ width: 240, flexShrink: 0, background: C.surface,
      borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column",
      height: "100vh", position: "sticky", top: 0, overflow: "hidden" }}>

      {/* Logo */}
      <div style={{ padding: "16px 14px 12px", borderBottom: `1px solid ${C.border}` }}>
        <Logo size={26} />
        <div style={{ color: C.muted, fontSize: 10, marginTop: 6, letterSpacing: 1 }}>
          KARDEX 2026 · {productos.length} productos
        </div>
      </div>

      {/* Búsqueda */}
      <div style={{ padding: "10px 12px" }}>
        <input value={buscar} onChange={(e) => setBuscar(e.target.value)}
          placeholder="Buscar producto..."
          style={{ width: "100%", background: C.card, border: `1px solid ${C.border}`,
            color: C.text, borderRadius: 7, padding: "6px 10px", fontSize: 11,
            fontFamily: FONT, outline: "none" }} />
      </div>

      {/* Lista */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {filtrados.map((p) => {
          const activo = seleccionado?.slug === p.slug;
          return (
            <button key={p.slug} onClick={() => onSelect(p)}
              style={{ width: "100%", display: "flex", alignItems: "flex-start", gap: 8,
                padding: "10px 14px", background: activo ? C.card : "transparent",
                border: "none", borderLeft: `3px solid ${activo ? C.accent : "transparent"}`,
                borderRight: "none", borderTop: "none", borderBottom: `1px solid ${C.border}22`,
                cursor: "pointer", textAlign: "left", transition: "all 0.1s" }}
              onMouseEnter={(e) => { if (!activo) e.currentTarget.style.background = C.card + "88"; }}
              onMouseLeave={(e) => { if (!activo) e.currentTarget.style.background = "transparent"; }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: activo ? C.text : C.sub, fontSize: 11, fontWeight: 600,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {p.nombre}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 3, alignItems: "center" }}>
                  <span style={{ color: C.accent, fontSize: 9, fontFamily: MONO, fontWeight: 700 }}>
                    {p.codigo}
                  </span>
                  <span style={{ color: C.muted, fontSize: 9 }}>
                    {new Intl.NumberFormat("es-CL").format(Math.round(p.stockActual))} {p.unidad}
                  </span>
                </div>
              </div>
              {p.stockActual > 0 && (
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green,
                  marginTop: 4, flexShrink: 0 }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer resumen */}
      <div style={{ padding: "12px 14px", borderTop: `1px solid ${C.border}` }}>
        <div style={{ color: C.muted, fontSize: 9, textTransform: "uppercase", letterSpacing: 1 }}>
          Ventas totales 2026
        </div>
        <div style={{ color: C.teal, fontWeight: 800, fontSize: 14, fontFamily: MONO, marginTop: 2 }}>
          {clp(totalStock)}
        </div>
      </div>
    </div>
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
const VISTAS = [
  { id: "resumen",     label: "Resumen",     icon: "▦" },
  { id: "movimientos", label: "Movimientos", icon: "≡" },
  { id: "margen",      label: "Márgenes",    icon: "◈" },
];

export default function App() {
  const [index, setIndex]         = useState(null);
  const [selMeta, setSelMeta]     = useState(null);
  const [producto, setProducto]   = useState(null);
  const [vista, setVista]         = useState("resumen");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  // Cargar índice al montar
  useEffect(() => {
    fetch("./data/index.json")
      .then((r) => r.json())
      .then((data) => {
        setIndex(data);
        if (data.productos.length > 0) setSelMeta(data.productos[0]);
      })
      .catch(() => setError("No se pudo cargar el índice de productos. Ejecuta sync.py primero."));
  }, []);

  // Cargar producto al seleccionar
  useEffect(() => {
    if (!selMeta) return;
    setLoading(true);
    setProducto(null);
    fetch(`./data/${selMeta.slug}.json`)
      .then((r) => r.json())
      .then((data) => { setProducto(data); setLoading(false); })
      .catch(() => { setError("Error cargando producto."); setLoading(false); });
  }, [selMeta]);

  if (error) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
        height: "100vh", flexDirection: "column", gap: 12 }}>
        <Logo size={36} />
        <div style={{ color: C.red, fontSize: 14, marginTop: 16 }}>{error}</div>
      </div>
    );
  }

  if (!index) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div style={{ color: C.muted, fontSize: 13 }}>Cargando...</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: C.bg }}>
      <Sidebar
        productos={index.productos}
        seleccionado={selMeta}
        onSelect={(p) => { setSelMeta(p); setVista("resumen"); }}
      />

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`,
          padding: "0 20px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", height: 52 }}>
            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 20 }}>
              <span style={{ color: C.muted, fontSize: 12 }}>Kardex</span>
              <span style={{ color: C.muted, fontSize: 12 }}>›</span>
              <span style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>
                {selMeta?.nombre ?? "—"}
              </span>
              {selMeta && (
                <span style={{ background: C.card, color: C.accent, border: `1px solid ${C.border}`,
                  borderRadius: 4, padding: "1px 7px", fontSize: 10, fontFamily: MONO, fontWeight: 700 }}>
                  {selMeta.codigo}
                </span>
              )}
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 2 }}>
              {VISTAS.map((v) => (
                <button key={v.id} onClick={() => setVista(v.id)}
                  style={{ background: "transparent",
                    borderBottom: vista === v.id ? `2px solid ${C.accent}` : "2px solid transparent",
                    borderTop: "2px solid transparent", borderLeft: "none", borderRight: "none",
                    color: vista === v.id ? C.accent : C.muted,
                    padding: "0 16px", height: 52, fontFamily: FONT,
                    fontWeight: vista === v.id ? 700 : 400,
                    fontSize: 13, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10 }}>{v.icon}</span>{v.label}
                </button>
              ))}
            </div>

            {/* Stock badge */}
            {producto && (
              <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: C.teal, fontWeight: 800, fontSize: 16, fontFamily: MONO }}>
                    {num(producto.stockActual)} {producto.unidad}
                  </div>
                  <div style={{ color: C.muted, fontSize: 10 }}>
                    Stock · PMP ${num(producto.pmpActual, 0)}/{producto.unidad}
                  </div>
                </div>
                <div style={{ width: 8, height: 8, borderRadius: "50%",
                  background: producto.stockActual > 0 ? C.green : C.amber,
                  boxShadow: `0 0 6px ${producto.stockActual > 0 ? C.green : C.amber}` }} />
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {loading && (
            <div style={{ color: C.muted, fontSize: 13, padding: 40 }}>Cargando producto...</div>
          )}
          {!loading && producto && (
            <>
              {vista === "resumen"     && <VistaResumen     producto={producto} />}
              {vista === "movimientos" && <VistaMovimientos producto={producto} />}
              {vista === "margen"      && <VistaMargen      producto={producto} />}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${C.border}`, padding: "6px 20px",
          display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ color: C.muted, fontSize: 10 }}>
            Generado: {index.generado?.split("T")[0] ?? "—"}
          </div>
          <div style={{ color: C.muted, fontSize: 10, marginLeft: "auto" }}>
            {index.total} productos · Surquimica Kardex 2026
          </div>
        </div>
      </div>
    </div>
  );
}
