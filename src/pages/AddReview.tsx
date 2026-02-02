import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Star, X, Verified, AlertTriangle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { BusinessModel, ReviewField } from "../types/business";
import { BusinessReviewService } from "../services/business-review-service";

type ReviewAnswers = Record<string, string | number | boolean | string[]>;

export default function AddReviewPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const business: BusinessModel | null = location.state?.business || null;

  const [fields, setFields] = useState<ReviewField[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [answers, setAnswers] = useState<ReviewAnswers>({});
  const [reviewText, setReviewText] = useState<string>("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const hasQuestions = fields.length > 0;
  const characterCount = useMemo(() => reviewText.trim().length, [reviewText]);

  useEffect(() => {
    if (!business?.id) return;
    let cancelled = false;
    setLoading(true);
    BusinessReviewService.getCustomBusinessReviewMeta(business.id)
      .then((meta) => {
        if (cancelled) return;
        if (meta.valid && Array.isArray(meta.fields) && meta.fields.length > 0) {
          setFields(meta.fields);
        } else {
          setFields([]);
        }
      })
      .catch((error) => {
        // Ignore the known "not found" error; surface others
        if (error?.message !== "No custom business review found for this business") {
          toast.error("Failed to load review questions");
          // eslint-disable-next-line no-console
          console.error("Error fetching custom review questions:", error);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [business?.id]);

  const setAnswer = (fieldId: string, value: ReviewAnswers[string]) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  };

  // Handle photo selection (only when there are no custom questions)
  const handlePhotoSelect: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const next = [...photos, ...files].slice(0, 10);
    setPhotos(next);
    const urls = next.map((f) => URL.createObjectURL(f));
    // Revoke old URLs first to avoid leaks
    photoPreviews.forEach((u) => URL.revokeObjectURL(u));
    setPhotoPreviews(urls);
    // reset the input so same file can be selected again if removed
    e.currentTarget.value = "";
  };

  const removePhotoAt = (idx: number) => {
    const nextFiles = photos.filter((_, i) => i !== idx);
    const nextUrls = photoPreviews.filter((_, i) => i !== idx);
    // Revoke the removed preview URL
    URL.revokeObjectURL(photoPreviews[idx]);
    setPhotos(nextFiles);
    setPhotoPreviews(nextUrls);
  };

  useEffect(() => {
    return () => {
      // Cleanup object URLs on unmount
      photoPreviews.forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMultiChoice = (fieldId: string, choice: string) => {
    setAnswers((prev) => {
      const current = Array.isArray(prev[fieldId]) ? (prev[fieldId] as string[]) : [];
      const exists = current.includes(choice);
      const next = exists ? current.filter((c) => c !== choice) : [...current, choice];
      return { ...prev, [fieldId]: next };
    });
  };

  const renderField = (field: ReviewField) => {
    if (field.type === "rating") {
      const current = Number(answers[field.id] || 0);
      return (
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setAnswer(field.id, i)}
              className="p-1"
              aria-label={`Rate ${i}`}
            >
              <Star className={`w-6 h-6 ${i <= current ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`} />
            </button>
          ))}
        </div>
      );
    }

    if (field.type === "yesNo") {
      const current = answers[field.id] as boolean | undefined;
      return (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setAnswer(field.id, true)}
            className={`px-3 py-1.5 rounded ${current === true ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setAnswer(field.id, false)}
            className={`px-3 py-1.5 rounded ${current === false ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}
          >
            No
          </button>
        </div>
      );
    }

    if (field.type === "singleChoice") {
      const current = String(answers[field.id] || "");
      return (
        <div className="flex flex-col gap-2">
          {field.choices?.map((c) => (
            <label key={c} className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={field.id}
                value={c}
                checked={current === c}
                onChange={() => setAnswer(field.id, c)}
              />
              <span>{c}</span>
            </label>
          ))}
        </div>
      );
    }

    if (field.type === "multiChoice") {
      const current = Array.isArray(answers[field.id]) ? (answers[field.id] as string[]) : [];
      return (
        <div className="flex flex-col gap-2">
          {field.choices?.map((c) => (
            <label key={c} className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={current.includes(c)}
                onChange={() => toggleMultiChoice(field.id, c)}
              />
              <span>{c}</span>
            </label>
          ))}
        </div>
      );
    }

    return null;
  };

  if (!business) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-muted text-foreground rounded-full hover:bg-muted-foreground/20"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
        <div className="text-center mt-20">
          <p className="text-muted-foreground">Business not provided.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="px-4 py-4 border-b border-border bg-background">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-muted text-foreground rounded-full hover:bg-muted-foreground/20"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          {/* Business Display Image with Status Badge */}
          <div className="relative flex-shrink-0">
            <img
              src={`https://images.hive.blog/320x0/${business.profile.displayImage}`}
              alt={business.profile.displayName}
              className="w-12 h-12 rounded-full object-cover border border-border"
            />
            {business.distriator.subscriptionStatus === "whitelisted" &&
              business.distriator.owner && (
                <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1 shadow-md">
                  <Verified className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
              )}
            {business.distriator.subscriptionStatus === "underInvestigation" && (
              <div className="absolute bottom-0 right-0 bg-red-600 rounded-full p-1 shadow-md">
                <AlertTriangle className="w-3 h-3 text-white" strokeWidth={3} />
              </div>
            )}
          </div>
          {/* Business Name and Subtitle */}
          <div>
            <h1 className="text-lg font-semibold">{business.profile.displayName}</h1>
            <p className="text-sm text-muted-foreground">Add your review</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Your review</label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-border bg-background p-3 outline-none"
            placeholder={`Share your experience at ${business.profile.displayName}...`}
          />
          <div className="text-xs text-muted-foreground mt-1">{characterCount} characters</div>
        </div>

        {/* Optional Photo Reviews - only when there are no custom questions */}
        {!hasQuestions && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Photo Reviews</h2>
              <span className="text-xs text-muted-foreground">{photos.length}/10</span>
            </div>
            <div>
              <label className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-border cursor-pointer hover:bg-muted">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                Add Photos
              </label>
            </div>
            {photoPreviews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {photoPreviews.map((url, idx) => (
                  <div key={url} className="relative">
                    <img
                      src={url}
                      alt={`Selected ${idx + 1}`}
                      className="w-full h-24 object-cover rounded-md border border-border"
                    />
                    <button
                      type="button"
                      onClick={() => removePhotoAt(idx)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white"
                      aria-label="Remove photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(loading || hasQuestions) && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold">Questions</h2>
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading questions...
              </div>
            )}
            {!loading &&
              hasQuestions &&
              fields.map((f) => (
                <div key={f.id} className="p-4 border border-border rounded-md">
                  <div className="font-medium mb-2">{f.title}</div>
                  {renderField(f)}
                </div>
              ))}
          </div>
        )}

        <div className="pt-2">
          <button
            type="button"
            className="w-full px-4 py-3 rounded-md bg-primary text-primary-foreground"
            onClick={() => {
              // No action for now; integration will be added later
              toast.info("Submit action will be integrated later");
            }}
          >
            Submit Review
          </button>
        </div>
      </div>
    </div>
  );
}