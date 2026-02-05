
import { Star } from 'lucide-react';
import { type BusinessRatingModel } from '../../types/business-rating';
import { ViewState } from '../../types/enums';
import { Skeleton } from '@radix-ui/themes';
import { useNavigate } from 'react-router-dom';
import { ThreeDotMenu } from '../ThreeDotMenu';
import { useAuthContext } from '../../context/AuthContext';

interface BusinessRatingsProps {
    ratings: BusinessRatingModel[];
    viewState: ViewState;
    businessName: string;
}

export function BusinessRatings({ ratings, viewState, businessName }: BusinessRatingsProps) {
    const navigate = useNavigate();
    const { currentUser } = useAuthContext();

    const getPeakdRatingUrl = (author: string, permlink: string) => {
        const cleanAuthor = (author || '').replace(/^@/, '').trim();
        const cleanPermlink = (permlink || '').trim();
        if (!cleanAuthor || !cleanPermlink) return undefined;
        return `https://peakd.com/@${encodeURIComponent(cleanAuthor)}/${encodeURIComponent(cleanPermlink)}`;
    };

    if (viewState === ViewState.LOADING) {
        return (
            <div className="flex gap-4 overflow-x-auto pb-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton
                        key={i}
                        className="w-80 h-40 flex-shrink-0 rounded-lg"
                    />
                ))}
            </div>
        );
    }

    if (viewState === ViewState.ERROR) {
        return (
            <div className="text-center py-12">
                <p className="text-destructive">Failed to load ratings</p>
            </div>
        );
    }

    if (viewState === ViewState.EMPTY || ratings.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">No ratings available</p>
            </div>
        );
    }

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-2 py-2">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                    Ratings
                </h1>
                <button
                    onClick={() =>
                        navigate(`/ratings/${businessName}`)
                    }
                    className="px-3 py-1.5 md:px-4 md:py-2 text-primary-foreground rounded-lg text-sm md:text-base cursor-pointer"
                >
                    View all &gt;
                </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
                {ratings.map((rating) => (
                    (() => {
                        const peakdUrl = getPeakdRatingUrl(rating.ratingAuthor, rating.ratingPermlink);
                        const card = (
                            <div className="w-80 h-40 flex-shrink-0 rounded-lg overflow-hidden relative bg-muted p-4 flex flex-col justify-between">
                                {currentUser && (
                                    <div className="absolute top-2 right-2" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                                        <ThreeDotMenu username={rating.ratingAuthor} permlink={rating.ratingPermlink} />
                                    </div>
                                )}
                                <div>
                                    <div className="flex items-center gap-2">
                                        <img
                                            src={`https://images.hive.blog/u/${rating.ratingAuthor}/avatar`}
                                            alt={rating.ratingAuthor}
                                            className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                                        />
                                        <span className="truncate">@{rating.ratingAuthor}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2 break-words">
                                        {rating.ratingText}
                                    </p>
                                </div>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: 5 }, (_, i) => (
                                        <Star
                                            key={i}
                                            className={`w-5 h-5 ${i < rating.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        );

                        if (!peakdUrl) {
                            return (
                                <div key={rating.id} className="cursor-default">
                                    {card}
                                </div>
                            );
                        }

                        return (
                            <a
                                key={rating.id}
                                href={peakdUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block cursor-pointer rounded-lg"
                                aria-label={`Open rating on PeakD by @${rating.ratingAuthor}`}
                            >
                                {card}
                            </a>
                        );
                    })()
                ))}
            </div>
        </div>
    );
}
