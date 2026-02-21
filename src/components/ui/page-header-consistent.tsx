interface PageHeaderConsistentProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}

export function PageHeaderConsistent({ 
  title, 
  subtitle, 
  actions,
  icon 
}: PageHeaderConsistentProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <div className="flex items-center gap-2">
          {icon}
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        </div>
        {subtitle && (
          <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
