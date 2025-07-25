import React, { FC } from 'react'
import ProtectedLayout from '../layouts/ProtectedLayout'
import withHeader from '../HOC/withProtectedLayout'
import FileUploadPage from '../../file-upload/FileUploadPage'
import DocumentsContainer from '../../file-upload/DocumentsContainer'

const DocumentsPage: FC = () => {
  return (
    <div>
        {/* <FileUploadPage /> */}
        <DocumentsContainer />
    </div>
  )
}

export default withHeader(DocumentsPage, "Documents") 
