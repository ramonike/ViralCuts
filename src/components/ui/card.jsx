export function Card({ children, className = "", variant = "default" }) {
  const variants = {
    default: "bg-slate-900/80 border-slate-800 shadow-lg shadow-black/20",
    elevated: "bg-slate-900 border-slate-700 shadow-xl shadow-purple-900/10",
    glass: "bg-slate-900/60 border-slate-700/50 shadow-lg shadow-black/30",
  };
  
  return (
    <div
      className={`rounded-2xl border p-6 transition-all duration-300 hover:border-slate-700 hover:shadow-xl hover:shadow-purple-900/5 ${variants[variant] || variants.default} ${className}`}
      style={{ backdropFilter: 'blur(12px)' }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = "" }) {
  return <h3 className={`font-bold text-xl text-slate-100 tracking-tight ${className}`}>{children}</h3>;
}

export function CardDescription({ children, className = "" }) {
  return <p className={`text-sm text-slate-400 mt-1 ${className}`}>{children}</p>;
}

export function CardContent({ children, className = "" }) {
  return <div className={`p-0 text-slate-300 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = "" }) {
  return <div className={`mt-4 ${className}`}>{children}</div>;
}
