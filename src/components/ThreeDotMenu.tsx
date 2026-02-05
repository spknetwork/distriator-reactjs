import { Menu, Transition, Portal } from '@headlessui/react';
import { MoreVertical, ShieldAlert, UserX, Flag, FileX } from 'lucide-react';
import { Fragment, useState } from 'react';
import ReportModal from './ReportModal';
import { ReportService } from '../services/report-service';
import { useAuthData } from '../utils/auth-utils';
import { toast } from 'sonner';
import { useReportedContentStore } from '../stores/reportedContentStore';

const menuOptions = [
  { label: 'Report Author', icon: Flag, action: 'report_author' },
  { label: 'Block Author', icon: UserX, action: 'block_author' },
  { label: 'Block Content', icon: FileX, action: 'block_content' },
  { label: 'Report Content', icon: ShieldAlert, action: 'report_content' },
];

export interface ThreeDotMenuProps {
  username: string;
  permlink?: string;
}

export function ThreeDotMenu({ username, permlink }: ThreeDotMenuProps) {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState<'user' | 'post'>('user');
  const { token, isAuthenticated } = useAuthData();

  const handleOpenReport = (type: 'user' | 'post') => {
    if (!isAuthenticated) {
      toast.error("Please login to report");
      return;
    }
    setReportType(type);
    setIsReportModalOpen(true);
  };

  const { addReportedUser, addReportedReview } = useReportedContentStore();

  const handleReport = async (reason: string) => {
    if (!token) return;

    let result;
    if (reportType === 'user') {
      result = await ReportService.reportUser(token, username, reason);
    } else {
      if (!permlink) return;
      result = await ReportService.reportReview(token, username, permlink, reason);
    }

    if (result.valid) {
      
      // Update store immediately – components will re-filter and hide reported content without reload
      if (reportType === 'user') {
        toast.success("User has been reported");
        addReportedUser(username);
      } else {
        toast.success("Review has been reported");
        if (permlink) {
          addReportedReview({
            _id: 'temp_id_' + Date.now(),
            reporter: 'current_user',
            author: username,
            permlink: permlink,
            reason: reason,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } as any);
        }
      }
    } else {
      toast.error(result.errorMessage || "Failed to submit report");
    }
  };

  const handleBlock = async (type: 'user' | 'post') => {
    if (!isAuthenticated) {
      toast.error("Please login to block");
      return;
    }
    if (!token) return;
    if (type === 'post' && !permlink) return;

    const reason = 'Block';
    let result;
    if (type === 'user') {
      result = await ReportService.reportUser(token, username, reason);
    } else {
      result = await ReportService.reportReview(token, username, permlink!, reason);
    }

    if (result.valid) {
      if (type === 'user') {
        toast.success("User has been blocked");
        addReportedUser(username);
      } else if (permlink) {
        toast.success("Review has been blocked");
        addReportedReview({
          _id: 'temp_id_' + Date.now(),
          reporter: 'current_user',
          author: username,
          permlink,
          reason,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as any);
      }
    } else {
      toast.error(result.errorMessage || "Failed to submit block");
    }
  };

  return (
    <>
      <Menu as="div" className="inline-flex">
        {/* Trigger */}
        <Menu.Button
          className="
            p-3 rounded-full
            text-gray-300
            hover:bg-gray-700
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-gray-500
            active:scale-95
            transition
          "
          aria-label="More options"
        >
          <MoreVertical className="w-5 h-5" />
        </Menu.Button>

        {/* PORTAL fixes clipping */}
        <Portal>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-150"
            enterFrom="opacity-0 scale-95 translate-y-1"
            enterTo="opacity-100 scale-100 translate-y-0"
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Menu.Items
              className="
                fixed
                z-[9999]
                mt-2
                w-56
                rounded-xl
                bg-gray-900
                shadow-2xl
                ring-1 ring-black/40
                focus:outline-none
              "
              anchor="bottom end"
            >
              <div className="py-1">
                {menuOptions.map(({ label, icon: Icon, action }) => {
                  // Skip "Report Content" / "Block Content" if no permlink
                  if ((label === 'Report Content' || label === 'Block Content') && !permlink) {
                    return null;
                  }

                  return (
                    <Menu.Item key={label}>
                      {({ active }) => (
                        <button
                          type="button"
                          onClick={() => {
                            if (action === 'report_author') handleOpenReport('user');
                            else if (action === 'report_content') handleOpenReport('post');
                            else if (action === 'block_author') handleBlock('user');
                            else if (action === 'block_content') handleBlock('post');
                          }}
                          className={`
                            flex w-full items-center gap-3
                            px-4 py-3
                            text-sm text-left
                            transition
                            ${active
                              ? 'bg-gray-800 text-white'
                              : 'text-gray-300'
                            }
                            `}
                        >
                          <Icon className="w-4 h-4 opacity-80" />
                          {label}
                        </button>
                      )}
                    </Menu.Item>
                  );
                })}
              </div>
            </Menu.Items>
          </Transition>
        </Portal>
      </Menu>

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onReport={handleReport}
        reportType={reportType}
        targetUsername={username}
        targetPermlink={permlink}
      />
    </>
  );
}
