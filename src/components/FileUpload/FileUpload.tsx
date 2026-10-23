import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type DragEvent,
} from "react";
import cancelIcon from "./icons/cancel-01.svg";
import checkIcon from "./icons/checkmark-circle-02.svg";
import cloudUploadIcon from "./icons/cloud-upload.svg";
import deleteIcon from "./icons/delete-02.svg";
import documentIcon from "./icons/document-attachment.svg";
import styles from "./FileUpload.module.css";

export interface UploadItem {
  id: string;
  name: string;
  /** Size in bytes. */
  size: number;
  status: "uploading" | "uploaded";
  /** 0–100, used while uploading. */
  progress?: number;
}

export type FileRejectionReason = "size" | "type";

export interface FileUploadProps {
  label?: string;
  hint?: string;
  /** Same format as the `accept` attribute of `<input type="file">`. */
  accept?: string;
  /** Maximum size per file, in bytes. */
  maxSize?: number;
  multiple?: boolean;
  disabled?: boolean;
  /** Files to list under the dropzone (Uploading / Uploaded rows). */
  items?: UploadItem[];
  /** Error to show from outside (e.g. a server failure). Overrides validation errors. */
  error?: string;
  /** Called with the files that passed validation. */
  onFilesAccepted?: (files: File[]) => void;
  onFileRejected?: (file: File, reason: FileRejectionReason) => void;
  onCancel?: (id: string) => void;
  onRemove?: (id: string) => void;
  className?: string;
}

const MB = 1024 * 1024;

export function formatFileSize(bytes: number) {
  if (bytes >= MB) return `${+(bytes / MB).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function matchesAccept(file: File, accept: string | undefined) {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return accept
    .split(",")
    .map((rule) => rule.trim().toLowerCase())
    .some((rule) =>
      rule.startsWith(".")
        ? name.endsWith(rule)
        : rule.endsWith("/*")
          ? type.startsWith(rule.slice(0, -1))
          : type === rule,
    );
}

const icon = (url: string) => ({ "--fu-icon": `url("${url}")` }) as CSSProperties;

/**
 * File Upload / Dropzone (Figma 330:10272).
 * Variants: Idle, Drag over, Uploading, Uploaded, Error.
 */
export function FileUpload({
  label = "Attachments",
  hint = "PNG, JPG or PDF · max 10 MB",
  accept = ".png,.jpg,.jpeg,.pdf",
  maxSize = 10 * MB,
  multiple = false,
  disabled = false,
  items = [],
  error,
  onFilesAccepted,
  onFileRejected,
  onCancel,
  onRemove,
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [isDragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string>();
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const errorMessage = error ?? validationError;
  const maxSizeLabel = formatFileSize(maxSize);

  const handleFiles = (list: FileList | null) => {
    if (!list || disabled) return;
    const files = Array.from(list).slice(0, multiple ? undefined : 1);
    const accepted: File[] = [];
    let message: string | undefined;
    for (const file of files) {
      if (!matchesAccept(file, accept)) {
        message = "File type not supported.";
        onFileRejected?.(file, "type");
      } else if (file.size > maxSize) {
        message = `File exceeds ${maxSizeLabel}. Try a smaller file.`;
        onFileRejected?.(file, "size");
      } else {
        accepted.push(file);
      }
    }
    setValidationError(message);
    if (accepted.length) onFilesAccepted?.(accepted);
  };

  const onDragEnter = (event: DragEvent) => {
    event.preventDefault();
    if (disabled) return;
    dragDepth.current += 1;
    setDragOver(true);
  };
  const onDragLeave = (event: DragEvent) => {
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragOver(false);
  };
  const onDragOver = (event: DragEvent) => {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = disabled ? "none" : "copy";
  };
  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    dragDepth.current = 0;
    setDragOver(false);
    handleFiles(event.dataTransfer?.files ?? null);
  };
  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
    event.target.value = "";
  };

  const state = isDragOver ? "dragOver" : errorMessage ? "error" : "idle";

  return (
    <div className={[styles.root, className].filter(Boolean).join(" ")}>
      <label className={styles.label} htmlFor={`${id}-input`}>
        {label}
      </label>

      <div
        className={styles.dropzone}
        data-state={state}
        data-disabled={disabled || undefined}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={(event) => {
          if (event.target === event.currentTarget) inputRef.current?.click();
        }}
      >
        <svg className={styles.outline} aria-hidden="true">
          <rect />
        </svg>
        <span aria-hidden="true" className={styles.uploadIcon} style={icon(cloudUploadIcon)} />
        <p className={styles.prompt}>
          {isDragOver ? (
            "Drop files to upload"
          ) : (
            <>
              <span>Drag &amp; drop files or</span>
              <button
                type="button"
                className={styles.browse}
                disabled={disabled}
                onClick={() => inputRef.current?.click()}
              >
                browse
              </button>
            </>
          )}
        </p>
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
        <input
          ref={inputRef}
          id={`${id}-input`}
          className={styles.input}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          tabIndex={-1}
          aria-describedby={errorMessage ? `${hintId} ${errorId}` : hintId}
          aria-invalid={errorMessage ? true : undefined}
          onChange={onInputChange}
        />
      </div>

      {errorMessage && (
        <p id={errorId} role="alert" className={styles.error}>
          {errorMessage}
        </p>
      )}

      {items.map((item) => (
        <FileRow key={item.id} item={item} onCancel={onCancel} onRemove={onRemove} />
      ))}
    </div>
  );
}

interface FileRowProps {
  item: UploadItem;
  onCancel?: (id: string) => void;
  onRemove?: (id: string) => void;
}

/** File row — Uploading (330:10191 "Upload row") / Uploaded (File row, State=Default). */
function FileRow({ item, onCancel, onRemove }: FileRowProps) {
  const uploading = item.status === "uploading";
  const progress = Math.min(100, Math.max(0, item.progress ?? 0));
  return (
    <div className={styles.fileRow} data-status={item.status}>
      <span className={styles.fileIcon}>
        <span aria-hidden="true" className={styles.icon20} style={icon(documentIcon)} />
      </span>
      <div className={styles.fileText}>
        <p className={styles.fileName}>{item.name}</p>
        <p className={styles.fileMeta}>
          {uploading ? "Uploading…" : `${formatFileSize(item.size)} · Uploaded`}
        </p>
        {uploading && (
          <div
            className={styles.progress}
            role="progressbar"
            aria-label={`Uploading ${item.name}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
      {!uploading && (
        <span
          role="img"
          aria-label="Uploaded"
          className={`${styles.icon20} ${styles.statusIcon}`}
          style={icon(checkIcon)}
        />
      )}
      <button
        type="button"
        className={styles.iconButton}
        aria-label={uploading ? `Cancel upload of ${item.name}` : `Remove ${item.name}`}
        onClick={() => (uploading ? onCancel : onRemove)?.(item.id)}
      >
        <span
          aria-hidden="true"
          className={styles.icon16}
          style={icon(uploading ? cancelIcon : deleteIcon)}
        />
      </button>
    </div>
  );
}
