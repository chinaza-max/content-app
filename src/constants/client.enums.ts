// ✅ Centralized ENUM source of truth

export const PURPOSE_ENUM = ['Content Creation', 'Bulk SMS Delivery', 'Both'] as const;
export type PurposeEnum = (typeof PURPOSE_ENUM)[number];

export const ACCOUNT_TYPE_ENUM = ['individual', 'organization'] as const;
export type AccountTypeEnum = (typeof ACCOUNT_TYPE_ENUM)[number];
