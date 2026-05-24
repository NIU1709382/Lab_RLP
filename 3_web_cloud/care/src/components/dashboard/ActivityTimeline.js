"use client";

import Card from "@/components/ui/Card";
import AlertItem from "./AlertItem";
import Skeleton from "@/components/ui/Skeleton";

export default function ActivityTimeline({ 
  logs, 
  loading, 
  dark, 
  title = "Alertes Recents",
  showResolveButton = false,
  onResolve = null,
  maxItems = null,
  emptyMessage = "Cap alerta recent ✓",
}) {
  const displayLogs = maxItems ? logs.slice(0, maxItems) : logs;
  const sinResoldre = logs.filter(l => !l.resolved).length;

  return (
    <Card dark={dark} className="overflow-hidden">
      <Header title={title} count={sinResoldre} hasLogs={logs.length > 0} dark={dark} />
      <div className="p-4 space-y-2">
        {loading ? (
          <LoadingState dark={dark} />
        ) : displayLogs.length === 0 ? (
          <EmptyState message={emptyMessage} dark={dark} />
        ) : (
          displayLogs.map((a, i) => (
            <AlertItem 
              key={a.id}
              alert={a}
              isLast={i === displayLogs.length - 1}
              dark={dark}
              showResolveButton={showResolveButton}
              onResolve={onResolve}
            />
          ))
        )}
      </div>
    </Card>
  );
}

function Header({ title, count, hasLogs, dark }) {
  return (
    <div className={`flex items-center justify-between gap-2 px-6 py-4 border-b ${dark ? "border-slate-800" : "border-slate-100"}`}>
      <h3 className={`text-base font-bold font-jakarta ${dark ? "text-white" : "text-slate-900"}`}>
        {title}
      </h3>
      {hasLogs && (
        <span className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>
          {count} sense resoldre
        </span>
      )}
    </div>
  );
}

function LoadingState({ dark }) {
  return [1,2,3].map(i => <Skeleton key={i} dark={dark} className="h-16 w-full" />);
}

function EmptyState({ message, dark }) {
  return (
    <p className={`text-sm text-center py-6 ${dark ? "text-slate-500" : "text-slate-400"}`}>
      {message}
    </p>
  );
}