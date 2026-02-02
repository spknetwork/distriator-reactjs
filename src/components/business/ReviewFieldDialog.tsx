import { useState, useEffect } from "react";
import { X, Star, Radio, CheckSquare, CheckCircle, Trash2, FileText } from "lucide-react";
import type { ReviewField } from "../../types/business";
import { toast } from "sonner";

export type ReviewFieldType = 'rating' | 'singleChoice' | 'multiChoice' | 'yesNo' | 'text';

interface ReviewFieldDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (field: ReviewField, isEdit: boolean) => void;
  editingField?: ReviewField | null;
}

interface FieldOption {
  type: ReviewFieldType;
  label: string;
  icon: React.ReactNode;
  requiresChoices: boolean;
}

const fieldOptions: FieldOption[] = [
  {
    type: 'rating',
    label: 'Rating',
    icon: <Star className="w-5 h-5" />,
    requiresChoices: false,
  },
  {
    type: 'yesNo',
    label: 'Yes - No',
    icon: <CheckCircle className="w-5 h-5" />,
    requiresChoices: false,
  },
  {
    type: 'text',
    label: 'Text Response',
    icon: <FileText className="w-5 h-5" />,
    requiresChoices: false,
  },
  {
    type: 'multiChoice',
    label: 'Multi Choice',
    icon: <CheckSquare className="w-5 h-5" />,
    requiresChoices: true,
  },
  {
    type: 'singleChoice',
    label: 'Single Choice',
    icon: <Radio className="w-5 h-5" />,
    requiresChoices: true,
  },
];

export function ReviewFieldDialog({
  isOpen,
  onClose,
  onSave,
  editingField = null,
}: ReviewFieldDialogProps) {
  const [selectedType, setSelectedType] = useState<ReviewFieldType | null>(null);
  const [title, setTitle] = useState('');
  const [choices, setChoices] = useState<string[]>([]);
  const isEditMode = !!editingField;

  useEffect(() => {
    if (isOpen && editingField) {
      setSelectedType(editingField.type);
      setTitle(editingField.title);
      setChoices(editingField.choices || []);
    } else if (isOpen && !editingField) {
      setSelectedType(null);
      setTitle('');
      setChoices([]);
    }
  }, [isOpen, editingField]);

  const handleTypeSelect = (type: ReviewFieldType) => {
    setSelectedType(type);
    const option = fieldOptions.find(opt => opt.type === type);

    if (option?.requiresChoices) {
      setChoices(['', '']);
    } else {
      setChoices([]);
    }
    setTitle('');
  };

  const handleAddChoice = () => {
    setChoices([...choices, '']);
  };

  const handleRemoveChoice = (index: number) => {
    if (choices.length > 2) {
      setChoices(choices.filter((_, i) => i !== index));
    }
  };

  const handleChoiceChange = (index: number, value: string) => {
    const newChoices = [...choices];
    newChoices[index] = value;
    setChoices(newChoices);
  };

  const handleSaveField = () => {
    // Allow empty title only in edit mode (for deletion)
    if (!title.trim() && !isEditMode) {
      toast.error('Please provide a title for the field');
      return;
    }

    if (!selectedType) {
      toast.error('Please select a field type');
      return;
    }

    const option = fieldOptions.find(opt => opt.type === selectedType);

    // Only validate choices if title is not empty (not a deletion)
    if (title.trim() && option?.requiresChoices) {
      const validChoices = choices.filter(c => c.trim());
      if (validChoices.length < 2) {
        toast.error('Please provide at least 2 choices');
        return;
      }
    }

    const field: ReviewField = {
      id: editingField?.id || `field_${Date.now()}`,
      title: title.trim(),
      type: selectedType,
      choices: option?.requiresChoices ? choices.filter(c => c.trim()) : undefined,
    };

    onSave(field, isEditMode);
    onClose();
    resetDialog();
  };

  const resetDialog = () => {
    setSelectedType(null);
    setTitle('');
    setChoices([]);
  };

  const handleClose = () => {
    onClose();
    resetDialog();
  };

  const handleOverlayClick = () => {
    handleClose();
  };

  if (!isOpen) return null;

  const selectedOption = fieldOptions.find(o => o.type === selectedType);
  const requiresChoices = selectedOption?.requiresChoices || false;
  const titlePlaceholder = selectedType === 'text'
    ? 'e.g., Describe your experience in your own words'
    : 'e.g., How would you rate the service?';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={handleOverlayClick}>
      <div className="bg-background rounded-lg shadow-xl w-full max-w-lg overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            {isEditMode ? 'Edit Review Field' : 'Add Review Field'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedType ? (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Choose the type of field you want to add
              </p>

              <div className="grid grid-cols-2 gap-3">
                {fieldOptions.map((option) => (
                  <button
                    key={option.type}
                    onClick={() => handleTypeSelect(option.type)}
                    className="flex flex-col items-center gap-2 p-4 border-2 border-border rounded-lg hover:border-primary hover:bg-muted transition-all text-center"
                  >
                    <div className="text-primary">{option.icon}</div>
                    <span className="text-sm font-medium text-foreground">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Field Type Display */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-primary">{selectedOption?.icon}</div>
                  <span className="font-medium text-foreground">{selectedOption?.label}</span>
                </div>
                {!isEditMode && (
                  <button
                    onClick={() => {
                      setSelectedType(null);
                      setTitle('');
                      setChoices([]);
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Change
                  </button>
                )}
              </div>

              {/* Title input */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Question Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={titlePlaceholder}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
                {isEditMode && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Tip: Clear the title to delete this question
                  </p>
                )}
              </div>

              {/* Choices for single/multi choice */}
              {requiresChoices && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Answer Options
                  </label>
                  <div className="space-y-2">
                    {choices.map((choice, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={choice}
                          onChange={(e) => handleChoiceChange(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        {choices.length > 2 && (
                          <button
                            onClick={() => handleRemoveChoice(index)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove option"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={handleAddChoice}
                      className="w-full py-2 px-4 border border-border border-dashed rounded-lg hover:bg-muted transition-colors text-sm text-foreground"
                    >
                      + Add Option
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Minimum 2 options required
                  </p>
                </div>
              )}

              {/* Text field preview */}
              {selectedType === 'text' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Customer Input Preview
                  </label>
                  <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Customers will see a single open-ended text box to answer this question.
                    </p>
                    <textarea
                      disabled
                      placeholder="Write your response here..."
                      className="w-full min-h-[80px] rounded-md border border-dashed border-border bg-background px-3 py-2 text-sm text-muted-foreground"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedType && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveField}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              {isEditMode ? 'Update Field' : 'Add Field'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

