export type LedgerRow = {
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
};

export type ComputedRow = LedgerRow & {
  goldBalance: number;
  fiatBalance: number;
};

const GRAM_PER_MESGHAL = 4.3318;

/** Mazaneh (per mesghal, 17 ayar) -> price of one gram of 18 ayar gold. */
export function mazanehToGram(mazaneh: number): number {
  return mazaneh / GRAM_PER_MESGHAL;
}

export function withRunningBalances(rows: LedgerRow[]): ComputedRow[] {
  // Zero Logic in UI: Use pre-computed server running balances if available
  if (rows.length > 0 && 'goldBalance' in rows[0] && 'fiatBalance' in rows[0]) {
    return rows as ComputedRow[];
  }
  let gold = 0;
  let fiat = 0;
  return rows.map((row) => {
    gold += (row.gold_in || 0) - (row.gold_out || 0);
    fiat += (row.fiat_debtor || 0) - (row.fiat_creditor || 0);
    return { ...row, goldBalance: gold, fiatBalance: fiat };
  });
}

export type PortfolioStats = {
  openGold: number;
  fiatBalance: number;
  breakEven: number;
  realized: number;
  goldAlpha: number;
  turnover: number;
  unrealized: number;
  totalValue: number;
  returnPct: number;
  goldBacking: number;
};

/**
 * Zero Logic in UI: Prioritizes canonical server-side accounting metrics over client-side estimation.
 * Positive gold = long position, negative = short (فردایی).
 */
export function computePortfolio(
  rows: LedgerRow[],
  gramPrice: number,
  initialCapital: number,
  serverStats?: any,
): PortfolioStats {
  // Zero Logic in UI: Return server-side canonical figures if available
  if (serverStats && typeof serverStats.openGold === "number") {
    return serverStats as PortfolioStats;
  }
  let openGold = 0;
  let avgCost = 0;
  let realized = 0;
  let fiat = 0;
  let turnover = 0;
  let goldAlpha = 0;

  for (const row of rows) {
    const gramPriceAtRow = row.mazaneh ? mazanehToGram(row.mazaneh) : gramPrice;
    const inGold = row.gold_in || 0;
    const outGold = row.gold_out || 0;
    fiat += (row.fiat_debtor || 0) - (row.fiat_creditor || 0);
    turnover += (row.fiat_debtor || 0) + (row.fiat_creditor || 0);

    if (inGold) {
      const total = avgCost * openGold + gramPriceAtRow * inGold;
      openGold += inGold;
      avgCost = openGold !== 0 ? total / openGold : gramPriceAtRow;
    }
    if (outGold) {
      const profit = (gramPriceAtRow - avgCost) * outGold;
      realized += profit;
      goldAlpha += gramPriceAtRow ? profit / gramPriceAtRow : 0;
      openGold -= outGold;
      if (openGold <= 0) avgCost = openGold === 0 ? 0 : gramPriceAtRow;
    }
  }

  const unrealized = openGold * (gramPrice - avgCost);
  const totalValue = initialCapital > 0 ? initialCapital + realized + unrealized : realized + unrealized;
  const returnPct = initialCapital > 0 ? ((realized + unrealized) / initialCapital) * 100 : 0;

  return {
    openGold,
    fiatBalance: fiat,
    breakEven: avgCost,
    realized,
    goldAlpha,
    turnover,
    unrealized,
    totalValue,
    returnPct,
    goldBacking: gramPrice > 0 ? totalValue / gramPrice : 0,
  };
}
