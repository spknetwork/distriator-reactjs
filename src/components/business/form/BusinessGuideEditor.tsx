import React, { useState } from 'react';
import { Users, Plus, Trash2, X } from 'lucide-react';
import { BusinessFormField } from './BusinessFormField';

interface Guide {
  name: string;
  percent: number;
}

interface BusinessGuideEditorProps {
  label: string;
  guides: Guide[];
  onChange: (guides: Guide[]) => void;
  required?: boolean;
}

export const BusinessGuideEditor: React.FC<BusinessGuideEditorProps> = ({
  label,
  guides,
  onChange,
  required = false
}) => {
  const [showEditor, setShowEditor] = useState(false);
  const [newGuideName, setNewGuideName] = useState('');
  const [newGuidePercent, setNewGuidePercent] = useState(50);

  const displayText =
    guides.length > 0 ? guides.map((g) => g.name).join(', ') : 'No guides assigned';

  // Work in internal 0-10000 scale
  const totalPercent = guides.reduce((sum, guide) => sum + guide.percent, 0);
  const remainingPercent = 10000 - totalPercent;

  const handleAddGuide = () => {
    if (newGuideName.trim() && remainingPercent > 0) {
      // scale from 0-100 UI -> 0-10000 internal
      const percent = Math.min(newGuidePercent * 100, remainingPercent);
      onChange([...guides, { name: newGuideName.trim(), percent }]);
      setNewGuideName('');
      setNewGuidePercent(50);
    }
  };

  const handleRemoveGuide = (index: number) => {
    onChange(guides.filter((_, i) => i !== index));
  };

  const handlePercentChange = (index: number, percentUI: number) => {
    const newGuides = [...guides];
    newGuides[index] = { ...newGuides[index], percent: percentUI * 100 }; // scale back to 0-10000
    onChange(newGuides);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div
        onClick={() => setShowEditor(true)}
        className="w-full px-3 py-2 bg-background border border-border rounded-lg cursor-pointer hover:border-primary transition-colors"
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span
            className={
              guides.length > 0 ? 'text-foreground' : 'text-muted-foreground'
            }
          >
            {displayText}
          </span>
        </div>
      </div>

      {showEditor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-semibold">Edit Guides</h3>
              <button
                onClick={() => setShowEditor(false)}
                className="p-1 hover:bg-muted rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="text-sm text-muted-foreground">
                Total: {totalPercent / 100}% / 100% (Remaining:{' '}
                {remainingPercent / 100}%)
              </div>
              
              {guides.map((guide, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 bg-muted rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{guide.name}</div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={guide.percent / 100} // convert 0-10000 -> 0-100
                      onChange={(e) =>
                        handlePercentChange(index, parseInt(e.target.value))
                      }
                      className="w-full mt-1"
                    />
                    <div className="text-xs text-muted-foreground">
                      {guide.percent / 100}%
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveGuide(index)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {remainingPercent > 0 && (
                <div className="border-t border-border pt-4 space-y-3">
                  <BusinessFormField
                    label="Guide Name"
                    value={newGuideName}
                    onChange={setNewGuideName}
                    placeholder="Enter guide username"
                  />
                  <div className="space-y-1">
                    <label className="block text-sm font-medium">
                      Percentage
                    </label>
                    <input
                      type="range"
                      min="1"
                      max={remainingPercent / 100} // convert remaining back to 0-100
                      value={Math.min(newGuidePercent, remainingPercent / 100)}
                      onChange={(e) =>
                        setNewGuidePercent(parseInt(e.target.value))
                      }
                      className="w-full"
                    />
                    <div className="text-xs text-muted-foreground">
                      {Math.min(newGuidePercent, remainingPercent / 100)}%
                    </div>
                  </div>
                  <button
                    onClick={handleAddGuide}
                    disabled={!newGuideName.trim()}
                    className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Guide
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};