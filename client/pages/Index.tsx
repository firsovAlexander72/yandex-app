import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Images, Upload } from "lucide-react";

type LocalFile = { id: string; file: File; preview: string };

export default function Index() {
  const [parkName, setParkName] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [projectName, setProjectName] = useState("Яндекс Маркет");
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [comment, setComment] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [deliveredBy, setDeliveredBy] = useState("Водитель");
  const [oldWrapRemoved, setOldWrapRemoved] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const wa = (window as any)?.Telegram?.WebApp;
    wa?.ready?.();
    const initData = wa?.initData as string | undefined;
    if (initData) {
      fetch("/api/telegram/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData }),
      }).catch(() => {});
    }
  }, []);

  const phoneOk =
    /^((\+7|8)\s?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}|\+?\d{10,15})$/.test(
      driverPhone.trim(),
    );
  const canSubmit = useMemo(() => {
    return (
      parkName.trim() &&
      carNumber.trim() &&
      phoneOk &&
      files.length >= 5 &&
      files.length <= 12 &&
      !loading
    );
  }, [parkName, carNumber, driverPhone, files.length, loading, phoneOk]);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []).slice(
      0,
      12 - files.length,
    );
    const next: LocalFile[] = selected.map((f) => ({
      id: `${f.name}-${f.size}-${f.lastModified}-${Math.random()}`,
      file: f,
      preview: URL.createObjectURL(f),
    }));
    setFiles((cur) => [...cur, ...next]);
    // reset input so selecting the same file names again still fires change
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(id: string) {
    setFiles((cur) => cur.filter((f) => f.id !== id));
  }

  async function onSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("parkName", parkName.trim());
      fd.append("carNumber", carNumber.trim());
      fd.append("projectName", projectName.trim());
      fd.append("comment", comment.trim());
      fd.append("driverPhone", driverPhone.trim());
      fd.append("deliveredBy", deliveredBy.trim());
      fd.append("oldWrapRemoved", String(oldWrapRemoved));
      files.forEach((lf) => fd.append("photos", lf.file, lf.file.name));

      const res = await fetch("/api/report", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");

      alert(`Отчёт отправлен. Папка: ${data.folder}. Файлов: ${data.count}`);
      setFiles([]);
    } catch (e: any) {
      alert(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Фотоотчёт такси</h1>
        <p className="text-sm text-muted-foreground">
          Загрузите 5–12 фото оклеенного автомобиля. Отчёт отправится на
          Яндекс.Диск в отдельную папку с названием парка и номером авто.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border p-4 bg-card sm:col-span-2">
          <label className="text-sm text-muted-foreground" htmlFor="project">
            Проект
          </label>
          <select
            id="project"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="mt-1 w-full rounded-xl border bg-background px-3 py-2"
          >
            <option>Яндекс Маркет</option>
            <option>Яндекс Лавка</option>
            <option>Яндекс ГО</option>
          </select>
        </div>
        <div className="rounded-2xl border p-4 bg-card">
          <label className="text-sm text-muted-foreground" htmlFor="park">
            Парк
          </label>
          <input
            id="park"
            value={parkName}
            onChange={(e) => setParkName(e.target.value)}
            placeholder="Например: СитиПарк"
            className="mt-1 w-full rounded-xl border bg-background px-3 py-2"
          />
        </div>
        <div className="rounded-2xl border p-4 bg-card">
          <label className="text-sm text-muted-foreground" htmlFor="car">
            Номер авто
          </label>
          <input
            id="car"
            value={carNumber}
            onChange={(e) => setCarNumber(e.target.value)}
            placeholder="А123ВС77"
            className="mt-1 w-full rounded-xl border bg-background px-3 py-2"
          />
        </div>
        <div className="rounded-2xl border p-4 bg-card">
          <label className="text-sm text-muted-foreground" htmlFor="phone">
            Телефон водителя
          </label>
          <input
            id="phone"
            value={driverPhone}
            onChange={(e) => setDriverPhone(e.target.value)}
            placeholder="+7 (999) 123-45-67"
            className="mt-1 w-full rounded-xl border bg-background px-3 py-2"
          />
        </div>
        <div className="rounded-2xl border p-4 bg-card">
          <label
            className="text-sm text-muted-foreground"
            htmlFor="deliveredBy"
          >
            Кто пригнал авто
          </label>
          <select
            id="deliveredBy"
            value={deliveredBy}
            onChange={(e) => setDeliveredBy(e.target.value)}
            className="mt-1 w-full rounded-xl border bg-background px-3 py-2"
          >
            <option>Водитель</option>
            <option>Механик</option>
          </select>
        </div>
        <div className="rounded-2xl border p-4 bg-card sm:col-span-2">
          <label
            className="inline-flex items-center gap-3 text-sm text-muted-foreground"
            htmlFor="oldWrap"
          >
            <input
              id="oldWrap"
              type="checkbox"
              checked={oldWrapRemoved}
              onChange={(e) => setOldWrapRemoved(e.target.checked)}
              className="size-4 accent-current"
            />
            Был ли демонтаж старой плёнки
          </label>
        </div>
        <div className="rounded-2xl border p-4 bg-card sm:col-span-2">
          <label className="text-sm text-muted-foreground" htmlFor="comment">
            Дополнительный комментарий
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Например: замечания, комплектация, особенности работ"
            rows={3}
            className="mt-1 w-full rounded-xl border bg-background px-3 py-2"
          />
        </div>
      </section>

      <section className="rounded-2xl border p-4 bg-card">
        <div className="flex items-center justify-between">
          <div className="font-medium">Фотографии</div>
          <div className="text-sm text-muted-foreground">{files.length}/12</div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {files.map((f) => (
            <div
              key={f.id}
              className="relative group aspect-square overflow-hidden rounded-xl border"
            >
              <img
                src={f.preview}
                alt="preview"
                className="h-full w-full object-cover"
              />
              <button
                onClick={() => remove(f.id)}
                className="absolute right-1 top-1 rounded-full bg-black/60 text-white px-2 py-0.5 text-xs opacity-0 group-hover:opacity-100"
              >
                Удалить
              </button>
            </div>
          ))}
          {files.length < 12 && (
            <label className="aspect-square rounded-xl border border-dashed flex flex-col items-center justify-center gap-2 text-muted-foreground cursor-pointer hover:bg-accent">
              <input
                ref={inputRef}
                onChange={onPick}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
              />
              <Images className="size-6" />
              <span className="text-xs">Добавить</span>
            </label>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Минимум 5, максимум 12 фото.
        </p>
      </section>

      <div className="h-2" />

      <button
        disabled={!canSubmit}
        onClick={onSubmit}
        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground py-3 disabled:opacity-50"
      >
        <Upload className="size-5" />{" "}
        {loading ? "Отправка..." : "Отправить отчёт"}
      </button>
    </div>
  );
}
