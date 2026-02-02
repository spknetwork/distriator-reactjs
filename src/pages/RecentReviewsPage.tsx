import Header from "../components/Header";
import { RecentReviews } from "../components/RecentReviews";

export default function RecentReviewsPage() {
  return (
      <main className="min-h-screen bg-background">
        <Header title={"Recent Reviews"} isDrawerMenuRequired={false} />
        <div className="max-w-5xl mx-auto px-4 py-5 space-y-12 w-full overflow-x-hidden">
          <RecentReviews />
        </div>
      </main>
  );
}

