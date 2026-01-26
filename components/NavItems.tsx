'use client'
import {NAV_ITEMS} from "@/lib/constants";
import Link from "next/link";
import {usePathname} from "next/navigation";
import SearchCommand from "@/components/SearchCommand";

const NavItems = ({initialStocks}: { initialStocks: StockWithWatchlistStatus[]}) => {
    const pathname = usePathname()

    const isActive = (path: string) => {
        if (path === '/') return pathname === '/';

        return pathname.startsWith(path);
    }

    return (
        <ul className="flex flex-col sm:flex-row p-2 gap-3 sm:gap-10 font-medium">
            {NAV_ITEMS.map(({ href, label }) => {
                // Render Search as special SearchCommand component
                if(href === '/search') return (
                    <li key="search-trigger">
                        <SearchCommand
                            renderAs="text"
                            label="Search"
                            initialStocks={initialStocks}
                        />
                    </li>
                )

                // Render all other navigation items as regular links
                return (
                    <li key={href}>
                        <Link 
                            href={href} 
                            className={`hover:text-yellow-500 transition-colors whitespace-nowrap ${
                                isActive(href) ? 'text-gray-100' : 'text-gray-400'
                            }`}
                        >
                            {label}
                        </Link>
                    </li>
                )
            })}
        </ul>
    )
}
export default NavItems