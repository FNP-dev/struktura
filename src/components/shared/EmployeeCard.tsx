import { Mail, Phone, MapPin, Building2 } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { EmployeeStatusBadge } from './badges';
import { fullName, tenureYears } from '../../lib/format';
import type { EmployeeWithRelations } from '../../lib/types';
import { cn } from '../../lib/utils';

interface EmployeeCardProps {
  employee: EmployeeWithRelations;
  onClick?: (e: EmployeeWithRelations) => void;
  showManager?: boolean;
  className?: string;
}

export function EmployeeCard({ employee, onClick, showManager = true, className }: EmployeeCardProps) {
  return (
    <button
      onClick={() => onClick?.(employee)}
      className={cn(
        'card card-hover p-4 text-left w-full flex flex-col gap-3',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar src={employee.avatar_url} first={employee.first_name} last={employee.last_name} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-ink-900 truncate">{fullName(employee)}</h4>
            {employee.is_board_member && (
              <Badge variant="brand" size="sm">Zarząd</Badge>
            )}
          </div>
          <p className="text-sm text-ink-600 truncate">{employee.position?.title ?? '—'}</p>
          <p className="text-xs text-ink-400 truncate mt-0.5">
            {employee.department?.name ?? '—'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <EmployeeStatusBadge status={employee.status} />
        {employee.location && (
          <Badge variant="outline" size="sm">
            <MapPin size={11} />
            {employee.location.city}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 gap-1 text-xs text-ink-500">
        {employee.email && (
          <span className="flex items-center gap-1.5 truncate">
            <Mail size={12} className="shrink-0 text-ink-400" />
            {employee.email}
          </span>
        )}
        {employee.phone && (
          <span className="flex items-center gap-1.5">
            <Phone size={12} className="shrink-0 text-ink-400" />
            {employee.phone}
          </span>
        )}
        {showManager && employee.manager && (
          <span className="flex items-center gap-1.5 truncate">
            <Building2 size={12} className="shrink-0 text-ink-400" />
            Przełożony: {employee.manager.first_name} {employee.manager.last_name}
          </span>
        )}
        {employee.hire_date && (
          <span className="text-ink-400">Zatrudniony: {tenureYears(employee.hire_date)}</span>
        )}
      </div>

      {employee.competencies && employee.competencies.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1 border-t border-ink-100">
          {employee.competencies.slice(0, 3).map((c) => (
            <Badge key={c} variant="default" size="sm">{c}</Badge>
          ))}
          {employee.competencies.length > 3 && (
            <Badge variant="outline" size="sm">+{employee.competencies.length - 3}</Badge>
          )}
        </div>
      )}
    </button>
  );
}
