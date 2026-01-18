"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SetupStep } from "@/lib/dashboard/setup-steps";

interface SetupProgressProps {
  steps: SetupStep[];
  orgSlug: string;
  onDismiss?: () => void;
}

export function SetupProgress({
  steps,
  orgSlug,
  onDismiss,
}: SetupProgressProps) {
  const completedSteps = steps.filter((step) => step.completed).length;
  const totalSteps = steps.length;
  const progress = (completedSteps / totalSteps) * 100;
  const isComplete = completedSteps === totalSteps;

  // Don't show if all steps are complete and user wants to dismiss
  if (isComplete && onDismiss) {
    return null;
  }

  return (
    <Card className="border-primary-500/20 bg-gradient-to-br from-primary-500/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {isComplete ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-success-400" />
                  Setup Complete!
                </>
              ) : (
                <>
                  Setup Progress
                  <span className="text-sm font-normal text-gray-400">
                    ({completedSteps}/{totalSteps} steps)
                  </span>
                </>
              )}
            </CardTitle>
          </div>
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-hero transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {isComplete
              ? "You're all set! Your AI is ready to capture leads."
              : "Complete these steps to start capturing qualified leads"}
          </p>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "flex items-start gap-4 p-4 rounded-lg border transition-all",
                step.completed
                  ? "bg-success-500/5 border-success-500/20"
                  : "bg-bg-secondary border-border-primary hover:border-primary-500/30"
              )}
            >
              {/* Step Number/Status */}
              <div className="flex-shrink-0 mt-0.5">
                {step.completed ? (
                  <div className="w-6 h-6 rounded-full bg-success-500 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-bg-elevated border-2 border-primary-500/30 flex items-center justify-center text-xs font-bold text-gray-400">
                    {index + 1}
                  </div>
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <h4
                  className={cn(
                    "font-semibold mb-1",
                    step.completed ? "text-success-400" : "text-white"
                  )}
                >
                  {step.title}
                </h4>
                <p className="text-sm text-gray-400">{step.description}</p>
              </div>

              {/* CTA Button */}
              {!step.completed && (
                <div className="flex-shrink-0">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={step.href}>
                      {step.ctaText}
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Completion Message */}
        {isComplete && (
          <div className="mt-6 p-4 bg-success-500/10 border border-success-500/20 rounded-lg">
            <p className="text-sm text-success-400 text-center">
              Great job! Your AI lead generator is fully configured. Start
              monitoring your leads dashboard to see qualified prospects rolling
              in.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
