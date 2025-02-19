'use client';

import { cn } from '@/lib/utils';
import { clearCredentials } from '@/redux/features/auth/authSlice';
import { ChevronDown, MoreVertical, UserRoundCog } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CgProfile } from 'react-icons/cg';
import { MdOutlineLogout } from 'react-icons/md';
import { useDispatch, useSelector } from 'react-redux';
import { FaListCheck } from 'react-icons/fa6';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { protectedRoutes } from '@/utils/protectedRoutes';
import { useAuth } from '@/hooks/useAuth';
import { FaBlog } from 'react-icons/fa';

const UserMenu = () => {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth) || {};
  const { logout } = useAuth();
  const isPrivateRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  const menuItems = [
    {
      href: '/my-profile',
      label: 'Profile',
      icon: <CgProfile size={17} />,
      className: 'hover:bg-slate-200',
    },
    {
      href: '/products',
      label: 'Products',
      icon: <FaListCheck size={17} />,
      className: 'hover:bg-slate-200',
    },
    {
      href: '/blog',
      label: 'Blog',
      icon: <FaBlog size={17} />,
      className: 'hover:bg-slate-200',
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      dispatch(clearCredentials());

      if (isPrivateRoute) {
        router.push('/');
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="relative flex items-center justify-between cursor-pointer">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="relative group hover:opacity-80 transition">
            <MoreVertical className="h-5 w-5 text-gray-500" />
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className={cn('max-w-56 mt-2 p-2 bg-white z-10')}
        >
          <div className="px-2 py-1.5 mb-2">
            <p className="text-sm font-medium truncate">
              Wellcome {user?.name || 'User'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email || ''}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            {menuItems.map(item => (
              <DropdownMenuItem
                key={item.href}
                asChild
                className={cn('cursor-pointer px-2 py-1.5', item.className)}
              >
                <Link
                  href={item.href}
                  className="flex items-center gap-2 w-full"
                >
                  {item.icon}
                  <span className="text-sm">{item.label}</span>
                </Link>
              </DropdownMenuItem>
            ))}

            <DropdownMenuItem
              onClick={handleLogout}
              className={cn(
                'cursor-pointer px-2 py-1.5 mt-1',
                'hover:bg-red-50 hover:text-red-600 text-red-500'
              )}
            >
              <div className="flex items-center gap-2 w-full">
                <MdOutlineLogout size={17} />
                <span className="text-sm">Logout</span>
              </div>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserMenu;
