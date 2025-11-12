import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Folder, FileImage, ChevronRight, ChevronLeft } from "lucide-react";

interface YItem {
  name: string;
  path: string;
  type: "dir" | "file" | string;
  media_type?: string;
  preview?: string;
}

interface ListResponse {
  path: string;
  total: number;
  limit: number;
  offset: number;
  items: YItem[];
}

export default function Payments() {
  const [path, setPath] = useState<string>("disk:/");

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["ydisk", path],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const res = await fetch(
        `/api/report/list?path=${encodeURIComponent(path)}&offset=${pageParam}&limit=50`,
      );
      const json = (await res.json()) as ListResponse;
      if (!res.ok) throw new Error((json as any)?.error || "Failed to list");
      return json;
    },
    getNextPageParam: (last) => {
      const next = last.offset + last.items.length;
      return next < last.total ? next : undefined;
    },
  });

  const allItems = useMemo(
    () => (data?.pages ?? []).flatMap((p) => p.items),
    [data],
  );

  useEffect(() => {
    // reload when path changes
    refetch();
  }, [path, refetch]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      const [e] = entries;
      if (e.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const parts = useMemo(
    () =>
      (path ? (path.split(":").pop() ?? "") : "").split("/").filter(Boolean),
    [path],
  );

  const goInto = useCallback((p: string) => setPath(p), []);
  const goUp = useCallback(() => {
    const raw = path.split(":").pop() ?? "";
    const segs = raw.split("/").filter(Boolean);
    segs.pop();
    const newRaw = segs.join("/");
    const prefix = path.includes(":")
      ? path.slice(0, path.indexOf(":") + 1)
      : "";
    setPath(prefix + newRaw);
  }, [path]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Доступные работы</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button
            disabled={!path}
            onClick={goUp}
            className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 disabled:opacity-50"
          >
            <ChevronLeft className="size-4" /> Назад
          </button>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <button onClick={() => setPath("")} className="hover:underline">
          Корень
        </button>
        {parts.map((seg, i) => (
          <div key={i} className="flex items-center gap-1">
            <ChevronRight className="size-4 opacity-70" />
            <span>{seg}</span>
          </div>
        ))}
      </div>

      {isLoading && <p className="text-muted-foreground">Загрузка...</p>}

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {allItems.map((it) => (
          <div
            key={it.path}
            className="group rounded-xl border overflow-hidden bg-card"
          >
            {it.type === "dir" ? (
              <button
                onClick={() => goInto(it.path)}
                className="w-full h-full p-3 flex flex-col items-center justify-center gap-2"
              >
                <Folder className="size-8 text-amber-500" />
                <span className="text-xs text-center line-clamp-2">
                  {it.name}
                </span>
              </button>
            ) : it.media_type?.includes("image") && it.preview ? (
              <a
                href={it.preview}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                <img
                  src={it.preview}
                  alt={it.name}
                  className="aspect-square w-full object-cover"
                />
              </a>
            ) : (
              <div className="aspect-square w-full flex items-center justify-center text-muted-foreground">
                <FileImage className="size-6" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div ref={sentinelRef} />
      {isFetchingNextPage && (
        <p className="text-center text-sm text-muted-foreground">
          Загружаем ещё…
        </p>
      )}
    </section>
  );
}
