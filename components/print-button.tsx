"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex min-h-11 items-center rounded-lg border px-4 font-medium print:hidden"
    >
      Print label
    </button>
  );
}
