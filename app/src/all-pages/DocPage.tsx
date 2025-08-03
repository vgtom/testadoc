import React, { FC } from 'react'
import withProtectedLayout from "../client/HOC/withProtectedLayout";
import DocumentsContainer from '../features/documents/containers/Documents'

const DocumentsPage: FC = () => {
  return (
    <div>
        <DocumentsContainer />
    </div>
  )
}

export default withProtectedLayout(DocumentsPage, "Documents") 
