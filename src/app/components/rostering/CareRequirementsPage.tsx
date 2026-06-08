import { Tag } from "../ui/tag";
import { PencilSolidIcon } from "../icons/PencilSolidIcon";

export function CareRequirementsPage() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
      {/* Mandatory Care Requirements */}
      <CareRequirementSection
        title="Mandatory Care Requirements"
        items={[
          { label: "Area", value: "Sutton Coldfield" },
        ]}
        testId="mandatoryCareReq"
      />

      {/* Preferred Care Requirements */}
      <CareRequirementSection
        title="Preferred Care Requirements"
        items={[
          { label: "Medical Conditions", value: "Glaucoma" },
          { label: "Medical Conditions", value: "Hypertension" },
          { label: "Medical Conditions", value: "Stroke" },
        ]}
        testId="preferredCareReq"
      />

      {/* Preferred Employees */}
      <CareRequirementSection
        title="Preferred Employees"
        items={[
          { label: "Claire Restall", variant: "preferred" },
        ]}
        testId="preferredEmployees"
      />

      {/* Excluded Careworkers */}
      <CareRequirementSection
        title="Excluded Careworkers"
        items={[
          { label: "John Smith", variant: "excluded" },
        ]}
        testId="exludedCareworkers"
      />

      {/* Visit Environment */}
      <CareRequirementSection
        title="Home & Visit Environment"
        items={[
          { label: "Other pets" },
          { label: "Smoker" },
          { label: "Stairs" },
        ]}
        testId="visitEnvironment"
      />
    </div>
  );
}

function CareRequirementSection({
  title,
  items,
  testId,
}: {
  title: string;
  items: Array<{
    label: string;
    value?: string;
    variant?: "preferred" | "excluded";
  }>;
  testId: string;
}) {
  const getDescriptionText = () => {
    switch (testId) {
      case "mandatoryCareReq":
        return "Only careworkers who meet these requirements can be scheduled for this customer.";
      case "preferredCareReq":
        return "Careworkers matching these preferences will be prioritised when scheduling visits, but others can still be assigned.";
      case "preferredEmployees":
        return "These careworkers will be prioritised when scheduling visits for this customer.";
      case "exludedCareworkers":
        return "These careworkers cannot be scheduled for this customer.";
      case "visitEnvironment":
        return "Environmental details about this customer used to match careworkers with compatible restrictions and preferences.";
      default:
        return "";
    }
  };

  return (
    <div className="p-6" data-testid={`${testId}-section`}>
      <h6 className="text-base font-semibold text-gray-900 mb-1">{title}</h6>
      <p className="text-sm text-gray-500 mb-4">{getDescriptionText()}</p>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 flex flex-wrap gap-2">
          {items.length > 0 ? (
            items.map((item, index) => (
              <Tag
                key={index}
                label={item.label}
                value={item.value}
                variant={item.variant}
              />
            ))
          ) : (
            <span className="text-gray-400 text-sm italic">None specified</span>
          )}
        </div>
        <button
          className="flex-shrink-0 p-2 text-gray-600 hover:text-gray-900 rounded-full border border-gray-200 transition-colors"
          style={{ backgroundColor: "rgb(220, 217, 228)" }}
          data-testid={`${testId}-edit-btn`}
          aria-label="Edit"
        >
          <PencilSolidIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}