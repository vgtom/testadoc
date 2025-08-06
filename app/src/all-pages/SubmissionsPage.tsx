import { FC } from 'react';
import withProtectedLayout from "../client/HOC/withProtectedLayout";
import TemplateSubmissions from '../features/documents/templates/containers/TemSubmissions';

const TemplatesPage: FC = () => {
  return (
    <div>
        <TemplateSubmissions />
    </div>
  )
}

export default withProtectedLayout(TemplatesPage, "Submissions") 
