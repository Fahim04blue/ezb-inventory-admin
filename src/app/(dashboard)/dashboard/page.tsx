import { PlaceholderCard } from "@/components/common/placeholder-card";

export default function DashboardPage() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <PlaceholderCard
        title="Dashboard"
        description="This route is ready for summary cards, low stock alerts, and core business metrics."
      />
      <PlaceholderCard
        title="Project Status"
        description="Initial setup is in place. Business features and data workflows have not been implemented yet."
      />
      <PlaceholderCard
        title="Next Build Step"
        description="The next layer should be Prisma models and the first product and variant feature module."
      />
    </div>
  );
}
