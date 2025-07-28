import React, { FC } from 'react'
import withHeader from '../HOC/withProtectedLayout'
import DocumentsContainer from '../../document-upload/DocumentsContainer'

const DocumentsPage: FC = () => {
  return (
    <div>
        <DocumentsContainer />
    </div>
  )
}

export default withHeader(DocumentsPage, "Documents") 
