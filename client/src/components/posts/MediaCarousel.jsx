import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function MediaCarousel({
  mediaUrls,
  images,
  alt = "Post image",
  altText,
  aspectRatio = "4/5",
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const urls = mediaUrls || images || [];
  const label = altText || alt;

  if (!urls || urls.length === 0) return null;

  if (urls.length === 1) {
    return (
      <div
        style={{
          width: "100%",
          backgroundColor: "var(--muted-surface)",
          position: "relative",
          overflow: "hidden",
          borderRadius: "var(--radius-sm)",
          aspectRatio,
        }}
      >
        <img
          src={urls[0]}
          alt={label}
          loading="lazy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>
    );
  }

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : urls.length - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < urls.length - 1 ? prev + 1 : 0));
  };

  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "var(--muted-surface)",
        position: "relative",
        overflow: "hidden",
        borderRadius: "var(--radius-sm)",
        aspectRatio,
      }}
    >
      <img
        src={urls[currentIndex]}
        alt={`${label} (${currentIndex + 1} of ${urls.length})`}
        loading="lazy"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          transition: "opacity var(--transition-fast)",
        }}
      />

      {/* Navigation arrows */}
      <button
        onClick={handlePrev}
        aria-label="Previous image"
        style={{
          position: "absolute",
          left: "12px",
          top: "50%",
          transform: "translateY(-50%)",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          color: "#FFFFFF",
          width: "32px",
          height: "32px",
          borderRadius: "var(--radius-full)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(4px)",
          transition: "background-color var(--transition-fast)",
        }}
      >
        <ChevronLeft size={20} />
      </button>

      <button
        onClick={handleNext}
        aria-label="Next image"
        style={{
          position: "absolute",
          right: "12px",
          top: "50%",
          transform: "translateY(-50%)",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          color: "#FFFFFF",
          width: "32px",
          height: "32px",
          borderRadius: "var(--radius-full)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(4px)",
          transition: "background-color var(--transition-fast)",
        }}
      >
        <ChevronRight size={20} />
      </button>

      {/* Pagination dots & counter */}
      <div
        style={{
          position: "absolute",
          bottom: "12px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 8px",
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          borderRadius: "var(--radius-full)",
          backdropFilter: "blur(4px)",
        }}
      >
        {urls.map((_, i) => (
          <span
            key={i}
            style={{
              width: i === currentIndex ? "16px" : "6px",
              height: "6px",
              borderRadius: "var(--radius-full)",
              backgroundColor: i === currentIndex ? "#FFFFFF" : "rgba(255, 255, 255, 0.4)",
              transition: "all var(--transition-fast)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
