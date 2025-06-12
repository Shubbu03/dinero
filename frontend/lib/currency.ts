export const updateCurrency = (money: number, currency: string) => {
  let updatedValues = {
    amount: 0,
    symbol: "$",
  };
  switch (currency) {
    case "USD":
      updatedValues = { amount: money, symbol: "$" };
      break;
    case "INR":
      updatedValues = { amount: money * 85.59, symbol: "₹" };
      break;
    case "GBP":
      updatedValues = { amount: money * 0.74, symbol: "£" };
      break;
    default:
      updatedValues = { amount: money, symbol: "$" };
  }
  return updatedValues;
};
