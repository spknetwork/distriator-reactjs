import { create } from 'zustand';
import { format } from "date-fns";
import {
  deleteBusinessApi,
  fetchBusinessesApi,
  createBusinessApi,
  createMiniBusinessApi,
  updateBusinessApi,
} from "../services/BusinessApi";
import {
  type BusinessModel,
  type BusinessFilter,
  type SpendHistoryItem,
} from "../types/business";
import { getFormattedSpendHistory } from "../hooks/useDhiveData";
import { toast } from "sonner";
import { ViewState } from '../types/enums';

interface BusinessesState {
  // State
  businesses: BusinessModel[];
  searchedItems: BusinessModel[];
  filteredItems: BusinessModel[];
  viewState: ViewState;
  filter: BusinessFilter;
  
  // Actions
  fetchBusinesses: (signal?: AbortSignal) => Promise<BusinessModel[]>;
  setBusinessData: (data: BusinessModel[]) => void;
  onFilter: (filter: BusinessFilter, enableGuideFilter: boolean) => void;
  onSearch: (keyword: string) => void;
  businessByName: (name?: string) => BusinessModel | undefined;
  getTopOnboarders: (filterDate: Date) => Record<string, number>;
  getDailyOnboarders: (filterDate: Date) => Record<string, Record<string, number>>;
  getEnhancedSpendHistory: (accountName: string, filterDays: number) => Promise<SpendHistoryItem[]>;
  deleteBusiness: (businessId: string, token: string) => Promise<void>;
  createBusiness: (businessData: BusinessModel, token: string, isMini?: boolean) => Promise<void>;
  updateBusiness: (businessData: BusinessModel, token: string, isOnboardingOnly?: boolean) => Promise<void>;
  
  // Internal helpers
  setBusinesses: (businesses: BusinessModel[]) => void;
  setSearchedItems: (items: BusinessModel[]) => void;
  setFilteredItems: (items: BusinessModel[]) => void;
  setViewState: (state: ViewState) => void;
  setFilter: (filter: BusinessFilter) => void;
}

export const useBusinessesStore = create<BusinessesState>((set, get) => ({
  // Initial state
  businesses: [],
  searchedItems: [],
  filteredItems: [],
  viewState: ViewState.LOADING,
  filter: { cities: [], guides: [], currencies: [], ownerFilter: [] },

  // Internal setters
  setBusinesses: (businesses) => set({ businesses }),
  setSearchedItems: (searchedItems) => set({ searchedItems }),
  setFilteredItems: (filteredItems) => set({ filteredItems }),
  setViewState: (viewState) => set({ viewState }),
  setFilter: (filter) => set({ filter }),

  // Main actions
  fetchBusinesses: async (signal?: AbortSignal) => {
    return fetchBusinessesApi(signal || new AbortController().signal);
  },

  setBusinessData: (data: BusinessModel[]) => {
    set({
      businesses: data,
      searchedItems: data,
      filteredItems: data,
      viewState: data.length > 0 ? ViewState.DATA : ViewState.EMPTY,
    });
  },

  onSearch: (keyword: string) => {
    const { businesses } = get();
    
    if (!keyword) {
      set({ searchedItems: businesses });
      return;
    }
    
    const searchResults = businesses.filter(
      (business) =>
        business.profile.displayName
          .toLowerCase()
          .includes(keyword.toLowerCase()) ||
        business.location.address.country
          .toLowerCase()
          .includes(keyword.toLowerCase()) ||
        business.location.address.city
          .toLowerCase()
          .includes(keyword.toLowerCase()) ||
        business.location.address.address1
          ?.toLowerCase()
          .includes(keyword.toLowerCase())
    );
    set({ searchedItems: searchResults });
  },

  onFilter: (newFilter: BusinessFilter, enableGuideFilter: boolean) => {
    const { businesses } = get();
    set({ filter: newFilter });

    const filtered = businesses.filter((business) => {
      const matchesCountry =
        !newFilter.countries || newFilter.countries.length === 0 ||
        newFilter.countries.includes(business.location.address.country);

      const matchesCity =
        newFilter.cities.length === 0 ||
        newFilter.cities.some((city) =>
          business.location.address.city
            .toLowerCase()
            .includes(city.toLowerCase())
        );

      const matchesGuides =
        !enableGuideFilter ||
        newFilter.guides.length === 0 ||
        business.distriator.guides?.some((guide) =>
          newFilter.guides.some((filterGuide) =>
            guide.name.toLowerCase().includes(filterGuide.toLowerCase())
          )
        );

      const matchesCurrency =
        newFilter.currencies.length === 0 ||
        business.distriator.paymentMethods.some((method) =>
          newFilter.currencies.some((currency) =>
            method.toLowerCase().includes(currency.toLowerCase())
          )
        );

      const matchesOwner =
        !newFilter.ownerFilter || newFilter.ownerFilter.length === 0 ||
        (newFilter.ownerFilter.includes("with") && business.distriator.owner) ||
        (newFilter.ownerFilter.includes("without") && !business.distriator.owner);

      const matchesVerified =
        !newFilter.verified ||
        (newFilter.verified &&
          business.distriator.verification?.hivePost);

      return matchesCountry && matchesCity && matchesGuides && matchesCurrency && matchesOwner && matchesVerified;
    });

    set({ filteredItems: filtered });
  },

  businessByName: (name?: string): BusinessModel | undefined => {
    if (!name) return undefined;
    const { businesses } = get();
    return businesses.find((business) => business.profile.displayName === name);
  },

  getTopOnboarders: (filterDate: Date): Record<string, number> => {
    const { businesses } = get();
    const onboarderCounts: Record<string, number> = {};

    businesses.forEach((business) => {
      if (business.distriator.expiry) {
        const creationDate = new Date(business.distriator.expiry);
        creationDate.setDate(creationDate.getDate() - 90);

        if (creationDate > filterDate) {
          const onboarder = business.distriator.creator || "Unknown";
          onboarderCounts[onboarder] = (onboarderCounts[onboarder] || 0) + 1;
        }
      }
    });

    return onboarderCounts;
  },

  getDailyOnboarders: (filterDate: Date): Record<string, Record<string, number>> => {
    const { businesses } = get();
    const dailyOnboarders: Record<string, Record<string, number>> = {};

    businesses.forEach((business) => {
      if (business.distriator.expiry) {
        const creationDate = new Date(business.distriator.expiry);
        creationDate.setDate(creationDate.getDate() - 90);

        if (creationDate > filterDate) {
          const formattedDate = format(creationDate, "yyyy-MM-dd");
          const onboarder = business.distriator.creator || "Unknown";

          if (!dailyOnboarders[formattedDate]) {
            dailyOnboarders[formattedDate] = {};
          }

          dailyOnboarders[formattedDate][onboarder] =
            (dailyOnboarders[formattedDate][onboarder] || 0) + 1;
        }
      }
    });

    return dailyOnboarders;
  },

  getEnhancedSpendHistory: async (accountName: string, filterDays: number): Promise<SpendHistoryItem[]> => {
    try {
      const { businessByName } = get();
      const dhiveTransactions = await getFormattedSpendHistory(accountName, filterDays);

      return dhiveTransactions.map((item) => {
        const business = businessByName(item.businessName);
        return {
          businessName: item.businessName,
          spendingAmount: item.spendingAmount,
          trxnTs: item.trxnTs,
          country: business?.location.address.country || item.country || "Unknown",
          state: business?.location.address.state || item.state || "Unknown",
          city: business?.location.address.city || item.city || "Unknown",
        };
      });
    } catch (error) {
      console.error("Error fetching spend history:", error);
      return [];
    }
  },

  deleteBusiness: async (businessId: string, token: string) => {
    set({ viewState: ViewState.LOADING });
    try {
      if (!token) {
        throw new Error("Authentication required");
      }
      await deleteBusinessApi(businessId, token);

      // Remove business from all state arrays
      const filterBusinessInArray = (businesses: BusinessModel[]) =>
        businesses.filter((business) => business.id !== businessId);

      const { businesses } = get();
      const filtered = filterBusinessInArray(businesses);

      set({
        businesses: filtered,
        searchedItems: filtered,
        filteredItems: filtered
      });

      toast.success("Business deleted successfully");
    } catch (error) {
      console.error("Error deleting business:", error);
      toast.error("Failed to delete business");
      set({ viewState: ViewState.ERROR });
      throw error;
    }
  },

  createBusiness: async (businessData: BusinessModel, token: string, isMini = false) => {
    set({ viewState: ViewState.LOADING });
    try {
      if (!token) {
        throw new Error("Authentication required");
      }

      const newBusiness = isMini
        ? await createMiniBusinessApi(businessData, token)
        : await createBusinessApi(businessData, token);

      // Update local state
      const { businesses } = get();
      const updated = [...businesses, newBusiness];

      set({
        businesses: updated,
        searchedItems: updated,
        filteredItems: updated
      });

      toast.success(`Business ${isMini ? "quick" : ""} created successfully`);
    } catch (error) {
      console.error("Error creating business:", error);
      toast.error("Failed to create business");
      set({ viewState: ViewState.ERROR });
      throw error;
    }
  },

  updateBusiness: async (businessData: BusinessModel, token: string, isOnboardingOnly = false) => {
    set({ viewState: ViewState.LOADING });
    try {
      if (!token) {
        throw new Error("Authentication required");
      }

      // Prepare payload; remove `unverified_claims` from distriator when onboarding-only update
      const payload: any = JSON.parse(JSON.stringify(businessData));
      if (isOnboardingOnly && payload?.distriator && Object.prototype.hasOwnProperty.call(payload.distriator, 'unverified_claims')) {
        delete payload.distriator.unverified_claims;
      }

      const updatedBusiness = await updateBusinessApi(payload, token);

      // Update local state
      const { businesses } = get();
      const updateBusinessInArray = (businesses: BusinessModel[]) =>
        businesses.map((business) =>
          business.id === updatedBusiness.id ? updatedBusiness : business
        );

      const updated = updateBusinessInArray(businesses);

      set({
        businesses: updated,
        searchedItems: updated,
        filteredItems: updated
      });

      toast.success("Business updated successfully");
    } catch (error) {
      console.error("Error updating business:", error);
      toast.error("Failed to update business");
      set({ viewState: ViewState.ERROR });
      throw error;
    }
  },
}));
