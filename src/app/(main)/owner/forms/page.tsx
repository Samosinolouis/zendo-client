"use client";



// ================================================================

// Owner Forms — /owner/forms

// Dynamic Booking Form Schema builder (v1).

//

// Implements the full v1 spec:

//   Root:   id · version · currency · totalAmount · submit ·

//           plugins · fields

//   Pricing: field-level `amount` only.  Options carry NO price.

//            Per-option pricing must be implemented as a plugin.

//   Plugins: editable JavaScript strings, sandbox-safe.

//   10 field types: text · textarea · number · select · radio ·

//                   checkbox · switch · date · file · password

// ================================================================



import { useState, useMemo, useCallback, useRef } from "react";

import { useAuth } from "@/providers/AuthProvider";

import { useQuery, useMutation, extractNodes } from "@/graphql/hooks";
import type { GraphQLError } from "@/lib/graphql-client";
import { useToast } from "@/providers/ToastProvider";

import { GET_SERVICES } from "@/graphql/queries";

import {

  emptyFormPayload,

  parseFormPayload,

  newFormField,

  newFieldOption,

  isOptionsField,

  isBoundedField,

  isBooleanField,

  computeTotalAmount,

  FORM_FIELD_META,

  GET_SERVICE_FORM,

  UPSERT_SERVICE_FORM,

  DELETE_SERVICE_FORM,

} from "@/graphql/form";

import type {

  FormPayload,

  FormField,

  FormFieldType,

  FieldOption,

  BaseFormField,

  FormSubmit,

} from "@/graphql/form";

import type { Service, ServiceForm, Connection } from "@/types";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Badge } from "@/components/ui/badge";

import { Switch } from "@/components/ui/switch";

import { Label } from "@/components/ui/label";

import { Separator } from "@/components/ui/separator";

import { cn } from "@/lib/utils";

function resolveGqlError(err: GraphQLError): string {
  const code = err.extensions?.code;
  const messages: Record<string, string> = {
    NOT_FOUND:         "Resource not found.",
    UNAUTHORIZED:      "You are not authorised to do that.",
    VALIDATION_ERROR:  "Invalid input. Please check your fields and try again.",
  };
  return (code && messages[String(code)]) ?? err.message ?? "Something went wrong.";
}

import {

  Search, Plus, ChevronUp, ChevronDown, Trash2,

  Save, Loader2, CheckCircle, ClipboardList,

  GripVertical, Settings2, AlertTriangle, BookOpen,

  Type, AlignLeft, Hash, CalendarDays,

  ChevronDownSquare, CircleDot, CheckSquare, Paperclip,

  ToggleLeft, Lock, Code2, X as XIcon,

  DollarSign, Globe, Zap,

} from "lucide-react";



// ─── Field-type → icon map ─────────────────────────────────────



const FIELD_ICONS: Record<FormFieldType, React.ComponentType<{ className?: string }>> = {

  text:     Type,

  textarea: AlignLeft,

  number:   Hash,

  select:   ChevronDownSquare,

  radio:    CircleDot,

  checkbox: CheckSquare,

  switch:   ToggleLeft,

  date:     CalendarDays,

  file:     Paperclip,

  password: Lock,

};



// ─── Currency formatter ────────────────────────────────────────



function fmtAmount(amount: number, currency: string): string {

  try {

    return new Intl.NumberFormat(undefined, {

      style: "currency", currency, minimumFractionDigits: 2,

    }).format(amount);

  } catch {

    return `${currency} ${amount.toFixed(2)}`;

  }

}



function fmtBytes(bytes: number): string {

  if (bytes < 1024) return `${bytes} B`;

  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

}



// ═══════════════════════════════════════════════════════════════

// OPTION ROW  (select / radio — no pricing in v1)

// ═══════════════════════════════════════════════════════════════



interface OptionRowProps {

  readonly option: FieldOption;

  readonly index: number;

  readonly total: number;

  readonly onUpdate: (patch: Partial<FieldOption>) => void;

  readonly onDelete: () => void;

  readonly onMoveUp: () => void;

  readonly onMoveDown: () => void;

}



function OptionRow({ option, index, total, onUpdate, onDelete, onMoveUp, onMoveDown }: OptionRowProps) {

  return (

    <div className="border border-border rounded-lg p-2 flex items-center gap-2 bg-background">

      <div className="flex shrink-0">

        <button onClick={onMoveUp} disabled={index === 0} title="Move up"

          className="p-1 rounded hover:bg-muted disabled:opacity-25 transition-colors">

          <ChevronUp className="w-3 h-3" />

        </button>

        <button onClick={onMoveDown} disabled={index === total - 1} title="Move down"

          className="p-1 rounded hover:bg-muted disabled:opacity-25 transition-colors">

          <ChevronDown className="w-3 h-3" />

        </button>

      </div>

      <Input value={option.label} onChange={(e) => onUpdate({ label: e.target.value })}

        placeholder="Label…" className="flex-1 h-7 text-sm" />

      <Input value={option.value} onChange={(e) => onUpdate({ value: e.target.value })}

        placeholder="value" className="w-28 h-7 text-xs font-mono" />

      <button onClick={onDelete}

        className="p-1.5 rounded hover:bg-destructive/10 text-destructive/60 hover:text-destructive transition-colors shrink-0"

        title="Remove option">

        <XIcon className="w-3.5 h-3.5" />

      </button>

    </div>

  );

}



// ═══════════════════════════════════════════════════════════════

// FIELD EDITOR

// ═══════════════════════════════════════════════════════════════



interface FieldEditorProps {

  readonly field: FormField;

  readonly currency: string;

  readonly index: number;

  readonly total: number;

  readonly onChange: (f: FormField) => void;

  readonly onDelete: () => void;

  readonly onMoveUp: () => void;

  readonly onMoveDown: () => void;

}



function FieldEditor({ field, currency, index, total, onChange, onDelete, onMoveUp, onMoveDown }: FieldEditorProps) {

  const [expanded, setExpanded] = useState(true);

  const Icon = FIELD_ICONS[field.type];

  const meta = FORM_FIELD_META.find((m) => m.type === field.type);

  const optionCount = isOptionsField(field) ? field.options.length : 0;
  const optionKeysRef = useRef<string[]>([]);
  while (optionKeysRef.current.length < optionCount) optionKeysRef.current.push(`opt-${optionKeysRef.current.length}`);
  if (optionKeysRef.current.length > optionCount) optionKeysRef.current.length = optionCount;



  const updateBase = useCallback(

    (patch: Partial<BaseFormField>) => onChange({ ...field, ...patch } as FormField),

    [field, onChange],

  );



  // biome-ignore lint/suspicious/noExplicitAny: intentional generic patch

  const updateField = useCallback((patch: Record<string, any>) =>

    onChange({ ...field, ...patch } as FormField), [field, onChange]);



  // ── options helpers (select / radio only) ───────────────────

  const updateOption = useCallback((idx: number, patch: Partial<FieldOption>) => {

    if (!isOptionsField(field)) return;

    const next = field.options.map((o, i) => (i === idx ? { ...o, ...patch } : o));

    onChange({ ...field, options: next } as FormField);

  }, [field, onChange]);



  const addOption = useCallback(() => {

    if (!isOptionsField(field)) return;

    onChange({ ...field, options: [...field.options, newFieldOption()] } as FormField);

  }, [field, onChange]);



  const removeOption = useCallback((idx: number) => {

    if (!isOptionsField(field)) return;

    onChange({ ...field, options: field.options.filter((_, i) => i !== idx) } as FormField);

  }, [field, onChange]);



  const moveOption = useCallback((idx: number, dir: -1 | 1) => {

    if (!isOptionsField(field)) return;

    const arr = [...field.options];

    const next = idx + dir;

    if (next < 0 || next >= arr.length) return;

    [arr[idx], arr[next]] = [arr[next], arr[idx]];

    onChange({ ...field, options: arr } as FormField);

  }, [field, onChange]);



  return (

    <div className={cn("rounded-xl border bg-card transition-all",

      expanded ? "border-border shadow-sm" : "border-border/60")}>

      {/* ── Header ── */}

      <div className="flex items-center gap-2 px-3 py-2.5">

        <GripVertical className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />

        <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">

          <Icon className="w-3.5 h-3.5 text-primary" />

        </span>

        <div className="flex-1 min-w-0">

          <span className="text-sm font-medium text-foreground truncate block">

            {field.label || <span className="italic text-muted-foreground/60">Untitled field</span>}

          </span>

          <span className="text-[10px] text-muted-foreground leading-none">{meta?.label}</span>

        </div>

        {field.amount > 0 && (

          <Badge variant="secondary" className="text-[10px] h-4 py-0 gap-0.5 shrink-0">

            <DollarSign className="w-2.5 h-2.5" />

            {fmtAmount(field.amount, currency)}

          </Badge>

        )}

        {field.required && (

          <Badge variant="secondary" className="text-[10px] py-0 h-4 shrink-0">Required</Badge>

        )}

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">

          <button onClick={onMoveUp} disabled={index === 0} title="Move up"

            className="p-1.5 rounded hover:bg-muted disabled:opacity-25 transition-colors">

            <ChevronUp className="w-3.5 h-3.5" />

          </button>

          <button onClick={onMoveDown} disabled={index === total - 1} title="Move down"

            className="p-1.5 rounded hover:bg-muted disabled:opacity-25 transition-colors">

            <ChevronDown className="w-3.5 h-3.5" />

          </button>

          <button onClick={onDelete}

            className="p-1.5 rounded hover:bg-destructive/10 text-destructive/60 hover:text-destructive transition-colors"

            title="Delete field">

            <Trash2 className="w-3.5 h-3.5" />

          </button>

        </div>

        <button onClick={() => setExpanded((v) => !v)}

          className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors ml-1">

          <Settings2 className="w-3.5 h-3.5" />

        </button>

      </div>



      {/* ── Body ── */}

      {expanded && (

        <div className="px-3 pb-3 border-t border-border/50 pt-3 space-y-3">

          {/* Name slug */}

          <div className="space-y-1">

            <Label htmlFor={`nm-${field.name}`} className="text-xs">

              Field name <span className="text-muted-foreground/60">(slug, unique)</span>

            </Label>

            <Input id={`nm-${field.name}`} value={field.name}

              onChange={(e) => updateBase({ name: e.target.value.replaceAll(/\s+/g, "_").toLowerCase() })}

              placeholder="field_name" className="font-mono text-sm" />

          </div>



          {/* Label + required */}

          <div className="flex items-start gap-3">

            <div className="flex-1 space-y-1">

              <Label htmlFor={`lbl-${field.name}`} className="text-xs">

                Label <span className="text-destructive">*</span>

              </Label>

              <Input id={`lbl-${field.name}`} value={field.label}

                onChange={(e) => updateBase({ label: e.target.value })}

                placeholder="Field label shown to customer…" />

            </div>

            <div className="flex flex-col items-center gap-1 pt-5 shrink-0">

              <Switch

                id={`req-${field.name}`}

                checked={field.required ?? false}

                onCheckedChange={(v) => updateBase({ required: v })}

              />

              <Label htmlFor={`req-${field.name}`} className="text-[10px] text-muted-foreground">Required</Label>

            </div>

          </div>



          {/* Amount (price contribution) */}

          <div className="grid grid-cols-2 gap-2">

            <div className="space-y-1">

              <Label htmlFor={`amt-${field.name}`} className="text-xs flex items-center gap-1">

                <DollarSign className="w-3 h-3 text-primary" />

                Amount ({currency})

              </Label>

              <Input id={`amt-${field.name}`} type="number" min={0} step={0.01}

                value={field.amount}

                onChange={(e) => updateBase({ amount: Math.max(0, Number(e.target.value)) })}

                placeholder="0.00" />

            </div>

            <div className="space-y-1">

              <Label htmlFor={`ph-${field.name}`} className="text-xs">Placeholder</Label>

              <Input id={`ph-${field.name}`} value={field.placeholder ?? ""}

                onChange={(e) => updateBase({ placeholder: e.target.value || undefined })}

                placeholder="e.g. Enter your name…" className="text-sm" />

            </div>

          </div>



          {/* Tooltip */}

          <div className="space-y-1">

            <Label htmlFor={`tt-${field.name}`} className="text-xs">Tooltip</Label>

            <Input id={`tt-${field.name}`} value={field.tooltip ?? ""}

              onChange={(e) => updateBase({ tooltip: e.target.value || undefined })}

              placeholder="Short contextual helper text…" className="text-sm" />

          </div>



          {/* ── Bounded constraints ── */}

          {isBoundedField(field) && (

            <div className="border border-border/60 rounded-lg p-3 space-y-2 bg-muted/30">

              <p className="text-xs font-semibold text-muted-foreground">Constraints</p>

              {field.type === "text" && (

                <div className="grid grid-cols-2 gap-2">

                  <div className="space-y-1">

                    <Label className="text-xs">Min length</Label>

                    <Input type="number" min={0} value={field.minLength ?? ""}

                      onChange={(e) => updateField({ minLength: e.target.value ? Number(e.target.value) : undefined })}

                      placeholder="—" className="text-sm" />

                  </div>

                  <div className="space-y-1">

                    <Label className="text-xs">Max length</Label>

                    <Input type="number" min={0} value={field.maxLength ?? ""}

                      onChange={(e) => updateField({ maxLength: e.target.value ? Number(e.target.value) : undefined })}

                      placeholder="—" className="text-sm" />

                  </div>

                </div>

              )}

              {field.type === "textarea" && (

                <div className="grid grid-cols-2 gap-2">

                  <div className="space-y-1">

                    <Label className="text-xs">Rows</Label>

                    <Input type="number" min={1} max={20} value={field.rows ?? ""}

                      onChange={(e) => updateField({ rows: e.target.value ? Number(e.target.value) : undefined })}

                      placeholder="3" className="text-sm" />

                  </div>

                  <div className="space-y-1">

                    <Label className="text-xs">Max length</Label>

                    <Input type="number" min={0} value={field.maxLength ?? ""}

                      onChange={(e) => updateField({ maxLength: e.target.value ? Number(e.target.value) : undefined })}

                      placeholder="—" className="text-sm" />

                  </div>

                </div>

              )}

              {field.type === "number" && (

                <div className="grid grid-cols-3 gap-2">

                  <div className="space-y-1">

                    <Label className="text-xs">Min</Label>

                    <Input type="number" value={field.min ?? ""}

                      onChange={(e) => updateField({ min: e.target.value ? Number(e.target.value) : undefined })}

                      placeholder="—" className="text-sm" />

                  </div>

                  <div className="space-y-1">

                    <Label className="text-xs">Max</Label>

                    <Input type="number" value={field.max ?? ""}

                      onChange={(e) => updateField({ max: e.target.value ? Number(e.target.value) : undefined })}

                      placeholder="—" className="text-sm" />

                  </div>

                  <div className="space-y-1">

                    <Label className="text-xs">Step</Label>

                    <Input type="number" min={0} value={field.step ?? ""}

                      onChange={(e) => updateField({ step: e.target.value ? Number(e.target.value) : undefined })}

                      placeholder="1" className="text-sm" />

                  </div>

                </div>

              )}

              {field.type === "date" && (

                <div className="grid grid-cols-2 gap-2">

                  <div className="space-y-1">

                    <Label className="text-xs">Min date</Label>

                    <Input type="date" value={field.minDate ?? ""}

                      onChange={(e) => updateField({ minDate: e.target.value || undefined })}

                      className="text-sm" />

                  </div>

                  <div className="space-y-1">

                    <Label className="text-xs">Max date</Label>

                    <Input type="date" value={field.maxDate ?? ""}

                      onChange={(e) => updateField({ maxDate: e.target.value || undefined })}

                      className="text-sm" />

                  </div>

                </div>

              )}

            </div>

          )}



          {/* ── File settings ── */}

          {field.type === "file" && (

            <div className="border border-border/60 rounded-lg p-3 space-y-2 bg-muted/30">

              <p className="text-xs font-semibold text-muted-foreground">File settings</p>

              <div className="grid grid-cols-2 gap-2">

                <div className="space-y-1">

                  <Label className="text-xs">Accepted types</Label>

                  <Input value={field.accept ?? ""}

                    onChange={(e) => updateField({ accept: e.target.value || undefined })}

                    placeholder="image/*,.pdf" className="text-sm font-mono" />

                </div>

                <div className="space-y-1">

                  <Label className="text-xs">

                    Max size {field.maxSizeBytes ? `(${fmtBytes(field.maxSizeBytes)})` : ""}

                  </Label>

                  <Input type="number" min={0} value={field.maxSizeBytes ?? ""}

                    onChange={(e) => updateField({ maxSizeBytes: e.target.value ? Number(e.target.value) : undefined })}

                    placeholder="bytes" className="text-sm" />

                </div>

              </div>

            </div>

          )}



          {/* ── Options (select / radio only — no pricing per spec) ── */}

          {isOptionsField(field) && (

            <div className="space-y-2">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-xs font-semibold text-muted-foreground">Options</p>

                  <p className="text-[10px] text-muted-foreground/60">

                    Options carry no pricing in v1.

                    Use a plugin for per-option amounts.

                  </p>

                </div>

                <Button variant="ghost" size="sm" onClick={addOption} className="h-6 px-2 text-xs gap-1">

                  <Plus className="w-3 h-3" /> Add

                </Button>

              </div>

              {field.options.length === 0 && (

                <p className="text-xs text-muted-foreground/60 italic py-2 text-center">

                  No options yet.

                </p>

              )}

              <div className="space-y-1.5">

                {field.options.map((opt, idx) => (
                  <OptionRow
                    key={optionKeysRef.current[idx]}

                    option={opt}

                    index={idx}

                    total={field.options.length}

                    onUpdate={(patch) => updateOption(idx, patch)}

                    onDelete={() => removeOption(idx)}

                    onMoveUp={() => moveOption(idx, -1)}

                    onMoveDown={() => moveOption(idx, 1)}

                  />

                ))}

              </div>

            </div>

          )}



          {/* ── Boolean hint ── */}

          {isBooleanField(field) && (

            <p className="text-xs text-muted-foreground/70 italic">

              Boolean field — stores true/false. The `amount` above is

              applied when the customer checks/toggles this field.

            </p>

          )}

        </div>

      )}

    </div>

  );

}



// ═══════════════════════════════════════════════════════════════

// FIELD TYPE PICKER

// ═══════════════════════════════════════════════════════════════



function FieldPicker({ onAdd, onClose }: {

  readonly onAdd: (t: FormFieldType) => void;

  readonly onClose: () => void;

}) {

  return (

    <>

      <button type="button" aria-label="Close picker"

        className="fixed inset-0 z-30 cursor-default bg-transparent border-0"

        onClick={onClose} />

      <div className="absolute top-full left-0 mt-2 z-40 bg-popover border border-border rounded-2xl shadow-xl w-72 overflow-hidden">

        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 pt-3 pb-1.5">

          Add Field

        </p>

        <div className="grid grid-cols-2 gap-1 p-2">

          {FORM_FIELD_META.map(({ type, label, description }) => {

            const Icon = FIELD_ICONS[type];

            return (

              <button key={type} onClick={() => onAdd(type)}

                className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-muted transition-colors text-left group">

                <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">

                  <Icon className="w-3.5 h-3.5 text-primary" />

                </span>

                <div className="min-w-0">

                  <p className="text-xs font-semibold leading-tight">{label}</p>

                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">{description}</p>

                </div>

              </button>

            );

          })}

        </div>

      </div>

    </>

  );

}



// ═══════════════════════════════════════════════════════════════

// PLUGIN EDITOR

// ═══════════════════════════════════════════════════════════════



function PluginEditor({

  plugins,

  onChange,

}: {

  readonly plugins: string[];

  readonly onChange: (plugins: string[]) => void;

}) {

  const [expanded, setExpanded] = useState(false);
  const pluginIds = useRef<string[]>([]);
  while (pluginIds.current.length < plugins.length) pluginIds.current.push(`pid-${pluginIds.current.length}`);
  if (pluginIds.current.length > plugins.length) pluginIds.current.length = plugins.length;



  const updatePlugin = (idx: number, value: string) =>

    onChange(plugins.map((p, i) => (i === idx ? value : p)));



  const addPlugin = () => onChange([...plugins, ""]);

  const removePlugin = (idx: number) => onChange(plugins.filter((_, i) => i !== idx));



  return (

    <section className="space-y-2">

      <button

        onClick={() => setExpanded((v) => !v)}

        className="flex items-center gap-2 w-full text-left group"

      >

        <div className="flex-1">

          <h3 className="font-semibold text-foreground text-sm flex items-center gap-1.5">

            <Code2 className="w-3.5 h-3.5 text-primary" />

            Plugins

            {plugins.length > 0 && (

              <Badge variant="secondary" className="text-[10px] h-4 py-0">{plugins.length}</Badge>

            )}

          </h3>

          <p className="text-xs text-muted-foreground mt-0.5">

            JavaScript plugins for conditional pricing and dynamic rules.

            Each runs in a sandbox with access only to <code className="font-mono text-[10px]">form</code>.

          </p>

        </div>

        <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform shrink-0",

          expanded && "rotate-180")} />

      </button>



      {expanded && (

        <div className="space-y-3 pt-1">

          {plugins.length === 0 && (

            <div className="py-6 text-center border-2 border-dashed border-border rounded-xl space-y-1">

              <Zap className="w-6 h-6 text-muted-foreground/25 mx-auto" />

              <p className="text-xs text-muted-foreground/60">No plugins yet</p>

            </div>

          )}

          {plugins.map((code, idx) => (

            <div key={pluginIds.current[idx]} className="space-y-1">

              <div className="flex items-center justify-between">

                <Label className="text-xs text-muted-foreground">Plugin {idx + 1}</Label>

                <button onClick={() => removePlugin(idx)}

                  className="p-1 rounded hover:bg-destructive/10 text-destructive/60 hover:text-destructive transition-colors">

                  <XIcon className="w-3 h-3" />

                </button>

              </div>

              <textarea

                value={code}

                onChange={(e) => updatePlugin(idx, e.target.value)}

                rows={6}

                spellCheck={false}

                className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs font-mono resize-y focus:outline-none focus:ring-1 focus:ring-ring"

                placeholder={`form.subscribe((state) => {\n  const tier = form.getValue("serviceTier");\n  if (tier === "premium") {\n    form.updateField("serviceTier", { amount: 1000 });\n  }\n});`}

              />

            </div>

          ))}

          <Button variant="outline" size="sm" onClick={addPlugin} className="gap-1.5 border-dashed text-xs">

            <Plus className="w-3 h-3" /> Add Plugin

          </Button>

          {plugins.length > 0 && (

            <details className="text-[10px] text-muted-foreground/70 border border-border/50 rounded-lg p-2">

              <summary className="cursor-pointer font-semibold">Available form API</summary>

              <pre className="mt-1 text-[10px] leading-4 overflow-x-auto">{`form.getValue(fieldName)

form.setValue(fieldName, value)

form.addField(fieldDefinition)

form.removeField(fieldName)

form.updateField(fieldName, patch)

form.getFields()

form.getState()

form.subscribe(callback)`}</pre>

            </details>

          )}

        </div>

      )}

    </section>

  );

}



// ═══════════════════════════════════════════════════════════════

// ROOT SETTINGS (currency, submit label, id)

// ═══════════════════════════════════════════════════════════════



function RootSettings({

  payload,

  onChange,

}: {

  readonly payload: FormPayload;

  readonly onChange: (patch: Partial<FormPayload>) => void;

}) {

  const [expanded, setExpanded] = useState(false);



  const updateSubmit = (patch: Partial<FormSubmit>) =>

    onChange({ submit: { ...payload.submit, ...patch } });



  return (

    <section className="space-y-2">

      <button

        onClick={() => setExpanded((v) => !v)}

        className="flex items-center gap-2 w-full text-left"

      >

        <div className="flex-1">

          <h3 className="font-semibold text-foreground text-sm flex items-center gap-1.5">

            <Globe className="w-3.5 h-3.5 text-primary" />

            Form Settings

          </h3>

          <p className="text-xs text-muted-foreground mt-0.5">

            Currency, submit button, and form identifier.

          </p>

        </div>

        <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform shrink-0",

          expanded && "rotate-180")} />

      </button>



      {expanded && (

        <div className="border border-border/60 rounded-xl p-3 space-y-3 bg-muted/20 pt-3">

          <div className="grid grid-cols-2 gap-3">

            <div className="space-y-1">

              <Label className="text-xs">Currency (ISO 4217)</Label>

              <Input value={payload.currency}

                onChange={(e) => onChange({ currency: e.target.value.toUpperCase() })}

                placeholder="PHP" maxLength={3} className="uppercase tracking-widest font-mono" />

            </div>

            <div className="space-y-1">

              <Label className="text-xs">Form ID</Label>

              <Input value={payload.id}

                onChange={(e) => onChange({ id: e.target.value })}

                placeholder="clinic-booking" className="font-mono text-sm" />

            </div>

          </div>

          <div className="grid grid-cols-2 gap-3">

            <div className="space-y-1">

              <Label className="text-xs">Submit button label</Label>

              <Input value={payload.submit.label}

                onChange={(e) => updateSubmit({ label: e.target.value })}

                placeholder="Book Appointment" />

            </div>

            <div className="space-y-1">

              <Label className="text-xs">Submit mutation</Label>

              <Input value={payload.submit.mutation}

                onChange={(e) => updateSubmit({ mutation: e.target.value })}

                placeholder="createAppointment" className="font-mono text-sm" />

            </div>

          </div>

        </div>

      )}

    </section>

  );

}



// ═══════════════════════════════════════════════════════════════

// SERVICE FORM EDITOR

// ═══════════════════════════════════════════════════════════════



function fieldCountLabel(n: number): string {

  if (n === 0) return "No fields yet — add one below.";

  return `${n} field${n === 1 ? "" : "s"}`;

}



type ServiceWithName = Service & { businessName?: string };



function ServiceFormEditor({

  service,

  onBack,

}: {

  readonly service: ServiceWithName;

  readonly onBack: () => void;

}) {

  const { data: formData, loading: formLoading, refetch: refetchForm } =

    useQuery<{ serviceFormByService: ServiceForm | null }>(GET_SERVICE_FORM, { serviceId: service.id });

  const { showSuccess, showError } = useToast();


  const [payload, setPayload] = useState<FormPayload>(emptyFormPayload());

  const [isDirty, setIsDirty] = useState(false);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const [showPicker, setShowPicker] = useState(false);

  const payloadRef = useRef(payload);
  const fieldKeysRef = useRef<string[]>([]);
  while (fieldKeysRef.current.length < payload.fields.length) fieldKeysRef.current.push(`fld-${fieldKeysRef.current.length}`);
  if (fieldKeysRef.current.length > payload.fields.length) fieldKeysRef.current.length = payload.fields.length;



  // Keep ref in sync for the save handler closure

  if (payloadRef.current !== payload) payloadRef.current = payload;



  // Load form data when query resolves

  const prevFormDataRef = useRef(formData);

  const prevServiceIdRef = useRef(service.id);

  if (prevServiceIdRef.current !== service.id || prevFormDataRef.current !== formData) {

    prevServiceIdRef.current = service.id;

    prevFormDataRef.current = formData;

    if (!formLoading && formData !== undefined) {

      const raw = formData?.serviceFormByService?.payload as Record<string, unknown> | null;

      const loaded = parseFormPayload(raw);

      setPayload(loaded);

      setIsDirty(false);

      setSaveStatus("idle");

      payloadRef.current = loaded;

    }

  }



  const { mutate: upsert } = useMutation<{ upsertServiceForm: { serviceForm: ServiceForm } }>(UPSERT_SERVICE_FORM, {
    onError: (err) => showError(resolveGqlError(err)),
  });

  const { mutate: deleteForm } = useMutation<{ deleteServiceForm: { success: boolean } }>(DELETE_SERVICE_FORM, {
    onError: (err) => showError(resolveGqlError(err)),
  });



  const handleSave = useCallback(async () => {

    setSaveStatus("saving");

    const result = await upsert({ input: { serviceId: service.id, payload: payloadRef.current } });

    if (result) {

      setSaveStatus("saved");

      setIsDirty(false);

      refetchForm();

      showSuccess("Form saved.");

    } else {

      setSaveStatus("error");

    }

  }, [service.id, upsert, refetchForm, showSuccess]);



  // Generic updater that also recomputes totalAmount

  const update = useCallback((updater: (p: FormPayload) => FormPayload) => {

    setPayload((prev) => {

      const next = updater(prev);

      const withTotal = { ...next, totalAmount: computeTotalAmount(next.fields) };

      payloadRef.current = withTotal;

      return withTotal;

    });

    setIsDirty(true);

    setSaveStatus("idle");

  }, []);



  const updateRoot = useCallback((patch: Partial<FormPayload>) =>

    update((p) => ({ ...p, ...patch })), [update]);



  const updateField = useCallback((name: string, field: FormField) =>

    update((p) => ({ ...p, fields: p.fields.map((f) => (f.name === name ? field : f)) })),

  [update]);



  const deleteField = useCallback((name: string) =>

    update((p) => ({ ...p, fields: p.fields.filter((f) => f.name !== name) })),

  [update]);



  const moveField = useCallback((name: string, dir: -1 | 1) =>

    update((p) => {

      const arr = [...p.fields];

      const idx = arr.findIndex((f) => f.name === name);

      const next = idx + dir;

      if (next < 0 || next >= arr.length) return p;

      [arr[idx], arr[next]] = [arr[next], arr[idx]];

      return { ...p, fields: arr };

    }),

  [update]);



  const addField = useCallback((type: FormFieldType) => {

    update((p) => ({ ...p, fields: [...p.fields, newFormField(type)] }));

    setShowPicker(false);

  }, [update]);



  const updatePlugins = useCallback((plugins: string[]) =>

    update((p) => ({ ...p, plugins })), [update]);



  const handleDelete = async () => {

    const svcForm = formData?.serviceFormByService;

    if (!svcForm) return;

    if (!globalThis.confirm("Delete this form? This cannot be undone.")) return;

    const result = await deleteForm({ input: { serviceFormId: svcForm.id } });

    if (result) {

      const fresh = emptyFormPayload();

      setPayload(fresh);

      payloadRef.current = fresh;

      setIsDirty(false);

      setSaveStatus("idle");

      refetchForm();

      showSuccess("Form deleted.");

    }

  };



  return (

    <div className="space-y-6">

      {/* ── Toolbar ── */}

      <div className="flex items-center justify-between gap-3 flex-wrap border-b pb-4">

        <div className="flex items-center gap-3 min-w-0">

          <button onClick={onBack}

            className="text-sm text-muted-foreground hover:text-foreground shrink-0 transition-colors">

            ← All Services

          </button>

          <div className="min-w-0">

            <h2 className="font-semibold text-foreground leading-tight truncate">{service.name}</h2>

            {service.businessName && (

              <p className="text-xs text-muted-foreground">{service.businessName}</p>

            )}

          </div>

        </div>

        <div className="flex items-center gap-2 flex-wrap">

          {/* Total amount badge */}

          {payload.totalAmount > 0 && (

            <span className="text-xs font-semibold border border-primary/30 text-primary bg-primary/5 rounded-md px-2 py-0.5 flex items-center gap-1">

              <DollarSign className="w-3 h-3" />

              {fmtAmount(payload.totalAmount, payload.currency)}

            </span>

          )}

          {saveStatus === "saving" && (

            <span className="flex items-center gap-1 text-xs text-muted-foreground">

              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…

            </span>

          )}

          {saveStatus === "saved" && (

            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">

              <CheckCircle className="w-3.5 h-3.5" /> Saved

            </span>

          )}

          {saveStatus === "error" && (

            <span className="flex items-center gap-1 text-xs text-destructive">

              <AlertTriangle className="w-3.5 h-3.5" /> Save failed

            </span>

          )}

          <Button size="sm" onClick={handleSave} disabled={saveStatus === "saving" || !isDirty} className="gap-1.5">

            <Save className="w-3.5 h-3.5" /> Save

          </Button>

        </div>

      </div>



      {formLoading ? (

        <div className="flex items-center gap-2 text-muted-foreground py-12">

          <Loader2 className="w-4 h-4 animate-spin" /> Loading form…

        </div>

      ) : (

        <div className="space-y-8 max-w-2xl">



          {/* ── Root settings ─────────────────────── */}

          <RootSettings payload={payload} onChange={updateRoot} />



          <Separator />



          {/* ── Field list ─────────────────────────── */}

          <section>

            <div className="flex items-center justify-between mb-3">

              <div>

                <h3 className="font-semibold text-foreground text-sm">Form Fields</h3>

                <p className="text-xs text-muted-foreground mt-0.5">

                  {fieldCountLabel(payload.fields.length)}

                </p>

              </div>

            </div>



            <div className="space-y-2">

              {payload.fields.length === 0 && (

                <div className="py-14 text-center border-2 border-dashed border-border rounded-2xl space-y-2">

                  <ClipboardList className="w-8 h-8 text-muted-foreground/25 mx-auto" />

                  <p className="text-sm text-muted-foreground font-medium">No fields yet</p>

                  <p className="text-xs text-muted-foreground/60">

                    Click &ldquo;Add Field&rdquo; to build your booking form

                  </p>

                </div>

              )}

              {payload.fields.map((field, idx) => (
                <div key={fieldKeysRef.current[idx]} className="group">

                  <FieldEditor

                    field={field}

                    currency={payload.currency}

                    index={idx}

                    total={payload.fields.length}

                    onChange={(f) => updateField(field.name, f)}

                    onDelete={() => deleteField(field.name)}

                    onMoveUp={() => moveField(field.name, -1)}

                    onMoveDown={() => moveField(field.name, 1)}

                  />

                </div>

              ))}

            </div>



            {/* Add field button */}

            <div className="relative mt-3">

              <Button variant="outline" size="sm" onClick={() => setShowPicker((v) => !v)}

                className="w-full gap-2 border-dashed">

                <Plus className="w-3.5 h-3.5" /> Add Field

              </Button>

              {showPicker && <FieldPicker onAdd={addField} onClose={() => setShowPicker(false)} />}

            </div>

          </section>



          <Separator />



          {/* ── Plugin editor ─────────────────────── */}

          <PluginEditor plugins={payload.plugins} onChange={updatePlugins} />



          <Separator />



          {/* ── Preview summary ─────────────────────── */}

          {payload.fields.length > 0 && (

            <section className="space-y-3">

              <div>

                <h3 className="font-semibold text-foreground text-sm">Form Summary</h3>

                <p className="text-xs text-muted-foreground mt-0.5">

                  Field order and pricing as customers will experience them.

                </p>

              </div>

              <div className="border border-border rounded-2xl divide-y divide-border overflow-hidden bg-muted/20">

                {payload.fields.map((field, idx) => {

                  const Icon = FIELD_ICONS[field.type];

                  const meta = FORM_FIELD_META.find((m) => m.type === field.type);

                  return (

                    <div key={field.name} className="flex items-center gap-3 px-4 py-2.5">

                      <span className="text-xs text-muted-foreground/40 w-5 shrink-0 text-right">

                        {idx + 1}

                      </span>

                      <Icon className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />

                      <span className="text-sm text-foreground flex-1 min-w-0 truncate">

                        {field.label || <span className="italic text-muted-foreground/50">Untitled</span>}

                      </span>

                      <Badge variant="outline" className="text-[10px] h-4 py-0 shrink-0">{meta?.label}</Badge>

                      {field.amount > 0 && (

                        <span className="text-xs text-primary font-semibold shrink-0">

                          {fmtAmount(field.amount, payload.currency)}

                        </span>

                      )}

                      {field.required && (

                        <span className="text-[10px] text-destructive font-bold shrink-0">*</span>

                      )}

                    </div>

                  );

                })}

                {/* Total row */}

                <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/5">

                  <span className="text-xs text-muted-foreground/40 w-5 shrink-0" />

                  <span className="flex-1 text-xs font-semibold text-foreground">Total</span>

                  <span className="text-sm font-bold text-primary">

                    {fmtAmount(payload.totalAmount, payload.currency)}

                  </span>

                </div>

              </div>

              <p className="text-[10px] text-muted-foreground/60 italic">

                * Frontend total is informational. The backend always recomputes the authoritative price.

              </p>

            </section>

          )}



          {/* ── Danger zone ─────────────────────────── */}

          {formData?.serviceFormByService && (

            <>

              <Separator />

              <section className="space-y-2">

                <h3 className="font-semibold text-foreground text-sm">Danger Zone</h3>

                <p className="text-xs text-muted-foreground">

                  Deleting the form removes all field and pricing configuration but leaves the service intact.

                </p>

                <Button size="sm" variant="destructive" onClick={handleDelete} className="gap-1.5">

                  <Trash2 className="w-3.5 h-3.5" /> Delete Form

                </Button>

              </section>

            </>

          )}

        </div>

      )}

    </div>

  );

}



// ═══════════════════════════════════════════════════════════════

// OWNER FORMS — Default export (service selector)

// ═══════════════════════════════════════════════════════════════



export default function OwnerForms() {

  const { user, businesses } = useAuth();

  const [selected, setSelected] = useState<ServiceWithName | null>(null);

  const [search, setSearch] = useState("");



  const bizIds = useMemo(() => businesses.map((b) => b.id), [businesses]);

  const { data: svcData, loading } = useQuery<{ services: Connection<Service> }>(GET_SERVICES, { first: 200 });



  const services: ServiceWithName[] = useMemo(() => {

    const raw = extractNodes(svcData?.services);

    const bizNameMap: Record<string, string> = {};

    for (const b of businesses) bizNameMap[b.id] = b.name;

    return raw

      .filter((s) => bizIds.includes(s.businessId))

      .filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase()))

      .map((s) => ({ ...s, businessName: bizNameMap[s.businessId] ?? undefined }));

  }, [svcData, bizIds, businesses, search]);



  if (!user) return null;

  if (selected) return <ServiceFormEditor service={selected} onBack={() => setSelected(null)} />;



  return (

    <div className="space-y-6">

      <header>

        <h1 className="text-2xl font-bold text-foreground">Forms</h1>

        <p className="text-sm text-muted-foreground mt-1">

          Configure the dynamic booking form and pricing for each of your services.

        </p>

      </header>



      {/* Search */}

      <div className="relative">

        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />

        <input

          value={search}

          onChange={(e) => setSearch(e.target.value)}

          placeholder="Search services…"

          className="w-full pl-9 pr-3 py-2 border border-border rounded-md text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"

        />

      </div>



      {loading && (

        <div className="flex items-center gap-2 text-muted-foreground py-8">

          <Loader2 className="w-4 h-4 animate-spin" /> Loading services…

        </div>

      )}

      {!loading && services.length === 0 && (

        <div className="text-center py-20">

          <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />

          <p className="text-muted-foreground font-medium">No services found</p>

          <p className="text-sm text-muted-foreground/70 mt-1">

            {search ? "Try a different search term." : "Create a service first to configure its booking form."}

          </p>

        </div>

      )}

      {!loading && services.length > 0 && (

        <div className="grid sm:grid-cols-2 gap-3">

          {services.map((svc) => (

            <button

              key={svc.id}

              onClick={() => setSelected(svc)}

              className="text-left p-4 border border-border rounded-xl hover:border-primary/40 hover:bg-muted/40 transition-all group"

            >

              <div className="flex items-start justify-between gap-2">

                <div className="min-w-0">

                  <div className="font-medium text-foreground group-hover:text-primary transition-colors truncate">

                    {svc.name}

                  </div>

                  {svc.businessName && (

                    <div className="text-xs text-muted-foreground mt-0.5">{svc.businessName}</div>

                  )}

                </div>

                <ClipboardList className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary/50 shrink-0 mt-0.5 transition-colors" />

              </div>

              {svc.description && (

                <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{svc.description}</p>

              )}

            </button>

          ))}

        </div>

      )}

    </div>

  );

}

