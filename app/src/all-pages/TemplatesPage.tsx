import React, { FC } from 'react'
import withProtectedLayout from "../client/HOC/withProtectedLayout";
import DocumentsContainer from '../features/document/containers/Documents'
import TemplatesContainer from '../features/document/containers/Templates';

const TemplatesPage: FC = () => {
  return (
    <div>
        <TemplatesContainer />
    </div>
  )
}

export default withProtectedLayout(TemplatesPage, "Templates") 
