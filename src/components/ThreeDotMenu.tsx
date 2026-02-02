import { Menu, Transition, Portal } from '@headlessui/react';
import { MoreVertical, ShieldAlert, UserX, Flag, FileX } from 'lucide-react';
import { Fragment } from 'react';

const menuOptions = [
  { label: 'Report Author', icon: Flag },
  { label: 'Block Author', icon: UserX },
  { label: 'Block Content', icon: FileX },
  { label: 'Report Content', icon: ShieldAlert },
];

export function ThreeDotMenu() {
  return (
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
              {menuOptions.map(({ label, icon: Icon }) => (
                <Menu.Item key={label}>
                  {({ active }) => (
                    <button
                      type="button"
                      onClick={() => alert(`${label} clicked`)}
                      className={`
                        flex w-full items-center gap-3
                        px-4 py-3
                        text-sm text-left
                        transition
                        ${
                          active
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
              ))}
            </div>
          </Menu.Items>
        </Transition>
      </Portal>
    </Menu>
  );
}
