import { BankRiskProfile, PaymentRequest, RailExecutionResult, RailMethod } from "../types";

export interface RailAdapter {
  readonly method: RailMethod;
  readonly name: string;
  readonly isSimulated: boolean;
  execute(
    request: PaymentRequest,
    bankProfile: BankRiskProfile
  ): Promise<RailExecutionResult>;
}
