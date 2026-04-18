import { LandingPageForm } from "../LandingPageForm";

export default function NewLandingPage() {
  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl md:text-4xl font-black tracking-tighter mb-6 md:mb-8">صفحة هبوط جديدة</h1>
      <LandingPageForm mode={{ kind: "new" }} />
    </div>
  );
}
