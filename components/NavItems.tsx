'use client';
import {Nav_Items} from '@/lib/constants';
import { usePathname } from "next/navigation";

const NavItems = () => {
  const pathname: string = usePathname();
  const isActive = (href: string) => {
    return pathname === href;
  }

  return (
    <ul className="flex flex-col sm:flex-row p-2 gap-3 sm:gap-10 font-medium">
      {Nav_Items.map(({href, label}) => (
        <li key={href} className="nav-item">  
          <a href={href} className={`hover:text-yellow-500 transition-colors ${isActive(href) ? 'text-gray-100' : ''}`}>{label}</a>
        </li>
      ))}
    </ul>
  )
}

export default NavItems
