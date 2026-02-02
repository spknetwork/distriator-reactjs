import { create } from 'zustand';
import { BusinessTypesService } from '../services/business-types-service';
import type { BusinessTypes } from '../types/business-types';

interface BusinessTypesState {
  businessTypes: BusinessTypes;
  isLoading: boolean;
  error: string | null;
  fetchBusinessTypes: () => Promise<void>;
}

export const useBusinessTypesStore = create<BusinessTypesState>((set) => ({
  businessTypes: {},
  isLoading: false,
  error: null,
  fetchBusinessTypes: async () => {
    set({ isLoading: true, error: null });
    try {
      const businessTypes = await BusinessTypesService.getBusinessTypes();
      set({ businessTypes, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch business types', isLoading: false });
    }
  },
}));
