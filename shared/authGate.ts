export type AuthRoute =
  | "/screens/auth/Login"
  | "/screens/auth/Onboarding"
  | "/under-review"
  | "/screens/Newsfeed";

const isTruthyFlag = (value: unknown) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "1" || normalized === "true" || normalized === "yes";
  }
  return false;
};

const hasValidSessionToken = (user: any) => {
  const token = user?.token;
  return typeof token === "string" && token.trim().length > 0;
};

const hasOnboardingFlag = (user: any) => {
  return (
    user &&
    (Object.prototype.hasOwnProperty.call(user, "is_onboarding_complete") ||
      Object.prototype.hasOwnProperty.call(user, "onboarding_completed"))
  );
};

const isOnboardingComplete = (user: any) => {
  return (
    isTruthyFlag(user?.is_onboarding_complete) ||
    isTruthyFlag(user?.onboarding_completed)
  );
};

const hasKycFlag = (user: any) => {
  if (!user) return false;
  return (
    Object.prototype.hasOwnProperty.call(user, "kyc") ||
    Object.prototype.hasOwnProperty.call(user, "kyc_status") ||
    Object.prototype.hasOwnProperty.call(user, "is_kyc_verified") ||
    Object.prototype.hasOwnProperty.call(user, "kyc_verified") ||
    Object.prototype.hasOwnProperty.call(user, "kyc_expired")
  );
};

const isKycApproved = (user: any) => {
  if (!hasKycFlag(user)) return true;

  const kycStatus = user?.kyc_status;
  if (typeof kycStatus === "string") {
    const normalized = kycStatus.trim().toLowerCase();
    if (
      normalized === "approved" ||
      normalized === "verified" ||
      normalized === "completed" ||
      normalized === "success"
    ) {
      return true;
    }
    if (
      normalized === "pending" ||
      normalized === "under_review" ||
      normalized === "under review" ||
      normalized === "rejected" ||
      normalized === "failed" ||
      normalized === "expired"
    ) {
      return false;
    }
  }

  if (user?.kyc_expired !== undefined && user?.kyc_expired !== null) {
    return !isTruthyFlag(user.kyc_expired);
  }
  if (user?.is_kyc_verified !== undefined && user?.is_kyc_verified !== null) {
    return isTruthyFlag(user.is_kyc_verified);
  }
  if (user?.kyc_verified !== undefined && user?.kyc_verified !== null) {
    return isTruthyFlag(user.kyc_verified);
  }
  if (user?.kyc !== undefined && user?.kyc !== null) {
    return isTruthyFlag(user.kyc);
  }
  if (kycStatus !== undefined && kycStatus !== null) {
    return isTruthyFlag(kycStatus);
  }

  return true;
};

const isApproved = (user: any) => {
  let approvedFromAccountFlag: boolean | null = null;

  if (user?.is_approved !== undefined && user?.is_approved !== null) {
    approvedFromAccountFlag = isTruthyFlag(user.is_approved);
  } else if (
    user?.has_account_primary_access !== undefined &&
    user?.has_account_primary_access !== null
  ) {
    approvedFromAccountFlag = isTruthyFlag(user.has_account_primary_access);
  }

  if (approvedFromAccountFlag === null) {
    return hasKycFlag(user) ? isKycApproved(user) : false;
  }
  if (!approvedFromAccountFlag) {
    return false;
  }

  return isKycApproved(user);
};

export const parseStoredUser = (rawUser: string | null) => {
  if (!rawUser) return null;
  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
};

export const resolveAuthenticatedRoute = (user: any): AuthRoute => {
  if (!user || !hasValidSessionToken(user)) return "/screens/auth/Login";

  const approved = isApproved(user);
  if (approved && !hasOnboardingFlag(user)) {
    return "/screens/Newsfeed";
  }

  if (!isOnboardingComplete(user)) {
    return "/screens/auth/Onboarding";
  }

  if (!approved) {
    return "/under-review";
  }

  return "/screens/Newsfeed";
};
