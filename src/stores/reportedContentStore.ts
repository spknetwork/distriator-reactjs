import { create } from 'zustand';
import { ReportService } from '../services/report-service';
import { type ReportedReview } from '../types/responses';

export interface ReportedContentState {
    reportedUsers: string[];
    reportedReviews: ReportedReview[];
    isLoading: boolean;
    isInitialized: boolean;

    fetchReportedContent: (token: string) => Promise<void>;
    addReportedUser: (username: string) => void;
    addReportedReview: (review: ReportedReview) => void;
    clear: () => void;
}

export const useReportedContentStore = create<ReportedContentState>((set) => ({
    reportedUsers: [],
    reportedReviews: [],
    isLoading: false,
    isInitialized: false,

    fetchReportedContent: async (token: string) => {
        set({ isLoading: true });
        try {
            const [usersResponse, reviewsResponse] = await Promise.all([
                ReportService.getReportedUsers(token),
                ReportService.getReportedReviews(token),
            ]);

            let users: string[] = [];
            if (usersResponse.valid) {
                users = (usersResponse.data as any[] || []).map((u: any) =>
                    typeof u === 'string' ? u : (u.name ?? u.reportedUser ?? '')
                ).filter(Boolean);
            }

            let reviews: ReportedReview[] = [];
            if (reviewsResponse.valid) {
                reviews = (reviewsResponse.data as any[] || []).map((r: any) => ({
                    ...r,
                    author: r.name ?? r.author ?? '',
                }));
            }

            set({
                reportedUsers: users,
                reportedReviews: reviews,
                isLoading: false,
                isInitialized: true,
            });
        } catch (error) {
            console.error('Failed to fetch reported content', error);
            set({ isLoading: false });
        }
    },

    addReportedUser: (username: string) => {
        set((state) => ({
            reportedUsers: [...state.reportedUsers, username],
        }));
    },

    addReportedReview: (review: ReportedReview) => {
        set((state) => ({
            reportedReviews: [...state.reportedReviews, review],
        }));
    },

    clear: () => {
        set({
            reportedUsers: [],
            reportedReviews: [],
            isInitialized: false,
            isLoading: false,
        });
    },
}));
