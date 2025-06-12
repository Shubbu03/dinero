const EXCHANGE_RATES = {
  USD: 1,
  INR: 85.59,
  GBP: 0.74,
};

const CURRENCY_SYMBOLS = {
  USD: "$",
  INR: "₹",
  GBP: "£",
};

export const convertToUSD = (amount: number, fromCurrency: string): number => {
  const rate = EXCHANGE_RATES[fromCurrency as keyof typeof EXCHANGE_RATES] || 1;
  return amount / rate;
};

export const convertFromUSD = (usdAmount: number, toCurrency: string): number => {
  const rate = EXCHANGE_RATES[toCurrency as keyof typeof EXCHANGE_RATES] || 1;
  return usdAmount * rate;
};

export const getCurrencySymbol = (currency: string): string => {
  return CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || "$";
};

export const updateCurrency = (usdMoney: number, currency: string) => {
  const amount = convertFromUSD(usdMoney, currency);
  const symbol = getCurrencySymbol(currency);
  return { amount, symbol };
};
