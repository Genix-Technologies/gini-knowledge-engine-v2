import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Segmented, SegmentedValue } from '@/components/ui/segmented';
import { useTranslate } from '@/hooks/common-hooks';
import { useNavigateWithFromState } from '@/hooks/route-hook';
import {
  ChevronDown,
  Cpu,
  Github,
  Library,
  MessageSquareText,
  Search,
  Star,
  Zap,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useLocation } from 'umi';

export function HomeHeader() {
  const { t } = useTranslate('header');
  const { pathname } = useLocation();
  const navigate = useNavigateWithFromState();
  const [currentPath, setCurrentPath] = useState('/home');

  const tagsData = useMemo(
    () => [
      { path: '/home', name: t('knowledgeBase'), icon: Library },
      { path: '/chat', name: t('chat'), icon: MessageSquareText },
      { path: '/search', name: t('search'), icon: Search },
      { path: '/flow', name: t('flow'), icon: Cpu },
      // { path: '/file', name: t('fileManager'), icon: FileIcon },
    ],
    [t],
  );

  const options = useMemo(() => {
    return tagsData.map((tag) => {
      const HeaderIcon = tag.icon;

      return {
        label: (
          <div className="flex items-center gap-1">
            <HeaderIcon className="size-5"></HeaderIcon>
            <span>{tag.name}</span>
          </div>
        ),
        value: tag.path,
      };
    });
  }, [tagsData]);

  // const currentPath = useMemo(() => {
  //   return tagsData.find((x) => pathname.startsWith(x.path))?.name || 'home';
  // }, [pathname, tagsData]);

  const handleChange = (path: SegmentedValue) => {
    // navigate(path as string);
    setCurrentPath(path as string);
  };

  const handleLogoClick = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return (
    <section className="py-[12px] flex justify-between items-center">
    </section>
  );
}
