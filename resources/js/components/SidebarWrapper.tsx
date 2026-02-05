import React from 'react';
import { usePage } from '@inertiajs/react';
import SidebarAdmin from './SidebarAdmin';
import SidebarConsultant from './SidebarConsultant';
import type { PageProps } from '@/types/PageProps';

const SidebarWrapper: React.FC = () => {
  const { url, props } = usePage<PageProps>();
  const user = props.auth.user;

  if (user.role === 'admin') {
    return <SidebarAdmin url={url} />;
  }
  
  return <SidebarConsultant url={url} />;
};

export default SidebarWrapper;
