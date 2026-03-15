import React, { useCallback, useRef, useState } from "react";

interface Props {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  preview: string | null;
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX_SIZE_MB = 10;

export default function ImageUploader({ onFileSelect, disabled, preview }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const validate = (file: File): string | null => {
    if (!ACCEPTED.includes(file.type)) return "Please upload a JPEG, PNG, or WebP image.";
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return `Image must be under ${MAX_SIZE_MB} MB.`;
    return null;
  };

  const handleFile = useCallback(
    (file: File) => {
      const err = validate(file);
      if (err) {
        setFileError(err);
        return;
      }
      setFileError(null);
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile, disabled]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  return (
    <div style={{ width: "100%" }}>
      <div
        onDragEnter={() => !disabled && setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? "var(--amber)" : "var(--border)"}`,
          borderRadius: "var(--radius-lg)",
          background: dragging ? "var(--amber-pale)" : preview ? "transparent" : "var(--cream-dark)",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "all 0.2s ease",
          overflow: "hidden",
          position: "relative",
          minHeight: preview ? "auto" : "240px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {preview ? (
          <div style={{ position: "relative", width: "100%" }}>
            <img
              src={preview}
              alt="Food preview"
              style={{
                width: "100%",
                maxHeight: "400px",
                objectFit: "cover",
                display: "block",
                borderRadius: "calc(var(--radius-lg) - 2px)",
              }}
            />
            {!disabled && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(26,22,18,0)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "calc(var(--radius-lg) - 2px)",
                  transition: "background 0.2s",
                }}
                className="img-overlay"
              >
                <span
                  style={{
                    background: "rgba(26,22,18,0.75)",
                    color: "#fff",
                    borderRadius: "40px",
                    padding: "8px 18px",
                    fontSize: "13px",
                    fontWeight: 500,
                    letterSpacing: "0.03em",
                    opacity: 0,
                    transition: "opacity 0.2s",
                  }}
                  className="img-overlay-label"
                >
                  Replace image
                </span>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
              padding: "48px 24px",
              textAlign: "center",
            }}
          >
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="14" fill="var(--amber-pale)" />
              <path d="M24 16v10M19 21l5-5 5 5" stroke="var(--amber)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 32c0-2.2 1.8-4 4-4h12c2.2 0 4 1.8 4 4v2H14v-2z" fill="var(--amber)" opacity="0.25" />
              <circle cx="30" cy="22" r="3" fill="var(--amber)" opacity="0.5" />
            </svg>
            <div>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "17px", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>
                Drop your food photo here
              </p>
              <p style={{ fontSize: "13px", color: "var(--ink-muted)", lineHeight: 1.5 }}>
                or <span style={{ color: "var(--amber)", fontWeight: 500 }}>click to browse</span>
                <br />
                JPEG, PNG, WebP · up to 10 MB
              </p>
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          onChange={handleChange}
          style={{ display: "none" }}
          disabled={disabled}
        />
      </div>

      {fileError && (
        <p style={{ marginTop: "8px", fontSize: "13px", color: "var(--red)", fontWeight: 500 }}>
          ⚠ {fileError}
        </p>
      )}

      <style>{`
        .img-overlay:hover {
          background: rgba(26,22,18,0.35) !important;
        }
        .img-overlay:hover .img-overlay-label {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}
