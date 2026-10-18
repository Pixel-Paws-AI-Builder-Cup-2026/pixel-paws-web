"use client";
import { useEffect, useState } from "react";
import { CameraIcon } from "./Icons";

export default function PhotoPicker({ file, onChange, label = "Tap to snap or upload a photo", capture = true, height = 168 }) {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <label className="photo-picker" style={{ height }}>
      <input
        type="file"
        accept="image/*"
        {...(capture ? { capture: "environment" } : {})}
        className="visually-hidden"
        onChange={(e) => onChange(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
      />
      {preview ? (
        <>
          <img src={preview} alt="Selected photo" className="photo-preview" />
          <span className="photo-change">Change photo</span>
        </>
      ) : (
        <>
          <span className="icon-circle icon-circle-lg">
            <CameraIcon size={26} />
          </span>
          <span className="strong">{label}</span>
          <span className="muted small">Camera or gallery</span>
        </>
      )}
    </label>
  );
}
