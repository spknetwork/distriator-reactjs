import { useState } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  Users,
  Building2,
  Calendar,
  UserPlus,
  Globe,
  DollarSign,
  Trophy,
  BarChart3,
} from "lucide-react";
import CommonLayout from "../../components/CommonLayout";

const reportLinks = [
  {
    path: "/reports/distriator/recent",
    label: "Recent Claim Records",
    description: "View the latest claim transactions and activities",
    icon: <TrendingUp className="w-6 h-6" />,
    color: "from-blue-500 to-blue-600",
  },
  {
    path: "/reports/distriator/top-consumers",
    label: "Top Rewarded Consumers",
    description: "See which users have earned the most rewards",
    icon: <Users className="w-6 h-6" />,
    color: "from-green-500 to-green-600",
  },
  {
    path: "/reports/distriator/top-businesses",
    label: "Top Businesses",
    description: "Discover the most popular businesses on the platform",
    icon: <Building2 className="w-6 h-6" />,
    color: "from-purple-500 to-purple-600",
  },
  {
    path: "/reports/distriator/daily",
    label: "Daily Cashbacks",
    description: "Analyze daily trends and patterns in claims",
    icon: <Calendar className="w-6 h-6" />,
    color: "from-orange-500 to-orange-600",
  },
  {
    path: "/reports/distriator/top-consumer-onboarders",
    label: "Top Consumer On-boarders",
    description: "Users who have successfully onboarded the most consumers",
    icon: <UserPlus className="w-6 h-6" />,
    color: "from-pink-500 to-pink-600",
  },
  {
    path: "/reports/distriator/top-business-onboarders",
    label: "Top Business On-boarders",
    description: "Users who have successfully onboarded the most businesses",
    icon: <UserPlus className="w-6 h-6" />,
    color: "from-indigo-500 to-indigo-600",
  },
  {
    path: "/reports/distriator/by-country",
    label: "Claims by Country",
    description: "Geographic distribution of claims worldwide",
    icon: <Globe className="w-6 h-6" />,
    color: "from-teal-500 to-teal-600",
  },
  {
    path: "/reports/distriator/total-spent",
    label: "Total Spend Report",
    description: "Track spending patterns across different periods",
    icon: <DollarSign className="w-6 h-6" />,
    color: "from-emerald-500 to-emerald-600",
  },
  {
    path: "/reports/distriator/leaderboard",
    label: "Leaderboard",
    description: "Top performers and monthly rankings",
    icon: <Trophy className="w-6 h-6" />,
    color: "from-yellow-500 to-yellow-600",
  },
  {
    path: "/reports/distriator/cumulative-businesses",
    label: "Cumulative Businesses",
    description: "Cumulative total and daily new businesses over time",
    icon: <BarChart3 className="w-6 h-6" />,
    color: "from-sky-500 to-sky-600",
  },
  {
    path: "/reports/distriator/my-activity",
    label: "My Activity Report",
    description: "Personal activity and transaction history",
    icon: <BarChart3 className="w-6 h-6" />,
    color: "from-rose-500 to-rose-600",
  },
];

const DistriatorReportsList = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredReports = reportLinks.filter(
    (report) =>
      report.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <CommonLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Distriator Reports
            </h1>
            <p className="text-muted-foreground">
              Comprehensive analytics and insights for the Distriator platform
            </p>
          </div>

          {/* Search Input */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-1/2 px-4 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-1"
            />
          </div>

          {/* Reports Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.length > 0 ? (
              filteredReports.map((report) => (
                <Link
                  key={report.path}
                  to={report.path}
                  className="group relative overflow-hidden bg-card rounded-2xl border border-border hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-glow"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${report.color} opacity-5 group-hover:opacity-10 transition-opacity`}
                  />

                  <div className="relative p-6">
                    <div
                      className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${report.color} text-white mb-4 group-hover:scale-110 transition-transform`}
                    >
                      {report.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {report.label}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {report.description}
                    </p>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        View Report
                      </span>
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <svg
                          className="w-3 h-3 text-primary transform group-hover:translate-x-0.5 transition-transform"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">
                No reports found for "{searchTerm}".
              </p>
            )}
          </div>
        </div>
      </div>
    </CommonLayout>
  );
};

export default DistriatorReportsList;