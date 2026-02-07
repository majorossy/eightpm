'use client';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  {
    category: 'Playback',
    items: [
      { keys: ['Space'], description: 'Play/Pause' },
      { keys: ['N', 'Right Arrow'], description: 'Next track' },
      { keys: ['P', 'Left Arrow'], description: 'Previous track' },
    ],
  },
  {
    category: 'Volume',
    items: [
      { keys: ['Up Arrow'], description: 'Volume up (+10%)' },
      { keys: ['Down Arrow'], description: 'Volume down (-10%)' },
    ],
  },
  {
    category: 'Playlist',
    items: [
      { keys: ['R'], description: 'Cycle repeat (off → all → one)' },
      { keys: ['L'], description: 'Like/unlike current song' },
    ],
  },
  {
    category: 'Navigation',
    items: [
      { keys: ['Q'], description: 'Toggle queue drawer' },
      { keys: ['K', 'Cmd+K', 'Ctrl+K'], description: 'Open search' },
      { keys: ['Escape'], description: 'Close modals/queue' },
    ],
  },
  {
    category: 'Help',
    items: [
      { keys: ['?'], description: 'Show this help' },
    ],
  },
];

export default function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 z-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-[#252220] rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-[#252220] border-b border-white/10 px-6 py-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Keyboard Shortcuts</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-8">
            {shortcuts.map((section) => (
              <div key={section.category}>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                  {section.category}
                </h3>
                <div className="space-y-3">
                  {section.items.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-white/5 transition-colors"
                    >
                      <span className="text-white">{shortcut.description}</span>
                      <div className="flex items-center gap-2">
                        {shortcut.keys.map((key, keyIndex) => (
                          <span key={keyIndex} className="flex items-center gap-1">
                            {keyIndex > 0 && (
                              <span className="text-gray-500 text-sm">or</span>
                            )}
                            <kbd className="px-3 py-1.5 bg-[#2d2a26] text-gray-300 rounded-md border border-white/10 text-sm font-mono shadow-sm">
                              {key}
                            </kbd>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-[#252220] border-t border-white/10 px-6 py-4">
            <p className="text-sm text-gray-400 text-center">
              Press <kbd className="px-2 py-1 bg-[#2d2a26] text-gray-300 rounded border border-white/10 text-xs font-mono">?</kbd> anytime to show this help
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
