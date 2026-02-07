'use client';

import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface ProfileMenuProps {
  onSignInClick: () => void;
}

export default function ProfileMenu({ onSignInClick }: ProfileMenuProps) {
  const { user, profile, isAuthenticated, isLoading, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-8 h-8 rounded-full bg-[#2d2a26] animate-pulse" />
    );
  }

  // Not authenticated - show sign in button
  if (!isAuthenticated) {
    return (
      <button
        onClick={onSignInClick}
        className="flex items-center gap-2 px-4 py-2 text-sm text-[#e8e0d4] bg-[#2d2a26] hover:bg-[#3a3632] border border-[#3a3632] rounded-full transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        Sign In
      </button>
    );
  }

  // Authenticated - show profile menu
  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url;
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <DropdownMenu.Root>
      {/* Profile button */}
      <DropdownMenu.Trigger asChild>
        <button
          className="flex items-center gap-2 p-1 rounded-full hover:bg-[#2d2a26] transition-colors"
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName || 'Profile'}
              width={32}
              height={32}
              quality={80}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#d4a060] flex items-center justify-center text-[#1c1a17] text-sm font-medium">
              {initials}
            </div>
          )}
          <svg
            className="w-4 h-4 text-[#8a8478]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </DropdownMenu.Trigger>

      {/* Dropdown menu */}
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="w-56 bg-[#2d2a26] border border-[#3a3632] rounded-lg shadow-xl overflow-hidden z-50 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          align="end"
          sideOffset={8}
        >
          {/* User info */}
          <DropdownMenu.Label className="px-4 py-3 border-b border-[#3a3632]">
            <p className="text-sm font-medium text-[#e8e0d4] truncate">{displayName}</p>
            <p className="text-xs text-[#8a8478] truncate">{user?.email}</p>
          </DropdownMenu.Label>

          {/* Menu items */}
          <DropdownMenu.Group className="py-1">
            <DropdownMenu.Item asChild>
              <Link
                href="/account"
                className="flex items-center gap-3 px-4 py-2 text-sm text-[#e8e0d4] hover:bg-[#3a3632] transition-colors outline-none data-[highlighted]:bg-[#3a3632]"
              >
                <svg className="w-4 h-4 text-[#8a8478]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </Link>
            </DropdownMenu.Item>

            <DropdownMenu.Item asChild>
              <Link
                href="/library"
                className="flex items-center gap-3 px-4 py-2 text-sm text-[#e8e0d4] hover:bg-[#3a3632] transition-colors outline-none data-[highlighted]:bg-[#3a3632]"
              >
                <svg className="w-4 h-4 text-[#8a8478]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z" />
                </svg>
                Your Library
              </Link>
            </DropdownMenu.Item>

            <DropdownMenu.Item asChild>
              <Link
                href="/playlists"
                className="flex items-center gap-3 px-4 py-2 text-sm text-[#e8e0d4] hover:bg-[#3a3632] transition-colors outline-none data-[highlighted]:bg-[#3a3632]"
              >
                <svg className="w-4 h-4 text-[#8a8478]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Playlists
              </Link>
            </DropdownMenu.Item>
          </DropdownMenu.Group>

          <DropdownMenu.Separator className="border-t border-[#3a3632] my-1" />

          <DropdownMenu.Group className="py-1">
            <DropdownMenu.Item asChild>
              <Link
                href="/account/settings"
                className="flex items-center gap-3 px-4 py-2 text-sm text-[#e8e0d4] hover:bg-[#3a3632] transition-colors outline-none data-[highlighted]:bg-[#3a3632]"
              >
                <svg className="w-4 h-4 text-[#8a8478]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </Link>
            </DropdownMenu.Item>

            <DropdownMenu.Item
              onSelect={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#e8e0d4] hover:bg-[#3a3632] transition-colors outline-none cursor-pointer data-[highlighted]:bg-[#3a3632]"
            >
              <svg className="w-4 h-4 text-[#8a8478]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </DropdownMenu.Item>
          </DropdownMenu.Group>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
