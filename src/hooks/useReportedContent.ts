import { useState, useEffect } from 'react';
import { ReportService } from '../services/report-service';
import { useAuthData } from '../utils/auth-utils';
import { type ReportedReview } from '../types/responses';

export const useReportedContent = () => {
    const { token, isAuthenticated } = useAuthData();
    const [reportedUsers, setReportedUsers] = useState<string[]>([]);
    const [reportedReviews, setReportedReviews] = useState<ReportedReview[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isAuthenticated || !token) {
            setReportedUsers([]);
            setReportedReviews([]);
            return;
        }

        const fetchReportedContent = async () => {
            setLoading(true);
            try {
                // parallel fetch
                const [usersResponse, reviewsResponse] = await Promise.all([
                    ReportService.getReportedUsers(token),
                    ReportService.getReportedReviews(token)
                ]);

                if (usersResponse.valid) {
                    const users = (usersResponse.data as any[] || []).map((u: any) =>
                        typeof u === 'string' ? u : (u.name ?? u.reportedUser ?? '')
                    ).filter(Boolean);
                    setReportedUsers(users);
                }

                if (reviewsResponse.valid) {
                    setReportedReviews(reviewsResponse.data as any[] || []);
                }

            } catch (error) {
                console.error("Failed to fetch reported content", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReportedContent();
    }, [isAuthenticated, token]);

    return { reportedUsers, reportedReviews, loading };
};
