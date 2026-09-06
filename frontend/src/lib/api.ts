const isLocalDev = typeof window !== "undefined" && window.location.port === "3000";
const API_BASE_URL = isLocalDev ? "http://localhost:8000/api" : "/api";

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("access_token");
    window.location.href = "/auth";
  }

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

export async function login(username: string, password: string) {
  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);

  const response = await fetch(`${API_BASE_URL}/auth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    throw new Error("Invalid username or password");
  }

  const data = await response.json();
  if (typeof window !== "undefined") {
    localStorage.setItem("access_token", data.access_token);
  }
  return data;
}

export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
    window.location.href = "/auth";
  }
}

export function getSession() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export async function getMyProfile() {
  return fetchWithAuth("/auth/me").catch(() => null);
}



export async function getLedgerPortfolioSummary() {
  try {
    const res = await fetchWithAuth("/ledger/summary");
    return res || { transactions: [], portfolio_stats: {} };
  } catch (error) {
    console.error("Failed to load ledger portfolio summary:", error);
    return { transactions: [], portfolio_stats: {} };
  }
}

export async function listAllEntries() {
  try {
    const res = await fetchWithAuth("/ledger/summary");
    if (!res || !res.transactions) return [];

    // Zero Logic in UI: If the server returned normalized entries with gold_in/out, pass through directly
    return res.transactions.map((t: any) => {
      if (t.gold_in !== undefined || t.gold_out !== undefined) {
        return {
          ...t,
          id: String(t.id),
          is_short: Boolean(t.is_short),
          is_settled: Boolean(t.is_settled),
        };
      }
      // Fallback only for legacy unnormalized backend responses
      const type = (t.type || "").toUpperCase();
      const isBuy = type === 'BUY';
      const isSell = type === 'SELL';
      const isPayment = type === 'PAYMENT';

      return {
        id: String(t.id),
        entry_at: t.date_time || new Date().toISOString(),
        entry_type: type,
        notes: t.notes || "",
        mazaneh: (t.price_per_gram || 0) * 4.3318,
        gold_in: isBuy ? (t.weight_grams || 0) : 0,
        gold_out: isSell ? (t.weight_grams || 0) : 0,
        fiat_debtor: isBuy ? (t.total_value || 0) : (isPayment && (t.total_value || 0) > 0 ? t.total_value : 0),
        fiat_creditor: isSell ? (t.total_value || 0) : (isPayment && (t.total_value || 0) < 0 ? Math.abs(t.total_value) : 0),
        is_short: Boolean(t.is_short),
        is_settled: Boolean(t.is_settled),
      };
    });
  } catch (error) {
    console.error("Failed to load entries:", error);
    return [];
  }
}

export interface LedgerEntryInput {
    id: string | null;
    entry_at: string;
    entry_type: string;
    notes: string;
    mazaneh: number;
    gold_in: number;
    gold_out: number;
    fiat_debtor: number;
    fiat_creditor: number;
    is_short: boolean;
    is_settled: boolean;
}

export async function addCounterparty(data: any) { 
  return fetchWithAuth("/ledger/counterparties", { method: "POST", body: JSON.stringify(data) }); 
}
export async function ensureWorkspace() { 
  return true; 
}
export async function listCounterparties() { 
  return fetchWithAuth("/ledger/counterparties"); 
}
export async function listEntries(data: any) { 
  return fetchWithAuth("/ledger/entries/list", { method: "POST", body: JSON.stringify(data) }); 
}
export async function resetCarryOver(data: any) { 
  return fetchWithAuth("/ledger/entries/carryover", { method: "POST", body: JSON.stringify(data) }); 
}
export async function saveEntries(data: any) { 
  return fetchWithAuth("/ledger/entries/save", { method: "POST", body: JSON.stringify(data) }); 
}
export async function wipeLedger(data: any) { 
  return fetchWithAuth("/ledger/entries/wipe", { method: "POST", body: JSON.stringify(data) }); 
}
export async function getLedgerKpi(data: any) { 
  return fetchWithAuth("/ledger/entries/kpi", { method: "POST", body: JSON.stringify(data) }); 
}
export async function getRiskMatrix() { 
  return fetchWithAuth("/ledger/risk-matrix"); 
}

// ── Trades API (Phase 1 — v2→v2.5 port) ────────────────────────────────────

export interface AddTradePayload {
  trade_type: "BUY" | "SELL";
  weight_grams: number;
  price_per_gram: number;
  counterparty?: string;
  trade_notes?: string;
  is_short?: boolean;
  is_historical?: boolean;
  shamsi_date?: string;
  date_gregorian?: string;
}

export interface TradeRecord {
  id: number;
  type: string;
  weight_grams: number;
  weight_mesghal: number;
  price_per_gram: number;
  price_mesghal: number;
  total_value: number;
  spread_mesghal: number;
  shamsi_date: string;
  date_gregorian: string;
  date_time: string;
  counterparty: string;
  trade_notes: string;
  is_short: boolean;
  is_settled: boolean;
  is_historical: boolean;
  pnl: number | null;
}

export interface PortfolioSummary {
  fiat_balance: number;
  trading_gold: number;
  baseline_gold: number;
  total_owned_gold: number;
  vault_gold: number;
  realized_pnl: number;
  unrealized_pnl: number;
  total_value: number;
  gold_alpha: number;
  return_index: number;
  avg_entry_mazaneh: number;
  avg_short_entry_mazaneh: number;
  short_gold: number;
}

export async function addTrade(payload: AddTradePayload) {
  return fetchWithAuth("/trades", { method: "POST", body: JSON.stringify(payload) });
}

export async function listTrades(): Promise<TradeRecord[]> {
  return fetchWithAuth("/trades");
}

export async function editTrade(tradeId: number, payload: Partial<AddTradePayload> & { total_value?: number }) {
  return fetchWithAuth(`/trades/${tradeId}`, { method: "PUT", body: JSON.stringify(payload) });
}

export async function settleTrade(tradeId: number, moveToVault = false) {
  return fetchWithAuth(`/trades/${tradeId}/settle`, {
    method: "POST",
    body: JSON.stringify({ move_to_vault: moveToVault }),
  });
}

export async function unsettleTrade(tradeId: number) {
  return fetchWithAuth(`/trades/${tradeId}/unsettle`, { method: "POST" });
}

export async function deleteTrade(tradeId: number) {
  return fetchWithAuth(`/trades/${tradeId}`, { method: "DELETE" });
}

export async function getPortfolio(): Promise<PortfolioSummary> {
  return fetchWithAuth("/trades/portfolio");
}

// ── Accounting & Vault API (Phase 2 — v2→v2.5 port) ────────────────────────

export interface AccountingEntry {
  counterparty: string;
  fiat_balance: number;
  pending_trades: number;
  status: "settled" | "debtor" | "creditor";
  status_text: string;
  trading_gold: number;
  realized_pnl: number;
  unrealized_pnl: number;
  roi_percent: number;
  gold_alpha_grams: number;
  avg_entry_mazaneh: number;
  avg_short_mazaneh: number;
  total_turnover: number;
  ai_advice: string;
  pos_type: string;
  stop_loss_mazaneh: number;
  take_profit_mazaneh: number;
  breakeven_mazaneh: number;
}

export interface UnsettledTrade {
  id: number;
  type: string;
  type_label: string;
  weight_grams: number;
  total_value: number;
  counterparty: string;
  shamsi_date: string;
  is_short: boolean;
}

export interface VaultData {
  entries: Array<{
    id: number;
    weight_grams: number;
    entry_price: number;
    notes: string;
    date_time: string;
  }>;
  total_weight: number;
  current_value: number;
  gold_toman: number;
}

export async function getAccountingSummary(): Promise<AccountingEntry[]> {
  return fetchWithAuth("/accounting/summary");
}

export async function getUnsettledTrades(): Promise<UnsettledTrade[]> {
  return fetchWithAuth("/accounting/unsettled");
}

export async function getVault(): Promise<VaultData> {
  return fetchWithAuth("/accounting/vault");
}

export async function adjustVault(payload: { weight_grams: number; operation: "increase" | "decrease"; notes?: string }) {
  return fetchWithAuth("/accounting/vault/adjust", { method: "POST", body: JSON.stringify(payload) });
}

export async function vaultTransfer(payload: {
  weight_grams: number;
  price_per_gram: number;
  counterparty: string;
  direction: "vault_to_trade" | "trade_to_vault";
}) {
  return fetchWithAuth("/accounting/vault/transfer", { method: "POST", body: JSON.stringify(payload) });
}

// ── Price Alerts & AI Signal API (Phase 3 — v2→v2.5 port) ──────────────────

export interface PriceAlert {
  id: number;
  target_price_toman: number;
  target_mazaneh: number;
  condition: string;
  icon: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface AiSignal {
  action: string;
  prob_buy: number;
  prob_sell: number;
  prob_hold: number;
  top_drivers: Array<{ Feature: string; Importance: number }>;
  updated_at: number | null;
  age_seconds: number | null;
  is_fresh: boolean;
}

export interface SignalHistoryEntry {
  signal: string;
  prob_buy: number;
  prob_sell: number;
  prob_hold: number;
  logged_at: string;
}

export async function listAlerts(): Promise<PriceAlert[]> {
  return fetchWithAuth("/alerts");
}

export async function addAlert(payload: { target_price_toman: number; condition: ">=" | "<="; unit: "gram" | "mesghal" }) {
  return fetchWithAuth("/alerts", { method: "POST", body: JSON.stringify(payload) });
}

export async function deleteAlert(alertId: number) {
  return fetchWithAuth(`/alerts/${alertId}`, { method: "DELETE" });
}

export async function getAiSignal(): Promise<AiSignal> {
  return fetchWithAuth("/alerts/signal");
}

export async function getSignalHistory(limit = 20): Promise<SignalHistoryEntry[]> {
  return fetchWithAuth(`/alerts/signal/history?limit=${limit}`);
}

// ── Charts API (Phase 4 — v2→v2.5 port) ──────────────────────────────────────

export interface TechnicalChartData {
  time: string;
  value: number;
  sma20: number | null;
  bb_upper: number | null;
  bb_lower: number | null;
  rsi: number | null;
}

export interface SignalChartData {
  time: string | number;
  shamsi_date?: string;
  value: number;
  sma20: number | null;
  bb_upper: number | null;
  bb_lower: number | null;
  rsi: number | null;
  action: number; // 0=SELL/PARTIAL_SELL, 1=HOLD, 2=BUY
  action_text?: string;
  prob_buy?: number;
  prob_sell?: number;
}

export interface AssetAllocationData {
  name: string;
  value: number;
  color: string;
}

export interface CounterpartyVolumeData {
  counterparty: string;
  volume_grams: number;
}

export interface PortfolioPerformanceData {
  time: string;
  invested: number;
}

export async function getTechnicalChartData(days = 120): Promise<TechnicalChartData[]> {
  return fetchWithAuth(`/charts/technical?days=${days}`);
}

export async function getSignalChartData(days = 1200): Promise<SignalChartData[]> {
  return fetchWithAuth(`/charts/signals?days=${days}`);
}

export async function getIntradaySignalChartData(date?: string): Promise<SignalChartData[]> {
  const url = date ? `/charts/signals/intraday?date=${encodeURIComponent(date)}` : `/charts/signals/intraday`;
  return fetchWithAuth(url);
}

export async function getAvailableIntradayDates(): Promise<string[]> {
  return fetchWithAuth("/charts/signals/intraday/dates");
}

export async function getAssetAllocation(): Promise<AssetAllocationData[]> {
  return fetchWithAuth("/charts/allocation");
}

export async function getCounterpartyVolume(): Promise<CounterpartyVolumeData[]> {
  return fetchWithAuth("/charts/counterparty/volume");
}

export async function getPortfolioPerformance(): Promise<PortfolioPerformanceData[]> {
  return fetchWithAuth("/charts/portfolio/performance");
}

// ── AI Evaluation API (Phase 5 — v2→v2.5 port) ───────────────────────────────

export interface WfaTimeseriesData {
  date: string;
  strategy: number;
  buyHold: number;
}

export interface MonteCarloPath {
  day: number;
  mean: number;
  p5: number;
  p95: number;
  [key: string]: number; // dynamic paths like path_0, path_1, etc.
}

export interface EvaluationMetricsResponse {
  wfa: {
    timeseries: WfaTimeseriesData[];
    final_strategy: number;
    final_buy_hold: number;
    alpha: number;
  };
  bootstrap: {
    median: number;
    lower_ci: number;
    upper_ci: number;
  };
  monte_carlo: {
    paths: MonteCarloPath[];
    var_95: number;
    es_99: number;
    last_price: number;
  };
}

export interface TacticalOracleResponse {
  status: string;
  message?: string;
  technical?: {
    rsi: number;
    sma_dist: number;
    status_tag: string;
    advice_text: string;
    advice_bg: string;
    advice_border: string;
  };
  counterparty_risk?: {
    name: string;
    gold: number;
    fiat: number;
    ratio: number;
  };
}

export async function getEvaluationMetrics(): Promise<EvaluationMetricsResponse> {
  return fetchWithAuth("/ml/evaluation-metrics");
}

export async function getTacticalOracle(): Promise<TacticalOracleResponse> {
  return fetchWithAuth("/ml/tactical-oracle");
}

export interface LivePricesResponse {
  gold: number | null;
  usd: number | null;
  xau: number | null;
  mesghal: number | null;
  mesghal_toman: number;
  gram18_toman: number;
  usd_toman: number;
  coin?: number | null;
  coin_toman?: number;
  intrinsic_mesghal_toman: number;
  bubble_pct: number;
  intrinsic_coin_toman?: number;
  coin_bubble_pct?: number;
  coin_bubble_toman?: number;
  coin_mazaneh_ratio?: number;
  market_status: {
    is_open: boolean;
    reason: string;
    shamsi_now: string;
    color: string;
    icon: string;
  };
  polled_at_str: string;
  price_changed_at_str: string;
  daemon_ok: boolean;
  daemon_age_sec: number;
  sr_levels: {
    supports_mesghal: number[];
    resistances_mesghal: number[];
    supports_gram18: number[];
    resistances_gram18: number[];
  };
  ok: boolean;
}

export interface AICouncilEngine {
  id: string;
  title_fa: string;
  status_fa: string;
  tone: "profit" | "loss" | "warn" | "neutral";
  score: number;
  chandelier_stop_toman?: number;
  is_active?: boolean;
}

export interface AICouncilData {
  active: boolean;
  verdict_fa: string;
  chandelier_stop_toman: number;
  is_super_trend_active: boolean;
  all_weather_regime_fa?: string;
  regime_tone?: "profit" | "loss" | "warn" | "neutral";
  squeeze_fuel_score?: number;
  gated_rsi_status?: string;
  engines: AICouncilEngine[];
}

export interface AISignalResponse {
  action: string;
  signal_fa?: string;
  ai_advice?: string;
  entropy_confidence?: number;
  strategic_stance?: string;
  intraday_phase?: string;
  trailing_risk?: {
    trailing_sl_toman?: number;
    step_1_tp_toman?: number;
    step_2_tp_toman?: number;
    protection_note?: string;
  };
  ai_council?: AICouncilData;
  prob_buy: number;
  prob_sell: number;
  prob_hold: number;
  top_drivers: Array<{ Feature: string; Importance: number }>;
  updated_at: number | null;
  age_seconds: number | null;
  is_fresh: boolean;
  personal_advice: string;
  sma20?: number;
  macd?: number;
  macd_signal?: number;
  rsi?: number;
  gold_usd_ratio?: number;
  coin_habab?: number;
  melt_habab?: number;
  dist_to_max30?: number;
  market_regime?: string;
  market_regime_code?: number;
}

export async function getLivePrices(): Promise<LivePricesResponse> {
  return fetchWithAuth("/prices/live");
}

export async function getAISignal(): Promise<AISignalResponse> {
  return fetchWithAuth("/alerts/signal");
}

export interface UserProfileResponse {
  user_id: number;
  username: string;
  display_name: string;
  is_root: boolean;
  fiat_balance: number;
  trading_gold: number;
  vault_gold: number;
}

export async function getSettingsProfile(): Promise<UserProfileResponse> {
  return fetchWithAuth("/settings/profile");
}

export async function transferVault(data: {
  direction: "vault_to_trade" | "trade_to_vault";
  weight_grams: number;
  price_per_gram: number;
  counterparty: string;
  shamsi_date?: string;
}) {
  return fetchWithAuth("/settings/vault/transfer", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function adjustFiat(new_balance: number, notes?: string) {
  return fetchWithAuth("/settings/fiat/adjust", {
    method: "POST",
    body: JSON.stringify({ new_balance, notes }),
  });
}

export async function resetHistory() {
  return fetchWithAuth("/settings/reset-history", {
    method: "POST",
  });
}

export async function adminListUsers(): Promise<UserProfileResponse[]> {
  return fetchWithAuth("/settings/admin/users");
}

export async function adminCreateUser(data: {
  username: string;
  password: string;
  display_name: string;
  initial_fiat?: number;
}) {
  return fetchWithAuth("/settings/admin/users/create", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function adminResetPassword(target_user_id: number, new_password: string) {
  return fetchWithAuth("/settings/admin/users/reset-password", {
    method: "POST",
    body: JSON.stringify({ target_user_id, new_password }),
  });
}

export async function adminDeleteUser(target_user_id: number) {
  return fetchWithAuth(`/settings/admin/users/${target_user_id}`, {
    method: "DELETE",
  });
}


