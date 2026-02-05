/* eslint-disable @typescript-eslint/no-explicit-any */
const HD_API_SERVER = import.meta.env.VITE_HD_API_SERVER || 'https://beta-api.distriator.com';
import { handleTokenExpiration } from '../utils/auth-utils';
import { createActionSingleResponse, type ActionSingleDataResponse } from '../types/responses';

export class ReportService {
    /**
     * Report a user for inappropriate behavior.
     * POST /report/report-user
     */
    static async reportUser(
        token: string,
        username: string,
        reason: string
    ): Promise<ActionSingleDataResponse<{ message: string }>> {
        try {
            const response = await fetch(`${HD_API_SERVER}/report/report-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token,
                },
                body: JSON.stringify({
                    username,
                    reason,
                }),
            });

            // Check for token expiration
            const isTokenExpired = await handleTokenExpiration(response);
            if (isTokenExpired) {
                return createActionSingleResponse({
                    valid: false,
                    errorMessage: 'Token expired',
                    data: { message: 'Token expired' },
                });
            }

            if (response.ok) {
                // The API returns "User reported successfully" or similar text
                const text = await response.text();
                // Try to parse as JSON if possible, but fallback to text
                let message = text;
                try {
                    const json = JSON.parse(text);
                    if (json.message) message = json.message;
                } catch (e) {
                    // ignore
                }

                return createActionSingleResponse({
                    valid: true,
                    errorMessage: '',
                    data: { message: message || 'User reported successfully' },
                });
            } else {
                const errorText = await response.text();
                return createActionSingleResponse({
                    valid: false,
                    errorMessage: `Failed to report user: ${response.statusText} - ${errorText}`,
                    data: { message: errorText },
                });
            }
        } catch (error) {
            return createActionSingleResponse({
                valid: false,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                data: { message: 'Unknown error' },
            });
        }
    }

    /**
     * Report a review for inappropriate content.
     * POST /report/report-review
     */
    static async reportReview(
        token: string,
        username: string,
        permlink: string,
        reason: string
    ): Promise<ActionSingleDataResponse<{ message: string }>> {
        try {
            const response = await fetch(`${HD_API_SERVER}/report/report-review`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token,
                },
                body: JSON.stringify({
                    username,
                    permlink,
                    reason,
                }),
            });

            // Check for token expiration
            const isTokenExpired = await handleTokenExpiration(response);
            if (isTokenExpired) {
                return createActionSingleResponse({
                    valid: false,
                    errorMessage: 'Token expired',
                    data: { message: 'Token expired' },
                });
            }

            if (response.ok) {
                const text = await response.text();
                let message = text;
                try {
                    const json = JSON.parse(text);
                    if (json.message) message = json.message;
                } catch (e) {
                    // ignore
                }

                return createActionSingleResponse({
                    valid: true,
                    errorMessage: '',
                    data: { message: message || 'Review reported successfully' },
                });
            } else {
                const errorText = await response.text();
                return createActionSingleResponse({
                    valid: false,
                    errorMessage: `Failed to report review: ${response.statusText} - ${errorText}`,
                    data: { message: errorText },
                });
            }
        } catch (error) {
            return createActionSingleResponse({
                valid: false,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                data: { message: 'Unknown error' },
            });
        }
    }

    /**
     * Get a list of all reported users for the authenticated reporter.
     * GET /report/reported-users
     */
    static async getReportedUsers(
        token: string
    ): Promise<ActionSingleDataResponse<any[]>> { // Using any[] temporarily if strict types fail, but ideally ReportedUser[]
        try {
            const response = await fetch(`${HD_API_SERVER}/report/reported-users`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token,
                },
            });

            const isTokenExpired = await handleTokenExpiration(response);
            if (isTokenExpired) {
                return createActionSingleResponse({
                    valid: false,
                    errorMessage: 'Token expired',
                    data: [],
                });
            }

            if (response.ok) {
                const json = await response.json();
                return createActionSingleResponse({
                    valid: true,
                    errorMessage: '',
                    data: json, // Expecting array directly or inside data property? Assuming direct array or standard response wrapper
                });
            } else {
                const errorText = await response.text();
                return createActionSingleResponse({
                    valid: false,
                    errorMessage: `Failed to fetch reported users: ${response.statusText} - ${errorText}`,
                    data: [],
                });
            }
        } catch (error) {
            return createActionSingleResponse({
                valid: false,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                data: [],
            });
        }
    }

    /**
     * Get a list of all reported reviews for the authenticated reporter.
     * GET /report/reported-reviews
     */
    static async getReportedReviews(
        token: string
    ): Promise<ActionSingleDataResponse<any[]>> {
        try {
            const response = await fetch(`${HD_API_SERVER}/report/reported-reviews`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token,
                },
            });

            const isTokenExpired = await handleTokenExpiration(response);
            if (isTokenExpired) {
                return createActionSingleResponse({
                    valid: false,
                    errorMessage: 'Token expired',
                    data: [],
                });
            }

            if (response.ok) {
                const json = await response.json();
                return createActionSingleResponse({
                    valid: true,
                    errorMessage: '',
                    data: json,
                });
            } else {
                const errorText = await response.text();
                return createActionSingleResponse({
                    valid: false,
                    errorMessage: `Failed to fetch reported reviews: ${response.statusText} - ${errorText}`,
                    data: [],
                });
            }
        } catch (error) {
            return createActionSingleResponse({
                valid: false,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                data: [],
            });
        }
    }
}
