import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  User,
  UserCheck,
  Laptop,
  Router,
  Share2,
  Cable,
  Server,
  Cloud,
  CloudCog,
  RadioTower,
  Smartphone,
  ShieldCheck,
  Skull,
  Youtube,
  Landmark,
  ChevronDown,
  Mail,
  Lock,
  KeyRound,
  Plus,
  Minus,
  Maximize,
  Sparkles,
  RotateCcw,
  Shuffle,
  Play,
  Download,
  Search,
  AlertTriangle,
  X,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  MonitorSmartphone,
  type LucideIcon,
} from "lucide-react";

/* ──────────────────────────────────────────────────────────────────────────
   Lumina Network Labs - Simulador Interactivo de Redes
   Un único App.tsx que concentra el estado y los componentes principales.
   Stack: React + Tailwind + Framer Motion + Lucide (ver docs/espec.md).
   ────────────────────────────────────────────────────────────────────────── */

// ── Tipos ───────────────────────────────────────────────────────────────────
type Mode = "basico" | "https" | "e2ee" | "vpn";

type NodeType =
  | "person"
  | "laptop"
  | "router"
  | "hub"
  | "cabling"
  | "isp"
  | "cloud-a"
  | "cloud-b"
  | "cell"
  | "smartphone"
  | "person2"
  | "vpn"
  | "youtube"
  | "gov"
  | "hacker";

interface NetNode {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  country?: string; // etiqueta de país (ej. servidor VPN en el extranjero)
}

interface Connection {
  from: string;
  to: string;
}

interface LogEntry {
  id: number;
  text: string;
  color: string;
  ms: number;
}

// ── Constantes de estilo ──────────────────────────────────────────────────────
const COLORS = {
  blue: "#0056d2",
  primary: "#0040a1",
  green: "#16a34a",
  amber: "#f59e0b",
  red: "#ba1a1a",
  purple: "#7c3aed",
};

// Colores para cada tramo cifrado (sesión TLS) en modo HTTPS.
const LEG_COLORS = ["#0056d2", "#16a34a", "#f59e0b", "#7c3aed", "#db2777", "#0891b2"];

// Extremos de cifrado en HTTPS: dispositivos y servidores (nubes). La
// infraestructura intermedia (módem, ISP, torres) solo transporta bytes.
const ENDPOINT_TYPES = new Set<NodeType>([
  "laptop",
  "smartphone",
  "cloud-a",
  "cloud-b",
  "youtube",
  "gov",
]);

// Tipos que pueden ser destino final de un envío.
const DEST_TYPES = new Set<NodeType>([
  "person2",
  "smartphone",
  "cloud-a",
  "cloud-b",
  "youtube",
  "gov",
]);

// Mensaje de ejemplo que viaja en el paquete.
const PLAINTEXT_MSG = "Hola Mundo, nos vemos a las 5pm. Clave wifi: 12345";

const CANVAS_W = 3000;
const CANVAS_H = 1100;
const NODE = 64; // tamaño del nodo (px)
const PACKET = 46; // tamaño del paquete (px)
const HOP_MS = 850; // duración de cada salto

// ── Catálogo de nodos (inventario) ───────────────────────────────────────────
interface InvItem {
  type: NodeType;
  label: string;
  icon: LucideIcon;
  desc: string;
  danger?: boolean;
}

const INVENTORY: InvItem[] = [
  { type: "person", label: "Persona 1", icon: User, desc: "Usuario que inicia la comunicación." },
  { type: "laptop", label: "Laptop", icon: Laptop, desc: "Dispositivo local de procesamiento." },
  { type: "router", label: "Módem/WiFi", icon: Router, desc: "Punto de acceso local a la red." },
  { type: "hub", label: "Colector", icon: Share2, desc: "Agregador de conexiones locales." },
  { type: "cabling", label: "Cableado", icon: Cable, desc: "Infraestructura física de transmisión." },
  { type: "isp", label: "ISP", icon: Server, desc: "Proveedor de Internet. Enruta los datos." },
  { type: "cloud-a", label: "Gmail", icon: Cloud, desc: "Servidor de aplicaciones en la nube." },
  { type: "cloud-b", label: "Hotmail", icon: CloudCog, desc: "Servidor de correo secundario." },
  { type: "cell", label: "Torre Celular", icon: RadioTower, desc: "Estación base inalámbrica." },
  { type: "smartphone", label: "Móvil", icon: Smartphone, desc: "Dispositivo receptor móvil." },
  { type: "person2", label: "Persona 2", icon: UserCheck, desc: "Destinatario final del mensaje." },
  { type: "vpn", label: "VPN", icon: ShieldCheck, desc: "Túnel cifrado de privacidad." },
  { type: "youtube", label: "YouTube", icon: Youtube, desc: "Servicio de video en internet." },
  { type: "gov", label: "Portal Gob", icon: Landmark, desc: "Portal de gobierno / trámites." },
  { type: "hacker", label: "Atacante MitM", icon: Skull, desc: "Entidad maliciosa interceptora.", danger: true },
];

const ICON_BY_TYPE: Record<NodeType, LucideIcon> = INVENTORY.reduce(
  (acc, it) => ({ ...acc, [it.type]: it.icon }),
  {} as Record<NodeType, LucideIcon>
);

const DESC_BY_TYPE: Record<NodeType, string> = INVENTORY.reduce(
  (acc, it) => ({ ...acc, [it.type]: it.desc }),
  {} as Record<NodeType, string>
);

// ── Telemetría por modo ───────────────────────────────────────────────────────
const MODE_META: Record<Mode, { latency: number; security: number; label: string }> = {
  basico: { latency: 12, security: 18, label: "Básica" },
  https: { latency: 18, security: 78, label: "HTTPS / TLS" },
  e2ee: { latency: 26, security: 99, label: "Extremo a Extremo" },
  vpn: { latency: 45, security: 88, label: "Túnel VPN" },
};

interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
}

// ── Generador de la secuencia de Auto-Armado ─────────────────────────────────
// Flujo completo (docs/espec.md): Persona1 → Laptop → Módem → Colector →
// Cableado → ISP → Gmail → Hotmail → ISP → Cableado → Torre Celular → Móvil → Persona2.
// El layout se ajusta a la región VISIBLE recibida (efecto "serpiente").
function buildSequence(mode: Mode, region: Region): { nodes: NetNode[]; connections: Connection[] } {
  // Fila superior (ida, izquierda → derecha)
  const top: Array<Omit<NetNode, "id" | "x" | "y">> = [
    { type: "person", label: "Persona 1" },
    { type: "laptop", label: "Laptop" },
    { type: "router", label: "Módem/WiFi" },
    { type: "hub", label: "Colector" },
    { type: "cabling", label: "Cableado" },
    { type: "isp", label: "ISP" },
    { type: "cloud-a", label: "Gmail" },
    { type: "cloud-b", label: "Hotmail" },
  ];
  // En modo VPN insertamos el nodo VPN tras el ISP de salida (el túnel
  // cubrirá el tramo Laptop → VPN).
  if (mode === "vpn") top.splice(6, 0, { type: "vpn", label: "VPN" });

  // Fila inferior (regreso, derecha → izquierda) - efecto "serpiente"
  const bottom: Array<Omit<NetNode, "id" | "x" | "y">> = [
    { type: "isp", label: "ISP" },
    { type: "cabling", label: "Cableado" },
    { type: "cell", label: "Torre Celular" },
    { type: "smartphone", label: "Móvil" },
    { type: "person2", label: "Persona 2" },
  ];

  const padL = 60;
  const padR = 60;
  const padT = 60;
  const padB = 170; // espacio para el selector de modos
  const cols = top.length;
  const usableW = Math.max(NODE, region.w - padL - padR);
  const colGap = cols > 1 ? (usableW - NODE) / (cols - 1) : 0;
  const xAt = (c: number) => region.x + padL + c * colGap;
  const topY = region.y + padT;
  const bottomY = region.y + Math.max(padT + 200, region.h - padB - NODE);

  const nodes: NetNode[] = [];
  top.forEach((n, i) => nodes.push({ ...n, id: `auto-t${i}`, x: xAt(i), y: topY }));
  // La fila inferior ocupa las columnas más a la derecha, en orden inverso.
  bottom.forEach((n, i) =>
    nodes.push({ ...n, id: `auto-b${i}`, x: xAt(Math.max(0, cols - 1 - i)), y: bottomY })
  );

  const connections: Connection[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    connections.push({ from: nodes[i].id, to: nodes[i + 1].id });
  }
  return { nodes, connections };
}

// ── Helpers geométricos ───────────────────────────────────────────────────────
const center = (n: NetNode) => ({ x: n.x + NODE / 2, y: n.y + NODE / 2 });

// Elige el nodo de origen: Persona 1 si existe; si no, un extremo (un solo
// cable); si no, el primer nodo. Así no depende del orden de creación.
function pickStart(nodes: NetNode[], connections: Connection[]): NetNode | null {
  if (nodes.length === 0) return null;
  const degree = (id: string) =>
    connections.filter((c) => c.from === id || c.to === id).length;
  return (
    nodes.find((n) => n.type === "person") ??
    nodes.find((n) => degree(n.id) === 1) ??
    nodes[0]
  );
}

// Ruta más corta (BFS) entre dos nodos; null si no hay camino. Soporta
// topologías ramificadas (un nodo con varias salidas).
function bfsPath(
  nodes: NetNode[],
  connections: Connection[],
  fromId: string,
  toId: string
): NetNode[] | null {
  const adj = new Map<string, string[]>();
  nodes.forEach((n) => adj.set(n.id, []));
  connections.forEach((c) => {
    adj.get(c.from)?.push(c.to);
    adj.get(c.to)?.push(c.from);
  });
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const prev = new Map<string, string | null>();
  prev.set(fromId, null);
  const queue = [fromId];
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === toId) break;
    for (const nb of adj.get(cur) ?? []) {
      if (!prev.has(nb)) {
        prev.set(nb, cur);
        queue.push(nb);
      }
    }
  }
  if (!prev.has(toId)) return null;
  const path: NetNode[] = [];
  let c: string | null = toId;
  while (c != null) {
    const n = byId.get(c);
    if (n) path.unshift(n);
    c = prev.get(c) ?? null;
  }
  return path;
}

// Recorre la cadena lineal de conexiones desde el origen (sin ramas).
function findPath(nodes: NetNode[], connections: Connection[]): NetNode[] {
  if (nodes.length === 0) return [];
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const start = pickStart(nodes, connections)!;
  const path: NetNode[] = [start];
  const visited = new Set([start.id]);
  let current = start;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const conn = connections.find(
      (c) =>
        (c.from === current.id && !visited.has(c.to)) ||
        (c.to === current.id && !visited.has(c.from))
    );
    if (!conn) break;
    const nextId = conn.from === current.id ? conn.to : conn.from;
    const next = byId.get(nextId);
    if (!next) break;
    path.push(next);
    visited.add(next.id);
    current = next;
  }
  return path;
}

// ¿Este nodo lleva una llave visible en este modo?
function keysForNode(node: NetNode, mode: Mode): string[] {
  if (mode === "e2ee") {
    if (node.type === "laptop" || node.type === "smartphone" || node.type === "person2")
      return [COLORS.amber];
  }
  if (mode === "vpn") {
    if (node.type === "laptop" || node.type === "vpn") return [COLORS.purple];
  }
  return [];
}

const uid = () => Math.random().toString(36).slice(2, 8);

// ════════════════════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [nodes, setNodes] = useState<NetNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [mode, setMode] = useState<Mode>("basico");
  const [zoom, setZoom] = useState(1);

  // Destino elegido (click en un servicio) y menú de escenarios.
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [scenarioOpen, setScenarioOpen] = useState(false);

  // Conexión por arrastre desde el puerto del nodo.
  const [linking, setLinking] = useState<string | null>(null); // id del nodo origen
  const [linkPos, setLinkPos] = useState({ x: 0, y: 0 }); // punta del cable (coords lienzo)
  const [linkHoverId, setLinkHoverId] = useState<string | null>(null); // destino bajo el cursor

  const [simulating, setSimulating] = useState(false);
  const [packetVisible, setPacketVisible] = useState(false);
  const [packetPos, setPacketPos] = useState({ x: 0, y: 0 });
  // Segmento activo durante el recorrido, identificado por los ids de sus dos
  // nodos (no por índice, para que no se desfase al modificar conexiones).
  const [activeEdge, setActiveEdge] = useState<[string, string] | null>(null);
  // Índice del tramo cifrado (leg) por el que viaja el paquete, en HTTPS.
  const [activeLeg, setActiveLeg] = useState<number | null>(null);
  const [delivered, setDelivered] = useState({ done: 0, total: 0 });
  const [packetsSent, setPacketsSent] = useState(0);

  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Interceptación MitM: pausa la simulación y muestra lo que ve el atacante.
  const [interception, setInterception] = useState<{ readable: boolean } | null>(null);
  const resumeRef = useRef<(() => void) | null>(null);

  // Explicación (modal con pausa) cuando el paquete llega a una llave en HTTPS.
  const [keyExplain, setKeyExplain] = useState<{
    title: string;
    text: string;
    color: string;
    readable: boolean; // ¿se ve el contenido en claro en este punto?
    reencrypts: boolean; // ¿lo vuelve a cifrar para reenviarlo?
  } | null>(null);

  // Identificador de corrida para poder cancelar una simulación en curso.
  const simRunRef = useRef(0);
  // Destello rojo en los cables cuando el flujo es inválido.
  const [errorFlash, setErrorFlash] = useState(false);

  const [invOpen, setInvOpen] = useState(true);
  const [logOpen, setLogOpen] = useState(true);

  // Detección de pantalla pequeña (herramienta de escritorio).
  const MIN_W = 1024;
  const MIN_H = 600;
  const [tooSmall, setTooSmall] = useState(
    () => window.innerWidth < MIN_W || window.innerHeight < MIN_H
  );
  useEffect(() => {
    const onResize = () =>
      setTooSmall(window.innerWidth < MIN_W || window.innerHeight < MIN_H);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Enter o Espacio continúan cuando hay un modal de pausa abierto.
  useEffect(() => {
    if (!interception && !keyExplain) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.code === "Space") {
        e.preventDefault();
        resumeSim();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interception, keyExplain]);

  const canvasRef = useRef<HTMLDivElement>(null);
  const logSeq = useRef(0);

  const encrypted = mode !== "basico";
  const meta = MODE_META[mode];

  // ── Logging ────────────────────────────────────────────────────────────────
  const addLog = useCallback((text: string, color: string, ms: number) => {
    setLogs((prev) => [{ id: logSeq.current++, text, color, ms }, ...prev].slice(0, 60));
  }, []);

  // ── Manipulación de nodos ────────────────────────────────────────────────────
  const addNode = useCallback(
    (type: NodeType, label: string, x: number, y: number, id?: string): NetNode => {
      const node: NetNode = { id: id ?? `n-${uid()}`, type, label, x, y };
      setNodes((prev) => [...prev, node]);
      return node;
    },
    []
  );

  const removeNode = useCallback((id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setConnections((prev) => prev.filter((c) => c.from !== id && c.to !== id));
  }, []);

  const removeConnection = useCallback((index: number) => {
    setConnections((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ── Drag desde el inventario hacia el lienzo ─────────────────────────────────
  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData("type") as NodeType;
      const label = e.dataTransfer.getData("label");
      if (!type) return;
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = (e.clientX - rect.left + canvasRef.current!.scrollLeft) / zoom - NODE / 2;
      const y = (e.clientY - rect.top + canvasRef.current!.scrollTop) / zoom - NODE / 2;
      addNode(type, label, Math.max(0, x), Math.max(0, y));
    },
    [addNode, zoom]
  );

  // zoom en ref para que el handler de drag siempre vea el valor actual
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  // Convierte coordenadas de pantalla a coordenadas del lienzo (scroll + zoom).
  const clientToCanvas = useCallback((cx: number, cy: number) => {
    const el = canvasRef.current;
    const z = zoomRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    return {
      x: (cx - rect.left + el.scrollLeft) / z,
      y: (cy - rect.top + el.scrollTop) / z,
    };
  }, []);

  // Devuelve el id del nodo bajo un punto de pantalla, si hay alguno.
  const nodeIdAt = (cx: number, cy: number): string | null => {
    const el = document.elementFromPoint(cx, cy) as HTMLElement | null;
    return el?.closest("[data-node-id]")?.getAttribute("data-node-id") ?? null;
  };

  // Región VISIBLE del lienzo en sus propias coordenadas (considera scroll y zoom).
  const getRegion = useCallback((): Region => {
    const el = canvasRef.current;
    const z = zoomRef.current;
    return {
      x: (el?.scrollLeft ?? 0) / z,
      y: (el?.scrollTop ?? 0) / z,
      w: (el?.clientWidth ?? 1000) / z,
      h: (el?.clientHeight ?? 640) / z,
    };
  }, []);

  // ── Reposicionar nodos ya colocados (pointer drag, corrige por zoom) ─────────
  // Usamos listeners en window para que el arrastre no se pierda aunque el
  // puntero salga del nodo. Marca si hubo movimiento para no disparar el click.
  const startNodeDrag = useCallback(
    (e: React.PointerEvent, node: NetNode) => {
      if (simulating) return;
      e.preventDefault();
      e.stopPropagation();
      let ox = e.clientX;
      let oy = e.clientY;

      const onMove = (ev: PointerEvent) => {
        const dx = (ev.clientX - ox) / zoomRef.current;
        const dy = (ev.clientY - oy) / zoomRef.current;
        ox = ev.clientX;
        oy = ev.clientY;
        setNodes((prev) =>
          prev.map((n) =>
            n.id === node.id ? { ...n, x: Math.max(0, n.x + dx), y: Math.max(0, n.y + dy) } : n
          )
        );
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [simulating]
  );

  // ── Conexión por arrastre desde el puerto del nodo ───────────────────────────
  const startLink = useCallback(
    (e: React.PointerEvent, node: NetNode) => {
      if (simulating) return;
      e.preventDefault();
      e.stopPropagation();
      setLinking(node.id);
      setLinkPos(clientToCanvas(e.clientX, e.clientY));

      const onMove = (ev: PointerEvent) => {
        setLinkPos(clientToCanvas(ev.clientX, ev.clientY));
        const t = nodeIdAt(ev.clientX, ev.clientY);
        setLinkHoverId(t && t !== node.id ? t : null);
      };
      const onUp = (ev: PointerEvent) => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        const toId = nodeIdAt(ev.clientX, ev.clientY);
        if (toId && toId !== node.id) {
          setConnections((prev) => {
            const exists = prev.some(
              (c) =>
                (c.from === node.id && c.to === toId) ||
                (c.to === node.id && c.from === toId)
            );
            return exists ? prev : [...prev, { from: node.id, to: toId }];
          });
        }
        setLinking(null);
        setLinkHoverId(null);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [simulating, clientToCanvas]
  );

  // ── Auto-Armado ──────────────────────────────────────────────────────────────
  const autoAssemble = useCallback(() => {
    if (simulating) return;
    const { nodes: ns, connections: cs } = buildSequence(mode, getRegion());
    setNodes(ns);
    setConnections(cs);
    setLogs([]);
    setActiveEdge(null);
    setPacketVisible(false);
    setSelectedTarget(null);
    setDelivered({ done: 0, total: 0 });
  }, [mode, simulating, getRegion]);

  // ── Escenario: VPN a varios servicios (topología ramificada) ─────────────────
  // Persona -> Laptop -> Módem -> ISP -> VPN (en otro país) -> {YouTube, Gmail,
  // Portal Gob}. Pone el modo en VPN. Los servicios son destinos; al simular se
  // recorren todos, o solo el que el usuario seleccione con click.
  const buildMultiService = useCallback(() => {
    if (simulating) return;
    const r = getRegion();
    const padL = 70;
    const cols = 6; // 5 del tronco + 1 columna de servicios
    const colGap = (Math.max(NODE, r.w - padL - 60) - NODE) / (cols - 1);
    const xAt = (c: number) => r.x + padL + c * colGap;
    const midY = r.y + r.h / 2 - NODE / 2;

    const trunk: NetNode[] = [
      { id: "ms-p1", type: "person", label: "Persona 1", x: xAt(0), y: midY },
      { id: "ms-lap", type: "laptop", label: "Laptop", x: xAt(1), y: midY },
      { id: "ms-mod", type: "router", label: "Módem/WiFi", x: xAt(2), y: midY },
      { id: "ms-isp", type: "isp", label: "ISP", x: xAt(3), y: midY },
      { id: "ms-vpn", type: "vpn", label: "VPN", x: xAt(4), y: midY, country: "Frankfurt 🇩🇪" },
    ];

    const services: NetNode[] = [
      { id: "ms-yt", type: "youtube", label: "YouTube", x: xAt(5), y: midY - 180 },
      { id: "ms-gm", type: "cloud-a", label: "Gmail", x: xAt(5), y: midY },
      { id: "ms-gov", type: "gov", label: "Portal Gob", x: xAt(5), y: midY + 180 },
    ];

    const ns = [...trunk, ...services];
    const cs: Connection[] = [];
    for (let i = 0; i < trunk.length - 1; i++) cs.push({ from: trunk[i].id, to: trunk[i + 1].id });
    services.forEach((s) => cs.push({ from: "ms-vpn", to: s.id }));

    setNodes(ns);
    setConnections(cs);
    setMode("vpn");
    setLogs([]);
    setActiveEdge(null);
    setPacketVisible(false);
    setSelectedTarget(null);
    setDelivered({ done: 0, total: 0 });
  }, [simulating, getRegion]);

  // ── Modo Taller: reparte los nodos del flujo inicial DESORDENADOS ────────────
  // Coloca los 13 nodos del flujo completo en posiciones aleatorias y SIN
  // conexiones, para que los participantes los acomoden y cableen ellos mismos.
  const scatterNodes = useCallback(() => {
    if (simulating) return;

    // Flujo inicial completo (con ISP y Cableado repetidos = 13 nodos).
    const specs: Array<Pick<NetNode, "type" | "label">> = [
      { type: "person", label: "Persona 1" },
      { type: "laptop", label: "Laptop" },
      { type: "router", label: "Módem/WiFi" },
      { type: "hub", label: "Colector" },
      { type: "cabling", label: "Cableado" },
      { type: "isp", label: "ISP" },
      { type: "cloud-a", label: "Gmail" },
      { type: "cloud-b", label: "Hotmail" },
      { type: "isp", label: "ISP" },
      { type: "cabling", label: "Cableado" },
      { type: "cell", label: "Torre Celular" },
      { type: "smartphone", label: "Móvil" },
      { type: "person2", label: "Persona 2" },
    ];

    // Región VISIBLE del lienzo (considera scroll y zoom).
    const { x: originX, y: originY, w: regionW, h: regionH } = getRegion();

    // Márgenes (el inferior es mayor para no chocar con el selector de modos).
    const padL = 40;
    const padR = 40;
    const padT = 40;
    const padB = 150;
    const cols = 5;
    const rows = Math.ceil(specs.length / cols);
    const cellW = (regionW - padL - padR) / cols;
    const cellH = (regionH - padT - padB) / rows;

    // Celdas centradas dentro del área visible, luego barajadas.
    const cells: Array<{ x: number; y: number }> = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        cells.push({
          x: originX + padL + (c + 0.5) * cellW,
          y: originY + padT + (r + 0.5) * cellH,
        });
      }
    }
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }

    // Jitter acotado para que el nodo no se salga de su celda.
    const jx = Math.max(0, cellW - NODE - 20);
    const jy = Math.max(0, cellH - NODE - 20);
    const jitter = (range: number) => (Math.random() - 0.5) * range;
    const ns: NetNode[] = specs.map((s, i) => ({
      ...s,
      id: `wk-${i}-${uid()}`,
      x: Math.round(cells[i].x - NODE / 2 + jitter(jx)),
      y: Math.round(cells[i].y - NODE / 2 + jitter(jy)),
    }));

    setNodes(ns);
    setConnections([]);
    setLogs([]);
    setActiveEdge(null);
    setPacketVisible(false);
    setSelectedTarget(null);
    setDelivered({ done: 0, total: 0 });
  }, [simulating, getRegion]);

  // ── Reset ─────────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setNodes([]);
    setConnections([]);
    setLogs([]);
    setActiveEdge(null);
    setPacketVisible(false);
    setInspectorOpen(false);
    setInterception(null);
    setErrorFlash(false);
    setKeyExplain(null);
    setActiveLeg(null);
    setSelectedTarget(null);
    simRunRef.current++; // invalida cualquier simulación en curso
    resumeRef.current?.();
    resumeRef.current = null;
    setSimulating(false);
    setDelivered({ done: 0, total: 0 });
  }, []);

  // ── Exportar configuración (JSON) ─────────────────────────────────────────────
  const exportJSON = useCallback(() => {
    const data = JSON.stringify({ nodes, connections, mode }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lumina-network-config.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, connections, mode]);

  // Reanuda la simulación tras una interceptación.
  const resumeSim = useCallback(() => {
    setInterception(null);
    setKeyExplain(null);
    resumeRef.current?.();
    resumeRef.current = null;
  }, []);

  // ── Simulación (soporta destinos múltiples / ramificación) ───────────────────
  const simulate = useCallback(async () => {
    if (simulating) return;
    const origin = pickStart(nodes, connections);
    if (!origin) return;

    // Destinos: el seleccionado (si es válido) o los destinos FINALES (nodos
    // hoja, con un solo cable). Así las nubes intermedias de un flujo lineal NO
    // se tratan como destino; sí los servicios en abanico (cada uno es hoja).
    const degree = (id: string) =>
      connections.filter((c) => c.from === id || c.to === id).length;
    let destNodes: NetNode[];
    const sel = selectedTarget ? nodes.find((n) => n.id === selectedTarget) : null;
    if (sel && sel.id !== origin.id) {
      destNodes = [sel];
    } else {
      destNodes = nodes.filter(
        (n) => n.id !== origin.id && DEST_TYPES.has(n.type) && degree(n.id) === 1
      );
      // Respaldo: si no hay hojas válidas, usa cualquier destino alcanzable.
      if (destNodes.length === 0) {
        destNodes = nodes.filter((n) => n.id !== origin.id && DEST_TYPES.has(n.type));
      }
    }

    // Rutas BFS desde el origen a cada destino alcanzable.
    const paths = destNodes
      .map((d) => bfsPath(nodes, connections, origin.id, d.id))
      .filter((p): p is NetNode[] => !!p && p.length >= 2);

    if (paths.length === 0) {
      addLog("ERROR: flujo incompleto. Conecta el origen hasta un destino válido.", COLORS.red, 0);
      setErrorFlash(true);
      setTimeout(() => setErrorFlash(false), 1200);
      return;
    }

    const runId = ++simRunRef.current;
    const cancelled = () => simRunRef.current !== runId;
    const pause = () => new Promise<void>((resolve) => { resumeRef.current = resolve; });
    const pauseModals = paths.length === 1; // narración rica solo en envío único
    const move = (n: NetNode) => {
      const c = center(n);
      setPacketPos({ x: c.x - PACKET / 2, y: c.y - PACKET / 2 });
    };

    setSimulating(true);
    setInspectorOpen(false);
    setErrorFlash(false);
    setActiveLeg(null);
    setLogs([]);
    setDelivered({ done: 0, total: paths.length });
    addLog(`Iniciando simulación - Modo ${meta.label.toUpperCase()}`, COLORS.primary, 0);
    if (mode === "e2ee") {
      addLog("Cifrado de extremo a extremo: solo el origen y el destino tienen la llave.", COLORS.amber, 0);
    } else if (mode === "vpn") {
      addLog("Túnel VPN activo: el tráfico viaja encapsulado y cifrado.", COLORS.purple, 0);
    }

    // Narración por nodo (usa el camino actual para el contexto).
    const narrateNode = async (path: NetNode[], i: number, t: number) => {
      const node = path[i];
      const isServer = ["cloud-a", "cloud-b", "youtube", "gov"].includes(node.type);

      // HTTPS: cifrado tramo por tramo; los servidores leen.
      if (mode === "https" && ENDPOINT_TYPES.has(node.type)) {
        const tlsOrder = path.map((n, k) => (ENDPOINT_TYPES.has(n.type) ? k : -1)).filter((k) => k >= 0);
        const order = tlsOrder.indexOf(i);
        const nextI = tlsOrder[order + 1];
        const next = nextI != null ? path[nextI] : null;
        let title = "", text = "", expColor = LEG_COLORS[order % LEG_COLORS.length];
        let readable = false, reencrypts = false;
        if (order === 0) {
          title = "Aquí inicia la llave segura";
          text = `${node.label} cifra el mensaje. Desde aquí viaja cifrado hasta ${next?.label ?? "el siguiente nodo"}, ilegible en la red.`;
        } else if (isServer && next) {
          title = `Aquí ${node.label} abre la llave`;
          text = `Tiene la llave: descifra el contenido y puede leerlo. Luego lo vuelve a cifrar con una nueva llave hacia ${next.label}.`;
          expColor = COLORS.amber; readable = true; reencrypts = true;
          addLog(`${node.label} descifra y vuelve a cifrar (puede leerlo).`, COLORS.amber, +t.toFixed(1));
        } else if (!next) {
          title = "Aquí termina la llave segura";
          text = `${node.label} descifra el contenido final con su llave y lo lee.`;
          expColor = COLORS.green; readable = true;
          addLog(`${node.label} recibe y descifra el contenido final.`, COLORS.green, +t.toFixed(1));
        }
        if (next) {
          addLog(`Llave segura: ${node.label} -> ${next.label}`, LEG_COLORS[order % LEG_COLORS.length], +t.toFixed(1));
          setActiveLeg(order);
        } else setActiveLeg(null);
        if (title && pauseModals) { setKeyExplain({ title, text, color: expColor, readable, reencrypts }); await pause(); }
        return;
      }

      // E2EE: una sola llave; las nubes NO pueden leer.
      if (mode === "e2ee" && ENDPOINT_TYPES.has(node.type)) {
        const devices = path.filter((n) => n.type === "laptop" || n.type === "smartphone");
        const originDevId = devices[0]?.id;
        const destDev = devices[devices.length - 1];
        let title = "", text = "", expColor = COLORS.amber, readable = false;
        if (node.id === originDevId) {
          title = "Cifrado de extremo a extremo";
          text = `${node.label} cifra el mensaje con una llave que solo comparte con ${destDev?.label ?? "el destino"}. Viaja cifrado todo el camino.`;
          setActiveLeg(0);
        } else if (node.id === destDev?.id) {
          title = "Solo el destino lo lee";
          text = `${node.label} descifra el contenido con su llave compartida. Nadie en medio pudo leerlo.`;
          expColor = COLORS.green; readable = true; setActiveLeg(null);
          addLog(`${node.label} descifra el contenido final (destino).`, COLORS.green, +t.toFixed(1));
        } else if (isServer) {
          title = `${node.label} no puede leerlo`;
          text = `Solo reenvía datos cifrados: no tiene la llave. A diferencia de HTTPS, aquí el servidor no ve el contenido.`;
          expColor = COLORS.green; readable = false;
          addLog(`${node.label} reenvía el contenido cifrado (no puede leerlo).`, COLORS.green, +t.toFixed(1));
        }
        if (title && pauseModals) { setKeyExplain({ title, text, color: expColor, readable, reencrypts: false }); await pause(); }
        return;
      }

      // VPN: túnel cifrado hasta la VPN; oculta tu IP; la VPN sí lee.
      if (mode === "vpn") {
        const vpnIdx = path.findIndex((n) => n.type === "vpn");
        if (vpnIdx >= 0) {
          const devices = path.filter((n) => n.type === "laptop" || n.type === "smartphone");
          const originDevId = devices[0]?.id;
          let vpnExitIdx = -1;
          for (let k = vpnIdx + 1; k < path.length; k++) {
            if (DEST_TYPES.has(path[k].type)) { vpnExitIdx = k; break; }
          }
          const insideTunnel = i < vpnIdx;
          let title = "", text = "", expColor = COLORS.purple, readable = false;
          if (node.id === originDevId) {
            title = "Entras al túnel VPN";
            text = `${node.label} cifra TODO el tráfico y lo envía por un túnel al servidor VPN. Tu ISP solo verá tráfico cifrado hacia la VPN, sin saber a dónde vas.`;
            addLog("Túnel VPN: tráfico cifrado hacia el servidor VPN.", COLORS.purple, +t.toFixed(1));
          } else if (node.type === "vpn") {
            title = node.country ? `Servidor VPN (${node.country})` : "Servidor VPN";
            text = `Descifra el túnel y reenvía tu tráfico a internet con SU dirección IP${node.country ? ` desde ${node.country}` : ""}, ocultando la tuya. Ojo: la VPN sí puede ver tu tráfico.`;
            expColor = COLORS.amber; readable = true;
            addLog(`Servidor VPN reenvía el tráfico con su propia IP${node.country ? ` (${node.country})` : ""}.`, COLORS.amber, +t.toFixed(1));
          } else if (node.type === "isp" && insideTunnel) {
            title = "Tu ISP no ve el destino";
            text = `El ISP solo ve un túnel cifrado hacia la VPN: no sabe qué visitas ni puede leer el contenido.`;
            expColor = COLORS.green;
            addLog("ISP: solo ve tráfico cifrado hacia la VPN.", COLORS.green, +t.toFixed(1));
          } else if (i === vpnExitIdx) {
            title = "Sales con la IP de la VPN";
            text = `El tráfico llega a ${node.label} con la IP de la VPN: tu identidad real queda oculta. Pero sin HTTPS, el contenido vuelve a viajar visible desde la VPN.`;
            expColor = COLORS.green; readable = true;
            addLog(`${node.label} te ve con la IP de la VPN (identidad oculta).`, COLORS.green, +t.toFixed(1));
          }
          if (title && pauseModals) { setKeyExplain({ title, text, color: expColor, readable, reencrypts: false }); await pause(); }
        }
      }

      // MITM: siempre pausa (momento clave).
      if (node.type === "hacker") {
        addLog(
          encrypted
            ? "Atacante MitM intercepta el tráfico, pero está cifrado, ilegible."
            : "Atacante MitM interceptó el mensaje en TEXTO PLANO.",
          encrypted ? COLORS.green : COLORS.red,
          +t.toFixed(1)
        );
        setInterception({ readable: !encrypted });
        await pause();
      }
    };

    // Coloca el paquete en el origen.
    move(origin);
    setPacketVisible(true);
    await wait(250);
    if (cancelled()) return;

    const narrated = new Set<string>([origin.id]);
    let t = 0;
    let prev: NetNode[] | null = null;
    let deliveredCount = 0;

    for (const path of paths) {
      let startIdx = 1;
      if (prev) {
        // Retrocede hasta el último nodo común con el camino anterior.
        let common = 0;
        while (common < prev.length && common < path.length && prev[common].id === path[common].id) common++;
        for (let k = prev.length - 2; k >= common - 1 && k >= 0; k--) {
          setActiveEdge([prev[k + 1].id, prev[k].id]);
          move(prev[k]);
          await wait(HOP_MS);
          if (cancelled()) return;
        }
        startIdx = common;
      }

      for (let i = startIdx; i < path.length; i++) {
        const node = path[i];
        const before = path[i - 1];
        setKeyExplain(null);
        setActiveEdge([before.id, node.id]);
        move(node);
        const hop = meta.latency / Math.max(1, path.length - 1) + Math.random() * 3;
        t += hop;
        const color = i % 2 === 0 ? COLORS.blue : COLORS.green;
        addLog(`Paquete recibido en ${node.label} - Procesando...`, color, +t.toFixed(1));
        await wait(HOP_MS);
        if (cancelled()) return;

        if (!narrated.has(node.id)) {
          narrated.add(node.id);
          await narrateNode(path, i, t);
          if (cancelled()) return;
        }
      }

      deliveredCount += 1;
      setDelivered({ done: deliveredCount, total: paths.length });
      addLog(`Entrega exitosa en ${path[path.length - 1].label}.`, COLORS.green, +t.toFixed(1));
      prev = path;
    }

    setPacketsSent((p) => p + paths.length);
    setActiveEdge(null);
    setActiveLeg(null);
    setKeyExplain(null);
    setSimulating(false);
    setTimeout(() => setPacketVisible(false), 600);
  }, [nodes, connections, simulating, meta, mode, encrypted, addLog, selectedTarget]);

  // ── Geometría del túnel VPN ───────────────────────────────────────────────────
  const vpnTunnel = useMemo(() => {
    if (mode !== "vpn") return null;
    const laptop = nodes.find((n) => n.type === "laptop");
    const vpn = nodes.find((n) => n.type === "vpn");
    if (!laptop || !vpn) return null;
    const minX = Math.min(laptop.x, vpn.x) - 16;
    const maxX = Math.max(laptop.x, vpn.x) + NODE + 16;
    const minY = Math.min(laptop.y, vpn.y) - 18;
    const maxY = Math.max(laptop.y, vpn.y) + NODE + 18;
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }, [mode, nodes]);

  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  // Llaves visibles por nodo, según el modo.
  // HTTPS: cifrado tramo por tramo. Los extremos de cifrado a lo largo del
  // camino (dispositivos y nubes) sostienen un par de llaves por cada tramo
  // que tocan; cada tramo tiene su propio color. Las nubes quedan con dos
  // llaves (pueden descifrar y volver a cifrar = pueden leer el contenido).
  const keyMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    if (mode === "https") {
      const path = findPath(nodes, connections);
      const tls = path.filter((n) => ENDPOINT_TYPES.has(n.type));
      tls.forEach((n, idx) => {
        const colors: string[] = [];
        if (idx > 0) colors.push(LEG_COLORS[(idx - 1) % LEG_COLORS.length]); // tramo anterior
        if (idx < tls.length - 1) colors.push(LEG_COLORS[idx % LEG_COLORS.length]); // tramo siguiente
        if (colors.length) map[n.id] = colors;
      });
    } else if (mode === "e2ee") {
      // Una sola llave compartida: solo el dispositivo de origen y el de destino.
      const devices = findPath(nodes, connections).filter(
        (n) => n.type === "laptop" || n.type === "smartphone"
      );
      if (devices.length) {
        map[devices[0].id] = [COLORS.amber];
        map[devices[devices.length - 1].id] = [COLORS.amber];
      }
    } else if (mode === "vpn") {
      nodes.forEach((n) => {
        const k = keysForNode(n, mode);
        if (k.length) map[n.id] = k;
      });
    }
    return map;
  }, [mode, nodes, connections]);

  // Tramos cifrados para la leyenda y la línea de llave a llave.
  // HTTPS: un tramo por cada par de extremos (sesiones TLS encadenadas).
  // E2EE: un solo tramo del dispositivo de origen al de destino.
  const secureLegs = useMemo(() => {
    const legs: Array<{ a: NetNode; b: NetNode; from: string; to: string; color: string }> = [];
    if (mode === "https") {
      const tls = findPath(nodes, connections).filter((n) => ENDPOINT_TYPES.has(n.type));
      for (let i = 0; i < tls.length - 1; i++) {
        legs.push({
          a: tls[i],
          b: tls[i + 1],
          from: tls[i].label,
          to: tls[i + 1].label,
          color: LEG_COLORS[i % LEG_COLORS.length],
        });
      }
    } else if (mode === "e2ee") {
      const devices = findPath(nodes, connections).filter(
        (n) => n.type === "laptop" || n.type === "smartphone"
      );
      if (devices.length >= 2) {
        const a = devices[0];
        const b = devices[devices.length - 1];
        legs.push({ a, b, from: a.label, to: b.label, color: COLORS.amber });
      }
    }
    return legs;
  }, [mode, nodes, connections]);

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex h-screen flex-col bg-background text-on-surface">
      {/* ── Header / Telemetría ── */}
      <header className="z-50 flex h-16 shrink-0 items-center justify-between border-b border-outline-variant bg-surface px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <span
            className="text-xl"
            style={{ fontFamily: '"Quicksand", sans-serif', fontWeight: 600 }}
          >
            <span style={{ color: "#08c2e2" }}>seguridad</span>
            <span style={{ color: "#d15892" }}>es</span>
          </span>
          <div className="h-6 w-px bg-outline-variant" />
          <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Simulador de Flujo
          </span>
        </div>

        <div className="hidden items-center gap-7 md:flex">
          <Stat label="Latencia" value={`${meta.latency} ms`} color={COLORS.primary} />
          <Stat label="Seguridad" value={`${meta.security}%`} color={encrypted ? COLORS.green : COLORS.red} />
          <Stat label="Paquetes" value={`${delivered.done}/${delivered.total} · ${packetsSent}✓`} color={COLORS.primary} />
        </div>

        <div className="flex items-center gap-2">
          <IconBtn title="Exportar JSON" onClick={exportJSON}>
            <Download size={18} />
          </IconBtn>
          <button
            onClick={scatterNodes}
            className="flex items-center gap-2 rounded-lg px-3 py-2 font-semibold text-amber transition-colors hover:bg-amber/10"
            title="Coloca los 13 nodos desordenados para que el grupo los acomode (modo taller)"
          >
            <Shuffle size={18} />
            <span className="text-sm">Desordenar</span>
          </button>
          <div className="relative">
            <button
              onClick={() => setScenarioOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 font-semibold text-secondary transition-colors hover:bg-secondary/10"
              title="Plantillas de escenario"
            >
              <Sparkles size={18} />
              <span className="text-sm">Escenarios</span>
              <ChevronDown size={14} />
            </button>
            {scenarioOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setScenarioOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-xl border border-outline-variant bg-white shadow-2xl">
                  <button
                    onClick={() => {
                      autoAssemble();
                      setScenarioOpen(false);
                    }}
                    className="flex w-full flex-col items-start px-4 py-2.5 text-left hover:bg-surface-variant"
                  >
                    <span className="text-sm font-bold">Flujo simple</span>
                    <span className="text-[11px] text-on-surface-variant">
                      Persona a Persona por un solo camino.
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      buildMultiService();
                      setScenarioOpen(false);
                    }}
                    className="flex w-full flex-col items-start border-t border-outline-variant px-4 py-2.5 text-left hover:bg-surface-variant"
                  >
                    <span className="text-sm font-bold">VPN a varios servicios</span>
                    <span className="text-[11px] text-on-surface-variant">
                      VPN en el extranjero hacia YouTube, Gmail y Portal Gob.
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      reset();
                      setScenarioOpen(false);
                    }}
                    className="flex w-full flex-col items-start border-t border-outline-variant px-4 py-2.5 text-left hover:bg-surface-variant"
                  >
                    <span className="text-sm font-bold">Lienzo vacío</span>
                    <span className="text-[11px] text-on-surface-variant">
                      Modo interactivo: arma tú el flujo.
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-2 rounded-full bg-outline-variant px-4 py-2 font-bold text-on-surface-variant transition hover:brightness-95"
          >
            <RotateCcw size={16} /> Reset
          </button>
          <button
            onClick={simulate}
            disabled={simulating}
            className="flex items-center gap-2 rounded-full bg-primary-container px-6 py-2 font-bold text-white shadow-md transition hover:brightness-110 disabled:opacity-50"
          >
            <Play size={18} /> {simulating ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </header>

      {/* ── Cuerpo: Inventario | Lienzo | Log ── */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Inventario */}
        {invOpen ? (
        <aside className="z-40 flex w-72 shrink-0 flex-col border-r border-outline-variant bg-surface-low shadow-sm">
          <div className="flex items-start justify-between px-5 pt-5">
            <div>
              <h2 className="text-lg font-semibold">Inventario</h2>
              <p className="mt-0.5 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                Nodos &amp; Herramientas
              </p>
            </div>
            <button
              onClick={() => setInvOpen(false)}
              title="Ocultar inventario"
              className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-variant"
            >
              <PanelLeftClose size={18} />
            </button>
          </div>

          <div className="px-4 pt-4">
            <div className="rounded-xl border border-outline-variant bg-surface p-3 text-[11px] leading-snug text-on-surface-variant">
              <p className="mb-1 flex items-center gap-1.5 font-bold text-on-surface">
                <Cable size={14} className="text-primary" /> Cómo conectar
              </p>
              Arrastra un nodo al lienzo. Para crear un cable, arrastra desde el{" "}
              <span className="font-bold text-primary">punto azul</span> de un nodo hasta otro.
              Click en un cable para eliminarlo.
            </div>
          </div>

          <nav className="lumina-scroll mt-4 flex-1 overflow-y-auto px-4 pb-6">
            <div className="grid grid-cols-2 gap-2">
              {INVENTORY.map((item) => (
                <InventoryCard key={item.label} item={item} />
              ))}
            </div>
          </nav>
        </aside>
        ) : (
          <button
            onClick={() => setInvOpen(true)}
            title="Mostrar inventario"
            className="z-40 flex w-10 shrink-0 flex-col items-center gap-3 border-r border-outline-variant bg-surface-low py-4 text-on-surface-variant transition-colors hover:bg-surface-variant"
          >
            <PanelLeftOpen size={18} />
            <span
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ writingMode: "vertical-rl" }}
            >
              Inventario
            </span>
          </button>
        )}

        {/* Lienzo */}
        <main className="relative flex-1 overflow-hidden bg-background">
          <div
            ref={canvasRef}
            className="lumina-scroll canvas-grid absolute inset-0 overflow-auto"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
          >
            <div
              className="relative origin-top-left"
              style={{ width: CANVAS_W, height: CANVAS_H, transform: `scale(${zoom})` }}
            >
              {/* Túnel VPN */}
              <AnimatePresence>
                {vpnTunnel && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="pointer-events-none absolute z-10 rounded-3xl border-2 border-dashed"
                    style={{
                      left: vpnTunnel.x,
                      top: vpnTunnel.y,
                      width: vpnTunnel.w,
                      height: vpnTunnel.h,
                      borderColor: COLORS.purple,
                      background:
                        "linear-gradient(90deg, rgba(124,58,237,0.10), rgba(124,58,237,0.18))",
                    }}
                  >
                    <span
                      className="absolute -top-3 left-4 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                      style={{ background: COLORS.purple }}
                    >
                      Túnel VPN cifrado
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Conexiones (SVG) */}
              <svg className="absolute inset-0 h-full w-full">
                {connections.map((c, i) => {
                  const a = nodeById.get(c.from);
                  const b = nodeById.get(c.to);
                  if (!a || !b) return null;
                  const ca = center(a);
                  const cb = center(b);
                  const active =
                    !!activeEdge &&
                    ((c.from === activeEdge[0] && c.to === activeEdge[1]) ||
                      (c.from === activeEdge[1] && c.to === activeEdge[0]));
                  return (
                    <g
                      key={`${c.from}-${c.to}-${i}`}
                      className="group/edge"
                      style={{ cursor: "pointer" }}
                      onClick={() => removeConnection(i)}
                    >
                      {/* Cable visible */}
                      <line
                        x1={ca.x}
                        y1={ca.y}
                        x2={cb.x}
                        y2={cb.y}
                        stroke={
                          active
                            ? COLORS.green
                            : errorFlash
                            ? COLORS.red
                            : encrypted
                            ? COLORS.blue
                            : "#737785"
                        }
                        strokeWidth={active || errorFlash ? 4 : 2}
                        strokeDasharray={active ? "0" : "6 6"}
                        className="transition-[stroke,stroke-width] group-hover/edge:stroke-[#ba1a1a]"
                        style={{ pointerEvents: "none" }}
                      />
                      {/* Área de click ancha e invisible */}
                      <line
                        x1={ca.x}
                        y1={ca.y}
                        x2={cb.x}
                        y2={cb.y}
                        stroke="transparent"
                        strokeWidth={18}
                        style={{ pointerEvents: "stroke" }}
                      />
                      <title>Click para eliminar este cable</title>
                    </g>
                  );
                })}

                {/* Líneas de llave a llave (sesiones cifradas) */}
                {secureLegs.map((leg, i) => {
                    const a = center(leg.a);
                    const b = center(leg.b);
                    const mx = (a.x + b.x) / 2;
                    const my = Math.min(a.y, b.y) - 72;
                    const d = `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
                    const active = activeLeg === i;
                    return (
                      <path
                        key={`leg-${i}`}
                        d={d}
                        fill="none"
                        stroke={leg.color}
                        strokeWidth={active ? 5 : 3}
                        strokeLinecap="round"
                        strokeDasharray={active ? "1 0" : "2 9"}
                        opacity={activeLeg == null ? 0.85 : active ? 1 : 0.25}
                        style={{
                          pointerEvents: "none",
                          transition: "opacity .3s, stroke-width .3s",
                        }}
                      />
                    );
                  })}

                {/* Cable en construcción (arrastre desde el puerto) */}
                {linking &&
                  (() => {
                    const from = nodeById.get(linking);
                    if (!from) return null;
                    const c = center(from);
                    return (
                      <line
                        x1={c.x}
                        y1={c.y}
                        x2={linkPos.x}
                        y2={linkPos.y}
                        stroke={COLORS.primary}
                        strokeWidth={2.5}
                        strokeDasharray="5 5"
                        style={{ pointerEvents: "none" }}
                      />
                    );
                  })()}
              </svg>

              {/* Nodos */}
              {nodes.map((node) => (
                <NodeCard
                  key={node.id}
                  node={node}
                  keys={keyMap[node.id] ?? []}
                  isLinkTarget={linkHoverId === node.id}
                  isSelected={selectedTarget === node.id}
                  selectable={DEST_TYPES.has(node.type)}
                  onSelect={() =>
                    DEST_TYPES.has(node.type) &&
                    setSelectedTarget((t) => (t === node.id ? null : node.id))
                  }
                  onPointerDown={(e) => startNodeDrag(e, node)}
                  onStartLink={(e) => startLink(e, node)}
                  onRemove={() => removeNode(node.id)}
                />
              ))}

              {/* Paquete en movimiento */}
              <AnimatePresence>
                {packetVisible && (
                  <Packet
                    pos={packetPos}
                    encrypted={encrypted}
                    onClick={() => setInspectorOpen(true)}
                  />
                )}
              </AnimatePresence>

            </div>
          </div>

          {/* Estado vacío */}
          {nodes.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center text-on-surface-variant">
              <Sparkles size={40} className="mb-3 opacity-40" />
              <p className="text-sm">
                Arrastra nodos desde el inventario o pulsa{" "}
                <span className="font-bold text-secondary">Auto-Armado</span>.
              </p>
            </div>
          )}

          {/* Leyenda de cifrado (esquina inferior izquierda) */}
          {secureLegs.length > 0 && (mode === "https" || mode === "e2ee") && (
            <div className="absolute bottom-4 left-4 z-40 w-56 rounded-xl border border-outline-variant bg-white/95 p-3 shadow-xl backdrop-blur">
              <div className="mb-2 flex items-center gap-1.5 text-[12px] font-bold text-on-surface">
                <Lock size={14} className="text-primary" />
                {mode === "https" ? "HTTPS: cifrado por tramos" : "E2EE: extremo a extremo"}
              </div>
              <div className="space-y-1.5">
                {secureLegs.map((leg, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px]">
                    <KeyRound size={13} style={{ color: leg.color }} />
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: leg.color }} />
                    <span className="text-on-surface-variant">
                      {leg.from} ↔ {leg.to}
                    </span>
                  </div>
                ))}
              </div>
              {mode === "e2ee" && (
                <p className="mt-2 border-t border-outline-variant pt-2 text-[10px] leading-snug text-on-surface-variant">
                  Una sola llave: solo origen y destino. Las nubes{" "}
                  <span className="font-bold text-secondary">no pueden leer</span> el contenido.
                </p>
              )}
            </div>
          )}

          {/* Leyenda VPN */}
          {mode === "vpn" && (
            <div className="absolute bottom-4 left-4 z-40 w-56 rounded-xl border border-outline-variant bg-white/95 p-3 shadow-xl backdrop-blur">
              <div className="mb-2 flex items-center gap-1.5 text-[12px] font-bold text-on-surface">
                <Lock size={14} className="text-primary" /> VPN: túnel cifrado
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <KeyRound size={13} style={{ color: COLORS.purple }} />
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COLORS.purple }} />
                <span className="text-on-surface-variant">Tu dispositivo ↔ VPN</span>
              </div>
              <p className="mt-2 border-t border-outline-variant pt-2 text-[10px] leading-snug text-on-surface-variant">
                Oculta tu IP y tu ISP no ve el destino. Ojo: la{" "}
                <span className="font-bold text-amber">VPN sí ve tu tráfico</span>.
              </p>
            </div>
          )}

          {/* Controles de zoom */}
          <div className="absolute bottom-24 right-6 z-40 flex flex-col gap-1.5 rounded-full border border-outline-variant bg-white/90 p-1.5 shadow-xl backdrop-blur">
            <ZoomBtn title="Acercar" onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)))}>
              <Plus size={18} />
            </ZoomBtn>
            <ZoomBtn title="Alejar" onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.1).toFixed(2)))}>
              <Minus size={18} />
            </ZoomBtn>
            <ZoomBtn
              title="Restablecer"
              onClick={() => {
                setZoom(1);
                canvasRef.current?.scrollTo({ left: 0, top: 0, behavior: "smooth" });
              }}
            >
              <Maximize size={16} />
            </ZoomBtn>
            <div className="pb-0.5 pt-1 text-center text-[9px] font-bold text-on-surface-variant">
              {Math.round(zoom * 100)}%
            </div>
          </div>

          {/* Selector de modos */}
          <nav className="absolute bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full border border-outline-variant bg-white/80 p-1.5 shadow-lg backdrop-blur">
            <ModeBtn current={mode} value="basico" onClick={setMode} icon={Mail} label="Básico" />
            <ModeBtn current={mode} value="https" onClick={setMode} icon={Lock} label="HTTPS" />
            <ModeBtn current={mode} value="e2ee" onClick={setMode} icon={ShieldCheck} label="E2EE" />
            <ModeBtn current={mode} value="vpn" onClick={setMode} icon={ShieldCheck} label="VPN" />
          </nav>

          {/* Inspector DPI */}
          <AnimatePresence>
            {inspectorOpen && (
              <DpiInspector
                encrypted={encrypted}
                mode={mode}
                onClose={() => setInspectorOpen(false)}
              />
            )}
          </AnimatePresence>

          {/* Interceptación MitM (pausa didáctica) */}
          <AnimatePresence>
            {interception && (
              <InterceptionModal readable={interception.readable} onContinue={resumeSim} />
            )}
          </AnimatePresence>

          {/* Explicación de llave segura HTTPS (pausa con Continuar) */}
          <AnimatePresence>
            {keyExplain && (
              <KeyExplainModal
                title={keyExplain.title}
                text={keyExplain.text}
                color={keyExplain.color}
                readable={keyExplain.readable}
                reencrypts={keyExplain.reencrypts}
                onContinue={resumeSim}
              />
            )}
          </AnimatePresence>
        </main>

        {/* Log técnico */}
        {logOpen ? (
        <aside className="z-40 flex w-72 shrink-0 flex-col border-l border-outline-variant bg-surface-high">
          <div className="flex items-center justify-between border-b border-outline-variant bg-surface px-4 py-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLogOpen(false)}
                title="Ocultar log"
                className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-variant"
              >
                <PanelRightClose size={18} />
              </button>
              <h2 className="font-bold">Log</h2>
            </div>
            <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold uppercase text-white">
              Pro
            </span>
          </div>
          <div className="lumina-scroll flex-1 space-y-1.5 overflow-y-auto p-3 font-mono text-[11px]">
            {logs.length === 0 && (
              <div className="italic text-on-surface-variant">Esperando simulación...</div>
            )}
            {logs.map((l) => (
              <div
                key={l.id}
                className="rounded border-l-4 px-2 py-1.5 leading-tight"
                style={{ borderColor: l.color, background: `${l.color}12` }}
              >
                <span className="font-bold" style={{ color: l.color }}>
                  [{l.ms.toFixed(1)}ms]
                </span>{" "}
                {l.text}
              </div>
            ))}
          </div>
        </aside>
        ) : (
          <button
            onClick={() => setLogOpen(true)}
            title="Mostrar log"
            className="z-40 flex w-10 shrink-0 flex-col items-center gap-3 border-l border-outline-variant bg-surface-high py-4 text-on-surface-variant transition-colors hover:bg-surface-variant"
          >
            <PanelRightOpen size={18} />
            <span
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ writingMode: "vertical-rl" }}
            >
              Log
            </span>
          </button>
        )}
      </div>

      {tooSmall && <LowResGate />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  SUBCOMPONENTES
// ════════════════════════════════════════════════════════════════════════════

function LowResGate() {
  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-background px-8 text-center">
      <MonitorSmartphone size={56} className="mb-5 text-primary" />
      <h1 className="mb-3 text-xl font-bold">Pantalla demasiado pequeña</h1>
      <p className="max-w-md text-sm leading-relaxed text-on-surface-variant">
        <span style={{ fontFamily: '"Quicksand", sans-serif', fontWeight: 600 }}>
          <span style={{ color: "#08c2e2" }}>seguridad</span>
          <span style={{ color: "#d15892" }}>es</span>
        </span>{" "}
        es una herramienta diseñada para <span className="font-semibold text-on-surface">navegador de escritorio</span>.
        Para su correcto funcionamiento se necesita una resolución mínima de{" "}
        <span className="font-mono font-bold text-on-surface">1024 × 600</span>.
      </p>
      <p className="mt-4 text-xs text-on-surface-variant">
        Amplía la ventana o utiliza una pantalla más grande.
      </p>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[9px] font-bold uppercase tracking-wide text-on-surface-variant">
        {label}
      </span>
      <span className="font-mono text-sm font-bold" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function IconBtn({
  children,
  title,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-variant"
    >
      {children}
    </button>
  );
}

function ZoomBtn({
  children,
  title,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-variant"
    >
      {children}
    </button>
  );
}

function ModeBtn({
  current,
  value,
  onClick,
  icon: Icon,
  label,
}: {
  current: Mode;
  value: Mode;
  onClick: (m: Mode) => void;
  icon: LucideIcon;
  label: string;
}) {
  const active = current === value;
  return (
    <button
      onClick={() => onClick(value)}
      className={`flex flex-col items-center rounded-full px-5 py-1.5 transition-all ${
        active
          ? "bg-primary-container text-white shadow"
          : "text-on-surface-variant hover:bg-surface-variant"
      }`}
    >
      <Icon size={18} />
      <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
    </button>
  );
}

function InventoryCard({ item }: { item: InvItem }) {
  const Icon = item.icon;
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("type", item.type);
        e.dataTransfer.setData("label", item.label);
      }}
      title={item.desc}
      className="group flex cursor-grab flex-col items-center justify-center rounded-xl border border-outline-variant bg-white p-3 transition-all hover:border-primary hover:bg-surface-variant active:cursor-grabbing"
    >
      <Icon
        size={26}
        className={`transition-transform group-hover:scale-110 ${
          item.danger ? "text-danger" : "text-primary"
        }`}
      />
      <span className="mt-1 text-center text-[10px] font-bold uppercase tracking-wide">
        {item.label}
      </span>
    </div>
  );
}

function NodeCard({
  node,
  keys,
  isLinkTarget,
  isSelected,
  selectable,
  onSelect,
  onPointerDown,
  onStartLink,
  onRemove,
}: {
  node: NetNode;
  keys: string[];
  isLinkTarget: boolean;
  isSelected: boolean;
  selectable: boolean;
  onSelect: () => void;
  onPointerDown: (e: React.PointerEvent) => void;
  onStartLink: (e: React.PointerEvent) => void;
  onRemove: () => void;
}) {
  const Icon = ICON_BY_TYPE[node.type];
  const danger = node.type === "hacker";
  const desc = DESC_BY_TYPE[node.type];

  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      data-node-id={node.id}
      className="group absolute z-20 flex flex-col items-center gap-1.5"
      style={{ left: node.x, top: node.y, cursor: selectable ? "pointer" : "grab" }}
      onPointerDown={onPointerDown}
      onClick={onSelect}
    >
      {/* Tooltip descriptivo (al pasar el mouse) */}
      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-48 -translate-x-1/2 scale-95 rounded-lg border border-white/10 bg-inverse-surface p-2.5 text-inverse-on-surface opacity-0 shadow-xl transition-all duration-150 group-hover:scale-100 group-hover:opacity-100">
        <div className="mb-0.5 border-b border-white/10 pb-1 text-[11px] font-bold">
          {node.label}
        </div>
        <div className="text-[10px] leading-snug opacity-90">{desc}</div>
        <div className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 bg-inverse-surface" />
      </div>

      {/* Badge de destino seleccionado */}
      {isSelected && (
        <div className="absolute -top-5 left-1/2 z-30 -translate-x-1/2 rounded-full bg-secondary px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white shadow">
          Destino
        </div>
      )}

      <div
        className={`relative flex items-center justify-center rounded-xl border bg-white shadow-sm transition-all group-hover:shadow-lg ${
          isSelected
            ? "border-secondary ring-2 ring-secondary"
            : isLinkTarget
            ? "border-primary ring-2 ring-primary"
            : "border-outline-variant group-hover:border-primary"
        }`}
        style={{ width: NODE, height: NODE }}
      >
        <Icon size={32} className={danger ? "text-danger" : "text-primary"} />

        {/* Puerto de conexión: arrastra desde aquí hacia otro nodo */}
        <div
          onPointerDown={onStartLink}
          title="Arrastra para conectar"
          className="absolute top-1/2 -right-3 z-30 flex h-5 w-5 -translate-y-1/2 cursor-crosshair items-center justify-center rounded-full border-2 border-white bg-primary-container opacity-0 shadow transition-opacity group-hover:opacity-100"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
        </div>

        {/* Llaves visuales (HTTPS / E2EE / VPN) */}
        {keys.length > 0 && (
          <div className="absolute -bottom-2 -right-2 flex">
            {keys.map((c, i) => (
              <span
                key={i}
                className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white shadow"
                style={{ background: c, marginLeft: i ? -8 : 0 }}
              >
                <KeyRound size={12} className="text-white" />
              </span>
            ))}
          </div>
        )}

        {/* Botón eliminar */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-white opacity-0 transition-opacity group-hover:opacity-100"
        >
          <Trash2 size={11} />
        </button>
      </div>
      <span className="w-24 text-center text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
        {node.label}
      </span>
      {node.country && (
        <span className="-mt-1 rounded-full bg-primary-fixed px-1.5 py-0.5 text-[9px] font-semibold text-primary">
          {node.country}
        </span>
      )}
    </motion.div>
  );
}

function Packet({
  pos,
  encrypted,
  onClick,
}: {
  pos: { x: number; y: number };
  encrypted: boolean;
  onClick: () => void;
}) {
  const glow = encrypted ? "0 0 18px rgba(22,163,74,0.7)" : "0 0 16px rgba(0,86,210,0.45)";
  const Icon = encrypted ? Lock : Mail;
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ x: pos.x, y: pos.y, scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "tween", ease: [0.4, 0, 0.2, 1], duration: HOP_MS / 1000 }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="absolute z-50 flex cursor-pointer items-center justify-center rounded-xl border-2 bg-white shadow-2xl"
      style={{
        width: PACKET,
        height: PACKET,
        borderColor: encrypted ? COLORS.green : COLORS.blue,
        boxShadow: glow,
        top: 0,
        left: 0,
      }}
    >
      <Icon size={22} style={{ color: encrypted ? COLORS.green : COLORS.blue }} />
      <span
        className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-1.5 py-0.5 text-[7px] font-bold text-white"
        style={{ background: encrypted ? COLORS.green : COLORS.blue }}
      >
        INSPECCIONAR
      </span>
    </motion.div>
  );
}

function KeyExplainModal({
  title,
  text,
  color,
  readable,
  reencrypts,
  onContinue,
}: {
  title: string;
  text: string;
  color: string;
  readable: boolean;
  reencrypts: boolean;
  onContinue: () => void;
}) {
  const cipher = useMemo(
    () =>
      "0x" +
      Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16))
        .join("")
        .toUpperCase() +
      "...H7",
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[70] flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="w-[24rem] max-w-full overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center gap-3 px-5 py-4 text-white" style={{ background: color }}>
          <KeyRound size={24} />
          <h3 className="text-sm font-bold uppercase tracking-wider">{title}</h3>
        </div>
        <div className="space-y-4 p-5">
          <p className="text-[13px] leading-relaxed text-on-surface">{text}</p>

          {/* Contenido del paquete: legible donde hay llave, cifrado en la red */}
          {readable ? (
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
                Contenido visible (descifrado)
              </p>
              <div
                className="rounded-lg border bg-black/[0.03] p-3 text-[13px]"
                style={{ borderColor: color }}
              >
                {PLAINTEXT_MSG}
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
                <Lock size={11} /> En la red viaja cifrado (ilegible)
              </p>
              <div className="break-all rounded-lg bg-[#0b1c30] p-3 font-mono text-[11px] font-semibold tracking-wide text-emerald-300">
                {cipher}
              </div>
            </div>
          )}

          {/* La nube vuelve a cifrar para reenviar el mensaje */}
          {reencrypts && (
            <div>
              <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
                <Lock size={11} /> Lo vuelve a cifrar para reenviarlo
              </p>
              <div className="break-all rounded-lg bg-[#0b1c30] p-3 font-mono text-[11px] font-semibold tracking-wide text-emerald-300">
                {cipher}
              </div>
            </div>
          )}

          <button
            onClick={onContinue}
            className="w-full rounded-full py-2.5 font-bold text-white transition hover:brightness-110"
            style={{ background: color }}
          >
            Continuar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function InterceptionModal({
  readable,
  onContinue,
}: {
  readable: boolean;
  onContinue: () => void;
}) {
  const hash = useMemo(
    () =>
      "0x" +
      Array.from({ length: 80 }, () => Math.floor(Math.random() * 16).toString(16))
        .join("")
        .toUpperCase() +
      "...H7",
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[70] flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="w-[26rem] max-w-full overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* Cabecera del atacante */}
        <div
          className="flex items-center gap-3 px-5 py-4 text-white"
          style={{ background: readable ? COLORS.red : "#334155" }}
        >
          <Skull size={26} />
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider">Atacante MitM</h3>
            <p className="text-[11px] opacity-90">Interceptando el paquete en tránsito…</p>
          </div>
        </div>

        <div className="space-y-4 p-5">
          {readable ? (
            <>
              <div className="flex items-center gap-2 font-bold text-danger">
                <AlertTriangle size={18} />
                ¡El atacante puede LEER tu mensaje!
              </div>
              <div className="rounded-lg border border-danger/30 bg-danger/5 p-3 font-mono text-[13px] text-danger">
                "Hola Mundo - nos vemos a las 5pm, clave wifi: 12345"
              </div>
              <p className="text-[12px] leading-relaxed text-on-surface-variant">
                El mensaje viaja en <span className="font-bold">texto plano</span>. Cualquiera en
                el camino (un atacante, el WiFi público o el ISP) puede leerlo e incluso
                modificarlo. Prueba un modo cifrado (HTTPS / E2EE / VPN) y vuelve a enviar.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 font-bold text-secondary">
                <ShieldCheck size={18} />
                El atacante no puede leer nada
              </div>
              <div className="break-all rounded-lg border border-secondary/30 bg-secondary/5 p-3 font-mono text-[12px] text-secondary">
                {hash}
              </div>
              <p className="text-[12px] leading-relaxed text-on-surface-variant">
                El contenido está <span className="font-bold">cifrado</span>. El atacante solo ve
                bytes ilegibles: no puede leer ni alterar el mensaje sin la llave. Eso es lo que
                protege HTTPS, el cifrado de extremo a extremo y la VPN.
              </p>
            </>
          )}

          <button
            onClick={onContinue}
            className="w-full rounded-full bg-primary-container py-2.5 font-bold text-white transition hover:brightness-110"
          >
            Continuar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DpiInspector({
  encrypted,
  mode,
  onClose,
}: {
  encrypted: boolean;
  mode: Mode;
  onClose: () => void;
}) {
  const hash = useMemo(
    () =>
      "0x" +
      Array.from({ length: 96 }, () => Math.floor(Math.random() * 16).toString(16))
        .join("")
        .toUpperCase() +
      "...H7",
    []
  );

  return (
    <motion.div
      initial={{ x: 360, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 360, opacity: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className="absolute right-4 top-4 z-[60] w-72 overflow-hidden rounded-xl border border-white/10 bg-inverse-surface text-inverse-on-surface shadow-2xl"
    >
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <Search size={14} className="text-[#8ab4ff]" />
          <h3 className="text-xs font-bold uppercase tracking-wider">Deep Packet Inspector</h3>
        </div>
        <button onClick={onClose} className="rounded p-1 hover:bg-white/10">
          <X size={14} />
        </button>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <p className="mb-2 text-[9px] font-bold uppercase opacity-50">Metadata</p>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="rounded bg-white/5 p-2">
              <span className="block opacity-50">Protocolo</span>
              <span className="font-mono font-bold text-[#8ab4ff]">
                {encrypted ? "HTTPS/TLS 1.3" : "HTTP/TCP"}
              </span>
            </div>
            <div className="rounded bg-white/5 p-2">
              <span className="block opacity-50">Cifrado</span>
              <span
                className="font-mono font-bold"
                style={{ color: encrypted ? "#4ae176" : "#ff9a8a" }}
              >
                {mode === "e2ee" ? "E2EE/AES-256" : encrypted ? "AES-256-GCM" : "NINGUNO"}
              </span>
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[9px] font-bold uppercase opacity-50">Payload (Contenido)</p>
          <div
            className="min-h-[96px] break-all rounded-lg bg-black/40 p-3 font-mono text-[11px]"
            style={{ color: encrypted ? "#4ade80" : "#f87171" }}
          >
            {encrypted ? hash : "Hola Mundo - nos vemos a las 5pm, clave wifi: 12345"}
          </div>
        </div>

        <div className="rounded border border-[#8ab4ff]/30 bg-[#8ab4ff]/10 p-2 text-[9px] leading-tight">
          <span className="mb-1 block font-bold">Nota del Analista:</span>
          {encrypted
            ? "El contenido viaja ilegible: un atacante en el camino solo ve bytes cifrados."
            : "Modo Básico: cualquiera en la ruta (ISP, atacante) puede leer el mensaje en texto plano."}
        </div>
      </div>
    </motion.div>
  );
}

// ── util ──────────────────────────────────────────────────────────────────────
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
