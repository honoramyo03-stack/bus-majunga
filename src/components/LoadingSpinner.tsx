export default function LoadingSpinner({ size = "md", color = "blue" }: { size?: "sm" | "md" | "lg"; color?: string }) {
  const sizes = { sm: "w-5 h-5", md: "w-8 h-8", lg: "w-12 h-12" };
  return (
    <div className="flex items-center justify-center">
      <div className={`${sizes[size]} border-3 border-${color}-200 border-t-${color}-600 rounded-full spinner`}
        style={{ borderWidth: "3px", borderColor: "#e2e8f0", borderTopColor: "#3b82f6" }}
      />
    </div>
  );
}
