import Link from 'next/link'
import Image from 'next/image'
import React from 'react'
import { auth } from '@/lib/better-auth/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Star, StarIcon } from 'lucide-react'

const layout = async ({ children }: { children: React.ReactNode }) => {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    if(session?.user){
        redirect('/')
    }
    return (
        <main className='auth-layout min-h-screen text-gray-400'>
            <section className='auth-left-section scrollbar-hide-default'>
                <Link href='/' className='auth-logo'>
                    <img
                        src='/assets/icons/logo.svg'
                        alt='logo'
                        className='h-24 w-auto '
                    />
                </Link>
                <div className="pb-6 lg:pb-8 flex-1">{children}</div>
            </section>
            <section className='auth-right-section'>
                <div className='z-10 relative lg:mt-4 lg:mb-16'>
                    <blockquote className='auth-blockquote'>
                        Allstar changed my watchlist game! The intuitive interface and real-time data have made tracking my favorite stocks a breeze. Highly recommend to any investor looking to stay ahead.
                    </blockquote>
                    <div className='flex items-center justify-end gap-2'>
                    <span className='auth-blockquote-author'>- Jamie L., Investor </span>
                    <div className='flex items-center'>
                        {[...Array(5)].map((_, index) => (
                            <StarIcon key={index} className='text-yellow-500 w-5 h-5 mr-1' />
                        ))}
                    </div>

                    </div>
                </div>
                <div className='flex-1 relative hidden md:block overflow-hidden mt-12'>
                    <div className='rounded-none max-h-[600px] max-w-[600px] mx-auto'
                     style={{ boxShadow: '30px 30px 60px rgba(0,0,0,0.4), -10px -10px 40px rgba(255,255,255,0)' }}>
                        <Image
                            src='/assets/images/dashboard-preview.png'
                            alt='auth background'
                            width={1440}
                            height={2110}
                            className='object-cover object-center opacity-50 w-full h-auto'
                            style={{
                                transform: 'perspective(1200px) rotateY(-8deg) rotateX(3deg)'
                            }}
                        />
                    </div>
                </div>
            </section>
        </main>
    )
}

export default layout
