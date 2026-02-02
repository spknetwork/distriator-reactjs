import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Edit2, AlertCircle, Loader2 } from "lucide-react";
import { useBusinesses } from "../hooks/useBusinesses";
import { useAuthData } from "../utils/auth-utils";
import { ReviewFieldDialog } from "../components/business/ReviewFieldDialog";
import type { ReviewField } from "../types/business";
import { toast } from "sonner";
import { BusinessReviewService } from "../services/business-review-service";

const CustomizeBusinessReview = () => {
  const { businessName } = useParams<{ businessName: string }>();
  const navigate = useNavigate();
  const { businesses } = useBusinesses();
  const { token } = useAuthData();

  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fields, setFields] = useState<ReviewField[]>([]);
  const [reviewDocId, setReviewDocId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<ReviewField | null>(null);

  const business = businesses.find(
    (b) => b.profile.displayName === businessName
  );
  useEffect(() => {
    if (!business?.id) return;
    const controller = new AbortController();
    const load = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const meta = await BusinessReviewService.getCustomBusinessReviewMeta(business.id as string, controller.signal);
        if (controller.signal.aborted) return; // Ignore if aborted
        if (meta.valid) {
          setFields(meta.fields || []);
          setReviewDocId(meta.id || null);
        } else {
          setLoadError(meta.errorMessage || 'Failed to load custom reviews');
        }
      } catch (e) {
        if (controller.signal.aborted) return; // Ignore abort errors
        setLoadError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };
    load();
    return () => controller.abort();
  }, [business?.id]);

  const handleSaveField = async (field: ReviewField, isEdit: boolean) => {
    if (!business?.id || !token) {
      toast.error('Missing business ID or authentication token');
      return;
    }

    setIsSaving(true);

    try {
      let updatedFields: ReviewField[];
      const isDeleting = isEdit && !field.title.trim();

      if (isEdit) {
        if (isDeleting) {
          // Remove the field from the list if title is empty (deletion)
          updatedFields = fields.filter(f => f.id !== field.id);
        } else {
          // Update the field
          updatedFields = fields.map(f => f.id === field.id ? field : f);
        }
      } else {
        updatedFields = [...fields, field];
      }

      const typeMap: Record<string, string> = {
        rating: 'rating',
        yesNo: 'yes-no',
        multiChoice: 'multi',
        singleChoice: 'single',
        text: 'text',
      };

      const questions = updatedFields.map((f, index) => {
        const question: {
          type: string;
          title: string;
          order: number;
          options?: string[];
        } = {
          type: typeMap[f.type],
          title: f.title,
          order: index,
        };

        if (f.choices && (f.type === 'singleChoice' || f.type === 'multiChoice')) {
          question.options = f.choices;
        }

        return question;
      });

      const result = reviewDocId
        ? await BusinessReviewService.updateCustomBusinessReview(
            business.id,
            reviewDocId,
            questions,
            token
          )
        : await BusinessReviewService.saveCustomBusinessReview(
            business.id,
            questions,
            token
          );

      if (result.valid && result.data) {
        setFields(updatedFields);
        if (!reviewDocId) {
          const meta = await BusinessReviewService.getCustomBusinessReviewMeta(business.id as string);
          if (meta.valid) setReviewDocId(meta.id || null);
        }
        toast.success(
          isDeleting
            ? 'Question deleted successfully!'
            : isEdit
            ? 'Question updated successfully!'
            : 'Question added successfully!'
        );
      } else {
        toast.error(result.errorMessage || 'Failed to save question');
      }
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const typeLabel = (type: ReviewField['type']) => {
    switch (type) {
      case 'rating': return 'Rating';
      case 'singleChoice': return 'Single Choice';
      case 'multiChoice': return 'Multi Choice';
      case 'yesNo': return 'Yes / No';
      case 'text': return 'Text';
      default: return type;
    }
  };

  const onEditField = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (field) {
      setEditingField(field);
      setShowDialog(true);
    }
  };

  const onAddField = () => {
    setEditingField(null);
    setShowDialog(true);
  };

  if (!business) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Business Not Found</h2>
          <button onClick={() => navigate(-1)} className="btn btn-primary">Go back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 py-4 border-b border-border bg-background sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-muted text-foreground rounded-full hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg sm:text-xl font-bold text-foreground">Custom Review Questions</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">
                {business.profile.displayName}
              </h2>
              <p className="text-sm text-muted-foreground">
                Create custom questions for customers to answer when they review your business.
              </p>
            </div>
            {fields.length > 0 && (
              <span className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium whitespace-nowrap">
                {fields.length} {fields.length === 1 ? 'question' : 'questions'}
              </span>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
            <p className="text-sm text-muted-foreground">Loading review questions...</p>
          </div>
        ) : loadError ? (
          <div className="border border-red-200 bg-red-50 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-900 mb-1">Error loading questions</h3>
                <p className="text-sm text-red-700">{loadError}</p>
              </div>
            </div>
          </div>
        ) : fields.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-xl p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No custom questions yet</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Add custom questions to gather specific feedback from your customers.
              </p>
                <button
                  onClick={onAddField}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  <Plus className="w-5 h-5" /> Add First Question
                </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="group relative rounded-xl border border-border/60 bg-gradient-to-br from-background/60 to-muted/40 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/40">
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary/60 via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-start justify-between gap-5">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/15 text-primary text-sm font-semibold ring-1 ring-primary/20">
                        {index + 1}
                      </span>
                      <h3 className="font-medium text-foreground">{field.title}</h3>
                    </div>
                    <div className="ml-10">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-muted/70 border border-border/60 text-xs font-medium text-foreground">
                        {typeLabel(field.type)}
                      </span>
                    </div>
                    {field.choices && field.choices.length > 0 && (
                      <div className="mt-3 ml-10 flex flex-wrap gap-2">
                        {field.choices.map((choice, idx) => (
                          <span key={idx} className="text-xs px-2.5 py-1 rounded-md bg-card/60 border border-border/60 text-foreground">
                            {choice}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                    <button
                      className="btn btn-outline btn-primary flex items-center gap-2"
                      onClick={() => onEditField(field.id)}
                      title="Edit question"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {fields.length > 0 && (
        <button
          onClick={onAddField}
          disabled={isSaving}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Add review question"
        >
          {isSaving ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Plus className="w-6 h-6" />
          )}
        </button>
      )}

      <ReviewFieldDialog
        isOpen={showDialog}
        onClose={() => {
          setShowDialog(false);
          setEditingField(null);
        }}
        onSave={handleSaveField}
        editingField={editingField}
      />
    </div>
  );
};

export default CustomizeBusinessReview;


