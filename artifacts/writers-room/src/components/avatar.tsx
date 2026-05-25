import { useState } from "react";
import { Camera } from "lucide-react";

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_MAP = {
  sm:  { outer: "w-7 h-7",   text: "text-[10px]", img: "w-7 h-7"  },
  md:  { outer: "w-9 h-9",   text: "text-sm",     img: "w-9 h-9"  },
  lg:  { outer: "w-10 h-10", text: "text-sm",     img: "w-10 h-10" },
  xl:  { outer: "w-20 h-20", text: "text-3xl",    img: "w-20 h-20" },
};

function avatarSrc(avatarUrl: string | null | undefined): string | null {
  if (!avatarUrl) return null;
  // Local uploads (/local/...) are served at /api/storage/local/...
  // Legacy Replit object paths (/objects/...) are served at /api/storage/objects/...
  return `/api/storage${avatarUrl}`;
}

export function Avatar({ name, avatarUrl, size = "md", className = "" }: AvatarProps) {
  const s = SIZE_MAP[size];
  const src = avatarSrc(avatarUrl);

  return (
    <div className={`${s.outer} shrink-0 overflow-hidden bg-[#1A1614] flex items-center justify-center ${className}`}>
      {src
        ? <img src={src} alt={name} className={`${s.img} object-cover`} />
        : <span className={`font-bold text-[#F9F6EE] font-serif ${s.text}`}>{name.charAt(0).toUpperCase()}</span>
      }
    </div>
  );
}

interface UploadableAvatarProps {
  userId: number;
  name: string;
  avatarUrl?: string | null;
  onUpload: (objectPath: string) => void;
}

export function UploadableAvatar({ userId, name, avatarUrl, onUpload }: UploadableAvatarProps) {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const src = previewSrc ?? avatarSrc(avatarUrl);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewSrc(URL.createObjectURL(file));
    setIsUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const uploadRes = await fetch("/api/storage/upload", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { objectPath } = await uploadRes.json() as { objectPath: string };
      await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ avatarUrl: objectPath }),
      });
      onUpload(objectPath);
    } catch (err) {
      console.error("[avatar] upload failed:", err);
      setPreviewSrc(null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <label className="relative w-20 h-20 shrink-0 cursor-pointer group">
      <div className="w-20 h-20 bg-[#1A1614] overflow-hidden flex items-center justify-center">
        {src
          ? <img src={src} alt={name} className="w-20 h-20 object-cover" />
          : <span className="text-3xl font-serif font-bold text-[#F9F6EE]">{name.charAt(0).toUpperCase()}</span>
        }
      </div>
      <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${isUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
        {isUploading
          ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          : <Camera className="w-5 h-5 text-white" />
        }
      </div>
      <input type="file" accept="image/*" className="sr-only" onChange={handleFile} disabled={isUploading} />
    </label>
  );
}
