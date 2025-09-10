import React, { useState } from "react";

import SettingsSidebar from "../../components/settings/SettingsSidebar";
import DepartmentsTable from "../../components/settings/DepartmentsTable";
import AssetsTable from "../../components/settings/AssetsTable";
import WorkLocations from "../../components/settings/WorkLocations";
import OrganisationProfile from "../../components/settings/OrganisationProfile";
import DesignationsTable from "../../components/settings/DesignationsTable";

const SettingsPage: React.FC = () => {
  const [active, setActive] = useState("Departments"); // default section

  const renderContent = () => {
    switch (active) {
      case "Departments":
        return <DepartmentsTable />;
      case "Assets":
        return <AssetsTable />;
        case "Work Locations":
      return <WorkLocations />;
      case "Organisational Profile":
      return <OrganisationProfile />; 
      case "Designations":
        return <DesignationsTable />;
      default:
        return <p className="text-gray-500">Coming soon...</p>;
    }
  };

  return (
    <div className="flex">
      <div className="flex-1">
        <div className="flex p-6 space-x-4">
          {/* Left Sidebar */}
          <div className="w-1/4">
            <h2 className="text-lg font-bold ms-4 mt-1">Settings</h2>
            {/* ✅ Sidebar gets active + setter */}
            <SettingsSidebar active={active} onSelect={setActive} />
          </div>

          {/* Right Content */}
          <div className="w-3/4">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
