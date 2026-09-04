import { BankRiskProfile, PaymentRequest, RailExecutionResult, RailMethod } from "../types";
import { aadhaarOtpRail } from "./aadhaar-otp";
import { upiCollectRail } from "./upi-collect";
import { accountIfscQrRail } from "./account-ifsc-qr";
import { razorpayPaymentLinkRail } from "./razorpay";
import { RailAdapter } from "./types";

const railsMap: Record<RailMethod, RailAdapter> = {
  aadhaar_otp: aadhaarOtpRail,
  upi_collect: upiCollectRail,
  razorpay_link: razorpayPaymentLinkRail,
  account_ifsc_qr: accountIfscQrRail,
};

export async function attemptRail(
  method: RailMethod,
  request: PaymentRequest,
  bankProfile: BankRiskProfile
): Promise<RailExecutionResult> {
  const adapter = railsMap[method];
  if (!adapter) {
    return {
      method,
      success: false,
      isReal: false,
      title: "Unknown Rail",
      message: `Requested payment rail '${method}' is not recognized.`,
      errorCode: "UNKNOWN_RAIL_METHOD",
    };
  }

  return await adapter.execute(request, bankProfile);
}

export function getRailInfo(method: RailMethod) {
  return railsMap[method];
}
