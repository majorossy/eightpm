'use client';

import React from 'react';
import { BandMember } from '@/lib/types';

interface BandMembersTimelineProps {
  members?: BandMember[];
  formerMembers?: BandMember[];
  foundedYear?: number;
}

interface TimelineMember {
  name: string;
  instruments: string[];
  startYear: number;
  endYear: number | null;
  initial: string;
  isCurrent: boolean;
  bio?: string;
}

/**
 * Parse years string like "1998-present" or "1998-2015" to get start/end years
 */
const parseYears = (yearsString: string): { startYear: number; endYear: number | null } => {
  const match = yearsString.match(/(\d{4})/g);
  if (!match || match.length === 0) {
    return { startYear: new Date().getFullYear(), endYear: null };
  }

  const startYear = parseInt(match[0], 10);
  const endYear = yearsString.toLowerCase().includes('present') || match.length === 1
    ? null
    : parseInt(match[1], 10);

  return { startYear, endYear };
};

/**
 * Parse role string to extract instruments (e.g., "Guitar, Keyboards" -> ["Guitar", "Keyboards"])
 */
const parseInstruments = (role: string): string[] => {
  return role.split(/[,&]/).map(s => s.trim()).filter(Boolean);
};

/**
 * Convert BandMember to TimelineMember
 */
const convertToTimelineMember = (member: BandMember, isCurrent: boolean): TimelineMember => {
  const { startYear, endYear } = parseYears(member.years);
  const instruments = parseInstruments(member.role);
  const initial = member.name.charAt(0).toUpperCase();

  return {
    name: member.name,
    instruments,
    startYear,
    endYear,
    initial,
    isCurrent,
    bio: member.bio,
  };
};

const TimelineMember = ({ member }: { member: TimelineMember }) => {
  const currentYear = new Date().getFullYear();
  const yearsActive = (member.endYear || currentYear) - member.startYear;

  return (
    <div className={`flex items-start gap-4 pl-4 ${!member.isCurrent ? 'opacity-60' : ''}`}>
      {/* Avatar node */}
      <div
        className={`
          w-8 h-8 rounded-full flex items-center justify-center font-bold z-10 shadow-lg flex-shrink-0
          ${member.isCurrent
            ? 'bg-gradient-to-br from-accent to-[#a07030] text-white'
            : 'bg-gradient-to-br from-[#5a5550] to-[#3a3530] text-white'
          }
        `}
      >
        {member.initial}
      </div>

      {/* Info card */}
      <div
        className={`
          flex-1 p-4 rounded-lg border-l-2
          ${member.isCurrent
            ? 'bg-gradient-to-r from-[#2a2520] to-transparent border-accent'
            : 'bg-gradient-to-r from-[#252320] to-transparent border-[#5a5550]'
          }
        `}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`font-bold ${member.isCurrent ? 'text-white' : 'text-secondary'}`}>
              {member.name}
            </h3>
            <p className={`text-sm ${member.isCurrent ? 'text-accent' : 'text-[#6a6560]'}`}>
              {member.instruments.join(' • ')}
            </p>
          </div>
          <div className="text-right">
            <div className={`text-xs font-semibold ${member.isCurrent ? 'text-[#4ade80]' : 'text-secondary'}`}>
              {member.isCurrent ? '● Active' : '○ Alumni'}
            </div>
            <div className={`text-xs ${member.isCurrent ? 'text-secondary' : 'text-[#6a6560]'}`}>
              {yearsActive} years
            </div>
          </div>
        </div>

        {/* Progress bar - removed as it was calculating based on total band years */}
      </div>
    </div>
  );
};

const TimelineMarker = ({ year, label, isHighlight = false }: { year: number; label: string; isHighlight?: boolean }) => (
  <div className="flex items-center gap-4 pl-4">
    <div
      className={`
        w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs z-10 shadow-lg
        ${isHighlight
          ? 'bg-accent text-white'
          : 'bg-border text-white border border-accent/30'
        }
      `}
    >
      '{String(year).slice(-2)}
    </div>
    <span className={`text-sm ${isHighlight ? 'text-white font-bold' : 'text-secondary'}`}>
      {label}
    </span>
  </div>
);

export default function BandMembersTimeline({
  members,
  formerMembers,
  foundedYear
}: BandMembersTimelineProps) {
  // Return null if no data to display
  if (!members?.length && !formerMembers?.length) {
    return null;
  }

  // Convert BandMembers to TimelineMembers
  const currentTimelineMembers = (members || []).map(m => convertToTimelineMember(m, true));
  const formerTimelineMembers = (formerMembers || []).map(m => convertToTimelineMember(m, false));

  // Sort members: current first (by start year), then former (by start year)
  const sortedCurrent = currentTimelineMembers.sort((a, b) => a.startYear - b.startYear);
  const sortedFormer = formerTimelineMembers.sort((a, b) => a.startYear - b.startYear);

  // Determine founded year from data if not provided
  const allMembers = [...sortedCurrent, ...sortedFormer];
  const calculatedFoundedYear = foundedYear || Math.min(...allMembers.map(m => m.startYear));

  // Find lineup change years (when members left and joined)
  const lineupChanges = new Map<number, string[]>();
  sortedFormer.forEach(member => {
    if (member.endYear) {
      const changes = lineupChanges.get(member.endYear) || [];
      changes.push(`${member.name} left`);
      lineupChanges.set(member.endYear, changes);
    }
  });
  sortedCurrent.forEach(member => {
    if (member.startYear > calculatedFoundedYear) {
      const changes = lineupChanges.get(member.startYear) || [];
      changes.push(`${member.name} joined`);
      lineupChanges.set(member.startYear, changes);
    }
  });

  // Get unique lineup change years sorted
  const changeYears = Array.from(lineupChanges.keys()).sort((a, b) => a - b);

  return (
    <section className="px-4 md:px-8 py-8">
      <h2 className="text-xl md:text-2xl font-bold text-white mb-8">Band Members</h2>

      <div className="relative max-w-2xl">
        {/* Timeline vertical line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-accent via-accent/50 to-border" />

        <div className="space-y-6">
          {/* Band founded marker */}
          <TimelineMarker year={calculatedFoundedYear} label="Band Founded" isHighlight />

          {/* Original members (founded year) */}
          {sortedCurrent
            .filter(m => m.startYear === calculatedFoundedYear)
            .map((member, idx) => (
              <TimelineMember key={`original-${idx}`} member={member} />
            ))
          }

          {/* Timeline events in chronological order */}
          {changeYears.map(year => {
            const changes = lineupChanges.get(year) || [];
            const leftMembers = sortedFormer.filter(m => m.endYear === year);
            const joinedMembers = sortedCurrent.filter(m => m.startYear === year && year > calculatedFoundedYear);

            return (
              <React.Fragment key={year}>
                {/* Show members who left */}
                {leftMembers.map((member, idx) => (
                  <TimelineMember key={`left-${year}-${idx}`} member={member} />
                ))}

                {/* Show lineup change marker */}
                <TimelineMarker
                  year={year}
                  label={changes.length > 1 ? 'Lineup Changes' : 'Lineup Change'}
                />

                {/* Show members who joined */}
                {joinedMembers.map((member, idx) => (
                  <TimelineMember key={`joined-${year}-${idx}`} member={member} />
                ))}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
}
