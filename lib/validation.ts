import { getBankProfile, getAllBankProfiles } from "./db";
import { ValidationResult } from "./types";

export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const PHONE_REGEX = /^[6-9]\d{9}$/;

export function validatePaymentInput(params: {
  accountNumber: string;
  ifsc: string;
  phoneNumber: string;
  amount?: number | string;
}): ValidationResult {
  const errors: string[] = [];
  const cleanIfsc = (params.ifsc || "").trim().toUpperCase();
  const cleanAccount = (params.accountNumber || "").trim().replace(/\s+/g, "");
  const cleanPhone = (params.phoneNumber || "").trim().replace(/[\s-+]/g, "").slice(-10);
  const amountVal = params.amount !== undefined ? Number(params.amount) : 500;

  // 1. IFSC Validation
  const ifscValidFormat = IFSC_REGEX.test(cleanIfsc);
  let ifscPrefix = "";
  let bankName = "Unknown Bank";
  let bankProfile = null;

  if (!cleanIfsc) {
    errors.push("IFSC code is required.");
  } else if (!ifscValidFormat) {
    errors.push("Invalid IFSC format. Expected 4 letters, '0', followed by 6 alphanumeric characters (e.g. SBIN0001234).");
  } else {
    ifscPrefix = cleanIfsc.substring(0, 4);
    bankProfile = getBankProfile(ifscPrefix);
    if (bankProfile) {
      bankName = bankProfile.bank_name;
    } else {
      // General recognized prefix check
      bankName = `${ifscPrefix} Branch`;
    }
  }

  // 2. Account Number Validation
  let accountValid = false;
  let expectedMin = 9;
  let expectedMax = 18;

  if (bankProfile) {
    expectedMin = bankProfile.account_digits_min;
    expectedMax = bankProfile.account_digits_max;
  }

  if (!cleanAccount) {
    errors.push("Account number is required.");
  } else if (!/^\d+$/.test(cleanAccount)) {
    errors.push("Account number must contain digits only.");
  } else if (cleanAccount.length < expectedMin || cleanAccount.length > expectedMax) {
    if (expectedMin === expectedMax) {
      errors.push(
        `Account number for ${bankName} must be exactly ${expectedMin} digits (provided ${cleanAccount.length}).`
      );
    } else {
      errors.push(
        `Account number for ${bankName} must be between ${expectedMin} and ${expectedMax} digits (provided ${cleanAccount.length}).`
      );
    }
  } else {
    accountValid = true;
  }

  // 3. Phone Number Validation
  let phoneValid = false;
  if (!cleanPhone) {
    errors.push("Mobile phone number is required.");
  } else if (!PHONE_REGEX.test(cleanPhone)) {
    errors.push("Invalid Indian mobile number. Must be a valid 10-digit number starting with 6, 7, 8, or 9.");
  } else {
    phoneValid = true;
  }

  // 4. Amount Validation
  let amountValid = false;
  if (isNaN(amountVal) || amountVal <= 0) {
    errors.push("Amount must be greater than ₹0.");
  } else if (amountVal > 100000) {
    errors.push("Maximum single transaction limit for card-less collection is ₹1,00,000.");
  } else {
    amountValid = true;
  }

  const isValid = ifscValidFormat && accountValid && phoneValid && amountValid && errors.length === 0;

  return {
    isValid,
    ifsc: {
      valid: ifscValidFormat,
      prefix: ifscPrefix || undefined,
      bankName: ifscValidFormat ? bankName : undefined,
      message: ifscValidFormat
        ? `Identified bank: ${bankName}`
        : "Invalid IFSC format.",
    },
    accountNumber: {
      valid: accountValid,
      length: cleanAccount.length,
      expectedRange: [expectedMin, expectedMax],
      message: accountValid
        ? `Valid account format (${cleanAccount.length} digits).`
        : "Account length does not match bank specifications.",
    },
    phoneNumber: {
      valid: phoneValid,
      message: phoneValid ? `Valid Indian mobile: +91 ${cleanPhone}` : "Invalid mobile number.",
    },
    amount: {
      valid: amountValid,
      message: amountValid ? `Valid amount: ₹${amountVal}` : "Invalid amount specified.",
    },
    errors,
  };
}
