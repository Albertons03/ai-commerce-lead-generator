export interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  href: string;
  ctaText: string;
}

// Helper function to check setup completion status
export async function getSetupSteps(
  orgSlug: string,
  hasProducts: boolean,
  hasTestedChat: boolean,
  hasLeads: boolean
): Promise<SetupStep[]> {
  return [
    {
      id: "train-ai",
      title: "Train Your AI on Products",
      description: "Upload product catalog or add products manually",
      completed: hasProducts,
      href: `/${orgSlug}/settings/training`,
      ctaText: "Add Products",
    },
    {
      id: "test-chatbot",
      title: "Test the Chatbot",
      description: "Chat as a customer would to see lead scoring in action",
      completed: hasTestedChat,
      href: `/${orgSlug}/chatbot`,
      ctaText: "Test Now",
    },
    {
      id: "view-leads",
      title: "View Your First Lead",
      description: "Check the leads dashboard to see captured prospects",
      completed: hasLeads,
      href: `/${orgSlug}/leads`,
      ctaText: "View Leads",
    },
  ];
}
