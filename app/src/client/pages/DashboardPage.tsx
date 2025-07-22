import React, { FC } from 'react'
import ProtectedLayout from '../layouts/ProtectedLayout'
import withHeader from '../HOC/withProtectedLayout'

const DashboardPage: FC = () => {
  return (
    <div>
        Dashboard
    </div>
  )
}

export default withHeader(DashboardPage, "Dashboard") 
