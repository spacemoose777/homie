"use client";

import { useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";
import { uploadAttachment, deleteAttachment } from "@/lib/storage/attachments";
import type { Attachment } from "@/types";

interface AttachmentSectionProps {
  /** Current attachments on the item */
  attachments: Attachment[];
  /** Firebase Storage base path, e.g. "households/hid/shoppingItems/itemId" */
  storagePath: string;
  /** Called immediately after an upload or deletion — persists to Firestore */
  onSave: (attachments: Attachment[]) => Promise<void>;
}

type Uploading = {
  id: string;
  name: string;
  progress: number;
  error?: string;
  cancel: () => void;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentIcon({ type, url, name }: { type: string; url: string; name: string }) {
  if (type.startsWith("image/")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={name} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
    );
  }

  const label =
    type === "application/pdf" ? "PDF"
    : type.includes("word") || type.includes("document") ? "DOC"
    : type.includes("sheet") || type.includes("excel") ? "XLS"
    : type.includes("presentation") || type.includes("powerpoint") ? "PPT"
    : type.includes("zip") || type.includes("compressed") ? "ZIP"
    : "FILE";

  const style =
    label === "PDF" ? { backgroundColor: "#fee2e2", color: "#ef4444" }
    : label === "DOC" ? { backgroundColor: "#dbeafe", color: "#3b82f6" }
    : label === "XLS" ? { backgroundColor: "#dcfce7", color: "#22c55e" }
    : { backgroundColor: "#f3f4f6", color: "#6b7280" };

  return (
    <div
      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
      style={style}
    >
      <span className="text-xs font-bold">{label}</span>
    </div>
  );
}

export default function AttachmentSection({ attachments, storagePath, onSave }: AttachmentSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<Uploading[]>([]);
  const [deleting, setDeleting] = useState<Set<string>>(new Set());

  function handleFiles(files: FileList | null) {
    if (!files) return;

    Array.from(files).forEach((file) => {
      const uploadId = crypto.randomUUID();
      const { promise, cancel } = uploadAttachment(storagePath, file, (progress) => {
        setUploading((prev) => prev.map((u) => (u.id === uploadId ? { ...u, progress } : u)));
      });

      setUploading((prev) => [...prev, { id: uploadId, name: file.name, progress: 0, cancel }]);

      promise
        .then(async (attachment) => {
          const updated = [...attachments, attachment];
          await onSave(updated);
          setUploading((prev) => prev.filter((u) => u.id !== uploadId));
        })
        .catch((err: Error) => {
          setUploading((prev) =>
            prev.map((u) =>
              u.id === uploadId ? { ...u, error: err.message || "Upload failed" } : u
            )
          );
        });
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDelete(attachment: Attachment) {
    setDeleting((prev) => new Set([...prev, attachment.id]));
    try {
      await deleteAttachment(attachment.path);
    } catch {
      // File may already be gone from Storage — still remove from item
    }
    const updated = attachments.filter((a) => a.id !== attachment.id);
    await onSave(updated);
    setDeleting((prev) => {
      const n = new Set(prev);
      n.delete(attachment.id);
      return n;
    });
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>

      {/* Existing attachments */}
      {attachments.length > 0 && (
        <div className="mb-3 space-y-2">
          {attachments.map((att) => (
            <div key={att.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl border border-gray-100">
              <a
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <AttachmentIcon type={att.type} url={att.url} name={att.name} />
                <div className="min-w-0">
                  <p className="text-sm text-gray-700 truncate">{att.name}</p>
                  <p className="text-xs text-gray-400">{formatBytes(att.size)}</p>
                </div>
              </a>
              <button
                onClick={() => handleDelete(att)}
                disabled={deleting.has(att.id)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0 disabled:opacity-40"
                aria-label="Remove attachment"
              >
                {deleting.has(att.id) ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <X size={14} />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* In-progress uploads */}
      {uploading.length > 0 && (
        <div className="mb-3 space-y-2">
          {uploading.map((u) => (
            <div key={u.id} className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-gray-600 truncate flex-1 mr-2">{u.name}</span>
                {u.error ? (
                  <span className="text-xs text-red-500">{u.error}</span>
                ) : (
                  <button
                    onClick={() => {
                      u.cancel();
                      setUploading((prev) => prev.filter((x) => x.id !== u.id));
                    }}
                    className="text-xs text-gray-400 hover:text-red-400"
                  >
                    Cancel
                  </button>
                )}
              </div>
              {!u.error && (
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-200"
                    style={{ width: `${u.progress}%`, backgroundColor: "#FF6B6B" }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        onDragOver={(e) => e.preventDefault()}
        className="border border-dashed border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
      >
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Paperclip size={15} />
          Add attachment
          <span className="ml-auto text-xs opacity-60">or drop files here</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    </div>
  );
}
