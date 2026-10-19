import PdfViewerDialog from "../../../components/common/PdfViewerDialog";

interface LabPrescriptionDialogProps {
  open: boolean;
  pdfUrl: string | null;
  loading: boolean;
  onClose: () => void;
}

export default function LabPrescriptionDialog({
  open,
  pdfUrl,
  loading,
  onClose,
}: LabPrescriptionDialogProps) {
  return (
    <PdfViewerDialog
      open={open}
      pdfUrl={pdfUrl}
      loading={loading}
      onClose={onClose}
    />
  );
}
