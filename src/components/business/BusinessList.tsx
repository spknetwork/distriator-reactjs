import { useBusinesses } from "../../hooks/useBusinesses";
import { useNavigate, useLocation } from "react-router-dom";
import React, { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Search, X, Plus, RefreshCw, MapPin, CheckCircle, AlertTriangle } from "lucide-react";
import { useAioha } from "@aioha/react-provider";
import { BusinessCreateDialog } from "./BusinessCreateDialogue";
import { useAuthData } from "../../utils/auth-utils";
import { ViewState } from "../../types/enums";
import type { BusinessModel } from "../../types/business";
import { useUnverifiedClaimsStore } from "../../stores/unverifiedClaimsStore";
import { isMobilePlatform } from "../../utils/platform-detection";

export default function BusinessList() {
  const {
    searchedItems,
    filteredItems,
    onSearch,
    refreshBusinesses,
    businesses,
    onFilter,
    filter,
    viewState,
  } = useBusinesses();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = isMobilePlatform();
  const [keyword, setKeyword] = useState(() => {
    const fromBusinessList = sessionStorage.getItem("fromBusinessList");
    if (fromBusinessList) {
      return sessionStorage.getItem("searchState") || "";
    }
    return "";
  });
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedOnboarders, setSelectedOnboarders] = useState<string[]>([]);
  const [countrySearch, setCountrySearch] = useState("");
  const [onboarderSearch, setOnboarderSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"country" | "guide" | "owner">("country");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedOwnerFilter, setSelectedOwnerFilter] = useState<string[]>([]);
  const [verifiedFilter, setVerifiedFilter] = useState(false);

  // Group cities by country
  const countryCityMap = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    businesses.forEach((biz) => {
      const country = biz.location.address.country;
      const city = biz.location.address.city;
      if (country) {
        if (!map[country]) map[country] = new Set();
        if (city) map[country].add(city);
      }
    });
    return map;
  }, [businesses]);

  // Filtered country list for search
  const filteredCountryOptions = Object.keys(countryCityMap).filter((country) =>
    country.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // Filtered options for search
  const onboarderOptions = useMemo(() => {
    const uniqueOnboarders = new Set<string>();
    businesses.forEach((biz) => {
      if (biz.distriator.guides && biz.distriator.guides.length > 0) {
        biz.distriator.guides.forEach((guide) => {
          uniqueOnboarders.add(guide.name || "");
        });
      }
    });
    return Array.from(uniqueOnboarders);
  }, [businesses]);

  const filteredOnboarderOptions = onboarderOptions.filter(
    (onboarder: string) =>
      onboarder.toLowerCase().includes(onboarderSearch.toLowerCase())
  );

  // Accordion state for expanded countries
  const [expandedCountries, setExpandedCountries] = useState<string[]>([]);
  const toggleCountryAccordion = (country: string) => {
    setExpandedCountries((prev) =>
      prev.includes(country)
        ? prev.filter((c) => c !== country)
        : [...prev, country]
    );
  };

  // Multi-select handler for cities
  const handleCityCheckbox = (city: string) => {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
  };

  // Handle search state based on navigation source
  useEffect(() => {
    const fromBusinessList = sessionStorage.getItem("fromBusinessList");
    if (fromBusinessList) {
      // Coming back from BusinessDetail, restore search and filters
      const savedSearch = sessionStorage.getItem("searchState");
      const savedFilters = sessionStorage.getItem("filterState");

      if (savedSearch) {
        setKeyword(savedSearch);
        onSearch(savedSearch);
      }

      if (savedFilters) {
        const filters = JSON.parse(savedFilters);
        setSelectedCountries(filters.selectedCountries || []);
        setSelectedCities(filters.selectedCities || []);
        setSelectedOnboarders(filters.selectedOnboarders || []);
        setSelectedOwnerFilter(filters.selectedOwnerFilter || []);
        setVerifiedFilter(filters.verifiedFilter || false);
      }
    } else {
      // First time accessing BusinessList, reset search and filters
      setKeyword("");
      onSearch("");
      setSelectedCountries([]);
      setSelectedCities([]);
      setSelectedOnboarders([]);
      setSelectedOwnerFilter([]);
      setVerifiedFilter(false);
    }
    // Clear the flags after checking
    sessionStorage.removeItem("fromBusinessList");
    sessionStorage.removeItem("searchState");
    sessionStorage.removeItem("filterState");
  }, [location.pathname]); // Remove onSearch from dependencies to prevent re-runs

  // useEffect for filter (countries, cities, onboarders, owner)
  useEffect(() => {
    onFilter(
      {
        ...filter,
        countries: selectedCountries,
        cities: selectedCities,
        guides: selectedOnboarders,
        ownerFilter: selectedOwnerFilter,
        currencies: [],
        verified: verifiedFilter,
      },
      true
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountries, selectedCities, selectedOnboarders, selectedOwnerFilter, verifiedFilter]);

  const { token, type: userRole } = useAuthData();
  const { user: username } = useAioha();
  const isQuickListingAllowed =
    token &&
    (userRole === "guide" || userRole === "admin" || userRole === "super");
  
  // Unverified claims store
  const { fetchUnverifiedClaims, getUnverifiedClaimsCount } = useUnverifiedClaimsStore();
  
  // Fetch unverified claims on component mount
  useEffect(() => {
    const abortController = new AbortController();
    fetchUnverifiedClaims(abortController.signal);
    return () => {
      abortController.abort();
    };
  }, [fetchUnverifiedClaims]);

  const persistListState = () => {
    sessionStorage.setItem("fromBusinessList", "true");
    sessionStorage.setItem("searchState", keyword);
    sessionStorage.setItem("filterState", JSON.stringify({
      selectedCountries,
      selectedCities,
      selectedOnboarders,
      selectedOwnerFilter,
      verifiedFilter,
    }));
  };

  const handleBusinessClick = (businessName: string) => {
    persistListState();
    navigate(`/business/${businessName}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setKeyword(value);
    onSearch(value);
  };

  const handleClearSearch = () => {
    setKeyword("");
    onSearch("");
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshBusinesses();
    } finally {
      setRefreshing(false);
    }
  };

  const handleFullListing = () => {
    navigate("/business/create/location");
  };

  const handleQuickListing = () => {
    navigate("/business/create/mini");
  };

  const handleMapView = () => {
    navigate("/map-view");
  };

  const canManageBusinessOnboarding = (biz: BusinessModel): boolean => {
    if (!username) return false;
    const isOwner = biz.distriator.owner === username;
    const isGuide = biz.distriator.guides?.some((guide) => guide.name === username);
    const isCreatorGuide =
      biz.distriator.creator === username && Boolean(biz.distriator.guides?.some((guide) => guide.name === username));
    return (
      userRole === "admin" ||
      userRole === "super" ||
      isOwner ||
      isGuide ||
      isCreatorGuide
    );
  };

  const handleOnboardingPostNavigation = (businessName: string) => {
    persistListState();
    navigate(`/business/${businessName}/onboarding-post`);
  };

  // Multi-select handler for countries
  const handleCountryCheckbox = (country: string) => {
    const countryCities = countryCityMap[country]
      ? Array.from(countryCityMap[country])
      : [];
    setSelectedCountries((prev) => {
      const isSelecting = !prev.includes(country);
      const nextCountries = isSelecting
        ? [...prev, country]
        : prev.filter((c) => c !== country);

      // Sync cities selection with country toggle
      setSelectedCities((prevCities) => {
        if (isSelecting) {
          const merged = new Set(prevCities);
          countryCities.forEach((c) => merged.add(c));
          return Array.from(merged);
        }
        const toRemove = new Set(countryCities);
        return prevCities.filter((c) => !toRemove.has(c));
      });

      return nextCountries;
    });
  };
  // Multi-select handler for onboarders
  const handleOnboarderCheckbox = (onboarder: string) => {
    setSelectedOnboarders((prev) =>
      prev.includes(onboarder)
        ? prev.filter((o) => o !== onboarder)
        : [...prev, onboarder]
    );
  };

  // Multi-select handler for owner filter
  const handleOwnerCheckbox = (owner: string) => {
    setSelectedOwnerFilter((prev) =>
      prev.includes(owner)
        ? prev.filter((o) => o !== owner)
        : [...prev, owner]
    );
  };

  // Determine if any filters are active
  const hasActiveFilters =
    filter.guides.length > 0 ||
    filter.cities.length > 0 ||
    (filter.countries?.length || 0) > 0 ||
    selectedOwnerFilter.length > 0 ||
    verifiedFilter;

  // Helper: match business against keyword (name, country, city, address1)
  const matchesKeyword = (biz: (typeof businesses)[number], kw: string) => {
    const k = kw.toLowerCase();
    return (
      biz.profile.displayName?.toLowerCase().includes(k) ||
      biz.location.address.country?.toLowerCase().includes(k) ||
      biz.location.address.city?.toLowerCase().includes(k) ||
      (biz.location.address.address1?.toLowerCase().includes(k) ?? false)
    );
  };

  // Compose final list to display: base list (filtered or searched) + keyword filter
  const baseItems = hasActiveFilters ? filteredItems : searchedItems;
  const displayedItems = keyword
    ? baseItems.filter((b) => matchesKeyword(b, keyword))
    : baseItems;

  return (
    <div className={isMobile ? "relative p-2" : "relative p-6"}>
      {/* Header Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="p-2 bg-muted text-foreground rounded-full hover:bg-muted-foreground/20"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-semibold">
            Businesses ({displayedItems.length})
          </h1>
        </div>
        {/* Filter Button (top right) */}
        <button
          className="ml-2 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition"
          onClick={() => setShowFilter(true)}
          aria-label="Filter"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0013 14.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 017 17v-2.586a1 1 0 00-.293-.707L3.293 6.707A1 1 0 013 6V4z"
            />
          </svg>
        </button>
      </div>
      {/* Filter Modal Popup */}
      {showFilter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowFilter(false)}
          />
          {/* Modal content */}
          <div className="relative w-full max-w-2xl bg-[#232323] rounded-2xl shadow-2xl mx-auto p-0 md:p-0 z-10 flex flex-col md:flex-row gap-0">
            {/* Left: Tabs/Accordion */}
            <div className="w-full md:w-48 border-r border-gray-700 flex flex-row md:flex-col bg-[#181818] rounded-tl-2xl rounded-bl-2xl">
              <button
                className={`flex-1 md:flex-none px-4 py-3 text-left text-white font-semibold ${
                  activeTab === "country" ? "bg-[#232323]" : "hover:bg-gray-800"
                } transition`}
                onClick={() => setActiveTab("country")}
              >
                Country
              </button>
              <button
                className={`flex-1 md:flex-none px-4 py-3 text-left text-white font-semibold ${
                  activeTab === "guide" ? "bg-[#232323]" : "hover:bg-gray-800"
                } transition`}
                onClick={() => setActiveTab("guide")}
              >
                Guide
              </button>
              <button
                className={`flex-1 md:flex-none px-4 py-3 text-left text-white font-semibold ${
                  activeTab === "owner" ? "bg-[#232323]" : "hover:bg-gray-800"
                } transition`}
                onClick={() => setActiveTab("owner")}
              >
                Owner
              </button>
            </div>
            {/* Right: Tab Content */}
            <div className="flex-1 flex flex-col max-h-[80vh] overflow-hidden">
              <div className="flex-grow p-4 overflow-y-auto">
                {activeTab === "country" && (
                  <>
                    <input
                      type="text"
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      placeholder="Search country..."
                      className="mb-2 w-full px-2 py-1 rounded bg-[#181818] text-white border border-gray-700"
                    />
                    <div>
                      {filteredCountryOptions.map((country) => (
                        <div
                          key={country}
                          className="mb-2 border-b border-gray-700 pb-2"
                        >
                          <div
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => toggleCountryAccordion(country)}
                          >
                            <input
                              type="checkbox"
                              checked={selectedCountries.includes(country)}
                              onChange={() => handleCountryCheckbox(country)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="font-semibold text-white">
                              {country}
                            </span>
                            <svg
                              className={`w-4 h-4 ml-auto transition-transform ${
                                expandedCountries.includes(country)
                                  ? "rotate-90"
                                  : ""
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </div>
                          {expandedCountries.includes(country) && (
                            <div className="pl-6 pt-2 flex flex-col gap-1">
                              {[...countryCityMap[country]].map((city) => (
                                <label
                                  key={city}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedCities.includes(city)}
                                    onChange={() => handleCityCheckbox(city)}
                                  />
                                  <span>{city}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {activeTab === "guide" && (
                  <>
                    <input
                      type="text"
                      value={onboarderSearch}
                      onChange={(e) => setOnboarderSearch(e.target.value)}
                      placeholder="Search onboarder..."
                      className="mb-2 w-full px-2 py-1 rounded bg-[#181818] text-white border border-gray-700"
                    />
                    <div className="max-h-40 overflow-y-auto w-full bg-[#181818] rounded p-2">
                      {filteredOnboarderOptions.map((onboarder) => (
                        <label
                          key={onboarder}
                          className="flex items-center gap-2 mb-1 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedOnboarders.includes(onboarder)}
                            onChange={() => handleOnboarderCheckbox(onboarder)}
                          />
                          <span>{onboarder}</span>
                        </label>
                      ))}
                    </div>
                  </>
                )}
                {activeTab === "owner" && (
                  <div className="w-full bg-[#181818] rounded p-2">
                    <label className="flex items-center gap-2 mb-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedOwnerFilter.includes("with")}
                        onChange={() => handleOwnerCheckbox("with")}
                      />
                      <span>Accept HBD</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedOwnerFilter.includes("without")}
                        onChange={() => handleOwnerCheckbox("without")}
                      />
                      <span>Doesn't Accept HBD</span>
                    </label>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-gray-700">
                <div className="flex gap-2 justify-end items-center">
                  <label className="flex items-center gap-2 text-white mr-auto">
                    <input
                      type="checkbox"
                      checked={verifiedFilter}
                      onChange={() => setVerifiedFilter((prev) => !prev)}
                    />
                    Verified
                  </label>
                  <button
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                    onClick={() => setShowFilter(false)}
                  >
                    Apply
                  </button>
                  <button
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                    onClick={() => {
                      setSelectedCountries([]);
                      setSelectedCities([]);
                      setSelectedOnboarders([]);
                      setSelectedOwnerFilter([]);
                      setVerifiedFilter(false);
                      setShowFilter(false);
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 w-full block">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#222] rounded-lg px-2 flex-1">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={keyword}
              onChange={handleSearchChange}
              placeholder="Search businesses..."
              autoFocus
              className="ml-2 bg-transparent px-2 py-2 text-sm text-white placeholder-gray-400 focus:outline-none flex-1 w-full"
            />
            {keyword && (
              <button
                onClick={handleClearSearch}
                className="ml-1 text-gray-400 hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing || viewState === ViewState.LOADING}
            className="p-2 bg-[#222] hover:bg-gray-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Refresh businesses"
          >
            <RefreshCw
              className={`w-4 h-4 text-gray-300 ${
                refreshing ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {viewState === ViewState.LOADING ? (
          <>
            {[...Array(4)].map((_, idx) => (
              <div
                key={idx}
                className="cursor-pointer flex items-center bg-[#181818] rounded-xl shadow p-4 gap-4"
              >
                <div className="w-16 h-16 bg-gray-700 rounded-md animate-pulse" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-gray-700 rounded w-1/2 animate-pulse" />
                  <div className="h-3 bg-gray-700 rounded w-full animate-pulse" />
                </div>
              </div>
            ))}
          </>
        ) : displayedItems.length === 0 ? (
          <p className="text-center col-span-2">No businesses found</p>
        ) : (
          displayedItems.map((biz) => (
            <div
              key={biz.id ?? ""}
              onClick={() =>
                biz.profile.displayName &&
                handleBusinessClick(biz.profile.displayName)
              }
              className="cursor-pointer flex items-center bg-[#181818] rounded-xl shadow p-4 gap-4 hover:bg-gray-900 transition"
            >
              {biz.profile.displayImage ? (
                <img
                  src={`https://images.hive.blog/320x0/${biz.profile.displayImage}`}
                  alt={biz.profile.displayName}
                  className="w-16 h-16 rounded-md object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-700 rounded-md flex items-center justify-center text-2xl font-bold">
                  {biz.profile.displayName[0]}
                </div>
              )}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-2 justify-between w-full">
                  <span className="text-lg font-semibold">
                    {biz.profile.displayName}
                  </span>
                  <div className="flex items-center gap-2">
                    {biz.distriator?.owner && (
                      <img
                        src="/hbd-logo.png"
                        alt="Hive"
                        title={biz.distriator.owner}
                        className="w-5 h-5"
                      />
                    )}
                    {biz.distriator?.verification?.hivePost ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(biz.distriator.verification!.hivePost, '_blank');
                        }}
                        className="p-1 rounded hover:bg-gray-700 transition-colors"
                        aria-label="View onboarding post"
                      >
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </button>
                    ) : (
                      canManageBusinessOnboarding(biz) ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOnboardingPostNavigation(biz.profile.displayName);
                          }}
                          className="p-1 rounded hover:bg-gray-700 transition-colors"
                          aria-label="Complete onboarding post"
                        >
                          <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        </button>
                      ) : (
                        <div
                          className="p-1 rounded text-yellow-400"
                          title="Onboarding post pending"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                      )
                    )}
                  </div>
                </div>
                <span className="text-sm text-green-400">
                  {biz.profile.business_type}
                </span>
                <span className="text-sm text-gray-300 mt-1">
                  {[
                    biz.location.address.address1,
                    biz.location.address.city,
                    biz.location.address.state,
                    biz.location.address.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </span>
                {biz.id && (() => {
                  const unverifiedCount = getUnverifiedClaimsCount(biz.id);
                  if (unverifiedCount > 0 && !biz.distriator.verification?.hivePost) {
                    return (
                      <span className="text-sm text-yellow-400 mt-1">
                        Only {unverifiedCount} unverified claims left.
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Action Buttons */}
      {token && (
        <>
          <button
            onClick={handleMapView}
            className="fixed bottom-24 right-6 w-14 h-14 bg-secondary text-white rounded-full shadow-lg hover:bg-secondary-dark transition-colors flex items-center justify-center z-40"
            aria-label="View Map"
          >
            <MapPin className="w-6 h-6" />
          </button>
          <button
            onClick={() => {
              if (!isQuickListingAllowed) {
                handleFullListing();
              } else {
                setShowCreateDialog(true);
              }
            }}
            className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-colors flex items-center justify-center z-40"
            aria-label="Add business"
          >
            <Plus className="w-6 h-6" />
          </button>
        </>
      )}

      <BusinessCreateDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onFullListing={handleFullListing}
        onQuickListing={handleQuickListing}
        isQuickListingAllowed={isQuickListingAllowed ?? false}
      />
    </div>
  );
}
