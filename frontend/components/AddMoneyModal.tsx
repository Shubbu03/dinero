"use client";

import { useState, useEffect } from "react";
import {
  X,
  Plus,
  CreditCard,
  Smartphone,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";
import { useAddMoney } from "@/lib/hooks/useTransactions";
import { useCards, useAddMoneyWithCard } from "@/lib/hooks/useCards";
import { AddCardRequest } from "@/lib/apiService";
import { notify } from "@/lib/notify";
import { updateCurrency, convertToUSD, getCurrencySymbol } from "@/lib/currency";

interface AddMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  currency: string;
}

interface NewCardForm {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  holderName: string;
}

export default function AddMoneyModal({
  isOpen,
  onClose,
  currentBalance,
  currency,
}: AddMoneyModalProps) {
  const [currentScene, setCurrentScene] = useState<"amount" | "card">("amount");
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string>("card");

  const [selectedExistingCard, setSelectedExistingCard] = useState<string>("");
  const [showExistingDropdown, setShowExistingDropdown] = useState(false);
  const [newCardForm, setNewCardForm] = useState<NewCardForm>({
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    holderName: "",
  });
  const [detectedCardType, setDetectedCardType] = useState<string>("");
  const [useNewCard, setUseNewCard] = useState(false);

  const { data: existingCards = [], isLoading: cardsLoading } = useCards();
  const addMoneyMutation = useAddMoney();
  const addMoneyWithCardMutation = useAddMoneyWithCard();

  const paymentMethods = [
    {
      id: "card",
      name: "Credit/Debit Card",
      icon: CreditCard,
      description: "Add money instantly using your card",
      fee: "1.4% fee",
    },
    {
      id: "upi",
      name: "UPI",
      icon: Smartphone,
      description: "Add money using UPI",
      fee: "Free",
    },
  ];

  const quickAmounts = [10, 25, 50, 100, 200, 500];

  useEffect(() => {
    if (isOpen) {
      setCurrentScene("amount");
      setAmount("");
      setSelectedMethod("card");
      setSelectedExistingCard("");
      setUseNewCard(false);
      setNewCardForm({
        cardNumber: "",
        expiryMonth: "",
        expiryYear: "",
        cvv: "",
        holderName: "",
      });
      setDetectedCardType("");
      setShowExistingDropdown(false);
    } else {
      setCurrentScene("amount");
      setAmount("");
      setSelectedMethod("card");
      setSelectedExistingCard("");
      setUseNewCard(false);
      setNewCardForm({
        cardNumber: "",
        expiryMonth: "",
        expiryYear: "",
        cvv: "",
        holderName: "",
      });
      setDetectedCardType("");
      setShowExistingDropdown(false);
    }
  }, [isOpen]);

  const detectCardType = (number: string) => {
    const cleaned = number.replace(/\s/g, "");
    if (cleaned.startsWith("4")) return "VISA";
    if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return "MC";
    if (/^3[47]/.test(cleaned)) return "AMEX";
    if (/^6011|^65/.test(cleaned)) return "DISC";
    return "";
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "");
    const match = cleaned.match(/.{1,4}/g);
    return match ? match.join(" ") : "";
  };

  const handleAmountChange = (value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleQuickAmount = (amount: number) => {
    setAmount(amount.toString());
  };

  const handleCardNumberChange = (value: string) => {
    const cleaned = value.replace(/\s/g, "");
    if (cleaned.length <= 19 && /^\d*$/.test(cleaned)) {
      const formatted = formatCardNumber(cleaned);
      setNewCardForm((prev) => ({ ...prev, cardNumber: formatted }));
      setDetectedCardType(detectCardType(cleaned));
    }
  };

  const handleExpiryChange = (
    field: "expiryMonth" | "expiryYear",
    value: string
  ) => {
    if (/^\d*$/.test(value)) {
      if (
        field === "expiryMonth" &&
        value.length <= 2 &&
        (value === "" || (parseInt(value) >= 1 && parseInt(value) <= 12))
      ) {
        const paddedValue =
          value.length === 1 && value !== "0" ? value.padStart(2, "0") : value;
        setNewCardForm((prev) => ({ ...prev, [field]: paddedValue }));
      } else if (field === "expiryYear" && value.length <= 2) {
        setNewCardForm((prev) => ({ ...prev, [field]: value }));
      }
    }
  };

  const handleCvvChange = (value: string) => {
    if (/^\d*$/.test(value) && value.length <= 4) {
      setNewCardForm((prev) => ({ ...prev, cvv: value }));
    }
  };

  const handleProceedToCard = () => {
    if (selectedMethod === "card" && amount && parseFloat(amount) > 0) {
      setCurrentScene("card");
    }
  };

  const handleUPIPayment = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    try {
      const amountInUserCurrency = parseFloat(amount);
      const amountInUSD = convertToUSD(amountInUserCurrency, currency);
      const amountInCents = Math.round(amountInUSD * 100);
      
      await addMoneyMutation.mutateAsync(amountInCents);
      setAmount("");
      onClose();
      
      const symbol = getCurrencySymbol(currency);
      notify(`${symbol}${amountInUserCurrency.toFixed(2)} added successfully via UPI!`, "success");
    } catch (error) {
      console.error("Failed to add money:", error);
      notify("Failed to add money. Please try again.", "error");
    }
  };

  const handleFinalPayment = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    try {
      const amountInUserCurrency = parseFloat(amount);
      const amountInUSD = convertToUSD(amountInUserCurrency, currency);
      const amountInCents = Math.round(amountInUSD * 100);

      if (useNewCard) {
        const { cardNumber, expiryMonth, expiryYear, cvv, holderName } =
          newCardForm;
        if (!cardNumber || !expiryMonth || !expiryYear || !cvv || !holderName) {
          notify("Please fill in all card details", "warn");
          return;
        }

        const cardData: AddCardRequest = {
          card_number: cardNumber.replace(/\s/g, ""),
          expiry_month: expiryMonth.padStart(2, "0"),
          expiry_year: expiryYear.padStart(2, "0"),
          cvv,
          holder_name: holderName.trim(),
        };

        const symbol = getCurrencySymbol(currency);
        await addMoneyWithCardMutation.mutateAsync({
          amount: amountInCents,
          description: `Added ${symbol}${amountInUserCurrency.toFixed(2)} via new card`,
          card_data: cardData,
        });
      } else {
        if (!selectedExistingCard) {
          notify("Please select a card", "warn");
          return;
        }

        const symbol = getCurrencySymbol(currency);
        await addMoneyWithCardMutation.mutateAsync({
          amount: amountInCents,
          description: `Added ${symbol}${amountInUserCurrency.toFixed(2)} via saved card`,
          card_id: parseInt(selectedExistingCard),
        });
      }

      setAmount("");
      onClose();
      const symbol = getCurrencySymbol(currency);
      notify(`${symbol}${amountInUserCurrency.toFixed(2)} added successfully!`, "success");
    } catch (error) {
      console.error("Failed to add money:", error);
      notify(
        `Failed to add money: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
    }
  };

  const isNewCardFormValid = () => {
    const { cardNumber, expiryMonth, expiryYear, cvv, holderName } =
      newCardForm;
    const cleanedCardNumber = cardNumber.replace(/\s/g, "");
    return (
      cleanedCardNumber.length >= 13 &&
      cleanedCardNumber.length <= 19 &&
      expiryMonth &&
      parseInt(expiryMonth) >= 1 &&
      parseInt(expiryMonth) <= 12 &&
      expiryYear &&
      parseInt(expiryYear) >= 0 &&
      parseInt(expiryYear) <= 99 &&
      cvv.length >= 3 &&
      cvv.length <= 4 &&
      holderName.trim().length >= 2
    );
  };

  const handleButtonClick = () => {
    if (currentScene === "amount") {
      if (selectedMethod === "card") {
        handleProceedToCard();
      } else {
        handleUPIPayment();
      }
    } else {
      handleFinalPayment();
    }
  };

  const isButtonDisabled = () => {
    if (
      !amount ||
      parseFloat(amount) <= 0 ||
      addMoneyMutation.isPending ||
      addMoneyWithCardMutation.isPending
    ) {
      return true;
    }

    if (currentScene === "card") {
      return !selectedExistingCard && (!useNewCard || !isNewCardFormValid());
    }

    return false;
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col transform transition-transform duration-300 ${
          isOpen ? "scale-100" : "scale-95"
        } overflow-y-auto overscroll-contain`}
        style={{ backgroundColor: "#FFFFFF" }}
      >
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: "#EAE4D5" }}
        >
          <div className="flex items-center space-x-3">
            {currentScene === "card" && (
              <button
                onClick={() => setCurrentScene("amount")}
                className="p-1 rounded-lg transition-colors hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" style={{ color: "#B6B09F" }} />
              </button>
            )}
            <h2 className="text-xl font-semibold" style={{ color: "#000000" }}>
              {currentScene === "amount" ? "Add Money" : "Select Payment Card"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-gray-100"
          >
            <X className="w-5 h-5" style={{ color: "#B6B09F" }} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div
            className="p-4 rounded-xl mb-4"
            style={{ backgroundColor: "#F8F8F8" }}
          >
            <p className="text-sm" style={{ color: "#B6B09F" }}>
              Current Balance
            </p>
            {(() => {
              const { amount, symbol } = updateCurrency(currentBalance / 100, currency);
              return (
                <p className="text-2xl font-bold" style={{ color: "#000000" }}>
                  {symbol}{amount.toFixed(2)}
                </p>
              );
            })()}
          </div>

          {currentScene === "amount" ? (
            <>
              <div className="space-y-2">
                <label
                  className="block text-sm font-medium"
                  style={{ color: "#000000" }}
                >
                  Amount to Add
                </label>
                <div className="relative">
                  <span
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lg font-medium"
                    style={{ color: "#000000" }}
                  >
                    {getCurrencySymbol(currency)}
                  </span>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none"
                    style={{ borderColor: "#EAE4D5" }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  className="block text-sm font-medium"
                  style={{ color: "#000000" }}
                >
                  Quick Add
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {quickAmounts.map((quickAmount) => (
                    <button
                      key={quickAmount}
                      onClick={() => handleQuickAmount(quickAmount)}
                      className="p-3 rounded-lg border transition-all hover:scale-105"
                      style={{
                        borderColor:
                          amount === quickAmount.toString()
                            ? "#000000"
                            : "#EAE4D5",
                        backgroundColor:
                          amount === quickAmount.toString()
                            ? "#000000"
                            : "#F8F8F8",
                        color:
                          amount === quickAmount.toString()
                            ? "#F2F2F2"
                            : "#000000",
                      }}
                    >
                      {getCurrencySymbol(currency)}{quickAmount}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label
                  className="block text-sm font-medium"
                  style={{ color: "#000000" }}
                >
                  Payment Method
                </label>
                <div className="space-y-2">
                  {paymentMethods.map((method) => {
                    const IconComponent = method.icon;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className="w-full flex items-center space-x-3 p-4 rounded-lg border transition-all"
                        style={{
                          borderColor:
                            selectedMethod === method.id
                              ? "#000000"
                              : "#EAE4D5",
                          backgroundColor:
                            selectedMethod === method.id ? "#F8F8F8" : "white",
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: "#EAE4D5" }}
                        >
                          <IconComponent
                            className="w-5 h-5"
                            style={{ color: "#000000" }}
                          />
                        </div>
                        <div className="flex-1 text-left">
                          <p
                            className="font-medium"
                            style={{ color: "#000000" }}
                          >
                            {method.name}
                          </p>
                          <p className="text-sm" style={{ color: "#B6B09F" }}>
                            {method.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className="text-sm font-medium"
                            style={{ color: "#000000" }}
                          >
                            {method.fee}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedMethod === "card" &&
                amount &&
                parseFloat(amount) > 0 && (
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: "#FFF8E1" }}
                  >
                    <div className="flex justify-between text-sm">
                      <span style={{ color: "#B6B09F" }}>Amount:</span>
                      <span style={{ color: "#000000" }}>
                        {getCurrencySymbol(currency)}{amount}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: "#B6B09F" }}>
                        Processing Fee (1.4%):
                      </span>
                      <span style={{ color: "#000000" }}>
                        {(() => {
                          const amt = parseFloat(amount) || 0;
                          const fee = amt * 0.014;
                          return `${getCurrencySymbol(currency)}${fee.toFixed(2)}`;
                        })()}
                      </span>
                    </div>
                    <hr className="my-2" style={{ borderColor: "#EAE4D5" }} />
                    <div className="flex justify-between text-sm font-medium">
                      <span style={{ color: "#000000" }}>
                        Total to be charged:
                      </span>
                      <span style={{ color: "#000000" }}>
                        {(() => {
                          const amt = parseFloat(amount) || 0;
                          const total = amt + amt * 0.014;
                          return `${getCurrencySymbol(currency)}${total.toFixed(2)}`;
                        })()}
                      </span>
                    </div>
                  </div>
                )}
            </>
          ) : (
            <>
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: "#FFF8E1" }}
              >
                <div className="flex justify-between text-sm font-medium">
                  <span style={{ color: "#000000" }}>Amount to Add:</span>
                  <span style={{ color: "#000000" }}>
                    {getCurrencySymbol(currency)}{amount}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#B6B09F" }}>
                    Processing Fee (1.4%):
                  </span>
                  <span style={{ color: "#000000" }}>
                    {getCurrencySymbol(currency)}{(parseFloat(amount) * 0.014).toFixed(2)}
                  </span>
                </div>
                <hr className="my-2" style={{ borderColor: "#EAE4D5" }} />
                <div className="flex justify-between text-sm font-medium">
                  <span style={{ color: "#000000" }}>Total to be charged:</span>
                  <span style={{ color: "#000000" }}>
                    {getCurrencySymbol(currency)}{(parseFloat(amount) * 1.014).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h3
                  className="text-lg font-semibold"
                  style={{ color: "#000000" }}
                >
                  Existing Cards
                </h3>

                {cardsLoading ? (
                  <div className="p-4 text-center" style={{ color: "#B6B09F" }}>
                    Loading your saved cards...
                  </div>
                ) : existingCards.length === 0 ? (
                  <div className="p-4 text-center" style={{ color: "#B6B09F" }}>
                    No saved cards found. Add a new card below.
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <button
                        onClick={() => {
                          setShowExistingDropdown(!showExistingDropdown);
                          if (!showExistingDropdown) {
                            setUseNewCard(false);
                          }
                        }}
                        className="w-full flex items-center justify-between p-3 border rounded-lg"
                        style={{
                          borderColor: "#EAE4D5",
                          backgroundColor: "#F8F8F8",
                        }}
                      >
                        <span
                          style={{
                            color: selectedExistingCard ? "#000000" : "#B6B09F",
                          }}
                        >
                          {selectedExistingCard
                            ? existingCards.find(
                                (card) =>
                                  card.id.toString() === selectedExistingCard
                              )?.masked_number
                            : "Select a saved card"}
                        </span>
                        <ChevronDown
                          className="w-5 h-5"
                          style={{ color: "#B6B09F" }}
                        />
                      </button>

                      {showExistingDropdown && (
                        <div
                          className="absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto"
                          style={{
                            backgroundColor: "#FFFFFF",
                            borderColor: "#EAE4D5",
                          }}
                        >
                          {existingCards.map((card) => (
                            <button
                              key={card.id}
                              onClick={() => {
                                setSelectedExistingCard(card.id.toString());
                                setUseNewCard(false);
                                setShowExistingDropdown(false);
                              }}
                              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                            >
                              <div className="text-left">
                                <p
                                  className="font-medium"
                                  style={{ color: "#000000" }}
                                >
                                  {card.masked_number}
                                </p>
                                <p
                                  className="text-sm"
                                  style={{ color: "#B6B09F" }}
                                >
                                  {card.holder_name} • {card.expiry_month}/
                                  {card.expiry_year}
                                </p>
                              </div>
                              <span
                                className="text-xs px-2 py-1 rounded"
                                style={{
                                  backgroundColor: "#F8F8F8",
                                  color: "#000000",
                                }}
                              >
                                {card.card_type}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {selectedExistingCard && !useNewCard && (
                      <div
                        className="p-4 rounded-lg border"
                        style={{
                          borderColor: "#000000",
                          backgroundColor: "#F8F8F8",
                        }}
                      >
                        <p className="text-sm" style={{ color: "#B6B09F" }}>
                          Selected Card
                        </p>
                        {(() => {
                          const card = existingCards.find(
                            (c) => c.id.toString() === selectedExistingCard
                          );
                          return card ? (
                            <div className="flex items-center justify-between">
                              <div>
                                <p
                                  className="font-medium"
                                  style={{ color: "#000000" }}
                                >
                                  {card.masked_number}
                                </p>
                                <p
                                  className="text-sm"
                                  style={{ color: "#B6B09F" }}
                                >
                                  {card.holder_name}
                                </p>
                              </div>
                              <span
                                className="text-xs px-2 py-1 rounded"
                                style={{
                                  backgroundColor: "#000000",
                                  color: "#F2F2F2",
                                }}
                              >
                                {card.card_type}
                              </span>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <div
                  className="flex-1 h-px"
                  style={{ backgroundColor: "#EAE4D5" }}
                ></div>
                <span className="text-sm font-medium" style={{ color: "#B6B09F" }}>
                  OR
                </span>
                <div
                  className="flex-1 h-px"
                  style={{ backgroundColor: "#EAE4D5" }}
                ></div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3
                    className="text-lg font-semibold"
                    style={{ color: "#000000" }}
                  >
                    Add New Card
                  </h3>
                  <button
                    onClick={() => {
                      setUseNewCard(!useNewCard);
                      if (!useNewCard) {
                        setSelectedExistingCard("");
                        setShowExistingDropdown(false);
                      }
                    }}
                    className={`px-3 py-1 rounded-lg text-sm transition-all ${
                      useNewCard
                        ? "bg-black text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {useNewCard ? "Using New Card" : "Use New Card"}
                  </button>
                </div>

                {useNewCard && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label
                        className="block text-sm font-medium"
                        style={{ color: "#000000" }}
                      >
                        Card Number
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={newCardForm.cardNumber}
                          onChange={(e) =>
                            handleCardNumberChange(e.target.value)
                          }
                          placeholder="1234 5678 9012 3456"
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none"
                          style={{ borderColor: "#EAE4D5" }}
                        />
                        {detectedCardType && (
                          <span
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs px-2 py-1 rounded"
                            style={{
                              backgroundColor: "#F8F8F8",
                              color: "#000000",
                            }}
                          >
                            {detectedCardType}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <label
                          className="block text-sm font-medium"
                          style={{ color: "#000000" }}
                        >
                          Month
                        </label>
                        <input
                          type="text"
                          value={newCardForm.expiryMonth}
                          onChange={(e) =>
                            handleExpiryChange("expiryMonth", e.target.value)
                          }
                          placeholder="MM"
                          maxLength={2}
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none"
                          style={{ borderColor: "#EAE4D5" }}
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          className="block text-sm font-medium"
                          style={{ color: "#000000" }}
                        >
                          Year
                        </label>
                        <input
                          type="text"
                          value={newCardForm.expiryYear}
                          onChange={(e) =>
                            handleExpiryChange("expiryYear", e.target.value)
                          }
                          placeholder="YY"
                          maxLength={2}
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none"
                          style={{ borderColor: "#EAE4D5" }}
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          className="block text-sm font-medium"
                          style={{ color: "#000000" }}
                        >
                          CVV
                        </label>
                        <input
                          type="text"
                          value={newCardForm.cvv}
                          onChange={(e) => handleCvvChange(e.target.value)}
                          placeholder="123"
                          maxLength={4}
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none"
                          style={{ borderColor: "#EAE4D5" }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label
                        className="block text-sm font-medium"
                        style={{ color: "#000000" }}
                      >
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        value={newCardForm.holderName}
                        onChange={(e) =>
                          setNewCardForm((prev) => ({
                            ...prev,
                            holderName: e.target.value,
                          }))
                        }
                        placeholder="John Doe"
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none"
                        style={{ borderColor: "#EAE4D5" }}
                      />
                    </div>

                    <div
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: "#E8F5E8" }}
                    >
                      <p className="text-xs" style={{ color: "#2E7D32" }}>
                        🔒 Your card information is encrypted and securely
                        stored. We follow industry standards to protect your
                        data.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <button
            onClick={handleButtonClick}
            disabled={isButtonDisabled()}
            className="w-full bg-black text-white py-3 rounded-lg font-medium transition-all hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center space-x-2"
            style={{
              backgroundColor: isButtonDisabled() ? "#D1D5DB" : "#000000",
              color: "#F2F2F2",
            }}
          >
            {addMoneyMutation.isPending ||
            addMoneyWithCardMutation.isPending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                <span>{(() => {
                  const amt = parseFloat(amount) || 0;
                  const symbol = getCurrencySymbol(currency);
                  if (currentScene === "amount") {
                    return selectedMethod === "card"
                      ? "Proceed to Add"
                      : `Add ${symbol}${amt.toFixed(2)}`;
                  }
                  return `Add ${symbol}${amt.toFixed(2)}`;
                })()}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
