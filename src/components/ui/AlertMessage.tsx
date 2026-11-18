interface AlertMessageProps {
  message: string | null | undefined;
  type?: "error" | "success" | "warning" | "info";
  className?: string;
}

const styles = {
  error: "bg-red-50 border border-red-300 text-red-700",
  success: "bg-green-50 border border-green-300 text-green-700",
  warning: "bg-yellow-50 border border-yellow-300 text-yellow-700",
  info: "bg-blue-50 border border-blue-300 text-blue-700",
};

export default function AlertMessage({
  message,
  type = "error",
  className = "",
}: AlertMessageProps) {
  if (!message) return null;
  return (
    <div className={`rounded-md px-4 py-3 text-sm ${styles[type]} ${className}`}>
      {message}
    </div>
  );
}
