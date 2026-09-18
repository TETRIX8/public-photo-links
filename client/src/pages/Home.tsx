import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import {
  Check,
  Clipboard,
  CloudUpload,
  ExternalLink,
  ImagePlus,
  Link2,
  LoaderCircle,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

type UploadedPhoto = {
  url: string;
  name: string;
  createdAt: string;
};

const HISTORY_KEY = "public-photo-links-history";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function readHistory(): UploadedPhoto[] {
  try {
    const value = window.localStorage.getItem(HISTORY_KEY);
    return value ? (JSON.parse(value) as UploadedPhoto[]) : [];
  } catch {
    return [];
  }
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploaded, setUploaded] = useState<UploadedPhoto | null>(null);
  const [history, setHistory] = useState<UploadedPhoto[]>(readHistory);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const chooseFile = (nextFile?: File) => {
    if (!nextFile) return;
    if (!nextFile.type.startsWith("image/")) {
      toast.error("Нужен файл изображения", {
        description: "Выбери JPG, PNG, WEBP, GIF или другой формат фото.",
      });
      return;
    }
    if (nextFile.size > MAX_FILE_SIZE) {
      toast.error("Файл слишком большой", {
        description: "Максимальный размер фотографии — 10 МБ.",
      });
      return;
    }

    if (preview) URL.revokeObjectURL(preview);
    setFile(nextFile);
    setPreview(URL.createObjectURL(nextFile));
    setUploaded(null);
    setCopied(false);
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    chooseFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    chooseFile(event.dataTransfer.files?.[0]);
  };

  const clearSelection = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setUploaded(null);
    setCopied(false);
  };

  const saveToHistory = (photo: UploadedPhoto) => {
    const next = [photo, ...history.filter((item) => item.url !== photo.url)].slice(0, 8);
    setHistory(next);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  };

  const uploadPhoto = async () => {
    if (!file) return;
    setIsUploading(true);
    setCopied(false);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "content-type": file.type || "application/octet-stream",
          "x-file-name": encodeURIComponent(file.name),
        },
        body: file,
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.error || "Не удалось загрузить фото");

      const photo = {
        url: data.url,
        name: file.name,
        createdAt: new Date().toISOString(),
      };
      setUploaded(photo);
      saveToHistory(photo);
      toast.success("Фото опубликовано", {
        description: "Ссылка уже готова для отправки.",
      });
    } catch (error) {
      toast.error("Не удалось загрузить фото", {
        description: error instanceof Error ? error.message : "Попробуй ещё раз.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Ссылка скопирована");
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("Не получилось скопировать", {
        description: "Выдели ссылку вручную и скопируй её.",
      });
    }
  };

  const shareLink = async (url: string) => {
    if (navigator.share) {
      await navigator.share({ title: "Публичная фотография", url });
      return;
    }
    await copyLink(url);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f7fb] text-[#10121a]">
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-0 h-[440px] overflow-hidden bg-[#10121a]">
        <div className="absolute -right-24 -top-36 h-[390px] w-[390px] rounded-full bg-[#d8ff58] blur-[2px]" />
        <div className="absolute -left-28 top-52 h-64 w-64 rounded-full border-[40px] border-white/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.16),transparent_30%),linear-gradient(135deg,transparent_40%,rgba(255,255,255,0.035)_40%,rgba(255,255,255,0.035)_41%,transparent_41%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-5 pb-12 pt-7 sm:px-8 sm:pt-10">
        <header className="mb-10 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#d8ff58] text-[#10121a] shadow-[0_10px_30px_rgba(216,255,88,0.22)]">
              <Link2 className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <p className="font-display text-lg font-extrabold tracking-[-0.04em]">photo.link</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">public storage</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/65 sm:flex">
            <ShieldCheck className="h-3.5 w-3.5 text-[#d8ff58]" />
            Vercel Blob
          </div>
        </header>

        <section className="mb-7 max-w-xl text-white">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#d8ff58] backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Ссылка за секунду
          </div>
          <h1 className="font-display text-[clamp(2.8rem,12vw,5.3rem)] font-black leading-[0.9] tracking-[-0.07em]">
            Фото.
            <br />
            <span className="text-[#d8ff58]">Ссылка.</span>
            <br />
            Готово.
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-6 text-white/65 sm:text-base">
            Загрузи фотографию с телефона и получи публичную ссылку, которую можно отправить кому угодно.
          </p>
        </section>

        <section className="rounded-[28px] bg-white p-3 shadow-[0_26px_70px_rgba(16,18,26,0.15)] sm:p-4">
          {!file ? (
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`group relative flex min-h-[270px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[21px] border-2 border-dashed px-6 py-10 text-center transition duration-200 sm:min-h-[310px] ${
                isDragging ? "scale-[0.99] border-[#10121a] bg-[#f1ffd0]" : "border-[#dfe2e9] bg-[#fafbfc] hover:border-[#9da4b2] hover:bg-[#f7f8fa]"
              }`}
            >
              <div className="mb-5 grid h-[72px] w-[72px] place-items-center rounded-[24px] bg-[#10121a] text-[#d8ff58] shadow-[0_12px_28px_rgba(16,18,26,0.18)] transition duration-200 group-hover:-translate-y-1 group-hover:rotate-3">
                <CloudUpload className="h-8 w-8" />
              </div>
              <p className="font-display text-xl font-extrabold tracking-[-0.04em]">Выбери фото</p>
              <p className="mt-2 text-sm leading-5 text-[#858b98]">Нажми или перетащи файл сюда</p>
              <span className="mt-5 rounded-full bg-[#eef0f4] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#676d7a]">JPG · PNG · WEBP · до 10 МБ</span>
              <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleInput} />
            </div>
          ) : (
            <div className="overflow-hidden rounded-[21px] bg-[#10121a]">
              <div className="relative aspect-[4/3] max-h-[450px] w-full overflow-hidden bg-[#1b1e29]">
                <img src={preview ?? undefined} alt="Предпросмотр выбранного фото" className="h-full w-full object-contain" />
                <button type="button" onClick={clearSelection} className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80" aria-label="Убрать фото">
                  <X className="h-5 w-5" />
                </button>
                <div className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white/85 backdrop-blur">
                  {formatFileSize(file.size)}
                </div>
              </div>
              <div className="p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#d8ff58] text-[#10121a]"><ImagePlus className="h-5 w-5" /></div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{file.name}</p>
                    <p className="mt-0.5 text-xs text-white/45">Готово к публикации</p>
                  </div>
                </div>
                {!uploaded ? (
                  <button type="button" onClick={uploadPhoto} disabled={isUploading} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#d8ff58] font-display text-base font-extrabold text-[#10121a] transition hover:bg-[#e2ff7e] active:scale-[0.98] disabled:cursor-wait disabled:opacity-70">
                    {isUploading ? <><LoaderCircle className="h-5 w-5 animate-spin" /> Загружаю...</> : <><Upload className="h-5 w-5" /> Получить публичную ссылку</>}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 rounded-2xl border border-[#d8ff58]/25 bg-[#d8ff58]/10 px-4 py-3 text-sm font-bold text-[#d8ff58]"><Check className="h-4 w-4" /> Фото опубликовано</div>
                    <div className="flex items-center gap-2 rounded-2xl bg-white/10 p-2 pl-4">
                      <p className="min-w-0 flex-1 truncate text-xs text-white/65">{uploaded.url}</p>
                      <button type="button" onClick={() => copyLink(uploaded.url)} className="flex h-10 shrink-0 items-center gap-2 rounded-xl bg-white px-3 text-xs font-extrabold text-[#10121a] transition hover:bg-[#d8ff58] active:scale-[0.97]">
                        {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                        <span className="hidden sm:inline">{copied ? "Скопировано" : "Копировать"}</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => shareLink(uploaded.url)} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 text-sm font-bold text-white transition hover:bg-white/10 active:scale-[0.98]">Поделиться <ExternalLink className="h-4 w-4" /></button>
                      <button type="button" onClick={clearSelection} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 text-sm font-bold text-white transition hover:bg-white/10 active:scale-[0.98]"><RefreshCcw className="h-4 w-4" /> Новое фото</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        <div className="mt-6 flex items-center gap-2 px-1 text-xs leading-5 text-[#767d8b]">
          <ShieldCheck className="h-4 w-4 shrink-0 text-[#8cae2a]" />
          Фото публичные: любой человек со ссылкой сможет их открыть.
        </div>

        {history.length > 0 && (
          <section className="mt-12">
            <div className="mb-4 flex items-end justify-between">
              <div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a909d]">На этом устройстве</p><h2 className="mt-1 font-display text-2xl font-extrabold tracking-[-0.05em]">Последние ссылки</h2></div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#747b88] shadow-sm">{history.length}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {history.map((item) => (
                <article key={item.url} className="group overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(16,18,26,0.06)]">
                  <a href={item.url} target="_blank" rel="noreferrer" className="block aspect-square overflow-hidden bg-[#edf0f4]"><img src={item.url} alt={item.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /></a>
                  <div className="flex items-center gap-2 p-2.5"><p className="min-w-0 flex-1 truncate text-[11px] font-semibold text-[#676d7a]">{item.name}</p><button type="button" onClick={() => copyLink(item.url)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#f0f2f5] text-[#303541] transition hover:bg-[#d8ff58]" aria-label="Скопировать ссылку"><Clipboard className="h-3.5 w-3.5" /></button></div>
                </article>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-14 flex items-center justify-between border-t border-[#e3e6eb] pt-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#979daa]"><span>photo.link</span><span>Fast · Public · Simple</span></footer>
      </div>
    </main>
  );
}
