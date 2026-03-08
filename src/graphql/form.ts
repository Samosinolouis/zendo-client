// ============================================================
// Zendo — Form Schema API
//
// This module is the single source of truth for the dynamic
// booking form schema.  It owns:
//   • TypeScript types for every concrete field variant
//   • The FormPayload shape stored in ServiceForm.payload
//   • Factory helpers (create fields / options / empty payloads)
//   • Type-guard predicates for narrowing inside components
//   • Re-exports of the relevant GraphQL operations so consumers
//     only need one import path for all form-related concerns
//
// SOLID compliance
//   S — all exports serve one domain: service form schemas
//   O — add a new field type by appending to the union; no
//       existing code needs to change
//   L — every concrete type satisfies BaseFormField so
//       components that accept BaseFormField work with any field
//   I — field-specific properties live only on the types that
//       need them; CallerS never carry dead properties
//   D — the editor and the renderer depend on BaseFormField /
//       FormField (abstractions), not on concrete field variants
// ============================================================

// ── Field type discriminant ───────────────────────────────────

/**
 * Every possible input kind a form field can take.
 * Extend here to add a new field type — nothing else needs
 * to change except the corresponding concrete interface and the
 * `newFormField` factory's switch statement.
 */
export type FormFieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "phone"
  | "date"
  | "select"
  | "multiselect"
  | "radio"
  | "checkbox"
  | "file";

// ── Option shape ──────────────────────────────────────────────

/**
 * A single selectable option in a select / multiselect / radio /
 * checkbox field.
 *
 * `amount` and `currency` express an optional price modifier
 * that is applied to the appointment total when the customer
 * picks this option (e.g. "Add-on service — ₱500").
 */
export interface FieldOption {
  /** Stable, unique option identifier (use `newFieldOption` to create). */
  id: string;
  /** Human-readable label rendered in the UI. */
  label: string;
  /** The raw value  stored in the appointment payload on submission. */
  value: string;
  /** Optional price modifier (added to the appointment amount). */
  amount?: number;
  /** ISO-4217 currency code for the price modifier, e.g. `"PHP"`. */
  currency?: string;
}

// ── Base field — common properties ───────────────────────────

/**
 * Properties shared by every form field variant.
 * Component code that doesn't care about field-specific settings
 * (e.g. a generic field list renderer) should type parameters as
 * `BaseFormField` so it is decoupled from concrete variants.
 */
export interface BaseFormField {
  /** Stable, unique field identifier (use `newFormField` to create). */
  id: string;
  /**
   * Discriminant — narrows `FormField` to a specific concrete type
   * via TypeScript's discriminated union narrowing.
   */
  type: FormFieldType;
  /** Label displayed above the input in the booking form. */
  label: string;
  /** Whether the customer must fill  this field before proceeding. */
  required: boolean;
  /** Placeholder text rendered inside the input (where applicable). */
  placeholder?: string;
  /** Short helper text rendered below the input. */
  helpText?: string;
}

// ── Concrete field interfaces (Interface Segregation) ─────────
//    Each type only carries the additional props it actually needs.
//    ISP: no field type is burdened by another type's concerns.

/** Free-form single-line text input. */
export interface TextField extends BaseFormField {
  type: "text";
  /** Minimum number of characters (inclusive). */
  minLength?: number;
  /** Maximum number of characters (inclusive). */
  maxLength?: number;
}

/** Multi-line text input. */
export interface TextareaField extends BaseFormField {
  type: "textarea";
  /** Visible row count hint for the textarea element. */
  rows?: number;
  /** Maximum number of characters (inclusive). */
  maxLength?: number;
}

/** Numeric input. */
export interface NumberField extends BaseFormField {
  type: "number";
  /** Minimum value (inclusive). */
  min?: number;
  /** Maximum value (inclusive). */
  max?: number;
  /** Increment / decrement step size. */
  step?: number;
}

/** Email address input — enforces email format on the client. */
export interface EmailField extends BaseFormField {
  type: "email";
}

/** Phone number input — stores as a plain string. */
export interface PhoneField extends BaseFormField {
  type: "phone";
}

/** Date picker input. */
export interface DateField extends BaseFormField {
  type: "date";
  /** Earliest selectable date in `YYYY-MM-DD` format. */
  minDate?: string;
  /** Latest selectable date in `YYYY-MM-DD` format. */
  maxDate?: string;
}

/** Single-value dropdown list. */
export interface SelectField extends BaseFormField {
  type: "select";
  /** Ordered list of choices rendered in the dropdown. */
  options: FieldOption[];
}

/** Multi-value dropdown / tag input — stores an array of values. */
export interface MultiSelectField extends BaseFormField {
  type: "multiselect";
  /** Ordered list of choices rendered as selectable tags. */
  options: FieldOption[];
}

/** Radio button group — single selection presented as discrete tiles. */
export interface RadioField extends BaseFormField {
  type: "radio";
  /** Ordered list of choices rendered as radio buttons. */
  options: FieldOption[];
}

/** Checkbox group — multiple selections presented as tick-boxes. */
export interface CheckboxField extends BaseFormField {
  type: "checkbox";
  /** Ordered list of choices rendered as checkboxes. */
  options: FieldOption[];
}

/** File upload input. */
export interface FileField extends BaseFormField {
  type: "file";
  /**
   * Comma-separated list of accepted MIME types or extensions,
   * forwarded to the HTML `accept` attribute.
   * e.g. `"image/*,.pdf"`
   */
  accept?: string;
  /** Maximum allowed file size in bytes. */
  maxSizeBytes?: number;
}

// ── Discriminated union ───────────────────────────────────────

/**
 * A single form field.  TypeScript narrows this union to the
 * appropriate concrete type when you check `field.type`.
 *
 * @example
 * if (field.type === "select") {
 *   // field is SelectField — field.options is available
 * }
 */
export type FormField =
  | TextField
  | TextareaField
  | NumberField
  | EmailField
  | PhoneField
  | DateField
  | SelectField
  | MultiSelectField
  | RadioField
  | CheckboxField
  | FileField;

// ── Form payload ──────────────────────────────────────────────

/**
 * The JSON blob stored in `ServiceForm.payload`.
 *
 * Serialise this object with `JSON.stringify` when passing to
 * `UPSERT_SERVICE_FORM` and deserialise with `parseFormPayload`
 * when reading it back from the API.
 */
export interface FormPayload {
  /** Ordered list of fields rendered in the customer booking form. */
  fields: FormField[];
  /**
   * Schema version number.  Bump to `2` (and handle migration in
   * `parseFormPayload`) whenever a breaking change is made.
   * This makes it easy to evolve the schema without data loss.
   */
  version: 1;
}

// ── Type guards ───────────────────────────────────────────────

/** Fields whose types have an `options` array. */
type OptionsField = SelectField | MultiSelectField | RadioField | CheckboxField;

/**
 * Returns `true` when `field` is one of the option-bearing variants
 * (`select`, `multiselect`, `radio`, `checkbox`).
 *
 * Use this guard in shared renderers / editors that need access to
 * `field.options` without a full switch statement.
 */
export function isOptionsField(field: FormField): field is OptionsField {
  return (
    field.type === "select" ||
    field.type === "multiselect" ||
    field.type === "radio" ||
    field.type === "checkbox"
  );
}

/**
 * Returns `true` when `field` is a bounded numeric or text field
 * (`text`, `textarea`, `number`, `date`) that carries constraint
 * metadata (min/max/length).
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

// ── Factories ──────────────────────────────────────────────────

/** Generates a short random unique ID. */
function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Returns a blank `FormPayload` for a newly created service form.
 */
export function emptyFormPayload(): FormPayload {
  return { fields: [], version: 1 };
}

/**
 * Safely deserialises a raw JSON object from the API into a typed
 * `FormPayload`.  Falls back to an empty payload when the blob is
 * `null`, `undefined`, or missing the expected keys.
 *
 * Any future schema version migration logic should live here.
 */
export function parseFormPayload(
  raw: Record<string, unknown> | null | undefined,
): FormPayload {
  if (!raw) return emptyFormPayload();
  return {
    fields: Array.isArray(raw.fields) ? (raw.fields as FormField[]) : [],
    version: 1,
  };
}

/**
 * Constructs a new `FormField` for the given type with sensible
 * defaults.  The caller can spread additional overrides on top.
 *
 * @example
 * const field = { ...newFormField("select"), label: "Preferred slot" };
 */
export function newFormField(type: FormFieldType): FormField {
  const base: Pick<BaseFormField, "id" | "required"> = {
    id: uid(),
    required: false,
  };

  switch (type) {
    case "text":
      return { ...base, type, label: "" };
    case "textarea":
      return { ...base, type, label: "", rows: 3 };
    case "number":
      return { ...base, type, label: "" };
    case "email":
      return { ...base, type, label: "" };
    case "phone":
      return { ...base, type, label: "" };
    case "date":
      return { ...base, type, label: "" };
    case "select":
      return { ...base, type, label: "", options: [] };
    case "multiselect":
      return { ...base, type, label: "", options: [] };
    case "radio":
      return { ...base, type, label: "", options: [] };
    case "checkbox":
      return { ...base, type, label: "", options: [] };
    case "file":
      return { ...base, type, label: "" };
  }
}

/**
 * Constructs a new `FieldOption` with a stable ID.
 *
 * @example
 * const opt = newFieldOption("Morning", "morning");
 */
export function newFieldOption(label = "", value = ""): FieldOption {
  return { id: uid(), label, value };
}

// ── UI metadata ───────────────────────────────────────────────

/**
 * Display metadata for each field type used in the form builder
 * toolbar / picker.  Extend this array when adding new field types.
 */
export const FORM_FIELD_META: ReadonlyArray<{
  type: FormFieldType;
  label: string;
  description: string;
}> = [
  {
    type: "text",
    label: "Short Text",
    description: "Single-line free-text answer",
  },
  {
    type: "textarea",
    label: "Long Text",
    description: "Multi-line free-text answer",
  },
  {
    type: "number",
    label: "Number",
    description: "Numeric value with optional min / max",
  },
  {
    type: "email",
    label: "Email",
    description: "Validated email address",
  },
  {
    type: "phone",
    label: "Phone",
    description: "Phone number",
  },
  {
    type: "date",
    label: "Date",
    description: "Calendar date picker",
  },
  {
    type: "select",
    label: "Dropdown",
    description: "Pick one from a list",
  },
  {
    type: "multiselect",
    label: "Multi-select",
    description: "Pick many from a list",
  },
  {
    type: "radio",
    label: "Radio",
    description: "Choose one — displayed as tiles",
  },
  {
    type: "checkbox",
    label: "Checkboxes",
    description: "Tick one or more options",
  },
  {
    type: "file",
    label: "File upload",
    description: "Customer uploads a document or image",
  },
] as const;

// ── GraphQL operations ────────────────────────────────────────
//    Re-exported so callers can use a single import path for both
//    the schema types and the network operations.

export { GET_SERVICE_FORM } from "@/graphql/queries";
export { UPSERT_SERVICE_FORM, DELETE_SERVICE_FORM } from "@/graphql/mutations";
