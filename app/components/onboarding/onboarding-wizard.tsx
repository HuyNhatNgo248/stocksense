import { useState } from "react";
import type { DefaultAppSettings } from "@/types/api";
import { PreferencesStep } from "./preferences-step";
import { WelcomeStep } from "./welcome-step";
import { WizardShell, type WizardStep } from "./wizard-shell";

export function OnboardingWizard({
  defaults,
}: {
  defaults: DefaultAppSettings;
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
        />
      )}
    </WizardShell>
  );
}
