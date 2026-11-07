"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const modules = [
  { href: "/", label: "Ruleta", icon: "🎡" },
  { href: "/dados", label: "Dados", icon: "🎲" },
  { href: "/moneda", label: "Cara o Cruz", icon: "🪙" },
  { href: "/grupos", label: "Grupos", icon: "👥" },
  { href: "/sorteador", label: "Sorteador", icon: "🎯" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside style={{ position:"fixed", left:0, top:0, height:"100vh", width:260, background:"var(--panel)", borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", zIndex:10 }}>
      <div style={{ padding:"20px 18px", borderBottom:"1px solid var(--border)" }}>
        <h2 style={{ margin:0, fontSize:16, display:"flex", alignItems:"center", gap:8 }}>🎰 Sorteador</h2>
      </div>
      <nav style={{ flex:1, padding:"12px 10px", display:"flex", flexDirection:"column", gap:4 }}>
        {modules.map(m => (
          <Link key={m.href} href={m.href} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, textDecoration:"none", color: pathname===m.href?"var(--text)":"var(--muted)", background: pathname===m.href?"var(--panel-strong)":"transparent", transition:"all .15s" }}>
            <span>{m.icon}</span>
            <span style={{ fontSize:14, fontWeight:500 }}>{m.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
