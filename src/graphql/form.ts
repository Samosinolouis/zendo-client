// ============================================================
// Zendo — Form Schema API  (Version 1.0)
//
// Single source of truth for the Dynamic Booking Form Schema.
//
// Root schema: id · version · currency · totalAmount ·
//              submit · plugins · fields
//
// Pricing model (v1):
//   • Every field carries an `amount` (≥ 0).
//   • totalAmount = SUM(field.amount) — computed by the engine.
//   • Options carry NO pricing.  Per-option price adjustments
//     must be implemented via a plugin (see Plugin System).
//
// Plugin system:
//   • `plugins` is an array of JavaScript source strings.
//   • Each plugin runs in a sandbox with access only to `form`.
//   • Use plugins for conditional pricing, discounts, and
//     dynamic field updates.
//
// SOLID compliance
//   S — all exports serve one domain: booking form schemas
//   O — add a new field type by appending to the union only
//   L — concrete types satisfy BaseFormField
//   I — type-specific props live only where needed
//   D — editor/renderer depend on abstractions, not concretes
// ============================================================

// ── ProseMirror JSON (minimal structural type) ────────────────

/** Minimal structural shape of a ProseMirror document node. */
export interface ProseMirrorJSON {
  type: string;
  content?: ProseMirrorJSON[];
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  text?: string;
}

// ── Validation rule ───────────────────────────────────────────

/** A single declarative validation rule applied to a field. */
export interface ValidationRule {
  /** Rule identifier, e.g. `"minLength"`, `"pattern"`, `"required"`. */
  rule: string;
  /** Rule parameter (e.g. minimum value or regex string). */
  value?: unknown;
  /** Custom error message shown when the rule fails. */
  message?: string;
}

// ── Field type discriminant ───────────────────────────────────

/**
 * Every supported input kind.  Ten types as defined by v1.
 * Extend here to add a new field type — nothing else changes
 * except the corresponding concrete interface and factory case.
 */
export type FormFieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "radio"
  | "checkbox"
  | "switch"
  | "date"
  | "file"
  | "password";

// ── Option shape ──────────────────────────────────────────────

/**
 * A single selectable option in a `select` or `radio` field.
 *
 * Options carry NO pricing in v1.  Field-level `amount` is the
 * sole pricing mechanism.  For per-option price adjustments
 * (e.g. "Premium tier adds ₱500") use a plugin instead.
 */
export interface FieldOption {
  /** Human-readable label rendered in the UI. */
  label: string;
  /** Raw value stored in the appointment payload on submission. */
  value: string;
}

// ── Base field — common properties ───────────────────────────

/**
 * Properties shared by every form field variant.
 *
 * `name` is the stable, unique slug used as the submission key.
 * `amount` is this field's contribution to `totalAmount` (≥ 0).
 */
export interface BaseFormField {
  /** Unique field identifier used as the submission key (slug). */
  name: string;
  /** Discriminant for TypeScript's discriminated union narrowing. */
  type: FormFieldType;
  /** Display label shown above the input in the booking form. */
  label: string;
  /**
   * This field's contribution to `totalAmount` (≥ 0).
   * The form engine sums all active field amounts in real time.
   * Dynamic adjustments must be done via a plugin.
   */
  amount: number;
  /** Initial value pre-populated in the field. */
  defaultValue?: unknown;
  /** Placeholder text rendered inside the input. */
  placeholder?: string;
  /** Short contextual helper rendered below the input. */
  tooltip?: string;
  /**
   * Rich structured field description (ProseMirror JSON).
   * Supports formatted text, custom nodes, etc.
   */
  details?: ProseMirrorJSON;
  /** Declarative validation rules applied before submission. */
  validation?: ValidationRule[];
  /** Whether the customer must fill this field before submitting. */
  required?: boolean;
}

// ── Concrete field interfaces ─────────────────────────────────
//    Each type carries only the additional props it needs (ISP).

/** Free-form single-line text input. */
export interface TextField extends BaseFormField {
  type: "text";
  minLength?: number;
  maxLength?: number;
}

/** Multi-line text input. */
export interface TextareaField extends BaseFormField {
  type: "textarea";
  rows?: number;
  maxLength?: number;
}

/** Numeric input. */
export interface NumberField extends BaseFormField {
  type: "number";
  min?: number;
  max?: number;
  step?: number;
}

/**
 * Single-value dropdown.
 * Options carry no pricing — use a plugin for per-option amounts.
 */
export interface SelectField extends BaseFormField {
  type: "select";
  options: FieldOption[];
}

/**
 * Radio button group — single selection.
 * Options carry no pricing — use a plugin for per-option amounts.
 */
export interface RadioField extends BaseFormField {
  type: "radio";
  options: FieldOption[];
}

/** Single boolean tick-box (not a checkbox group). */
export interface CheckboxField extends BaseFormField {
  type: "checkbox";
}

/** Boolean on/off toggle switch. */
export interface SwitchField extends BaseFormField {
  type: "switch";
}

/** Calendar date picker. */
export interface DateField extends BaseFormField {
  type: "date";
  /** Earliest selectable date in `YYYY-MM-DD` format. */
  minDate?: string;
  /** Latest selectable date in `YYYY-MM-DD` format. */
  maxDate?: string;
}

/** File upload input. */
export interface FileField extends BaseFormField {
  type: "file";
  /**
   * Accepted MIME types or extensions forwarded to `<input accept>`.
   * e.g. `"image/*,.pdf"`
   */
  accept?: string;
  /** Maximum allowed file size in bytes. */
  maxSizeBytes?: number;
}

/** Masked password text input. */
export interface PasswordField extends BaseFormField {
  type: "password";
}

// ── Discriminated union ───────────────────────────────────────

/**
 * A single form field.  TypeScript narrows this to the concrete
 * type when you check `field.type`.
 */
export type FormField =
  | TextField
  | TextareaField
  | NumberField
  | SelectField
  | RadioField
  | CheckboxField
  | SwitchField
  | DateField
  | FileField
  | PasswordField;

// ── Submit configuration ──────────────────────────────────────

export interface FormSubmit {
  /** Label on the submit button rendered to the customer. */
  label: string;
  /**
   * GraphQL mutation name invoked on form submission.
   * Example: `"createAppointment"`
   */
  mutation: string;
}

// ── Form payload (root schema, Version 1) ────────────────────

/**
 * The complete Dynamic Booking Form Schema (v1) stored in
 * `ServiceForm.payload`.
 *
 * `totalAmount` is always computed from field amounts by the
 * engine — never set it manually.  The backend must recompute
 * it independently for pricing integrity.
 */
export interface FormPayload {
  /** Unique form identifier. */
  id: string;
  /** Schema version — must be `1`. */
  version: 1;
  /** ISO 4217 currency code (e.g. `"PHP"`, `"USD"`). */
  currency: string;
  /**
   * Computed sum of all active field `amount` values (≥ 0).
   * Read-only from the UI — managed by the form engine.
   */
  totalAmount: number;
  /** Submit button / mutation configuration. */
  submit: FormSubmit;
  /**
   * Ordered JavaScript plugin source strings.
   * Each runs in a sandbox with access only to the `form` API.
   * No window / document / network access is permitted.
   */
  plugins: string[];
  /** Ordered array of field definitions. */
  fields: FormField[];
}

// ── Type guards ───────────────────────────────────────────────

/** Only select and radio carry an `options` array in v1. */
type OptionsField = SelectField | RadioField;

/**
 * Returns `true` when `field` is `select` or `radio`.
 * Checkbox and switch are boolean fields — they carry no options.
 */
export function isOptionsField(field: FormField): field is OptionsField {
  return field.type === "select" || field.type === "radio";
}

/**
 * Returns `true` when `field` carries constraint metadata
 * (text, textarea, number, date).
 */
export function isBoundedField(
  field: FormField,
): field is TextField | TextareaField | NumberField | DateField {
  return (
    field.type === "text" ||
    field.type === "textarea" ||
    field.type === "number" ||
    field.type === "date"
  );
}

/**
 * Returns `true` when `field` is a boolean field
 * (checkbox or switch) — no options, just on/off state.
 */
export function isBooleanField(
  field: FormField,
): field is CheckboxField | SwitchField {
  return field.type === "checkbox" || field.type === "switch";
}

// ── Factories ─────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Recomputes `totalAmount` by summing all field `amount` values.
 * Call this whenever fields change to keep the schema consistent.
 */
export function computeTotalAmount(fields: FormField[]): number {
  return fields.reduce((sum, f) => sum + (f.amount ?? 0), 0);
}

/** Returns a blank `FormPayload` with sensible defaults. */
export function emptyFormPayload(): FormPayload {
  return {
    id: uid(),
    version: 1,
    currency: "PHP",
    totalAmount: 0,
    submit: { label: "Book Appointment", mutation: "createAppointment" },
    plugins: [],
    fields: [],
  };
}

/**
 * Safely deserialises a raw API JSON object into a typed
 * `FormPayload`.  Recomputes `totalAmount` from field amounts.
 * Falls back to an empty payload when input is null/undefined.
 */
export function parseFormPayload(
  raw: Record<string, unknown> | null | undefined,
): FormPayload {
  if (!raw) return emptyFormPayload();
  const fields = Array.isArray(raw.fields) ? (raw.fields as FormField[]) : [];
  return {
    id: typeof raw.id === "string" ? raw.id : uid(),
    version: 1,
    currency: typeof raw.currency === "string" ? raw.currency : "PHP",
    totalAmount: computeTotalAmount(fields),
    submit:
      raw.submit && typeof raw.submit === "object"
        ? (raw.submit as FormSubmit)
        : { label: "Book Appointment", mutation: "createAppointment" },
    plugins: Array.isArray(raw.plugins) ? (raw.plugins as string[]) : [],
    fields,
  };
}

/**
 * Constructs a new `FormField` for the given type with safe defaults.
 * All fields start with `amount: 0`.
 */
export function newFormField(type: FormFieldType): FormField {
  const base = { name: `field_${uid()}`, amount: 0, label: "" } as const;
  switch (type) {
    case "text":     return { ...base, type };
    case "textarea": return { ...base, type, rows: 3 };
    case "number":   return { ...base, type };
    case "select":   return { ...base, type, options: [] };
    case "radio":    return { ...base, type, options: [] };
    case "checkbox": return { ...base, type };
    case "switch":   return { ...base, type };
    case "date":     return { ...base, type };
    case "file":     return { ...base, type };
    case "password": return { ...base, type };
  }
}

/**
 * Constructs a new `FieldOption`.
 * Note: options carry NO pricing in v1 — use a plugin instead.
 */
export function newFieldOption(label = "", value = ""): FieldOption {
  return { label, value };
}

// ── UI metadata ───────────────────────────────────────────────

/**
 * Display metadata for all 10 field types.
 * Used in the form builder's field-type picker.
 */
export const FORM_FIELD_META: ReadonlyArray<{
  type: FormFieldType;
  label: string;
  description: string;
}> = [
  { type: "text",     label: "Short Text",  description: "Single-line free-text answer" },
  { type: "textarea", label: "Long Text",   description: "Multi-line free-text answer" },
  { type: "number",   label: "Number",      description: "Numeric value with optional min / max" },
  { type: "select",   label: "Dropdown",    description: "Pick one from a list" },
  { type: "radio",    label: "Radio",       description: "Choose one — displayed as buttons" },
  { type: "checkbox", label: "Checkbox",    description: "Single boolean tick-box" },
  { type: "switch",   label: "Switch",      description: "Boolean on / off toggle" },
  { type: "date",     label: "Date",        description: "Calendar date picker" },
  { type: "file",     label: "File upload", description: "Customer uploads a document or image" },
  { type: "password", label: "Password",    description: "Masked text input" },
] as const;

// ── GraphQL operations ────────────────────────────────────────
//    Re-exported so callers use a single import path for both
//    the schema types and the network operations.

export { GET_SERVICE_FORM } from "@/graphql/queries";
export { UPSERT_SERVICE_FORM, DELETE_SERVICE_FORM } from "@/graphql/mutations";
