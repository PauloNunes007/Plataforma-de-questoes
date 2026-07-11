import type { Metadata } from "next";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export const metadata: Metadata = {
  title: "Questly — Configure sua campanha",
};

export default function OnboardingPage() {
  return <OnboardingWizard />;
}
