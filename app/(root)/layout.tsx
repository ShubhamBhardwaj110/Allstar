import { auth } from '@/lib/better-auth/auth'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'  
import React from 'react'
import Header from '@/components/Header'

const layout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if(!session?.user){redirect('/sign-in')}
  const user ={
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,

  }
  return (
    <main className='min-h-screen text-gray-400'>
      {/*Header can go here*/}
      <Header user={user}/>
      <div className='container py-10'>
        {children}
      </div>
    </main>
  )
}

export default layout
