// All user-facing number formatting goes through here (pt-BR). Add date and BRL helpers when a feature needs them.
const integer = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

export function formatInteger(n: number): string {
  return integer.format(n);
}

export function formatNumber(n: number): string {
  return decimal.format(n);
}
