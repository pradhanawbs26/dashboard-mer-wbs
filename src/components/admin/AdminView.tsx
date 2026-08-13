import React from 'react';
import { ExecutiveAnalytics } from './ExecutiveAnalytics';
import { MasterData } from './MasterData';
import { ScoreInputForm } from './ScoreInputForm';
import { BulkImporter } from './BulkImporter';
import { ParameterConfigEngine } from './ParameterConfigEngine';
import { AdminPrintReport } from './AdminPrintReport';

interface AdminViewProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ activeTab }) => {
  return (
    <div className="space-y-6">
      {/* Dynamic Tab Render */}
      {activeTab === 'analytics' && <ExecutiveAnalytics />}
      {activeTab === 'master_data' && <MasterData />}
      {activeTab === 'input_score' && <ScoreInputForm />}
      {activeTab === 'bulk_import' && <BulkImporter />}
      {activeTab === 'print_report' && <AdminPrintReport />}
      {activeTab === 'config_engine' && <ParameterConfigEngine />}
    </div>
  );
};


