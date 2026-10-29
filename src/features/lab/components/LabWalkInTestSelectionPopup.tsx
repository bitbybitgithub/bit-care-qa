import React from "react";
import LabTestSelectionPopup, {
  type LabWalkInPackage,
  type LabWalkInTest,
} from "../LabTestSelectionPopup";

export type { LabWalkInPackage, LabWalkInTest };

interface Props {
  open: boolean;
  labId: number;
  onClose: () => void;
  selectedTests: LabWalkInTest[];
  selectedPackages?: LabWalkInPackage[];
  onConfirm: (tests: LabWalkInTest[], packages?: LabWalkInPackage[]) => void;
  readOnlyPricing?: boolean;
}

const LabWalkInTestSelectionPopup: React.FC<Props> = ({
  open,
  labId,
  onClose,
  selectedTests,
  selectedPackages = [],
  onConfirm,
  readOnlyPricing = true,
}) => {
  return (
    <LabTestSelectionPopup
      mode="walkin"
      readOnlyPricing={readOnlyPricing}
      open={open}
      labId={labId}
      onClose={onClose}
      selectedWalkInTests={selectedTests}
      selectedWalkInPackages={selectedPackages}
      onConfirmSelection={(tests, packages) => {
        onConfirm(tests, packages);
      }}
    />
  );
};

export default LabWalkInTestSelectionPopup;
