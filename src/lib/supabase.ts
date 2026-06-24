import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

type OfflineRow = Record<string, unknown>;

const storageKey = (table: string) => `azazel-offline-${table}`;

function readRows(table: string): OfflineRow[] {
  try {
    const raw = window.localStorage.getItem(storageKey(table));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeRows(table: string, rows: OfflineRow[]) {
  try {
    window.localStorage.setItem(storageKey(table), JSON.stringify(rows));
  } catch {
    // Local storage can be unavailable in private modes.
  }
}

function createOfflineTable(table: string) {
  let rows = readRows(table);
  let filter: { column: string; value: unknown } | null = null;

  const builder: Record<string, unknown> = {
    select: () => builder,
    order: () => builder,
    eq: (column: string, value: unknown) => {
      filter = { column, value };
      return builder;
    },
    maybeSingle: async () => {
      rows = readRows(table);
      const currentFilter = filter;
      const data = currentFilter
        ? rows.find(row => row[currentFilter.column] === currentFilter.value) ?? null
        : rows[0] ?? null;
      return { data, error: data ? null : { code: 'PGRST116', message: 'Offline row not found' } };
    },
    upsert: async (payload: OfflineRow) => {
      rows = readRows(table);
      const key = typeof payload.session_id === 'string' ? 'session_id' : 'id';
      const index = rows.findIndex(row => row[key] === payload[key]);
      if (index >= 0) rows[index] = { ...rows[index], ...payload };
      else rows.push({ id: crypto.randomUUID?.() ?? String(Date.now()), ...payload });
      writeRows(table, rows);
      return { data: payload, error: null };
    },
    insert: async (payload: OfflineRow) => {
      rows = readRows(table);
      rows.push({
        id: crypto.randomUUID?.() ?? String(Date.now()),
        created_at: new Date().toISOString(),
        ...payload,
      });
      writeRows(table, rows);
      return { data: payload, error: null };
    },
    delete: () => builder,
    then: (resolve: (value: { data: null; error: null }) => void) => {
      if (filter) {
        rows = readRows(table).filter(row => row[filter!.column] !== filter!.value);
        writeRows(table, rows);
      }
      resolve({ data: null, error: null });
    },
  };

  return builder;
}

function createOfflineClient() {
  return {
    from: (table: string) => createOfflineTable(table),
    auth: {
      signUp: async () => ({ data: null, error: { message: 'Supabase keys are not configured.' } }),
      signInWithPassword: async () => ({ data: null, error: { message: 'Supabase keys are not configured.' } }),
    },
  };
}

export const isSupabaseConfigured = Boolean(url && anonKey);
export const supabase = (
  isSupabaseConfigured
    ? createClient(url as string, anonKey as string)
    : createOfflineClient()
) as any;
