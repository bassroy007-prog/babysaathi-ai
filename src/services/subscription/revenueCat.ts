import Purchases, {
  CustomerInfo,
  PurchasesPackage,
  PurchasesOffering,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { REVENUECAT_API_KEY_ANDROID, REVENUECAT_API_KEY_IOS } from '@constants/index';
import { SubscriptionTier } from '@types/index';

export interface PaywallOffering {
  monthly: PurchasesPackage | null;
  annual: PurchasesPackage | null;
  familyMonthly: PurchasesPackage | null;
  familyAnnual: PurchasesPackage | null;
}

class RevenueCatService {
  private initialized = false;

  async initialize(userId?: string): Promise<void> {
    if (this.initialized) return;

    const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;

    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    await Purchases.configure({ apiKey });

    if (userId) {
      await this.identify(userId);
    }

    this.initialized = true;
  }

  async identify(userId: string): Promise<void> {
    try {
      await Purchases.logIn(userId);
    } catch (error) {
      console.error('RevenueCat identify error:', error);
    }
  }

  async logout(): Promise<void> {
    try {
      await Purchases.logOut();
    } catch (error) {
      console.error('RevenueCat logout error:', error);
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.error('RevenueCat getCustomerInfo error:', error);
      return null;
    }
  }

  async getCurrentTier(): Promise<SubscriptionTier> {
    const info = await this.getCustomerInfo();
    if (!info) return 'free';

    const entitlements = info.entitlements.active;

    if (entitlements['premium_family']) return 'premium_family';
    if (entitlements['premium']) return 'premium';
    return 'free';
  }

  async getOfferings(): Promise<PaywallOffering> {
    const result: PaywallOffering = {
      monthly: null,
      annual: null,
      familyMonthly: null,
      familyAnnual: null,
    };

    try {
      const offerings = await Purchases.getOfferings();
      const current: PurchasesOffering | null = offerings.current;

      if (!current) return result;

      for (const pkg of current.availablePackages) {
        const id = pkg.identifier;
        if (id === '$rc_monthly') result.monthly = pkg;
        else if (id === '$rc_annual') result.annual = pkg;
        else if (id === 'family_monthly') result.familyMonthly = pkg;
        else if (id === 'family_annual') result.familyAnnual = pkg;
      }
    } catch (error) {
      console.error('RevenueCat getOfferings error:', error);
    }

    return result;
  }

  async purchasePackage(pkg: PurchasesPackage): Promise<{ success: boolean; tier: SubscriptionTier; error?: string }> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const tier = await this.getTierFromCustomerInfo(customerInfo);
      return { success: true, tier };
    } catch (error: any) {
      if (error.userCancelled) {
        return { success: false, tier: 'free', error: 'cancelled' };
      }
      return { success: false, tier: 'free', error: error.message ?? 'Purchase failed' };
    }
  }

  async restorePurchases(): Promise<{ success: boolean; tier: SubscriptionTier }> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      const tier = await this.getTierFromCustomerInfo(customerInfo);
      return { success: true, tier };
    } catch (error) {
      console.error('RevenueCat restore error:', error);
      return { success: false, tier: 'free' };
    }
  }

  private getTierFromCustomerInfo(info: CustomerInfo): SubscriptionTier {
    const active = info.entitlements.active;
    if (active['premium_family']) return 'premium_family';
    if (active['premium']) return 'premium';
    return 'free';
  }

  isFeatureUnlocked(feature: PremiumFeature, tier: SubscriptionTier): boolean {
    return FEATURE_ACCESS[feature].includes(tier);
  }
}

export type PremiumFeature =
  | 'cry_detection'
  | 'ai_chat'
  | 'ai_insights'
  | 'growth_charts'
  | 'analytics'
  | 'doctor_report'
  | 'family_sharing'
  | 'journal_photos'
  | 'digital_twin'
  | 'export_data';

const FEATURE_ACCESS: Record<PremiumFeature, SubscriptionTier[]> = {
  cry_detection: ['premium', 'premium_family'],
  ai_chat: ['premium', 'premium_family'],
  ai_insights: ['premium', 'premium_family'],
  growth_charts: ['premium', 'premium_family'],
  analytics: ['premium', 'premium_family'],
  doctor_report: ['premium', 'premium_family'],
  family_sharing: ['premium_family'],
  journal_photos: ['premium', 'premium_family'],
  digital_twin: ['premium', 'premium_family'],
  export_data: ['premium', 'premium_family'],
};

export const revenueCat = new RevenueCatService();
