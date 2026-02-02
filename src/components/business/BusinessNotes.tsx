import { Clock, FileText } from 'lucide-react'; // Add StickyNote for 'Notes'
import { type BusinessModel } from '../../types/business';

interface BusinessNotesProps {
  business: BusinessModel;
}

export function BusinessNotes({ business }: BusinessNotesProps) {
  const hasNotes = business.contact?.notes;
  const hasWorkTime = business.profile.workTime;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Notes</h2>


      {hasNotes && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Business Notes</h3>
          </div>
          <p className="text-foreground leading-relaxed">{business.contact!.notes}</p>
        </div>
      )}

      {hasWorkTime && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Work Time</h3>
          </div>
          <p className="text-foreground">{business.profile.workTime}</p>
        </div>
      )}
    </div>
  );
}
