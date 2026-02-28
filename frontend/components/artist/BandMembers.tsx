'use client';

import Image from 'next/image';
import { BandMember } from '@/lib/types';

interface BandMembersProps {
  members?: BandMember[];
  formerMembers?: BandMember[];
}

export default function BandMembers({ members, formerMembers }: BandMembersProps) {
  // Return null if no data to display
  if (!members?.length && !formerMembers?.length) {
    return null;
  }

  return (
    <section className="px-4 md:px-8 pb-8">
      <h2 className="text-xl md:text-2xl font-bold text-white mb-6">Band Members</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Members */}
        {members && members.length > 0 && (
          <div>
            <h3 className="text-base md:text-lg font-bold text-white mb-4">Current</h3>
            <div className="space-y-3">
              {members.map((member, index) => (
                <div
                  key={index}
                  className="bg-surface-elevated rounded-lg p-4 hover:bg-border transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Member photo or initial */}
                    {member.image ? (
                      <Image
                        src={member.image}
                        alt={member.name || 'Band member'}
                        width={48}
                        height={48}
                        quality={80}
                        className="rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                        <span className="text-black font-bold text-lg">
                          {member.name.charAt(0)}
                        </span>
                      </div>
                    )}

                    {/* Member info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-bold text-base truncate">
                        {member.name}
                      </h4>
                      <p className="text-secondary text-sm mt-1">
                        {member.role}
                      </p>
                      <p className="text-accent text-xs mt-1">
                        {member.years}
                      </p>
                      {member.bio && (
                        <p className="text-secondary text-xs mt-2 line-clamp-2">
                          {member.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Former Members */}
        {formerMembers && formerMembers.length > 0 && (
          <div>
            <h3 className="text-base md:text-lg font-bold text-white mb-4">Former</h3>
            <div className="space-y-3">
              {formerMembers.map((member, index) => (
                <div
                  key={index}
                  className="bg-surface-elevated rounded-lg p-4 hover:bg-border transition-colors opacity-75"
                >
                  <div className="flex items-start gap-4">
                    {/* Member photo or initial */}
                    {member.image ? (
                      <Image
                        src={member.image}
                        alt={member.name || 'Former band member'}
                        width={48}
                        height={48}
                        quality={80}
                        className="rounded-full object-cover flex-shrink-0 grayscale"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-border flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-lg">
                          {member.name.charAt(0)}
                        </span>
                      </div>
                    )}

                    {/* Member info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-bold text-base truncate">
                        {member.name}
                      </h4>
                      <p className="text-secondary text-sm mt-1">
                        {member.role}
                      </p>
                      <p className="text-secondary text-xs mt-1">
                        {member.years}
                      </p>
                      {member.bio && (
                        <p className="text-secondary text-xs mt-2 line-clamp-2">
                          {member.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
