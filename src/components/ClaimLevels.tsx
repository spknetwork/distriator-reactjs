import React from "react";

interface ClaimLevelsProps {
    biweeklyCount: number;
}

export const ClaimLevels: React.FC<ClaimLevelsProps> = ({ biweeklyCount }) => {
    // Calculate how many levels to fill
    const filledLevels = biweeklyCount % 5 === 0 && biweeklyCount > 0 ? 5 : biweeklyCount % 5;

    return (
        <div className="w-full flex flex-col items-center justify-center space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Levels of Claims</h3>
            <div className="flex items-end justify-center space-x-4">
                {[1, 2, 3, 4, 5].map((level) => (
                    <div key={level} className="flex flex-col items-center">
                        <div
                            className={`w-6 sm:w-8 md:w-10 rounded-t-md transition-all duration-300 ${level <= filledLevels ? "bg-green-500" : "bg-gray-300 dark:bg-gray-700"
                                }`}
                            style={{ height: `${level * 25}px` }} // Increasing height by level
                        />
                        <span className="mt-2 text-sm text-muted-foreground">L{level}</span>
                    </div>
                ))}
            </div>
            <p className="text-sm text-muted-foreground">
                {biweeklyCount} transaction{biweeklyCount !== 1 ? "s" : ""} recorded
            </p>
        </div>
    );
};
