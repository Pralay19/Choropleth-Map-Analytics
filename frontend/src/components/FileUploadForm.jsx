"use client"

import { useRef } from "react"
import { FileUpload } from "primereact/fileupload"
import { Toast } from "primereact/toast"

const FileUploadForm = ({ onUpload, setFiles }) => {
  const fileuploadRef = useRef(null)
  const toast = useRef(null)

  const handleFileChange = (e) => {
    if (e.files.length > 10) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Please select maximum of 10 files!",
        life: 3000,
      })
      fileuploadRef.current.clear()
    } else {
      setFiles(Array.from(e.files))
    }
  }

  const handleUploadClick = () => {
    const files = fileuploadRef.current.getFiles()
    if (!files || files.length === 0) {
      alert("Please select one or more files.")
      return
    }
    if (files.length > 10) {
      alert("Please select a maximum of 10 files.")
      return
    }

    const formData = new FormData()
    files.forEach((file) => {
      formData.append("files", file)
    })

    onUpload(formData)
  }

  return (
    <div className="form-container">
      <FileUpload
        ref={fileuploadRef}
        multiple
        accept="image/*"
        maxFileSize={500000} // 500 KB
        onSelect={handleFileChange}
        onClear={() => setFiles([])}
        onRemove={(e) => setFiles((prev) => prev.filter((f) => f !== e.file))}
        customUpload={true}
        uploadHandler={handleUploadClick}
      />
      <Toast ref={toast} />
    </div>
  )
}

export default FileUploadForm
