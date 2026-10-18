import { expect, test } from "vitest";
import { cn } from "@/lib/cn";

test("cn joins truthy class names and skips falsy ones", () => {
  expect(cn("a", false, null, undefined, "b")).toBe("a b");
});
