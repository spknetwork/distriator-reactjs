import { useState, useEffect } from "react";
import { Wallet } from "hive-authentication";
import { useAuthData } from "../utils/auth-utils";
import Header from "../components/Header";

export default function UserWallet() {
    const { username } = useAuthData();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate async setup (if Wallet needs data fetch)
        if (username) {
            setIsLoading(false);
        } else {
            setIsLoading(false); // if no username, stop loading
        }
    }, [username]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-muted-foreground">Loading wallet...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <Header title={"Wallet"} isDrawerMenuRequired={false} />
            {/* Wallet Content */}
            {username ? (
                <Wallet username={username} />
            ) : (
                <div className="flex items-center justify-center h-screen pb-14">
                    <p className="text-muted-foreground">No user logged in</p>
                </div>
            )}
        </div>
    );
}
