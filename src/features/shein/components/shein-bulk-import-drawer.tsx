"use client";

import JSZip from "jszip";
import { AlertTriangle, CheckCircle2, Download, FileArchive, FileSpreadsheet, ImageIcon, Info, List, Loader2, Upload, UploadCloud } from "lucide-react";
import { useMemo, useState } from "react";

import { CrudDrawer } from "@/components/common/crud-drawer";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { OrderSource, SheinBatchItemStatus } from "@/lib/domain-enums";
import { cn } from "@/lib/utils";
import type { SheinBatchView } from "../types/shein.types";

type ImportRow = {
  rowNumber: number;
  sku: string;
  sheinLink: string;
  size: string;
  color: string;
  quantity: number;
  buyingPriceRm: number | null;
  quoteBdt: number;
  customerName: string;
  phone: string;
  source: string;
  address: string;
  image: File | null;
  errors: string[];
  warnings: string[];
};

const REQUIRED_HEADERS = ["sku", "shein_link"];
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(value.trim());
      value = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }

  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function fileBaseName(name: string) {
  const fileName = name.split("/").pop() ?? name;
  return fileName.replace(/\.[^.]+$/, "").trim().toLowerCase();
}

function positiveNumber(value: string, fallback: number) {
  if (!value.trim()) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : Number.NaN;
}

async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("image", file);
  const response = await fetch("/api/product-variant-images", { method: "POST", body: formData });
  const result = await response.json();
  if (!response.ok || result.status === "error") throw new Error(result.message || `Failed to upload ${file.name}.`);
  return result.data as { imageUrl: string };
}

export function SheinBulkImportDrawer({
  batch,
  open,
  onClose,
  onSuccess,
}: {
  batch: SheinBatchView;
  open: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [csvRowCount, setCsvRowCount] = useState<number | null>(null);
  const [zipImageCount, setZipImageCount] = useState<number | null>(null);

  const validRows = useMemo(() => rows.filter((row) => row.errors.length === 0), [rows]);
  const existingSkus = useMemo(
    () => new Set((batch.items ?? []).map((item) => item.sku?.trim().toLowerCase()).filter(Boolean)),
    [batch.items],
  );

  function reset() {
    setCsvFile(null);
    setZipFile(null);
    setRows([]);
    setFileError(null);
    setProgress(0);
    setCsvRowCount(null);
    setZipImageCount(null);
  }

  async function selectCsvFile(file: File | null) {
    setRows([]);
    setFileError(null);
    setCsvRowCount(null);
    if (!file) {
      setCsvFile(null);
      return;
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setCsvFile(null);
      setFileError("Please select a CSV file.");
      return;
    }
    setCsvFile(file);
    try {
      setCsvRowCount(Math.max(parseCsv((await file.text()).replace(/^\uFEFF/, "")).length - 1, 0));
    } catch {
      setFileError("Could not read the CSV file.");
    }
  }

  async function selectZipFile(file: File | null) {
    setRows([]);
    setFileError(null);
    setZipImageCount(null);
    if (!file) {
      setZipFile(null);
      return;
    }
    if (!file.name.toLowerCase().endsWith(".zip")) {
      setZipFile(null);
      setFileError("Please select a ZIP file.");
      return;
    }
    setZipFile(file);
    try {
      const zip = await JSZip.loadAsync(file);
      setZipImageCount(Object.values(zip.files).filter((entry) => !entry.dir && ALLOWED_EXTENSIONS.has(entry.name.split(".").pop()?.toLowerCase() ?? "")).length);
    } catch {
      setZipFile(null);
      setFileError("Could not read the ZIP file.");
    }
  }

  function close() {
    if (isPreparing || isImporting) return;
    reset();
    onClose();
  }

  async function prepareImport() {
    if (!csvFile || !zipFile) return;
    setIsPreparing(true);
    setFileError(null);
    setRows([]);

    try {
      const trackingNumber = batch.sheinTrackingNumber?.trim().toLowerCase();
      if (!trackingNumber) throw new Error("Add a tracking number to this batch before importing.");
      if (fileBaseName(zipFile.name) !== trackingNumber) {
        throw new Error(`ZIP filename must match tracking number: ${batch.sheinTrackingNumber}.zip`);
      }

      const parsed = parseCsv((await csvFile.text()).replace(/^\uFEFF/, ""));
      if (parsed.length < 2) throw new Error("CSV must contain a header and at least one item row.");
      const headers = parsed[0].map((header) => header.trim().toLowerCase());
      const missingHeaders = REQUIRED_HEADERS.filter((header) => !headers.includes(header));
      if (missingHeaders.length) throw new Error(`Missing CSV columns: ${missingHeaders.join(", ")}.`);
      const column = (record: string[], name: string) => record[headers.indexOf(name)]?.trim() ?? "";

      const zip = await JSZip.loadAsync(zipFile);
      const images = new Map<string, { entry: JSZip.JSZipObject; extension: string }>();
      const duplicateImages = new Set<string>();
      for (const entry of Object.values(zip.files)) {
        if (entry.dir) continue;
        const extension = entry.name.split(".").pop()?.toLowerCase() ?? "";
        if (!ALLOWED_EXTENSIONS.has(extension)) continue;
        const sku = fileBaseName(entry.name);
        if (images.has(sku)) duplicateImages.add(sku);
        else images.set(sku, { entry, extension });
      }

      const csvSkus = parsed.slice(1).map((record) => column(record, "sku").toLowerCase()).filter(Boolean);
      const duplicateCsvSkus = new Set(csvSkus.filter((sku, index) => csvSkus.indexOf(sku) !== index));
      const preparedRows = await Promise.all(parsed.slice(1).map(async (record, index): Promise<ImportRow> => {
        const sku = column(record, "sku");
        const sheinLink = column(record, "shein_link");
        const quantity = positiveNumber(column(record, "quantity"), 1);
        const buyingPrice = column(record, "buying_price_rm");
        const quote = column(record, "quote_bdt");
        const normalizedSku = sku.toLowerCase();
        const errors: string[] = [];
        const warnings: string[] = [];
        if (!sku) errors.push("SKU is required");
        if (!sheinLink) errors.push("SHEIN link is required");
        else if (!/^https?:\/\//i.test(sheinLink)) errors.push("SHEIN link must be a valid URL");
        if (!Number.isInteger(quantity) || quantity < 1) errors.push("Quantity must be a positive whole number");
        if (buyingPrice && Number.isNaN(positiveNumber(buyingPrice, 0))) errors.push("Buying price must be zero or greater");
        if (quote && Number.isNaN(positiveNumber(quote, 0))) errors.push("Quote must be zero or greater");
        if (duplicateCsvSkus.has(normalizedSku)) errors.push("Duplicate SKU in CSV");
        if (existingSkus.has(normalizedSku)) errors.push("SKU already exists in this batch");
        if (duplicateImages.has(normalizedSku)) errors.push("Multiple ZIP images match this SKU");

        const imageEntry = images.get(normalizedSku);
        let image: File | null = null;
        if (imageEntry) {
          const blob = await imageEntry.entry.async("blob");
          image = new File([blob], `${sku}.${imageEntry.extension}`, { type: MIME_BY_EXTENSION[imageEntry.extension] });
          if (image.size > 3 * 1024 * 1024) errors.push("Image is larger than 3MB");
        } else {
          warnings.push("No matching image");
        }

        const source = column(record, "source").toUpperCase();
        if (source && !Object.values(OrderSource).includes(source as OrderSource)) errors.push("Invalid customer source");

        return {
          rowNumber: index + 2,
          sku,
          sheinLink,
          size: column(record, "size"),
          color: column(record, "color"),
          quantity: Number.isNaN(quantity) ? 1 : quantity,
          buyingPriceRm: buyingPrice ? positiveNumber(buyingPrice, 0) : null,
          quoteBdt: quote ? positiveNumber(quote, 0) : 0,
          customerName: column(record, "customer_name"),
          phone: column(record, "phone"),
          source,
          address: column(record, "address"),
          image,
          errors,
          warnings,
        };
      }));
      setRows(preparedRows);
    } catch (error) {
      setFileError(error instanceof Error ? error.message : "Failed to prepare import.");
    } finally {
      setIsPreparing(false);
    }
  }

  async function importItems() {
    if (!validRows.length || validRows.length !== rows.length) return;
    setIsImporting(true);
    setFileError(null);
    setProgress(0);
    try {
      const items = [];
      for (let index = 0; index < validRows.length; index += 1) {
        const row = validRows[index];
        const uploaded = row.image ? await uploadImage(row.image) : null;
        items.push({
          customerName: row.customerName,
          phone: row.phone,
          customerSource: row.source,
          address: row.address,
          productName: "SHEIN item",
          sku: row.sku,
          sheinLink: row.sheinLink,
          imageUrl: uploaded?.imageUrl ?? "",
          screenshotUrl: "",
          size: row.size,
          color: row.color,
          quantity: row.quantity,
          customerQuotedPriceBdt: row.quoteBdt,
          advanceReceivedBdt: 0,
          actualSheinPriceRm: row.buyingPriceRm,
          bankRateSnapshot: batch.bankRate ? Number(batch.bankRate) : null,
          actualWeightGram: null,
          customerWeightRateSnapshot: Number(batch.customerWeightRatePerGram),
          actualCargoRateSnapshot: Number(batch.actualCargoRatePerGram),
          status: SheinBatchItemStatus.CONFIRMED,
        });
        setProgress(index + 1);
      }
      await apiClient(`/api/shein/batches/${batch.id}/items/bulk`, {
        method: "POST",
        body: JSON.stringify({ items }),
        showSuccessToast: true,
      });
      await onSuccess();
      reset();
      onClose();
    } catch (error) {
      setFileError(error instanceof Error ? error.message : "Bulk import failed.");
    } finally {
      setIsImporting(false);
    }
  }

  const activeStep = rows.length ? 3 : zipFile ? 2 : 1;

  return (
    <CrudDrawer
      bodyClassName="bg-[#fbfaf7] px-5 py-5 sm:px-8 sm:py-7"
      className="md:w-[min(1080px,100vw)]"
      description="Upload item data and matching SKU images to add an entire batch at once."
      onClose={close}
      open={open}
      title="Bulk Import SHEIN Items"
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3.5 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            <p>Upload an items CSV and <strong>{batch.sheinTrackingNumber || "tracking-number"}.zip</strong>. Every image filename must match its SKU.</p>
          </div>
          <a className="inline-flex shrink-0 items-center gap-2 font-semibold !text-emerald-700 !underline underline-offset-2 hover:!text-emerald-900" download href="/shein-bulk-import-template.csv">
            <Download className="h-4 w-4" />Download CSV template
          </a>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 px-1 sm:px-8">
          <ImportStep active={activeStep >= 1} number={1} label="Upload CSV" />
          <div className={cn("h-px w-6 sm:w-20", activeStep >= 2 ? "bg-emerald-500" : "bg-slate-200")} />
          <ImportStep active={activeStep >= 2} number={2} label="Upload ZIP" />
          <div className={cn("h-px w-6 sm:w-20", activeStep >= 3 ? "bg-emerald-500" : "bg-slate-200")} />
          <ImportStep active={activeStep >= 3} number={3} label="Validate & Preview" />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <FileDropZone
            accept=".csv,text/csv"
            disabled={isPreparing || isImporting}
            file={csvFile}
            icon={FileSpreadsheet}
            onFile={(file) => void selectCsvFile(file)}
            subtitle="Accepted format: .csv"
            title="Items CSV"
          />
          <FileDropZone
            accept=".zip,application/zip"
            disabled={isPreparing || isImporting}
            file={zipFile}
            icon={FileArchive}
            onFile={(file) => void selectZipFile(file)}
            subtitle="Images must be JPG, PNG, or WEBP"
            title="SKU Images ZIP"
          />
        </div>

        <div className="grid gap-3 rounded-2xl border bg-white px-4 py-3 shadow-sm sm:grid-cols-2">
          <div className="flex items-center gap-3 sm:border-r">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border bg-slate-50 text-emerald-700"><List className="h-4 w-4" /></span>
            <p className="text-sm text-slate-600">CSV rows: <strong className="text-slate-950">{csvRowCount ?? "—"}</strong></p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border bg-slate-50 text-emerald-700"><ImageIcon className="h-4 w-4" /></span>
            <p className="text-sm text-slate-600">ZIP images: <strong className="text-slate-950">{zipImageCount ?? "—"}</strong></p>
          </div>
        </div>

        {fileError ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{fileError}</div> : null}
        {!rows.length ? (
          <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
            <Button className="h-11 px-6" disabled={isPreparing || isImporting} onClick={close} type="button" variant="outline">Cancel</Button>
            <Button className="h-11 bg-emerald-700 px-6 hover:bg-emerald-800" disabled={!csvFile || !zipFile || isPreparing || isImporting} onClick={() => void prepareImport()} type="button">
              {isPreparing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
              {isPreparing ? "Validating files…" : "Validate & Preview"}
            </Button>
          </div>
        ) : null}
        {rows.length ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="rounded-full border bg-white px-3 py-1">{rows.length} rows</span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">{validRows.length} valid</span>
              <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-red-700">{rows.length - validRows.length} invalid</span>
            </div>
            <div className="overflow-x-auto rounded-xl border">
              <div className="grid min-w-[760px] grid-cols-[60px_160px_90px_120px_minmax(220px,1fr)] gap-3 border-b bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600">
                <div>Row</div><div>SKU</div><div>Image</div><div>Variant / Qty</div><div>Validation</div>
              </div>
              {rows.map((row) => (
                <div className="grid min-w-[760px] grid-cols-[60px_160px_90px_120px_minmax(220px,1fr)] items-center gap-3 border-b px-4 py-3 text-sm last:border-0" key={row.rowNumber}>
                  <div className="text-muted-foreground">{row.rowNumber}</div>
                  <div className="truncate font-medium">{row.sku || "—"}</div>
                  <div>{row.image ? <span className="text-emerald-700">Matched</span> : <span className="text-amber-700">Missing</span>}</div>
                  <div>{[row.size, row.color].filter(Boolean).join(" / ") || "—"} · {row.quantity}</div>
                  <div className="space-y-1 text-xs">
                    {row.errors.map((error) => <p className="flex items-center gap-1 text-red-700" key={error}><AlertTriangle className="h-3 w-3" />{error}</p>)}
                    {row.warnings.map((warning) => <p className="flex items-center gap-1 text-amber-700" key={warning}><AlertTriangle className="h-3 w-3" />{warning}</p>)}
                    {!row.errors.length && !row.warnings.length ? <p className="flex items-center gap-1 text-emerald-700"><CheckCircle2 className="h-3 w-3" />Ready</p> : null}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
              <Button disabled={isImporting} onClick={close} type="button" variant="outline">Cancel</Button>
              <Button className="bg-emerald-700 hover:bg-emerald-800" disabled={isImporting || validRows.length !== rows.length} onClick={() => void importItems()} type="button">
                {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {isImporting ? `Uploading ${progress} of ${rows.length}…` : `Import ${rows.length} items`}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </CrudDrawer>
  );
}

function ImportStep({ active, number, label }: { active: boolean; number: number; label: string }) {
  return (
    <div className="flex min-w-0 items-center justify-center gap-2">
      <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold", active ? "bg-emerald-700 text-white shadow-sm" : "bg-slate-100 text-slate-500")}>{number}</span>
      <span className={cn("hidden truncate text-sm font-semibold sm:block", active ? "text-slate-900" : "text-slate-500")}>{label}</span>
    </div>
  );
}

function FileDropZone({
  title,
  subtitle,
  accept,
  file,
  disabled,
  icon: Icon,
  onFile,
}: {
  title: string;
  subtitle: string;
  accept: string;
  file: File | null;
  disabled: boolean;
  icon: typeof FileSpreadsheet;
  onFile: (file: File | null) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Icon className="h-5 w-5" /></span>
        <div>
          <h3 className="font-semibold text-slate-950">{title}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <label
        className={cn(
          "flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-8 text-center transition-all",
          isDragging ? "border-emerald-600 bg-emerald-50 shadow-inner" : file ? "border-emerald-300 bg-emerald-50/40" : "border-slate-300 bg-slate-50/50 hover:border-emerald-500 hover:bg-emerald-50/30",
          disabled && "pointer-events-none opacity-60",
        )}
        onDragEnter={(event) => { event.preventDefault(); if (!disabled) setIsDragging(true); }}
        onDragLeave={(event) => { event.preventDefault(); setIsDragging(false); }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          if (!disabled) onFile(event.dataTransfer.files?.[0] ?? null);
        }}
      >
        <input accept={accept} className="sr-only" disabled={disabled} onChange={(event) => onFile(event.target.files?.[0] ?? null)} type="file" />
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><UploadCloud className="h-7 w-7" /></span>
        <p className="mt-4 font-semibold text-emerald-800">Drag & drop or <span className="underline underline-offset-2">browse</span></p>
        <p className={cn("mt-2 max-w-full truncate text-sm", file ? "font-medium text-slate-800" : "text-muted-foreground")}>{file?.name ?? "No file selected"}</p>
        {file ? <p className="mt-1 text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p> : null}
      </label>
      {title.includes("ZIP") ? <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Info className="h-4 w-4" />Image filenames must exactly match SKU values in the CSV.</p> : null}
    </section>
  );
}
