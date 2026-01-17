'use client'
import React from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'
import { useRouter as userRouter } from 'next/navigation'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Nav_Items } from '@/lib/constants'
import NavItems from './NavItems'
import { LogOut } from 'lucide-react'

const UserDropDown = () => {
    const router = userRouter();
    const handleSignOut = () => {
        // Sign out logic here
        router.push('/sign-in');
    }
    const user = { name: 'John Doe', email: 'john.doe@example.com' };
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className='flex items-center gap-3 text-gray-400 hover:text-yellow-500'>
                    <Avatar className='h-8 w-8'>
                        <AvatarImage src="" alt={user.name} />
                        <AvatarFallback className='bg-yellow-500 text-yellow-900 text-sm font-bold'>
                            {user.name[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div className='hidden md:flex flex-col items-start '>
                        <span className='text-base font-medium text-gray-400'>
                            {user.name}
                        </span>
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='text-gray-400'>
                <DropdownMenuLabel>
                <div className='flex relative items-center gap-3 py-2'>
                    <Avatar className='h-10 w-10'>
                        <AvatarImage src="" alt={user.name} />
                        <AvatarFallback className='bg-yellow-500 text-yellow-900 text-sm font-bold'>
                            {user.name[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div className='flex flex-col items-start '>
                        <span className='text-base font-medium text-gray-400'>
                            {user.name}
                        </span>
                        <span className='text-sm font-normal text-gray-500'>
                            {user.email}
                        </span>
                    </div>

                </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator  className='bg-gray-600'/>
                <DropdownMenuItem onClick={handleSignOut} className=' text-gray-100 text-md focus:bg-transparent focus:text-yellow-500 transition-colors font-medium cursor-pointer'>
                    <LogOut className='mr-2 h-4 w-4 hidden sm:block'/>
                    Sign Out
                </DropdownMenuItem>
                <DropdownMenuSeparator  className='hidden sm:block bg-gray-600'/>
                <nav className='sm:hidden'>
                    <NavItems/>
                </nav>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default UserDropDown


