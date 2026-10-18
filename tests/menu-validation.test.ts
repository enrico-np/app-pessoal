import { describe, expect, test } from "vitest";
import {
  blockUpdateSchema,
  configSchema,
  isValidHref,
  LABEL_MAX,
  newBlockSchema,
  NOTE_MAX,
} from "@/features/menu/validation";

const cardKeys = ["open-tasks"];
const schema = newBlockSchema(cardKeys);

function firstError(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.error?.issues[0]?.message;
}

describe("isValidHref", () => {
  test.each(["/", "/tarefas", "/a/b?x=1", "http://example.com", "https://example.com/path"])("accepts %s", (h) => {
    expect(isValidHref(h)).toBe(true);
  });

  test.each(["", "tarefas", "//evil.com", "javascript:alert(1)", "ftp://x.com", "https://", "/a b", "mailto:a@b.c"])(
    "rejects %j",
    (h) => {
      expect(isValidHref(h)).toBe(false);
    },
  );
});

describe("newBlockSchema", () => {
  test("accepts a shortcut and applies defaults for icon and size", () => {
    const r = schema.safeParse({ type: "shortcut", label: " Tarefas ", config: { href: "/tarefas" } });
    expect(r.success).toBe(true);
    expect(r.data).toEqual({ type: "shortcut", label: "Tarefas", icon: null, size: "sm", config: { href: "/tarefas" } });
  });

  test("rejects a shortcut with an invalid href, with a pt-BR message", () => {
    const r = schema.safeParse({ type: "shortcut", label: "X", config: { href: "//evil.com" } });
    expect(r.success).toBe(false);
    expect(firstError(r)).toBe("Use um caminho que comece com / ou um endereço http:// ou https://.");
  });

  test("rejects an empty label after trimming", () => {
    const r = schema.safeParse({ type: "note", label: "   ", config: { text: "" } });
    expect(firstError(r)).toBe("Informe um nome.");
  });

  test("rejects a label longer than the limit", () => {
    const r = schema.safeParse({ type: "note", label: "a".repeat(LABEL_MAX + 1), config: { text: "" } });
    expect(r.success).toBe(false);
  });

  test("rejects a note longer than the limit", () => {
    const r = schema.safeParse({ type: "note", label: "N", config: { text: "a".repeat(NOTE_MAX + 1) } });
    expect(r.success).toBe(false);
  });

  test("counter defaults to value 0 and rejects fractions", () => {
    expect(schema.parse({ type: "counter", label: "Água" }).config).toEqual({ value: 0 });
    expect(schema.safeParse({ type: "counter", label: "Água", config: { value: 1.5 } }).success).toBe(false);
  });

  test("card accepts only registered keys", () => {
    expect(schema.safeParse({ type: "card", label: "T", config: { cardKey: "open-tasks" } }).success).toBe(true);
    const r = schema.safeParse({ type: "card", label: "T", config: { cardKey: "nope" } });
    expect(firstError(r)).toBe("Resumo desconhecido.");
  });

  test("rejects an icon outside the list and an unknown size", () => {
    expect(schema.safeParse({ type: "note", label: "N", icon: "🦄", config: { text: "" } }).success).toBe(false);
    expect(schema.safeParse({ type: "note", label: "N", size: "xl", config: { text: "" } }).success).toBe(false);
  });

  test("rejects an unknown type", () => {
    expect(schema.safeParse({ type: "chart", label: "N", config: {} }).success).toBe(false);
  });
});

describe("configSchema and blockUpdateSchema", () => {
  test("config is validated against the stored type", () => {
    expect(configSchema("counter", cardKeys).safeParse({ value: 3 }).success).toBe(true);
    expect(configSchema("counter", cardKeys).safeParse({ href: "/x" }).success).toBe(false);
  });

  test("update accepts partial fields and null icon", () => {
    expect(blockUpdateSchema.parse({ size: "lg", icon: null })).toEqual({ size: "lg", icon: null });
  });
});
