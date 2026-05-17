import { useState } from "react";
import type { BackfillStatus, DefaultAppSettings } from "@/types/api";
import { PreferencesStep } from "./preferences-step";
import { SyncingStep } from "./syncing-step";
import { WelcomeStep } from "./welcome-step";
import { WizardShell, type WizardStep } from "./wizard-shell";

export function OnboardingWizard({
  defaults,
  backfillStatus,
}: {
  defaults: DefaultAppSettings;
  backfillStatus: BackfillStatus;
}) {
  const [step, setStep] = useState<WizardStep>("welcome");

  return (
    <WizardShell step={step}>
      {step === "welcome" && (
        <WelcomeStep onContinue={() => setStep("preferences")} />
      )}
      {step === "preferences" && (
        <PreferencesStep
          defaults={defaults}
          onBack={() => setStep("welcome")}
          onSaved={() => setStep("syncing")}
        />
      )}
      {step === "syncing" && (
        <SyncingStep
          backfillStatus={backfillStatus}
          onBack={() => setStep("preferences")}
        />
      )}
    </WizardShell>
  );
}
