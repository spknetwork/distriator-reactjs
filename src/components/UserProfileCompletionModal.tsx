import { useAuthContext } from '../context/AuthContext';
import { useUserProfileStore } from '../stores/userProfileStore';
import { useEffect, useState } from 'react';

interface UserProfileCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileCompletionModal = ({ isOpen, onClose }: UserProfileCompletionModalProps) => {
  const { currentUser } = useAuthContext();
  const { user, updateUserProfile } = useUserProfileStore();
  const [gender, setGender] = useState<string>('');
  const [ageGroup, setAgeGroup] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const avatarUsername = user?.username ?? currentUser?.username ?? '';
  const avatarSrc = avatarUsername ? `https://images.hive.blog/u/${avatarUsername}/avatar` : 'https://images.hive.blog/u/null/avatar';

  useEffect(() => {
    if (user) {
      setGender(user.gender ?? '');
      setAgeGroup(user.ageGroup ?? '');
    } else {
      setGender('');
      setAgeGroup('');
    }
    setError(null);
  }, [user, isOpen]);

  const handleSubmit = async () => {
    setError(null);
    if (!gender || !ageGroup) {
      setError('Please select both gender and age group.');
      return;
    }
    if (!currentUser?.token) {
      setError('Missing authentication token.');
      return;
    }
    setSubmitting(true);
    try {
      await updateUserProfile(currentUser.token, { gender, ageGroup });
      onClose();
    } catch (err) {
      console.error('Failed to update user profile', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative bg-background rounded-lg shadow-lg max-w-md w-full p-6 z-10 text-foreground border border-border">
        <div className="flex flex-col items-center">
          <img
            src={avatarSrc}
            alt={`${avatarUsername} avatar`}
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.hive.blog/u/null/avatar'; }}
            className="w-16 h-16 rounded-full object-cover border-2 border-border"
          />
          <h2 className="text-xl font-bold mt-2 text-foreground">{user?.username ?? currentUser?.username}</h2>
        </div>

        <div className="mt-6 grid gap-4">
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-muted-foreground">Gender</label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="mt-1 block w-full rounded border border-border bg-background text-foreground px-3 py-2"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="age-group" className="block text-sm font-medium text-muted-foreground">Age Group</label>
            <select
              id="age-group"
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              className="mt-1 block w-full rounded border border-border bg-background text-foreground px-3 py-2"
            >
              <option value="">Select Age Group</option>
              <option value="18-25">18-25</option>
              <option value="26-35">26-35</option>
              <option value="36-45">36-45</option>
              <option value="46-55">46-55</option>
              <option value="56-65">56-65</option>
              <option value="66+">66+</option>
            </select>
          </div>

          {error && <div className="text-sm text-destructive">{error}</div>}

          <div className="flex justify-end mt-4">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileCompletionModal;