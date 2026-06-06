import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import esRaw from "./locales/es.json";
import ptRaw from "./locales/pt.json";

/* ──────────────────────────────────────────────────────────────────────────
   Internacionalización (i18n)
   Las cadenas viven en un JSON por idioma dentro de src/locales/. Para agregar
   un idioma nuevo (p. ej. una lengua indígena):
     1. Copia src/locales/es.json a src/locales/<código>.json y traduce.
        Las variables van entre llaves: "{label}", "{next}", etc.
     2. Añade su código a `Lang`, impórtalo aquí y regístralo en `RAW` y `LANGS`.
   TypeScript exige que cada JSON tenga la misma forma que es.json (RawDict),
   así no se olvida ninguna cadena.
   ────────────────────────────────────────────────────────────────────────── */

export type Lang = "es" | "pt";

// Metadatos para el selector de idioma (orden = orden mostrado).
export const LANGS: { code: Lang; name: string; flag: string }[] = [
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
];

// Forma del diccionario crudo (es.json es la referencia). Los demás idiomas
// deben coincidir con esta forma.
type RawDict = typeof esRaw;
const RAW: Record<Lang, RawDict> = { es: esRaw, pt: ptRaw };

// Sustituye {variables} de una plantilla por sus valores.
function interp(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? `{${k}}`);
}

// Convierte el JSON crudo en el diccionario que usa la app: las cadenas con
// variables se exponen como funciones tipadas; el resto se pasa tal cual.
function buildDict(r: RawDict) {
  const s = r.sim;
  return {
    ...r,
    sim: {
      ...s,
      errorIncomplete: (start: string) => interp(s.errorIncomplete, { start }),
      starting: (mode: string) => interp(s.starting, { mode: mode.toUpperCase() }),
      received: (label: string) => interp(s.received, { label }),
      httpsStartText: (label: string, next: string) =>
        interp(s.httpsStartText, { label, next }),
      httpsCloudTitle: (label: string) => interp(s.httpsCloudTitle, { label }),
      httpsCloudText: (next: string) => interp(s.httpsCloudText, { next }),
      httpsCloudLog: (label: string) => interp(s.httpsCloudLog, { label }),
      httpsEndText: (label: string) => interp(s.httpsEndText, { label }),
      httpsEndLog: (label: string) => interp(s.httpsEndLog, { label }),
      secureLegLog: (a: string, b: string) => interp(s.secureLegLog, { a, b }),
      e2eeStartText: (label: string, dest: string) =>
        interp(s.e2eeStartText, { label, dest }),
      e2eeEndText: (label: string) => interp(s.e2eeEndText, { label }),
      e2eeEndLog: (label: string) => interp(s.e2eeEndLog, { label }),
      e2eeCloudTitle: (label: string) => interp(s.e2eeCloudTitle, { label }),
      e2eeCloudLog: (label: string) => interp(s.e2eeCloudLog, { label }),
    },
  };
}

export type Dict = ReturnType<typeof buildDict>;

export const translations: Record<Lang, Dict> = {
  es: buildDict(RAW.es),
  pt: buildDict(RAW.pt),
};

// ── Contexto ─────────────────────────────────────────────────────────────────
const STORAGE_KEY = "flujo-lang";

function isLang(v: unknown): v is Lang {
  return v === "es" || v === "pt";
}

function detectInitial(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLang(saved)) return saved;
  } catch {
    /* localStorage no disponible */
  }
  const nav = typeof navigator !== "undefined" ? navigator.language?.toLowerCase() : "";
  return nav?.startsWith("pt") ? "pt" : "es";
}

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: Dict }>(
  { lang: "es", setLang: () => {}, t: translations.es }
);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectInitial);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

export function useT() {
  return useContext(LangContext).t;
}
