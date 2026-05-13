import { useState } from "react";
import { Camera } from "lucide-react";
import { useUpload } from "@workspace/object-storage-web";

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

export function Avatar({ name, avatarUrl, size = "md", className = "" }: AvatarProps) {
  const s = SIZE_MAP[size];
  const src = avatarUrl ? `/api/storage${avatarUrl}` : null;

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
  const src = previewSrc ?? (avatarUrl ? `/api/storage${avatarUrl}` : null);

  const { uploadFile, isUploading } = useUpload({
    onSuccess: async (response) => {
      await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: response.objectPath }),
      });
      onUpload(response.objectPath);
    },
  });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setPreviewSrc(preview);
    await uploadFile(file);
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
