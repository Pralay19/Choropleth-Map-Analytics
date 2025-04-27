import { Dialog } from "primereact/dialog"
import TypewriterMarkdown from "./TypewriterMarkdown"

const AISummaryDialog = ({ visible, onHide, summary, animate }) => {
  return (
    <Dialog header="AI Generated Summary" visible={visible} style={{ width: "90vw" }} onHide={onHide}>
      <TypewriterMarkdown text={summary} speed={50} animate={animate} />
    </Dialog>
  )
}

export default AISummaryDialog
