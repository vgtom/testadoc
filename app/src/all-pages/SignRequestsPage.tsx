import React from 'react'
import TemplateSignRequests from '../features/documents/signing/containers/SignRequests'
import withProtectedLayout from '../client/HOC/withProtectedLayout'

const SignRequestsPage = () => {
  return (
    <div>
      <TemplateSignRequests />
    </div>
  )
}

export default withProtectedLayout(SignRequestsPage, "Sign Requests") 
