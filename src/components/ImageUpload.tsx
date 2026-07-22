"use client";
// Sélecteur d'image locale : compression côté client (canvas) puis stockage sur
// Firebase Storage ; si Storage n'est pas configuré / autorisé, repli immédiat
// sur une data-URL compressée (stockée telle quelle). Fonctionne donc dans
// tous les cas, sans configuration supplémentaire.
import { useRef, useState } from "react";
import { storage } from "@/lib/firebase";
import { ref as sRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { Upload, Image as ImageIcon, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

async function compress(file: File, maxDim = 1000, quality = 0.8): Promise<{ blob: Blob; dataUrl: string }> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error("lecture image impossible"));
    i.src = URL.createObjectURL(file);
  });
  let { width, height } = img;
  if (width > maxDim || height > maxDim) {
    if (width > height) {
      height = Math.round((height * maxDim) / width);
      width = maxDim;
    } else {
      width = Math.round((width * maxDim) / height);
      height = maxDim;
    }
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas indisponible");
  ctx.drawImage(img, 0, 0, width, height);
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  const blob = await new Promise<Blob>((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("compression impossible"))), "image/jpeg", quality)
  );
  return { blob, dataUrl };
}

export default function ImageUpload({
  value,
  onChange,
  label,
  pathPrefix,
  theme = "light",
}: {
  value?: string;
  onChange: (url: string) => void;
  label: string;
  pathPrefix: string;
  theme?: "light" | "dark";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const onFile = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez choisir une image");
      return;
    }
    setBusy(true);
    setProgress(10);
    try {
      const { blob, dataUrl } = await compress(file);
      setProgress(45);
      let url = dataUrl;
      try {
        if (storage) {
          const name = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
          const r = sRef(storage, `${pathPrefix}/${name}`);
          await uploadBytes(r, blob);
          setProgress(80);
          url = await getDownloadURL(r);
        }
      } catch {
        // Storage indisponible ou règles bloquantes → on conserve la data-URL compressée.
        url = dataUrl;
      }
      setProgress(100);
      onChange(url);
      toast.success("Image ajoutée");
    } catch (e: any) {
      toast.error(e?.message || "Erreur lors de l'ajout de l'image");
    } finally {
      setBusy(false);
      setTimeout(() => setProgress(0), 700);
    }
  };

  const t =
    theme === "dark"
      ? { zone: "border-slate-600 bg-slate-700/40 hover:border-blue-400 text-slate-200", sub: "text-slate-400", ring: "border-slate-600" }
      : { zone: "border-slate-300 bg-slate-50 hover:border-[#06b6a4] text-slate-600", sub: "text-slate-400", ring: "border-slate-300" };

  return (
    <div>
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative flex-shrink-0">
            <img src={value} alt="" className={`w-20 h-20 rounded-xl object-cover border ${t.ring}`} />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
              title="Retirer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className={`w-20 h-20 rounded-xl border-2 border-dashed flex items-center justify-center flex-shrink-0 ${t.zone}`}>
            <ImageIcon className="w-6 h-6 opacity-50" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed transition-colors ${t.zone} disabled:opacity-60`}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span className="text-sm font-medium truncate">{busy ? `Téléversement… ${progress}%` : label}</span>
          </button>
          <p className={`text-[11px] mt-1 ${t.sub}`}>
            Fichier local · compressé automatiquement · {value ? "modifiable" : "JPG / PNG"}
          </p>
          {busy && (
            <div className="mt-1.5 h-1 rounded-full bg-slate-200/40 overflow-hidden">
              <div className="h-full bg-[#06b6a4] transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
