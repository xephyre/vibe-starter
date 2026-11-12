import React from 'react';
import { User, Users, Building2, Layers } from 'lucide-react';
import { WorkspaceType, Subscription } from '../types/subscription';

interface WorkspaceSelectorProps {
  currentWorkspace: WorkspaceType;
  onSelectWorkspace: (workspace: WorkspaceType) => void;
  subscriptions: Subscription[];
}

export const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({
  currentWorkspace,
  onSelectWorkspace,
  subscriptions,
}) => {
  const counts = {
    all: subscriptions.length,
    personal: subscriptions.filter((s) => s.workspace === 'personal').length,
    family: subscriptions.filter((s) => s.workspace === 'family').length,
    organization: subscriptions.filter((s) => s.workspace === 'organization').length,
  };

  const workspaces: { id: WorkspaceType; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'all',
      label: 'All Workspaces',
      icon: <Layers className="w-3.5 h-3.5" />,
      desc: 'Combined view of personal, family, and team commitments',
    },
    {
      id: 'personal',
      label: 'Personal',
      icon: <User className="w-3.5 h-3.5" />,
      desc: 'Individual subscriptions, wellness, and self-managed services',
    },
    {
      id: 'family',
      label: 'Family',
      icon: <Users className="w-3.5 h-3.5" />,
      desc: 'Shared home plans, streaming accounts, and family deliveries',
    },
    {
      id: 'organization',
      label: 'Organization',
      icon: <Building2 className="w-3.5 h-3.5" />,
      desc: 'Business SaaS licenses, team tools, and company subscriptions',
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500">
            Workspace Mode
          </span>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {workspaces.find((w) => w.id === currentWorkspace)?.desc}
          </p>
        </div>

        {/* Clean segmented control */}
        <div
          role="tablist"
          aria-label="Workspace Selection"
          className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/60 self-start sm:self-auto overflow-x-auto max-w-full"
        >
          {workspaces.map((ws) => {
            const isActive = currentWorkspace === ws.id;
            const count = counts[ws.id];
            return (
              <button
                key={ws.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onSelectWorkspace(ws.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {ws.icon}
                <span>{ws.label}</span>
                <span
                  className={`text-[11px] font-mono px-1.5 py-0.2 rounded-md ${
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
