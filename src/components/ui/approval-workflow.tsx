import { cn } from "@/lib/utils";
import { Check, X, Clock, ChevronRight } from "lucide-react";
import { ApprovalStatus } from "@/types";

interface ApprovalStep {
  role: string;
  label: string;
  status: ApprovalStatus;
  approverName?: string;
  date?: Date;
  comment?: string;
}

interface ApprovalWorkflowProps {
  steps: ApprovalStep[];
  currentStep: number;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

const statusIcons: Record<ApprovalStatus, React.ReactNode> = {
  pending: <Clock className="h-4 w-4" />,
  approved: <Check className="h-4 w-4" />,
  rejected: <X className="h-4 w-4" />,
};

const statusColors: Record<ApprovalStatus, string> = {
  pending: 'bg-stage-pending/20 text-stage-pending border-stage-pending',
  approved: 'bg-stage-approved/20 text-stage-approved border-stage-approved',
  rejected: 'bg-stage-rejected/20 text-stage-rejected border-stage-rejected',
};

export function ApprovalWorkflow({
  steps,
  currentStep,
  orientation = 'horizontal',
  className,
}: ApprovalWorkflowProps) {
  if (orientation === 'vertical') {
    return (
      <div className={cn("space-y-0", className)}>
        {steps.map((step, index) => (
          <div key={step.role} className="relative">
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "absolute left-[17px] top-10 h-full w-0.5",
                  step.status === 'approved' ? 'bg-stage-approved' : 'bg-border'
                )}
              />
            )}
            
            <div className="flex items-start gap-3 pb-6">
              {/* Status circle */}
              <div
                className={cn(
                  "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2",
                  index === currentStep && step.status === 'pending'
                    ? 'bg-stage-current/20 text-stage-current border-stage-current animate-pulse-subtle'
                    : statusColors[step.status]
                )}
              >
                {statusIcons[step.status]}
              </div>
              
              {/* Step content */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {step.label}
                  </span>
                  {index === currentStep && step.status === 'pending' && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium uppercase bg-stage-current/20 text-stage-current rounded">
                      Current
                    </span>
                  )}
                </div>
                
                {step.approverName && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {step.status === 'approved' ? 'Approved by' : step.status === 'rejected' ? 'Rejected by' : 'Assigned to'}: {step.approverName}
                  </p>
                )}
                
                {step.date && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(step.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
                
                {step.comment && (
                  <p className="mt-1 text-xs text-muted-foreground bg-muted/50 p-2 rounded italic">
                    "{step.comment}"
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Horizontal orientation
  return (
    <div className={cn("flex items-center", className)}>
      {steps.map((step, index) => (
        <div key={step.role} className="flex items-center">
          <div className="flex flex-col items-center">
            {/* Status circle */}
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border-2",
                index === currentStep && step.status === 'pending'
                  ? 'bg-stage-current/20 text-stage-current border-stage-current animate-pulse-subtle'
                  : statusColors[step.status]
              )}
            >
              {statusIcons[step.status]}
            </div>
            
            {/* Label */}
            <span className="mt-1.5 text-xs font-medium text-muted-foreground whitespace-nowrap">
              {step.label}
            </span>
          </div>
          
          {/* Connector */}
          {index < steps.length - 1 && (
            <div className="flex items-center px-2 -mt-4">
              <div
                className={cn(
                  "h-0.5 w-8",
                  step.status === 'approved' ? 'bg-stage-approved' : 'bg-border'
                )}
              />
              <ChevronRight className="h-4 w-4 text-muted-foreground -ml-1" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
