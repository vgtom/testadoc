import React, { FC } from 'react'
import ProtectedLayout from '../layouts/ProtectedLayout'
import withHeader from '../HOC/withProtectedLayout'
import FileUploadPage from '../../file-upload/FileUploadPage'
import DocumentsContainer from '../components/DocumentsContainer'

const DashboardPage: FC = () => {
  return (
    <div>
        {/* <FileUploadPage /> */}
        <DocumentsContainer />
    </div>
  )
}

export default withHeader(DashboardPage, "Dashboard") 
