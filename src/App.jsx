import { useState, useEffect, useMemo, useContext, createContext } from "react";

// Contextos globales cargados una vez en App
const BodegaCtx  = createContext(null);
const PreciosCtx = createContext(null);

// ─── TOKENS ──────────────────────────────────────────────────────────────────
const C = {
  bg:      "#07111E",
  surface: "#0D1F33",
  card:    "#102340",
  border:  "#1B3A6B44",
  line:    "#1B3A6B",
  accent:  "#1E7FC2",
  teal:    "#0ECFB4",
  green:   "#4CAF50",
  amber:   "#D29922",
  red:     "#F85149",
  text:    "#E6EDF3",
  sub:     "#8B9DB5",
  muted:   "#4A5A70",
};
const FONT = "'IBM Plex Sans','Segoe UI',sans-serif";
const MONO = "'IBM Plex Mono','Fira Code',monospace";

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const clp = (n) =>
  new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(n??0);
const num = (n, dec=0) =>
  new Intl.NumberFormat("es-CL",{maximumFractionDigits:dec}).format(n??0);
const fmtFecha = (iso) => {
  if (!iso) return "—";
  const [y,m,d] = iso.split("-");
  return `${d}-${m}-${y}`;
};
const corto = (s) =>
  (s||"").replace("SERVICIOS SANITARIOS ","SS ")
         .replace(" S.A.","").replace(" S.A","").replace(" LTDA","").replace(" SPA","").trim();

// ─── LOGO ─────────────────────────────────────────────────────────────────────
function Logo({ size=28 }) {
  const fs = size * 0.48;
  const py = size * 0.1, px = size * 0.18;
  const r  = size * 0.15;
  return (
    <div style={{display:"flex",alignItems:"center",fontWeight:900,fontSize:fs,lineHeight:1,letterSpacing:-0.5}}>
      <span style={{color:C.navy||"#1B3A6B",background:"#fff",padding:`${py}px ${px}px`,
        borderRadius:`${r}px 0 0 ${r}px`,color:"#1B3A6B"}}>Sur</span>
      <span style={{color:"#fff",background:C.accent,padding:`${py}px ${px*0.7}px`}}>Q</span>
      <span style={{color:"#1B3A6B",background:"#fff",padding:`${py}px ${px}px`,
        borderRadius:`0 ${r}px ${r}px 0`}}>uímica</span>
    </div>
  );
}

// ─── PRIMITIVOS ───────────────────────────────────────────────────────────────
function Tag({ label }) {
  const s = label==="Venta"
    ? {bg:"#0D2A1A",color:C.green,  border:"#1A4A2A"}
    : {bg:"#0D1F3A",color:C.accent, border:"#1A3A5A"};
  return (
    <span style={{background:s.bg,color:s.color,border:`1px solid ${s.border}`,
      padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:700,fontFamily:MONO,letterSpacing:0.5}}>
      {label}
    </span>
  );
}

function KPI({ label, value, sub, color, mono }) {
  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,
      padding:"14px 16px",display:"flex",flexDirection:"column",gap:4}}>
      <div style={{color:C.muted,fontSize:10,textTransform:"uppercase",letterSpacing:1.2}}>{label}</div>
      <div style={{color:color??C.text,fontWeight:800,fontSize:18,fontFamily:mono?MONO:FONT}}>{value}</div>
      {sub && <div style={{color:C.sub,fontSize:11}}>{sub}</div>}
    </div>
  );
}

function Spark({ points, color, h=32, w=100 }) {
  if (!points||points.length<2) return null;
  const max=Math.max(...points), min=Math.min(...points), range=max-min||1;
  const xs=points.map((_,i)=>(i/(points.length-1))*w);
  const ys=points.map(p=>h-((p-min)/range)*(h-4)-2);
  const d=xs.map((x,i)=>`${i===0?"M":"L"}${x},${ys[i]}`).join(" ");
  return (
    <svg width={w} height={h} style={{overflow:"visible"}}>
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round"/>
      <circle cx={xs[xs.length-1]} cy={ys[ys.length-1]} r={2.5} fill={color}/>
    </svg>
  );
}

// ─── PANEL STOCK BODEGA ───────────────────────────────────────────────────────
function PanelBodega({ slug, unidad }) {
  const bodega = useContext(BodegaCtx);
  if (!bodega) return null;
  const b = bodega.productos?.[slug];
  if (!b) return null;

  const mayo = b.mayo;
  const abril = b.abril;
  if (!mayo && !abril) return null;

  const ultimo = mayo?.fisico != null ? mayo : abril;
  const fisico = ultimo?.fisico ?? 0;
  const diff   = ultimo?.diferencia ?? 0;
  const obs    = ultimo?.obs;
  const fecha  = ultimo?.fecha;

  const diffColor = diff === 0 ? C.green : Math.abs(diff) < 500 ? C.amber : C.red;
  const diffLabel = diff > 0 ? `+${num(diff)}` : num(diff);

  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:16}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div style={{color:C.muted,fontSize:10,textTransform:"uppercase",letterSpacing:1.2}}>
          Inventario Bodega
        </div>
        <div style={{color:C.muted,fontSize:10}}>{fmtFecha(fecha)}</div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
        {/* Stock físico */}
        <div style={{background:C.surface,borderRadius:8,padding:"10px 12px"}}>
          <div style={{color:C.muted,fontSize:9,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Físico bodega</div>
          <div style={{color:C.text,fontWeight:800,fontSize:18,fontFamily:MONO}}>{num(fisico)}</div>
          <div style={{color:C.sub,fontSize:10}}>{unidad}</div>
        </div>

        {/* Stock Kardex (teórico) */}
        <div style={{background:C.surface,borderRadius:8,padding:"10px 12px"}}>
          <div style={{color:C.muted,fontSize:9,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Softland / Kardex</div>
          <div style={{color:C.accent,fontWeight:800,fontSize:18,fontFamily:MONO}}>{num(ultimo?.softland ?? 0)}</div>
          <div style={{color:C.sub,fontSize:10}}>{unidad}</div>
        </div>

        {/* Diferencia */}
        <div style={{background:C.surface,borderRadius:8,padding:"10px 12px",
          border:`1px solid ${diff===0?C.green+"44":Math.abs(diff)<500?C.amber+"44":C.red+"44"}`}}>
          <div style={{color:C.muted,fontSize:9,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Diferencia</div>
          <div style={{color:diffColor,fontWeight:800,fontSize:18,fontFamily:MONO}}>{diffLabel}</div>
          <div style={{color:diffColor,fontSize:10}}>{diff===0?"✓ Sin diferencia":"Físico vs Softland"}</div>
        </div>
      </div>

      {/* Comparación Abril */}
      {abril && (
        <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${C.border}`}}>
          <div style={{color:C.muted,fontSize:10,marginBottom:6}}>Conteo anterior — {fmtFecha(abril.fecha)}</div>
          <div style={{display:"flex",gap:16}}>
            <span style={{color:C.sub,fontSize:11,fontFamily:MONO}}>Físico: {num(abril.fisico ?? 0)}</span>
            <span style={{color:C.sub,fontSize:11,fontFamily:MONO}}>Softland: {num(abril.softland ?? 0)}</span>
            <span style={{color:abril.diferencia===0?C.green:C.amber,fontSize:11,fontFamily:MONO}}>
              Δ {abril.diferencia > 0 ? `+${num(abril.diferencia)}` : num(abril.diferencia ?? 0)}
            </span>
          </div>
          {abril.obs && <div style={{color:C.amber,fontSize:11,marginTop:4}}>⚠ {abril.obs}</div>}
        </div>
      )}

      {obs && <div style={{color:C.amber,fontSize:11,marginTop:8}}>⚠ {obs}</div>}
    </div>
  );
}

// ─── VISTA RESUMEN ────────────────────────────────────────────────────────────
function VistaResumen({ p }) {
  const preciosCtx = useContext(PreciosCtx);
  const ventas  = p.movimientos.filter(m=>m.tipo==="Venta");
  const compras = p.movimientos.filter(m=>m.tipo==="Compra");

  const porCliente = {};
  ventas.forEach(v=>{
    if(!porCliente[v.cliente]) porCliente[v.cliente]={vol:0,monto:0,n:0};
    porCliente[v.cliente].vol   += v.salida;
    porCliente[v.cliente].monto += v.haber;
    porCliente[v.cliente].n++;
  });
  const cli = Object.entries(porCliente)
    .map(([k,v])=>({cliente:k,...v}))
    .sort((a,b)=>b.vol-a.vol);
  const maxVol = cli[0]?.vol||1;

  // Margen: usa precios acordados si existen (igual que VistaMargen)
  const preciosProd = preciosCtx?.productos?.[p.codigo] ?? null;
  const { totalIngreso, totalCosto } = ventas.reduce((acc, v) => {
    const ac = preciosProd
      ? Object.keys(preciosProd).find(n => n === v.cliente || v.cliente.includes(n) || n.includes(v.cliente))
      : null;
    const acuerdo = ac ? preciosProd[ac] : null;
    if (acuerdo?.precio_venta != null && acuerdo?.pmp_ultimo != null) {
      const vol = acuerdo.cantidad ?? v.salida;
      acc.totalIngreso += acuerdo.precio_venta * vol;
      acc.totalCosto   += acuerdo.pmp_ultimo   * vol;
    } else {
      acc.totalIngreso += v.haber;
      acc.totalCosto   += v.salida * v.pmp;
    }
    return acc;
  }, { totalIngreso: 0, totalCosto: 0 });
  const margen = totalIngreso - totalCosto;
  const mPct   = totalIngreso > 0 ? (margen / totalIngreso) * 100 : 0;

  const saldoEvol = p.movimientos.filter(m=>m.saldo_kg!=null).map(m=>m.saldo_kg);
  const pmpEvol   = p.movimientos.filter(m=>m.pmp>0).map(m=>m.pmp);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        <KPI label="Stock actual" value={`${num(p.stockActual)} ${p.unidad}`}
          sub={`Saldo: ${clp(p.saldoActualPesos)}`} color={C.teal}/>
        <KPI label="PMP actual" value={`$${num(p.pmpActual,2)}/${p.unidad}`}
          sub="Precio medio ponderado" color={C.accent} mono/>
        <KPI label="Vol. vendido 2026" value={`${num(p.totalSalidas)} ${p.unidad}`}
          sub={`${ventas.length} movimientos`} color={C.green}/>
        <KPI label="Margen bruto" value={`${mPct.toFixed(1)}%`}
          sub={clp(margen)} color={mPct>20?C.green:C.amber}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:14}}>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:16}}>
          <div style={{color:C.muted,fontSize:10,textTransform:"uppercase",letterSpacing:1.2,marginBottom:14}}>
            Volumen por cliente
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {cli.map(c=>(
              <div key={c.cliente}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{color:C.text,fontSize:12,fontWeight:600}}>{corto(c.cliente)}</span>
                  <span style={{color:C.sub,fontSize:11,fontFamily:MONO}}>
                    {num(c.vol)} {p.unidad} · {clp(c.monto)}
                  </span>
                </div>
                <div style={{background:C.line,borderRadius:99,height:5,overflow:"hidden"}}>
                  <div style={{width:`${(c.vol/maxVol)*100}%`,height:"100%",borderRadius:99,
                    background:`linear-gradient(90deg,${C.accent},${C.teal})`}}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:16,flex:1}}>
            <div style={{color:C.muted,fontSize:10,textTransform:"uppercase",letterSpacing:1.2,marginBottom:10}}>
              Evolución stock ({p.unidad})
            </div>
            <Spark points={saldoEvol} color={C.teal} h={50} w={220}/>
          </div>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:16,flex:1}}>
            <div style={{color:C.muted,fontSize:10,textTransform:"uppercase",letterSpacing:1.2,marginBottom:10}}>
              Evolución PMP ($/{p.unidad})
            </div>
            <Spark points={pmpEvol} color={C.amber} h={50} w={220}/>
            {pmpEvol.length>0&&(
              <div style={{color:C.muted,fontSize:10,marginTop:6}}>
                Rango: ${num(Math.min(...pmpEvol),0)} – ${num(Math.max(...pmpEvol),0)}
              </div>
            )}
          </div>
        </div>
      </div>

      <PanelBodega slug={p.codigo} unidad={p.unidad}/>

      {compras.length>0&&(
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:16}}>
          <div style={{color:C.muted,fontSize:10,textTransform:"uppercase",letterSpacing:1.2,marginBottom:12}}>
            Compras / Entradas
          </div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            {compras.map((c,i)=>(
              <div key={i} style={{background:C.surface,border:`1px solid ${C.border}`,
                borderRadius:8,padding:"10px 14px",minWidth:160,flex:"1 1 160px"}}>
                <div style={{color:C.accent,fontSize:11,fontWeight:700,marginBottom:4}}>{corto(c.cliente)}</div>
                <div style={{color:C.text,fontSize:16,fontWeight:800,fontFamily:MONO}}>
                  {num(c.entrada)} {p.unidad}
                </div>
                <div style={{color:C.sub,fontSize:11,marginTop:2}}>{fmtFecha(c.fecha)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── VISTA MOVIMIENTOS ────────────────────────────────────────────────────────
function VistaMovimientos({ p }) {
  const [filtroTipo,setFiltroTipo]     = useState("Todos");
  const [filtroCliente,setFiltroCliente] = useState("Todos");
  const [buscar,setBuscar]             = useState("");

  const clientes = useMemo(()=>
    ["Todos",...Array.from(new Set(p.movimientos.map(m=>m.cliente))).sort()],
    [p.movimientos]);

  const filtered = useMemo(()=>{
    let r=[...p.movimientos].reverse();
    if(filtroTipo!=="Todos") r=r.filter(m=>m.tipo===filtroTipo);
    if(filtroCliente!=="Todos") r=r.filter(m=>m.cliente===filtroCliente);
    if(buscar) r=r.filter(m=>
      m.detalle.toLowerCase().includes(buscar.toLowerCase())||
      m.cliente.toLowerCase().includes(buscar.toLowerCase())
    );
    return r;
  },[filtroTipo,filtroCliente,buscar,p.movimientos]);

  const GRID="90px 65px 140px 1fr 88px 88px 88px 108px";

  return (
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
        <input value={buscar} onChange={e=>setBuscar(e.target.value)}
          placeholder="Buscar cliente u OC..."
          style={{background:C.surface,border:`1px solid ${C.border}`,color:C.text,
            borderRadius:8,padding:"7px 12px",fontSize:12,outline:"none",width:200}}/>
        <div style={{display:"flex",gap:4}}>
          {["Todos","Venta","Compra"].map(f=>(
            <button key={f} onClick={()=>setFiltroTipo(f)}
              style={{background:filtroTipo===f?C.accent+"22":"transparent",
                border:`1px solid ${filtroTipo===f?C.accent:"transparent"}`,
                color:filtroTipo===f?C.accent:C.muted,
                borderRadius:6,padding:"5px 12px",fontSize:11,cursor:"pointer",fontWeight:600}}>
              {f}
            </button>
          ))}
        </div>
        <select value={filtroCliente} onChange={e=>setFiltroCliente(e.target.value)}
          style={{background:C.surface,border:`1px solid ${C.border}`,color:C.text,
            borderRadius:8,padding:"6px 10px",fontSize:11,outline:"none",maxWidth:220}}>
          {clientes.map(c=><option key={c} value={c}>{corto(c)}</option>)}
        </select>
        <div style={{color:C.muted,fontSize:11,marginLeft:"auto"}}>{filtered.length} mov.</div>
      </div>

      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:GRID,padding:"8px 14px",
          borderBottom:`1px solid ${C.border}`,background:C.surface}}>
          {["Fecha","Tipo","Cliente","Detalle",`Mov.(${p.unidad})`,`Saldo(${p.unidad})`,`PMP $/${p.unidad}`,"Monto $"].map(h=>(
            <div key={h} style={{color:C.muted,fontSize:10,textTransform:"uppercase",
              letterSpacing:0.8,fontFamily:MONO}}>{h}</div>
          ))}
        </div>
        <div style={{maxHeight:480,overflowY:"auto"}}>
          {filtered.map((m,i)=>{
            const v=m.tipo==="Venta";
            return (
              <div key={i} style={{display:"grid",gridTemplateColumns:GRID,
                padding:"9px 14px",borderBottom:`1px solid ${C.border}22`,
                background:i%2===0?"transparent":"#ffffff03",transition:"background 0.1s"}}
                onMouseEnter={e=>e.currentTarget.style.background=C.surface}
                onMouseLeave={e=>e.currentTarget.style.background=i%2===0?"transparent":"#ffffff03"}>
                <div style={{color:C.sub,fontSize:11,fontFamily:MONO}}>{fmtFecha(m.fecha)}</div>
                <div><Tag label={m.tipo}/></div>
                <div style={{color:C.text,fontSize:11,fontWeight:600,
                  overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{corto(m.cliente)}</div>
                <div style={{color:C.muted,fontSize:10,
                  overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.detalle}</div>
                <div style={{fontFamily:MONO,fontSize:12,color:v?C.red+"CC":C.green}}>
                  {v?`−${num(m.salida)}`:`+${num(m.entrada)}`}
                </div>
                <div style={{fontFamily:MONO,fontSize:12,color:C.text}}>
                  {m.saldo_kg!=null?num(m.saldo_kg):"—"}
                </div>
                <div style={{fontFamily:MONO,fontSize:11,color:C.sub}}>
                  {m.pmp>0?`$${num(m.pmp,0)}`:"—"}
                </div>
                <div style={{fontFamily:MONO,fontSize:11,color:v?C.green:C.accent}}>
                  {v?clp(m.haber):"—"}
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
function VistaMargen({ p }) {
  const preciosData = useContext(PreciosCtx);
  const preciosProd = preciosData?.productos?.[p.codigo] ?? null;

  const ventas = p.movimientos.filter(m=>m.tipo==="Venta");
  const por={};
  ventas.forEach(v=>{
    if(!por[v.cliente]) por[v.cliente]={vol:0,monto:0,costo:0,n:0};
    por[v.cliente].vol   +=v.salida;
    por[v.cliente].monto +=v.haber;
    por[v.cliente].costo +=v.salida*v.pmp;
    por[v.cliente].n++;
  });
  const arr=Object.entries(por).map(([k,v])=>{
    // Buscar coincidencia en precios acordados (comparación flexible)
    let acuerdo = null;
    if (preciosProd) {
      const key = Object.keys(preciosProd).find(name =>
        name === k || k.includes(name) || name.includes(k)
      );
      if (key) acuerdo = preciosProd[key];
    }
    const precioAcordado = acuerdo?.precio_venta ?? null;
    const pmpUltimo      = acuerdo?.pmp_ultimo   ?? null;
    const cantAcuerdo    = acuerdo?.cantidad      ?? v.vol;

    // Si tenemos datos acordados: ingreso = precio_venta × cantidad, costo = pmp_ultimo × cantidad
    const ingreso = precioAcordado != null
      ? precioAcordado * cantAcuerdo
      : v.monto;
    const costo = pmpUltimo != null
      ? pmpUltimo * cantAcuerdo
      : v.costo;
    const margenCalc = ingreso - costo;
    const mPct = ingreso > 0 ? (margenCalc / ingreso) * 100 : 0;

    return {
      cliente: k,
      vol: cantAcuerdo,
      ingreso,
      costo,
      margen: margenCalc,
      mPct,
      precioAcordado,
      pmpUltimo,
    };
  }).sort((a,b)=>b.ingreso-a.ingreso);

  const totM  = arr.reduce((s,r)=>s+r.ingreso,0);
  const totC  = arr.reduce((s,r)=>s+r.costo,0);
  const totMg = totM-totC;
  const totPct = totM>0?(totMg/totM)*100:0;
  const hayAcuerdos = arr.some(r=>r.precioAcordado!=null);

  // Columnas variables según si hay datos de precios acordados
  const GRID = hayAcuerdos
    ? "1.6fr 80px 110px 110px 95px 95px 90px"
    : "1.6fr 80px 108px 108px 90px 108px 90px";
  const headers = hayAcuerdos
    ? ["Cliente",`Vol(${p.unidad})`,"Ingreso","Costo",`P.venta/$${p.unidad}`,`PMP último/$${p.unidad}`,"Margen %"]
    : ["Cliente",`Vol(${p.unidad})`,"Ingreso","Costo",`P.vta/$${p.unidad}`,"Margen $","Margen %"];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{background:"#0A1F0A",border:`1px solid #2A5A2A`,borderRadius:8,
        padding:"10px 14px",fontSize:12,color:"#6EE68E"}}>
        {hayAcuerdos
          ? "Ingreso = precio acordado × cantidad. Costo = PMP último × cantidad. Margen % = (Ingreso − Costo) ÷ Ingreso."
          : "Ingreso = haber del Kardex. Costo = volumen × PMP al momento de venta."}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
        <KPI label="Margen bruto total" value={clp(totMg)}
          sub={`${totPct.toFixed(1)}% sobre ingresos`} color={totPct>20?C.green:C.amber}/>
        <KPI label="Ingresos totales" value={clp(totM)}
          sub={hayAcuerdos?"P.venta × cantidad":"Haber Kardex"} color={C.accent}/>
        <KPI label="Costo total" value={clp(totC)}
          sub={hayAcuerdos?"PMP último × cantidad":"Vol × PMP venta"} color={C.sub}/>
      </div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:GRID,padding:"8px 16px",
          borderBottom:`1px solid ${C.border}`,background:C.surface}}>
          {headers.map(h=>(
            <div key={h} style={{color:C.muted,fontSize:10,textTransform:"uppercase",
              letterSpacing:0.8,fontFamily:MONO}}>{h}</div>
          ))}
        </div>
        {arr.map((r,i)=>(
          <div key={r.cliente} style={{display:"grid",gridTemplateColumns:GRID,
            padding:"11px 16px",borderBottom:i<arr.length-1?`1px solid ${C.border}22`:"none",
            background:i%2===0?"transparent":"#ffffff03"}}>
            <div style={{color:C.text,fontWeight:600,fontSize:12,
              overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{corto(r.cliente)}</div>
            <div style={{fontFamily:MONO,fontSize:12,color:C.sub}}>{num(r.vol)}</div>
            <div style={{fontFamily:MONO,fontSize:12,color:C.text}}>{clp(r.ingreso)}</div>
            <div style={{fontFamily:MONO,fontSize:12,color:C.muted}}>{clp(r.costo)}</div>
            {hayAcuerdos ? (
              <>
                <div style={{fontFamily:MONO,fontSize:12,color:C.accent}}>
                  {r.precioAcordado!=null?`$${num(r.precioAcordado,0)}`:"—"}
                </div>
                <div style={{fontFamily:MONO,fontSize:12,color:C.sub}}>
                  {r.pmpUltimo!=null?`$${num(r.pmpUltimo,0)}`:"—"}
                </div>
              </>
            ) : (
              <>
                <div style={{fontFamily:MONO,fontSize:12,color:C.accent}}>${num(r.vol>0?r.ingreso/r.vol:0,0)}</div>
                <div style={{fontFamily:MONO,fontSize:12,color:r.margen>=0?C.green:C.red}}>{clp(r.margen)}</div>
              </>
            )}
            <div>
              <span style={{fontFamily:MONO,fontSize:14,fontWeight:800,
                color:r.mPct>=25?C.green:r.mPct>=10?C.amber:C.red}}>
                {r.mPct.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
        <div style={{display:"grid",gridTemplateColumns:GRID,padding:"11px 16px",
          background:C.surface,borderTop:`1px solid ${C.border}`}}>
          <div style={{color:C.text,fontWeight:800}}>TOTAL</div>
          <div style={{fontFamily:MONO,fontWeight:700,color:C.text}}>{num(arr.reduce((s,r)=>s+r.vol,0))}</div>
          <div style={{fontFamily:MONO,fontWeight:700,color:C.text}}>{clp(totM)}</div>
          <div style={{fontFamily:MONO,fontWeight:700,color:C.muted}}>{clp(totC)}</div>
          <div/><div/>
          <div style={{fontFamily:MONO,fontSize:14,fontWeight:800,
            color:totPct>=20?C.green:C.amber}}>{totPct.toFixed(1)}%</div>
        </div>
      </div>

      {/* Panel de precios acordados completo si hay datos */}
      {preciosProd && (
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:16}}>
          <div style={{color:C.muted,fontSize:10,textTransform:"uppercase",letterSpacing:1.2,marginBottom:12}}>
            Tabla de precios acordados (Enero–Abril 2026)
          </div>
          <div style={{display:"grid",gridTemplateColumns:"2fr 90px 100px 110px 100px",gap:0,
            background:C.surface,borderRadius:8,overflow:"hidden",border:`1px solid ${C.border}`}}>
            {["Cliente","Vol (kg)","PMP pond.","P.venta","Margen"].map(h=>(
              <div key={h} style={{padding:"7px 12px",color:C.muted,fontSize:10,
                textTransform:"uppercase",letterSpacing:0.8,fontFamily:MONO,
                borderBottom:`1px solid ${C.border}`}}>{h}</div>
            ))}
            {Object.entries(preciosProd).map(([nombre, d], i) => (
              <>
                <div key={nombre+"n"} style={{padding:"9px 12px",color:C.text,fontSize:11,fontWeight:600,
                  borderBottom:`1px solid ${C.border}22`}}>{corto(nombre)}</div>
                <div key={nombre+"v"} style={{padding:"9px 12px",fontFamily:MONO,fontSize:11,color:C.sub,
                  borderBottom:`1px solid ${C.border}22`}}>{d.cantidad!=null?num(d.cantidad,0):"—"}</div>
                <div key={nombre+"p"} style={{padding:"9px 12px",fontFamily:MONO,fontSize:11,color:C.muted,
                  borderBottom:`1px solid ${C.border}22`}}>{d.pmp_pond!=null?`$${num(d.pmp_pond,0)}`:"—"}</div>
                <div key={nombre+"pv"} style={{padding:"9px 12px",fontFamily:MONO,fontSize:12,fontWeight:700,color:C.accent,
                  borderBottom:`1px solid ${C.border}22`}}>{d.precio_venta!=null?`$${num(d.precio_venta,0)}`:"—"}</div>
                <div key={nombre+"m"} style={{padding:"9px 12px",fontFamily:MONO,fontSize:12,fontWeight:700,
                  color:d.margen!=null&&d.margen>0?C.green:C.muted,
                  borderBottom:`1px solid ${C.border}22`}}>{d.margen!=null?`$${num(d.margen,0)}`:"—"}</div>
              </>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
function Sidebar({ productos, selMeta, onSelect, modoEmpresa, onEmpresa, bodega }) {
  const [buscar,setBuscar]=useState("");
  const lista=useMemo(()=>
    productos.filter(p=>
      p.nombre.toLowerCase().includes(buscar.toLowerCase())||
      p.codigo.toLowerCase().includes(buscar.toLowerCase())
    ),[productos,buscar]);
  const totalVentas=productos.reduce((s,p)=>s+(p.totalHaber||0),0);

  return (
    <div style={{width:240,flexShrink:0,background:C.surface,
      borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",
      height:"100vh",position:"sticky",top:0,overflow:"hidden"}}>
      <div style={{padding:"16px 14px 12px",borderBottom:`1px solid ${C.border}`}}>
        <Logo size={24}/>
        <div style={{color:C.muted,fontSize:10,marginTop:6,letterSpacing:1}}>
          KARDEX 2026 · {productos.length} productos
        </div>
      </div>

      {/* Botón Por Empresa */}
      <button onClick={onEmpresa}
        style={{margin:"10px 12px 0",display:"flex",alignItems:"center",gap:8,
          padding:"9px 12px",borderRadius:8,cursor:"pointer",textAlign:"left",
          background:modoEmpresa?C.accent+"22":"transparent",
          border:`1px solid ${modoEmpresa?C.accent:C.border}`,
          color:modoEmpresa?C.accent:C.sub,transition:"all 0.15s"}}>
        <span style={{fontSize:14}}>🏢</span>
        <div>
          <div style={{fontSize:11,fontWeight:700}}>Por Empresa</div>
          <div style={{fontSize:9,color:modoEmpresa?C.accent+"99":C.muted}}>Vista cross-producto</div>
        </div>
      </button>

      <div style={{padding:"10px 12px"}}>
        <input value={buscar} onChange={e=>setBuscar(e.target.value)}
          placeholder="Buscar producto..."
          style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,
            color:C.text,borderRadius:7,padding:"6px 10px",fontSize:11,outline:"none"}}/>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        {lista.map(prod=>{
          const activo=!modoEmpresa&&selMeta?.slug===prod.slug;
          return (
            <button key={prod.slug} onClick={()=>onSelect(prod)}
              style={{width:"100%",display:"flex",alignItems:"flex-start",gap:8,
                padding:"10px 14px",
                background:activo?C.card:"transparent",
                border:"none",
                borderLeft:`3px solid ${activo?C.accent:"transparent"}`,
                borderBottom:`1px solid ${C.border}22`,
                cursor:"pointer",textAlign:"left",transition:"background 0.1s"}}
              onMouseEnter={e=>{if(!activo)e.currentTarget.style.background=C.card+"88";}}
              onMouseLeave={e=>{if(!activo)e.currentTarget.style.background="transparent";}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:activo?C.text:C.sub,fontSize:11,fontWeight:600,
                  whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                  {prod.nombre}
                </div>
                <div style={{display:"flex",gap:6,marginTop:3,alignItems:"center"}}>
                  <span style={{color:C.accent,fontSize:9,fontFamily:MONO,fontWeight:700}}>{prod.codigo}</span>
                  <span style={{color:C.muted,fontSize:9}}>
                    {new Intl.NumberFormat("es-CL").format(Math.round(prod.stockActual))} {prod.unidad}
                  </span>
                </div>
              </div>
              {(()=>{
                const b = bodega?.productos?.[prod.slug];
                const diff = b?.mayo?.diferencia ?? b?.abril?.diferencia;
                if (diff != null && diff !== 0) return (
                  <div title={`Diferencia bodega: ${diff>0?"+":""}${Math.round(diff)}`}
                    style={{width:7,height:7,borderRadius:"50%",
                      background:Math.abs(diff)<500?C.amber:C.red,
                      marginTop:3,flexShrink:0,boxShadow:`0 0 4px ${Math.abs(diff)<500?C.amber:C.red}`}}/>
                );
                if (prod.stockActual>0) return (
                  <div style={{width:6,height:6,borderRadius:"50%",background:C.green,marginTop:4,flexShrink:0}}/>
                );
                return null;
              })()}
            </button>
          );
        })}
      </div>
      <div style={{padding:"12px 14px",borderTop:`1px solid ${C.border}`}}>
        <div style={{color:C.muted,fontSize:9,textTransform:"uppercase",letterSpacing:1}}>Ventas totales 2026</div>
        <div style={{color:C.teal,fontWeight:800,fontSize:14,fontFamily:MONO,marginTop:2}}>{clp(totalVentas)}</div>
      </div>
    </div>
  );
}

// ─── VISTA: POR EMPRESA ───────────────────────────────────────────────────────
// Busca precio acordado para un cliente en un producto (comparación flexible)
function buscarAcuerdo(preciosData, slug, nombreEmpresa) {
  const prod = preciosData?.productos?.[slug];
  if (!prod) return null;
  const key = Object.keys(prod).find(name =>
    name === nombreEmpresa ||
    nombreEmpresa.includes(name) ||
    name.includes(nombreEmpresa)
  );
  return key ? prod[key] : null;
}

// Calcula ingreso y costo usando precios acordados si existen, o datos Kardex si no
function calcMargen(prod, acuerdo) {
  if (acuerdo?.precio_venta != null && acuerdo?.pmp_ultimo != null) {
    const vol     = acuerdo.cantidad ?? prod.vol;
    const ingreso = acuerdo.precio_venta * vol;
    const costo   = acuerdo.pmp_ultimo  * vol;
    return { ingreso, costo, margen: ingreso - costo, usaAcuerdo: true };
  }
  return { ingreso: prod.monto, costo: prod.costo ?? 0, margen: prod.monto - (prod.costo ?? 0), usaAcuerdo: false };
}

function VistaEmpresas({ onIrProducto }) {
  const precios               = useContext(PreciosCtx);
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [sel, setSel]         = useState(null);
  const [buscar, setBuscar]   = useState("");

  useEffect(() => {
    fetch("./data/empresas.json")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const empresas = useMemo(() => {
    if (!data) return [];
    const q = buscar.toLowerCase();
    return data.empresas.filter(e =>
      !q || e.nombre.toLowerCase().includes(q)
    );
  }, [data, buscar]);

  const maxHaber = useMemo(() => empresas[0]?.totalHaber || 1, [empresas]);

  if (loading) return <div style={{color:C.muted,fontSize:13,padding:40}}>Cargando empresas...</div>;
  if (!data)   return <div style={{color:C.red,fontSize:13,padding:40}}>No se encontró empresas.json — ejecuta sync.py primero.</div>;

  // ── Detalle empresa ──────────────────────────────────────────────────────
  if (sel) {
    const e = sel;
    return (
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {/* Breadcrumb */}
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button onClick={()=>setSel(null)}
            style={{background:"transparent",border:`1px solid ${C.border}`,
              color:C.accent,borderRadius:6,padding:"5px 12px",fontSize:12,
              fontFamily:FONT,cursor:"pointer"}}>
            ← Todas las empresas
          </button>
          <span style={{color:C.muted,fontSize:12}}>›</span>
          <span style={{color:C.text,fontWeight:700,fontSize:13}}>{e.nombre}</span>
        </div>

        {/* KPIs — recalcula con precios acordados si existen */}
        {(()=>{
          const totales = e.productos.reduce((acc, p) => {
            const ac = buscarAcuerdo(precios, p.slug, e.nombre);
            const m  = calcMargen(p, ac);
            acc.ingreso += m.ingreso;
            acc.costo   += m.costo;
            return acc;
          }, { ingreso: 0, costo: 0 });
          const totalMargen = totales.ingreso - totales.costo;
          const mPct = totales.ingreso > 0 ? (totalMargen / totales.ingreso) * 100 : 0;
          return (
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>
              <KPI label="Facturado total"      value={clp(e.totalHaber)}
                sub={`${num(e.nMovimientos)} movimientos`} color={C.teal}/>
              <KPI label="Costo total"          value={clp(totales.costo)}
                sub="PMP último × cantidad" color={C.sub}/>
              <KPI label="Margen bruto"         value={clp(totalMargen)}
                sub={`${mPct.toFixed(1)}% sobre ventas`} color={mPct>=20?C.green:C.amber}/>
              <KPI label="Productos distintos"  value={e.nProductos}
                sub="líneas de producto" color={C.accent}/>
              <KPI label="Última compra"        value={fmtFecha(e.ultimaFecha)}
                sub={`Primera: ${fmtFecha(e.primeraFecha)}`} color={C.amber}/>
            </div>
          );
        })()}

        {/* Tabla de productos */}
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden"}}>
          <div style={{display:"grid",
            gridTemplateColumns:"2fr 70px 115px 105px 95px 80px 80px",
            padding:"8px 16px",background:C.surface,borderBottom:`1px solid ${C.border}`}}>
            {["Producto","Unidad","Ingreso","Costo","Margen $","Margen %","Última fecha"].map(h=>(
              <div key={h} style={{color:C.muted,fontSize:10,textTransform:"uppercase",
                letterSpacing:0.8,fontFamily:MONO}}>{h}</div>
            ))}
          </div>
          {e.productos.map((p,i)=>{
            const pct    = e.totalHaber > 0 ? (p.monto / e.totalHaber * 100) : 0;
            const ac     = buscarAcuerdo(precios, p.slug, e.nombre);
            const m      = calcMargen(p, ac);
            const { ingreso, costo, margen } = m;
            const mPct   = ingreso > 0 ? (margen / ingreso) * 100 : 0;
            return (
              <div key={p.slug}
                style={{display:"grid",
                  gridTemplateColumns:"2fr 70px 115px 105px 95px 80px 80px",
                  padding:"11px 16px",
                  borderBottom:i<e.productos.length-1?`1px solid ${C.border}22`:"none",
                  background:i%2===0?"transparent":"#ffffff03",
                  cursor:"pointer",transition:"background 0.1s"}}
                onMouseEnter={ev=>ev.currentTarget.style.background=C.surface}
                onMouseLeave={ev=>ev.currentTarget.style.background=i%2===0?"transparent":"#ffffff03"}
                onClick={()=>onIrProducto(p.slug)}>
                <div>
                  <div style={{color:C.text,fontWeight:600,fontSize:12}}>{p.nombre}</div>
                  <div style={{marginTop:4,background:C.border,borderRadius:99,height:3,overflow:"hidden"}}>
                    <div style={{width:`${pct}%`,height:"100%",borderRadius:99,
                      background:`linear-gradient(90deg,${C.accent},${C.teal})`}}/>
                  </div>
                  <div style={{color:C.muted,fontSize:10,marginTop:2}}>{pct.toFixed(1)}% del facturado</div>
                </div>
                <div style={{fontFamily:MONO,fontSize:11,color:C.sub,alignSelf:"center"}}>{p.unidad}</div>
                <div style={{fontFamily:MONO,fontSize:12,color:C.text,alignSelf:"center"}}>{clp(ingreso)}</div>
                <div style={{fontFamily:MONO,fontSize:12,color:C.muted,alignSelf:"center"}}>{clp(costo)}</div>
                <div style={{fontFamily:MONO,fontSize:12,color:margen>=0?C.green:C.red,alignSelf:"center"}}>{clp(margen)}</div>
                <div style={{alignSelf:"center"}}>
                  <span style={{fontFamily:MONO,fontSize:13,fontWeight:800,
                    color:mPct>=25?C.green:mPct>=10?C.amber:C.red}}>
                    {mPct.toFixed(1)}%
                  </span>
                </div>
                <div style={{fontFamily:MONO,fontSize:11,color:C.sub,alignSelf:"center"}}>{fmtFecha(p.ultimaFecha)}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Lista de empresas ────────────────────────────────────────────────────
  return (
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {/* Buscador + resumen */}
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <input value={buscar} onChange={e=>setBuscar(e.target.value)}
          placeholder="Buscar empresa..."
          style={{background:C.surface,border:`1px solid ${C.border}`,color:C.text,
            borderRadius:8,padding:"7px 12px",fontSize:12,fontFamily:FONT,
            outline:"none",width:220}}/>
        <div style={{color:C.muted,fontSize:11}}>{empresas.length} empresas</div>
        <div style={{marginLeft:"auto",display:"flex",gap:16}}>
          <div style={{textAlign:"right"}}>
            <div style={{color:C.muted,fontSize:10,textTransform:"uppercase",letterSpacing:1}}>Total facturado</div>
            <div style={{color:C.teal,fontWeight:800,fontSize:15,fontFamily:MONO}}>
              {clp(data.empresas.reduce((s,e)=>s+e.totalHaber,0))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"2fr 115px 105px 75px 80px 80px",
          padding:"8px 16px",background:C.surface,borderBottom:`1px solid ${C.border}`}}>
          {["Empresa","Facturado","Margen $","Margen %","Prods.","Última venta"].map(h=>(
            <div key={h} style={{color:C.muted,fontSize:10,textTransform:"uppercase",
              letterSpacing:0.8,fontFamily:MONO}}>{h}</div>
          ))}
        </div>
        <div style={{maxHeight:"calc(100vh - 260px)",overflowY:"auto"}}>
          {empresas.map((e,i)=>{
            const pct = (e.totalHaber / maxHaber) * 100;
            const totales = e.productos.reduce((acc, p) => {
              const ac = buscarAcuerdo(precios, p.slug, e.nombre);
              const m  = calcMargen(p, ac);
              acc.ingreso += m.ingreso;
              acc.costo   += m.costo;
              return acc;
            }, { ingreso: 0, costo: 0 });
            const margen = totales.ingreso - totales.costo;
            const mPct   = totales.ingreso > 0 ? (margen / totales.ingreso) * 100 : 0;
            return (
              <div key={e.nombre}
                style={{display:"grid",gridTemplateColumns:"2fr 115px 105px 75px 80px 80px",
                  padding:"10px 16px",
                  borderBottom:i<empresas.length-1?`1px solid ${C.border}22`:"none",
                  background:i%2===0?"transparent":"#ffffff03",
                  cursor:"pointer",transition:"background 0.1s"}}
                onMouseEnter={ev=>ev.currentTarget.style.background=C.surface}
                onMouseLeave={ev=>ev.currentTarget.style.background=i%2===0?"transparent":"#ffffff03"}
                onClick={()=>setSel(e)}>
                <div>
                  <div style={{color:C.text,fontWeight:600,fontSize:12}}>{e.nombre}</div>
                  <div style={{marginTop:4,background:C.border,borderRadius:99,height:3,overflow:"hidden"}}>
                    <div style={{width:`${pct}%`,height:"100%",borderRadius:99,
                      background:`linear-gradient(90deg,${C.accent},${C.teal})`}}/>
                  </div>
                </div>
                <div style={{fontFamily:MONO,fontSize:12,color:C.text,alignSelf:"center"}}>{clp(e.totalHaber)}</div>
                <div style={{fontFamily:MONO,fontSize:12,color:margen>=0?C.green:C.red,alignSelf:"center"}}>{clp(margen)}</div>
                <div style={{alignSelf:"center"}}>
                  <span style={{fontFamily:MONO,fontSize:13,fontWeight:800,
                    color:mPct>=25?C.green:mPct>=10?C.amber:C.red}}>
                    {mPct.toFixed(1)}%
                  </span>
                </div>
                <div style={{fontFamily:MONO,fontSize:12,color:C.muted,alignSelf:"center",textAlign:"center"}}>{e.nProductos}</div>
                <div style={{fontFamily:MONO,fontSize:11,color:C.sub,alignSelf:"center"}}>{fmtFecha(e.ultimaFecha)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────
const VISTAS=[
  {id:"resumen",    label:"Resumen",     icon:"▦"},
  {id:"movimientos",label:"Movimientos", icon:"≡"},
  {id:"margen",     label:"Márgenes",    icon:"◈"},
];

function App() {
  const [index,setIndex]       = useState(null);
  const [selMeta,setSelMeta]   = useState(null);
  const [producto,setProducto] = useState(null);
  const [vista,setVista]       = useState("resumen");
  const [modoEmpresa,setModoEmpresa] = useState(false);
  const [loading,setLoading]   = useState(false);
  const [err,setErr]           = useState(null);
  const [bodega,setBodega]     = useState(null);
  const [precios,setPrecios]   = useState(null);

  useEffect(()=>{
    fetch("./data/index.json")
      .then(r=>{ if(!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d=>{setIndex(d);if(d.productos.length>0)setSelMeta(d.productos[0]);})
      .catch(e=>setErr(`Error cargando datos: ${e.message} — verifica que data/index.json existe.`));
    fetch("./data/bodega.json").then(r=>r.json()).then(setBodega).catch(()=>{});
    fetch("./data/precios.json").then(r=>r.json()).then(setPrecios).catch(()=>{});
  },[]);

  useEffect(()=>{
    if(!selMeta)return;
    setLoading(true);setProducto(null);
    fetch(`./data/${selMeta.slug}.json`)
      .then(r=>r.json())
      .then(d=>{setProducto(d);setLoading(false);})
      .catch(()=>{setErr("Error cargando producto.");setLoading(false);});
  },[selMeta]);

  if(err) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",
      height:"100vh",flexDirection:"column",gap:16}}>
      <Logo size={40}/>
      <div style={{color:C.red,fontSize:13,marginTop:8}}>{err}</div>
    </div>
  );

  if(!index) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh"}}>
      <div style={{color:C.muted,fontSize:13}}>Cargando...</div>
    </div>
  );

  return (
    <PreciosCtx.Provider value={precios}>
    <BodegaCtx.Provider value={bodega}>
    <div style={{display:"flex",height:"100vh",overflow:"hidden",background:C.bg}}>
      <Sidebar productos={index.productos} selMeta={modoEmpresa?null:selMeta}
        onSelect={p=>{setSelMeta(p);setVista("resumen");setModoEmpresa(false);}}
        modoEmpresa={modoEmpresa}
        onEmpresa={()=>setModoEmpresa(true)}
        bodega={bodega}/>

      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Topbar */}
        <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,
          padding:"0 20px",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",height:52}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginRight:20}}>
              <span style={{color:C.muted,fontSize:12}}>Kardex</span>
              <span style={{color:C.muted,fontSize:12}}>›</span>
              {modoEmpresa
                ? <span style={{color:C.text,fontSize:13,fontWeight:700}}>Por Empresa</span>
                : <>
                    <span style={{color:C.text,fontSize:13,fontWeight:700}}>{selMeta?.nombre??"—"}</span>
                    {selMeta&&(
                      <span style={{background:C.card,color:C.accent,border:`1px solid ${C.border}`,
                        borderRadius:4,padding:"1px 7px",fontSize:10,fontFamily:MONO,fontWeight:700}}>
                        {selMeta.codigo}
                      </span>
                    )}
                  </>
              }
            </div>
            {!modoEmpresa && (
              <div style={{display:"flex",gap:2}}>
                {VISTAS.map(v=>(
                  <button key={v.id} onClick={()=>setVista(v.id)}
                    style={{background:"transparent",
                      borderBottom:vista===v.id?`2px solid ${C.accent}`:"2px solid transparent",
                      borderTop:"2px solid transparent",borderLeft:"none",borderRight:"none",
                      color:vista===v.id?C.accent:C.muted,
                      padding:"0 16px",height:52,fontFamily:FONT,
                      fontWeight:vista===v.id?700:400,fontSize:13,cursor:"pointer",
                      display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:10}}>{v.icon}</span>{v.label}
                  </button>
                ))}
              </div>
            )}
            {!modoEmpresa && producto&&(
              <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
                <div style={{textAlign:"right"}}>
                  <div style={{color:C.teal,fontWeight:800,fontSize:16,fontFamily:MONO}}>
                    {num(producto.stockActual)} {producto.unidad}
                  </div>
                  <div style={{color:C.muted,fontSize:10}}>
                    Stock · PMP ${num(producto.pmpActual,0)}/{producto.unidad}
                  </div>
                </div>
                <div style={{width:8,height:8,borderRadius:"50%",
                  background:producto.stockActual>0?C.green:C.amber,
                  boxShadow:`0 0 6px ${producto.stockActual>0?C.green:C.amber}`}}/>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>
          {modoEmpresa
            ? <VistaEmpresas onIrProducto={slug=>{
                const meta = index.productos.find(p=>p.slug===slug);
                if(meta){setSelMeta(meta);setVista("resumen");setModoEmpresa(false);}
              }}/>
            : <>
                {loading&&<div style={{color:C.muted,fontSize:13,padding:40}}>Cargando producto...</div>}
                {!loading&&producto&&(
                  <>
                    {vista==="resumen"     &&<VistaResumen     p={producto}/>}
                    {vista==="movimientos" &&<VistaMovimientos p={producto}/>}
                    {vista==="margen"      &&<VistaMargen      p={producto}/>}
                  </>
                )}
              </>
          }
        </div>

        {/* Footer */}
        <div style={{borderTop:`1px solid ${C.border}`,padding:"6px 20px",
          display:"flex",gap:16,alignItems:"center"}}>
          <div style={{color:C.muted,fontSize:10}}>
            Datos: {index.generado?.split("T")[0]??"—"}
          </div>
          <div style={{color:C.muted,fontSize:10,marginLeft:"auto"}}>
            {index.total} productos · Surquimica Kardex 2026
          </div>
        </div>
      </div>
    </div>
    </BodegaCtx.Provider>
    </PreciosCtx.Provider>
  );
}

export default App;
