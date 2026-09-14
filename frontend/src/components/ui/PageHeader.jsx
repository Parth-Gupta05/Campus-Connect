import React from 'react';

export default function PageHeader({
  category,
  title,
  description,
  actions,
  tabs,
  activeTab,
  onTabChange,
  children,
  className = ''
}) {
  return (
    <div className={`space-y-4 pb-2 border-b border-gray-400 ${className}`}>
      {/* Top Strip: Category / Breadcrumb + Title + Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          {category && (
            <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-gray-600 mb-1 select-none">
              {category}
            </div>
          )}
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-1000">
            {title}
          </h1>
          {description && (
            <p className="text-xs sm:text-sm text-gray-600 font-sans mt-1 max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            {actions}
          </div>
        )}
      </div>

      {/* Optional Level 2: Scope Tabs Navigation */}
      {tabs && tabs.length > 0 && (
        <div className="flex items-center gap-1 -mb-[9px] pt-1 overflow-x-auto scrollbar-none select-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange && onTabChange(tab.id)}
                className={`group flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-gray-1000 text-gray-1000 font-semibold'
                    : 'border-transparent text-gray-600 hover:text-gray-1000 hover:border-gray-400'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{tab.label}</span>
                {(tab.count !== undefined || tab.badge !== undefined) && (
                  <span
                    className={`inline-flex items-center justify-center min-w-[18px] h-4 px-1.5 rounded-full text-[10px] font-mono leading-none transition-colors ${
                      isActive
                        ? 'bg-gray-1000 text-background-100 font-bold'
                        : 'bg-background-200 text-gray-900 border border-gray-400 font-medium group-hover:text-gray-1000'
                    }`}
                  >
                    {tab.badge !== undefined ? tab.badge : tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Optional Slot for Custom Sub-Content */}
      {children}
    </div>
  );
}
