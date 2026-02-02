import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Star } from "lucide-react";
import { useAioha } from "@aioha/react-provider";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import { ApiService } from "../services/api";
import { Card } from "@radix-ui/themes";
import type { UserClaimResponseDTO } from "../types/claim";
import type { BusinessModel, ReviewField } from "../types/business";
import { BusinessReviewService } from "../services/business-review-service";
import { useAuthData } from '../utils/auth-utils';

export function ReviewScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { aioha } = useAioha();

  // Pull data from history state
  const photos: string[] = location.state?.photos || [];
  const claimData: UserClaimResponseDTO | null =
    location.state?.claimData || null;
  const business: BusinessModel | null = location.state?.business || null;
  const passedFields: ReviewField[] | undefined = location.state?.customReviewFields;

  const rawAmount = claimData?.claim?.transactionAmount ?? "0";
  const amount = Number(String(rawAmount).replace(/[^0-9.-]/g, ""));
  const formattedAmount = `${amount.toFixed(2)} HBD`;

  const title = `I visited ${business?.profile.displayName ?? ""} & paid ${formattedAmount} & here is my review`;

  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { token, username } = useAuthData();

  // Questions state
  const [fields, setFields] = useState<ReviewField[]>(passedFields || []);
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>({});
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [questionsCompleted, setQuestionsCompleted] = useState<boolean>(false);
  const [hoverRating, setHoverRating] = useState<Record<string, number>>({});
  const requiresServerQuestion = business?.profile?.isOnline === false;
  const [serverQuestionOpen, setServerQuestionOpen] = useState<boolean>(requiresServerQuestion);
  const [serverHasHiveUsername, setServerHasHiveUsername] = useState<boolean | null>(requiresServerQuestion ? null : false);
  const [serverHiveUsername, setServerHiveUsername] = useState("");
  const [serverDisplayName, setServerDisplayName] = useState("");
  const [serverRating, setServerRating] = useState<number>(0);
  const [serverQuestionCompleted, setServerQuestionCompleted] = useState<boolean>(!requiresServerQuestion);

  // If not passed, fetch once
  useEffect(() => {
    if (!passedFields && business?.id) {
      BusinessReviewService.getCustomBusinessReviewMeta(business.id).then((meta) => {
        if (meta.valid && meta.fields.length > 0) {
          setFields(meta.fields);
        }
      }).catch((error) => {
        // Handle the error silently - don't show console error for "No custom business review found"
        if (error?.message !== "No custom business review found for this business") {
          console.error("Error fetching custom business review:", error);
        }
      });
    }
  }, [passedFields, business?.id]);

  useEffect(() => {
    if (fields.length > 0) {
      const allDone = fields.every((f) => completed[f.id]);
      setQuestionsCompleted(allDone);
    } else {
      setQuestionsCompleted(false);
    }
  }, [completed, fields]);

  useEffect(() => {
    if (requiresServerQuestion) {
      setServerQuestionOpen(true);
    }
  }, [requiresServerQuestion]);

  const hasQuestions = fields.length > 0;

  const characterCount = useMemo(() => {
    return review.trim().length;
  }, [review]);

  const tags = ["spendhbd", "distriator", "spendtoearn"];

  const handleBack = () => navigate(-1);
  const handleSubmitSuccess = (title?: string, serverMessage?: string) => {
    toast.success(title || "Review Submitted", {
      description: serverMessage || `your Review has been submitted successfully.`,
    });
    setIsSubmitting(false);
    setShowConfetti(true);
  };

  const _claimRewardApi = async (permlink: string, invoiceId: string) => {
    try {
      setIsClaiming(true);
      if (!token) throw new Error("No authentication token");
      return await ApiService.reviewClaim(token, permlink, invoiceId);
    } catch (e) {
      toast.error("Claim Failed", { description: String(e) });
      return { success: false };
    } finally {
      setIsClaiming(false);
    }
  };

  const handleSubmit = async () => {
    // Validation: textarea must be >= 100 characters
    if (characterCount < 100) {
      toast.error("Review Too Short", {
        description: "Please write at least 100 characters to submit.",
      });
      return;
    }
    if (requiresServerQuestion && !serverQuestionCompleted) {
      toast.error("Missing Server Details", {
        description: "Please answer the server question before submitting.",
      });
      setServerQuestionOpen(true);
      return;
    }
    if (!claimData?.claim?.invoice) {
      toast.error("Invoice Missing", {
        description: "Invoice not found for this claim.",
      });
      return;
    }

    setIsSubmitting(true);

    const permlink = generateRandomString(8);
    const parentAuthor = "";
    const parentPermlink = "hive-106130";
    const body = _comment();
    const metadata = jsonMetaData(username);
    const result = await aioha.comment(
      parentAuthor,
      parentPermlink,
      permlink,
      title,
      body,
      metadata,
      {
        author: username,
        permlink: permlink,
        max_accepted_payout: "100000.000 HBD",
        percent_hbd: 10000,
        allow_votes: true,
        allow_curation_rewards: true,
        extensions: [
          [
            0,
            {
              beneficiaries: [{ account: "distriator.bene", weight: 8000 }],
            },
          ],
        ],
      }
    );

    if (result.success) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      const claimResult = await _claimRewardApi(
        permlink,
        claimData.claim.invoice
      );
      if (claimResult.success) {
        handleSubmitSuccess(claimResult.message, claimResult.data?.message);
      } else {
        setIsSubmitting(false);
      }
    } else {
      toast.error("Claim Failed", {
        description: "Failed to broadcast the transaction",
      });
      setIsSubmitting(false);
    }
  };

  const generateRandomString = (length: number) => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from({ length }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join("");
  };

  const _comment = () => {
    let result = "";

    const businessName = business?.profile.displayName || "this business";

    // Intro section – main body starts with a clear, smaller heading
    result += `## My experience at ${businessName}\n\n`;

    if (review.trim() !== "") {
      result += `${review.trim()}\n\n`;
    }

    // Q&A and server details grouped under a separate section
    if (hasQuestions || (requiresServerQuestion && serverQuestionCompleted)) {
      result += `---\n\n`;
      result += `### Detailed business review\n\n`;
    }

    // Custom business questions as subheadings with clearly formatted answers
    if (hasQuestions) {
      fields.forEach((f) => {
        const val = answers[f.id];
        let ansStr = "";
        if (f.type === "rating") {
          ansStr = `${val}/5`;
        } else if (Array.isArray(val)) {
          ansStr = val.join(", ");
        } else if (typeof val === "string") {
          ansStr = val;
        } else {
          ansStr = String(val ?? "");
        }

        result += `#### ${f.title}\n`;
        result += `- **Your answer**: ${ansStr}\n\n`;
      });
    }

    // Server interaction question rendered as its own subsection
    if (requiresServerQuestion && serverQuestionCompleted) {
      const identifier = serverHasHiveUsername
        ? `@${serverHiveUsername.trim()}`
        : `${serverDisplayName.trim()}`;

      result += `#### Server experience\n`;
      result += `- **Person**: ${identifier}\n`;
      result += `- **Rating**: ${serverRating}/5\n\n`;
    }

    // Append all customer-uploaded review photos
    if (photos.length > 0) {
      result += `---\n\n`;
      result += `### Photos from my visit\n\n`;
      for (let i = 0; i < photos.length; i++) {
        const image = photos[i];
        result += `![${business?.profile.displayName}-review-photo-by-${username}-image-${i + 1}](${image})\n`;
      }
      result += "\n";
    }

    result += _commentMetaData();
    return result;
  };

  const _commentMetaData = () => {
    return `
Business name: [${business?.profile.displayName
      }](https://distriator.com/#/businesses/${encodeURIComponent(
        business?.profile.displayName || ""
      )})
[Open SpendHBD Business Page](${business?.distriator.spendHbdLink || ""})

Paid Amount: ${claimData?.claim?.amount || ""}

To benefit from Distriator and receive discounts on your Hive Dollars purchases:

1. Spend Hive Dollars at listed businesses on Distriator (See business list here - https://distriator.com/#/businesses).
2. Make sure business issues a QR Invoice from v4v.app / Hive-Keychain app.
3. Go to https://distriator.com, log in, follow the instructions, and make your claim.
`;
  };

  const jsonMetaData = (userName: string) => ({
    tags: tags,
    app: "distriator/1.0.0",
    image: photos,
    users: [userName],
    business_display_name: business?.profile.displayName || "",
    business_name: business?.distriator.owner || "",
    spend_hbd_link: business?.distriator.spendHbdLink || "",
    invoice_id: claimData?.claim?.invoice || "",
    unique_business_invoice_id: `${business?.distriator.owner}-${claimData?.claim?.invoice || ""
      }`,
    invoice_memo: claimData?.claim?.memo || "",
    developer: "sagarkothari88",
    team: "spknetwork",
    format: "markdown",
    total_value: claimData?.claim?.amount || "",
    claim_percent: claimData?.claim?.percentage || "",
    claim_value: claimData?.claim?.claimValue || "",
    guides_percent: claimData?.claim?.guides?.map((g) => g.percent).join(", "),
    server_question: requiresServerQuestion
      ? {
          has_hive_username: serverHasHiveUsername,
          hive_username: serverHiveUsername.trim() || undefined,
          display_name: serverDisplayName.trim() || undefined,
          rating: serverRating || undefined,
        }
      : undefined,
    custom_review: fields.map((field) => {
      let typeStr = "";
      if (field.type === "yesNo") typeStr = "yes-no";
      else if (field.type === "singleChoice") typeStr = "single";
      else if (field.type === "multiChoice") typeStr = "multi";
      else if (field.type === "rating") typeStr = "rating";
      else if (field.type === "text") typeStr = "text";
      return {
        type: typeStr,
        title: field.title,
        ...(field.choices ? { options: field.choices } : {}),
        answer: answers[field.id],
      };
    }),
  });

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* Global Loading Overlay during submission/claiming */}
      {(isSubmitting || isClaiming) && !showConfetti && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80">
          <div className="flex items-center gap-3 bg-background/90 text-foreground px-5 py-4 rounded-lg shadow-xl border border-border">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>
              {isClaiming ? "Submitting business review... Please wait" : "Posting business review... Please wait"}
            </span>
          </div>
        </div>
      )}
      {requiresServerQuestion && serverQuestionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-background text-foreground rounded-lg shadow-2xl border border-border max-w-lg w-full mx-8 p-6 space-y-4">
            <img src={business?.profile.displayImage} alt={business?.profile.displayName} className="w-16 h-16 rounded-full object-cover border-2 border-primary shadow-md mx-auto" />
            <h1 className="text-2xl font-bold text-center">Rate the person who served you at {business?.profile.displayName}</h1>
            <h3 className="text-md font-semibold text-center">Does he/she have hive-username?</h3>
            <div className="flex gap-3 justify-center">
              <button
                className={`px-4 py-2 rounded-lg border ${serverHasHiveUsername === true ? "bg-primary text-primary-foreground" : "hover:bg-primary hover:text-primary-foreground"}`}
                onClick={() => {
                  setServerHasHiveUsername(true);
                  setServerDisplayName("");
                }}
              >
                Yes
              </button>
              <button
                className={`px-4 py-2 rounded-lg border ${serverHasHiveUsername === false ? "bg-primary text-primary-foreground" : "hover:bg-primary hover:text-primary-foreground"}`}
                onClick={() => {
                  setServerHasHiveUsername(false);
                  setServerHiveUsername("");
                }}
              >
                No
              </button>
            </div>
            {serverHasHiveUsername === true && (
              <div className="space-y-3">
                <label className="block text-sm font-medium">Enter Hive username</label>

                <div className="relative">
                  {/* Avatar inside input */}
                  {serverHiveUsername.trim() !== "" && (
                    <img
                      src={`https://images.hive.blog/u/${serverHiveUsername.trim()}/avatar`}
                      alt={serverHiveUsername}
                      className="w-8 h-8 rounded-full absolute left-2 top-1/2 -translate-y-1/2 border border-border"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://images.hive.blog/u/null/avatar";
                      }}
                    />
                  )}
                  <input
                    value={serverHiveUsername.toLocaleLowerCase()}
                    onChange={(e) => setServerHiveUsername(e.target.value.trim())}
                    className={`w-full pl-13 py-2 rounded-lg border border-border bg-muted/50 ${
                      serverHiveUsername.trim() !== "" ? "pl-12" : "pl-3"
                    }`}
                    placeholder="hive-username"
                  />
                </div>
              </div>
            )}
            {serverHasHiveUsername === false && (
              <div className="space-y-3">
                <label className="block text-sm font-medium">Enter server name</label>
                <input
                  value={serverDisplayName}
                  onChange={(e) => setServerDisplayName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-muted/50 focus:ring-2 focus:ring-primary"
                  placeholder="Server name"
                />
              </div>
            )}
            {serverHasHiveUsername !== null && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Rate the server</p>
                <div className="flex gap-1 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className="p-1 hover:scale-110 transition-transform"
                      onClick={() => setServerRating(star)}
                    >
                      <Star
                        className={`w-8 h-8 ${serverRating >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button
              className="btn btn-outline btn-success w-full"
              disabled={
                serverHasHiveUsername === null ||
                serverRating === 0 ||
                (serverHasHiveUsername === true && serverHiveUsername.trim() === "") ||
                (serverHasHiveUsername === false && serverDisplayName.trim() === "")
              }
              onClick={() => {
                setServerQuestionCompleted(true);
                setServerQuestionOpen(false);
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
      {/* 🎉 Confetti Popup */}
      {showConfetti && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-8 shadow-2xl max-w-md mx-4 text-center animate-in fade-in zoom-in-95 duration-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Congratulations!
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                your review was submitted, please check back in a day or two to claim your cashback.
              </p>
              <button
                onClick={() => {
                  setShowConfetti(false);
                  navigate("/claim");
                }}
                className="mt-6 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Okay
              </button>
            </div>
          </div>
        </>
      )}

      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border bg-background/80">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-muted"
            aria-label="Go back"
          >
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Write a Review</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 sm:p-6 space-y-8">
        {/* Business Info */}
        {business && (
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center space-x-4">
              <img
                src={business.profile.displayImage}
                alt={business.profile.displayName}
                className="w-16 h-16 rounded-full object-cover border-2 border-primary shadow-md"
              />
              <div>
                <h3 className="text-xl font-semibold text-foreground">
                  {business.profile.displayName}
                </h3>
                <p className="text-muted-foreground capitalize">
                  {business.profile.businessType}
                </p>
              </div>
            </div>
          </Card>
        )}

        {requiresServerQuestion && serverQuestionCompleted && (
          <Card>
            <div className="p-4 bg-background/50 border border-border/50 rounded-lg flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Does the server have a Hive username?</p>
                  <p className="font-semibold">{serverHasHiveUsername ? "Yes" : "No"}</p>
                </div>
                <button className="btn btn-outline btn-xs" onClick={() => setServerQuestionOpen(true)}>
                  Edit
                </button>
              </div>
              <div className="text-sm">
                {serverHasHiveUsername
                  ? `Hive username: @${serverHiveUsername.trim()}`
                  : `Server name: ${serverDisplayName.trim()}`}
              </div>
              <div className="flex items-center gap-1 text-sm">
                <span className="font-medium">Rating:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${serverRating >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                  />
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Questions Flow */}
        {hasQuestions && (
          <Card>
            <div className="p-6 bg-background/50 border border-border/50 rounded-lg">
              {fields.map((field) => (
                <div key={field.id} className="space-y-4 mb-6">
                  <h3 className="text-xl font-semibold text-foreground">{field.title}</h3>
                  {field.type === 'yesNo' && (
                    <div className="flex gap-3">
                      <button
                        className={`px-4 py-2 rounded-lg border ${
                          answers[field.id] === 'Yes'
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-primary hover:text-primary-foreground'
                        }`}
                        onClick={() => {
                          const qid = field.id;
                          setAnswers((prev) => ({ ...prev, [qid]: 'Yes' }));
                          setCompleted((prev) => ({ ...prev, [qid]: true }));
                        }}
                      >
                        Yes
                      </button>
                      <button
                        className={`px-4 py-2 rounded-lg border ${
                          answers[field.id] === 'No'
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-primary hover:text-primary-foreground'
                        }`}
                        onClick={() => {
                          const qid = field.id;
                          setAnswers((prev) => ({ ...prev, [qid]: 'No' }));
                          setCompleted((prev) => ({ ...prev, [qid]: true }));
                        }}
                      >
                        No
                      </button>
                    </div>
                  )}

                  {field.type === 'singleChoice' && (
                    <div className="flex flex-col gap-2">
                      {(field.choices || []).map((c) => (
                        <button
                          key={c}
                          className={`text-left px-4 py-2 rounded-lg border ${
                            answers[field.id] === c
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-primary hover:text-primary-foreground'
                          }`}
                          onClick={() => {
                            const qid = field.id;
                            setAnswers((prev) => ({ ...prev, [qid]: c }));
                            setCompleted((prev) => ({ ...prev, [qid]: true }));
                          }}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}

                  {field.type === 'multiChoice' && (
                    <div className="space-y-3">
                      <div className="flex flex-col gap-2">
                        {(field.choices || []).map((c) => {
                          const selected = Array.isArray(answers[field.id]) && (answers[field.id] as string[]).includes(c);
                          return (
                            <label key={c} className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={Boolean(selected)}
                                onChange={(e) => {
                                  setAnswers((prev) => {
                                    const curr = Array.isArray(prev[field.id]) ? (prev[field.id] as string[]) : [];
                                    const next = e.target.checked
                                      ? Array.from(new Set([...curr, c]))
                                      : curr.filter((x) => x !== c);
                                    const newAnswers = { ...prev, [field.id]: next };
                                    // Set completed if at least one selected
                                    setCompleted((prevCompleted) => ({ ...prevCompleted, [field.id]: next.length > 0 }));
                                    return newAnswers;
                                  });
                                }}
                              />
                              <span>{c}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {field.type === 'text' && (
                  <div className="space-y-2">
                    <textarea
                      value={(answers[field.id] as string) || ''}
                      onChange={(e) => {
                        const qid = field.id;
                        const val = e.target.value;
                        setAnswers((prev) => ({ ...prev, [qid]: val }));
                        setCompleted((prev) => ({ ...prev, [qid]: val.trim().length >= 60 }));
                      }}
                      placeholder="Write your answer here..."
                      className="w-full min-h-[120px] rounded-lg border border-border bg-background/70 p-3 focus:ring-2 focus:ring-primary"
                    />
                    {(() => {
                      const v = String((answers[field.id] as string) || "").trim();
                      const count = v.length;
                      const remaining = Math.max(0, 60 - count);
                      const ok = remaining === 0;
                      const warningText = count === 0
                        ? "60 characters required"
                        : `${remaining} more characters required`;

                      return (
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs text-muted-foreground">
                            Open-ended response.
                          </p>
                          {!ok && (
                            <p className="text-xs text-red-500">
                              {warningText}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                  {field.type === 'rating' && (
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          className="p-1 hover:scale-110 transition-transform"
                          onMouseEnter={() => setHoverRating(prev => ({ ...prev, [field.id]: star }))}
                          onMouseLeave={() => setHoverRating(prev => ({ ...prev, [field.id]: 0 }))}
                          onClick={() => {
                            const qid = field.id;
                            setAnswers((prev) => ({ ...prev, [qid]: star }));
                            setCompleted((prev) => ({ ...prev, [qid]: true }));
                          }}
                        >
                          <Star
                            className={`w-8 h-8 ${
                              ((hoverRating[field.id] ?? 0) || (answers[field.id] as number ?? 0)) >= star
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Review Textarea (required 100 characters) */}

        <Card>
          <div className="p-6 bg-background/50 border border-border/50 rounded-lg">
              <h3 className="text-xl font-semibold mb-1 text-foreground">Write a Review <span className="text-xs text-red-500 mt-1 text-right">(required)</span></h3>
            <p className="text-muted-foreground mb-4">{title}</p>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
                placeholder="Share your experience... (minimum 100 characters)"
              className="min-h-[150px] w-full resize-none bg-muted/50 border border-border rounded-lg p-4 focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
            />
                {(() => {
                  const remaining = Math.max(0, 100 - characterCount);
                  const ok = remaining === 0;
                  const warningText = characterCount === 0
                    ? "100 characters required"
                    : `${remaining} more characters required`;
                  if (ok) return null;
                  return (
                    <p className="text-sm mt-2 text-right text-red-500">
                      {warningText}
                    </p>
                  );
                })()}
          </div>
        </Card>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={
            isSubmitting ||
            isClaiming ||
            characterCount < 100 ||
            (hasQuestions && !questionsCompleted) ||
            (requiresServerQuestion && !serverQuestionCompleted)
          }
          className="btn btn-outline btn-success py-3 text-lg rounded-lg mx-auto flex items-center gap-2"
        >
          {(isSubmitting || isClaiming) && (
            <Loader2 className="w-5 h-5 animate-spin" />
          )}
          {isClaiming
            ? "Submitting business review..."
            : isSubmitting
              ? "Posting business review..."
              : "Submit Review"}
        </button>

        {/* Photo Preview */}
        <Card>
          <div className="p-6 bg-background/50 border border-border/50 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">
              Your Photos ({photos.length})
            </h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {photos.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Review photo ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg shadow-md"
                />
              ))}
            </div>
          </div>
        </Card>

        
      </main>
    </div>
  );
}
