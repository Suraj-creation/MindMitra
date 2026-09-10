import React, { useState } from "react";

interface Props {
  imageUrl?: string;
  caption?: string;
  altText?: string;
  provenanceBadge?: string;
  sensoryBadges?: Array<{ icon: string; label: string }>;
}

export const ImagePresentation: React.FC<Props> = ({
  imageUrl,
  caption,
  altText,
  provenanceBadge = "Caregiver Verified",
  sensoryBadges,
}) => {
  const [isZoomed, setIsZoomed] = useState<boolean>(false);

  return (
    <div className="space-y-3 w-full">
      <div className="relative rounded-3xl overflow-hidden border-2 border-[#dfd4c0] bg-[#faf6f0] shadow-sm group">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={altText || caption || "Cognitive experience memory"}
            className="w-full h-64 sm:h-80 object-cover object-center cursor-pointer transition duration-300 group-hover:scale-[1.01]"
            onClick={() => setIsZoomed(true)}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-64 sm:h-80 flex flex-col items-center justify-center bg-[#f5ede0] text-[#736a5e] p-6 text-center">
            <span className="text-4xl mb-2">🌿</span>
            <span className="font-serif text-base">Gentle Sensory Contemplation</span>
            <p className="text-xs text-[#8c8273] mt-1 max-w-sm">
              Visualize this cherished place in your mind’s warm memory.
            </p>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {provenanceBadge && (
            <span className="bg-white/90 backdrop-blur-md border border-[#dfd4c0] text-[#2c401e] px-2.5 py-1 rounded-full text-[11px] font-semibold shadow-sm flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#485935]"></span>
              {provenanceBadge}
            </span>
          )}
          {imageUrl && (
            <button
              type="button"
              onClick={() => setIsZoomed(true)}
              className="pointer-events-auto bg-black/40 hover:bg-black/60 text-white p-1.5 rounded-full backdrop-blur-sm text-xs transition"
              title="Tap to view larger photo"
            >
              🔍
            </button>
          )}
        </div>

        {/* Caption */}
        {caption && (
          <div className="p-3 bg-white border-t border-[#dfd4c0] flex items-center justify-between text-xs text-[#595043]">
            <span className="font-serif font-medium">{caption}</span>
            <span className="text-[10px] text-[#8c8273]">Tezpur, Assam</span>
          </div>
        )}
      </div>

      {/* Sensory Anchors Badges */}
      {sensoryBadges && sensoryBadges.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {sensoryBadges.map((badge, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#dfd4c0] text-xs text-[#41382c] shadow-xs"
            >
              <span>{badge.icon}</span>
              <span>{badge.label}</span>
            </span>
          ))}
        </div>
      )}

      {/* Modal Zoom for Elders */}
      {isZoomed && imageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <div className="relative max-w-3xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border-4 border-[#faf6f0]">
            <img
              src={imageUrl}
              alt={caption}
              className="w-full max-h-[80vh] object-contain bg-black"
              referrerPolicy="no-referrer"
            />
            <div className="p-4 bg-white flex justify-between items-center border-t border-[#dfd4c0]">
              <span className="font-serif text-sm font-medium text-[#2c2824]">{caption}</span>
              <button
                type="button"
                onClick={() => setIsZoomed(false)}
                className="px-4 py-2 bg-[#485935] text-white rounded-xl text-xs font-semibold hover:bg-[#39472a]"
              >
                ✕ Close Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
