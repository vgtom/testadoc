import React from 'react'
import withProtectedLayout from '../client/HOC/withProtectedLayout'
import ContactsContainer from '../features/contacts/containers/Contacts'

const ContactsPage = () => {
  return (
    <ContactsContainer />
  )
}

export default withProtectedLayout(ContactsPage, "Contacts") 
