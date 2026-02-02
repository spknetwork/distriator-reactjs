const HD_API_SERVER = import.meta.env.VITE_HD_API_SERVER || 'https://beta-api.distriator.com';
import { type BusinessTypes } from '../types/business-types';

export class BusinessTypesService {
  static async getBusinessTypes(signal?: AbortSignal): Promise<BusinessTypes> {
    try {
      const response = await fetch(`${HD_API_SERVER}/business/types`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal,
      });

      if (response.ok) {
        const data = await response.json();
        return data as BusinessTypes;
      } else {
        return {};
      }
    } catch (error) {
      return {};
    }
  }
}
