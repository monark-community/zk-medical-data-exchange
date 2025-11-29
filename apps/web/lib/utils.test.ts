import { describe, it, expect } from "bun:test";
import { cn } from "./utils";

describe("Utils", () => {
  describe("cn - className utility", () => {
    it("should merge class names", () => {
      const result = cn("class1", "class2");
      expect(result).toContain("class1");
      expect(result).toContain("class2");
    });

    it("should handle conditional classes", () => {
      const isActive = true;
      const result = cn("base", isActive && "active");
      expect(result).toContain("base");
      expect(result).toContain("active");
    });

    it("should ignore falsy values", () => {
      const result = cn("base", false, null, undefined, "valid");
      expect(result).toContain("base");
      expect(result).toContain("valid");
      expect(result).not.toContain("false");
      expect(result).not.toContain("null");
      expect(result).not.toContain("undefined");
    });

    it("should merge Tailwind classes correctly", () => {
      const result = cn("px-2", "px-4");
      expect(result).toContain("px-4");
      expect(result).not.toContain("px-2");
    });

    it("should handle arrays of classes", () => {
      const result = cn(["class1", "class2"], "class3");
      expect(result).toContain("class1");
      expect(result).toContain("class2");
      expect(result).toContain("class3");
    });

    it("should handle objects with boolean values", () => {
      const result = cn({
        active: true,
        disabled: false,
        primary: true,
      });
      expect(result).toContain("active");
      expect(result).toContain("primary");
      expect(result).not.toContain("disabled");
    });

    it("should handle empty input", () => {
      const result = cn();
      expect(result).toBe("");
    });

    it("should handle single class", () => {
      const result = cn("single-class");
      expect(result).toBe("single-class");
    });

    it("should handle complex Tailwind combinations", () => {
      const result = cn(
        "bg-red-500 text-white",
        "hover:bg-red-600",
        "focus:ring-2 focus:ring-red-300"
      );
      expect(result).toContain("bg-red-500");
      expect(result).toContain("text-white");
      expect(result).toContain("hover:bg-red-600");
      expect(result).toContain("focus:ring-2");
    });

    it("should merge conflicting margin classes", () => {
      const result = cn("m-2", "m-4");
      expect(result).toBe("m-4");
    });

    it("should merge conflicting padding classes", () => {
      const result = cn("p-1", "p-3");
      expect(result).toBe("p-3");
    });

    it("should handle responsive variants", () => {
      const result = cn("md:flex", "lg:grid", "xl:block");
      expect(result).toContain("md:flex");
      expect(result).toContain("lg:grid");
      expect(result).toContain("xl:block");
    });

    it("should merge same property with different responsive variants", () => {
      const result = cn("flex", "md:grid");
      expect(result).toContain("flex");
      expect(result).toContain("md:grid");
    });

    it("should handle dark mode variants", () => {
      const result = cn("bg-white", "dark:bg-gray-900");
      expect(result).toContain("bg-white");
      expect(result).toContain("dark:bg-gray-900");
    });

    it("should work with component styling", () => {
      const base = "rounded-lg shadow-md";
      const variant = "bg-blue-500 text-white";
      const size = "px-4 py-2";

      const result = cn(base, variant, size);

      expect(result).toContain("rounded-lg");
      expect(result).toContain("shadow-md");
      expect(result).toContain("bg-blue-500");
      expect(result).toContain("text-white");
      expect(result).toContain("px-4");
      expect(result).toContain("py-2");
    });

    it("should handle nested conditionals", () => {
      const isLoading = false;
      const isError = true;

      const result = cn(
        "button",
        isLoading && "opacity-50 cursor-wait",
        isError && "border-red-500 text-red-500"
      );

      expect(result).toContain("button");
      expect(result).not.toContain("opacity-50");
      expect(result).toContain("border-red-500");
      expect(result).toContain("text-red-500");
    });

    it("should handle mixed input types", () => {
      const result = cn(
        "base",
        ["array1", "array2"],
        { conditional: true, ignored: false },
        "final"
      );

      expect(result).toContain("base");
      expect(result).toContain("array1");
      expect(result).toContain("array2");
      expect(result).toContain("conditional");
      expect(result).not.toContain("ignored");
      expect(result).toContain("final");
    });
  });
});
