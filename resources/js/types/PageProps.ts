import { PageProps as InertiaPageProps } from '@inertiajs/core';

export interface ClientDetail {
  profile_image?: string;
}

export interface PageProps extends InertiaPageProps {
  auth: {
    user: {
      id: number;
      name: string;
      email: string;
      role: string;
      client_detail?: ClientDetail;
      equipe_interna_detalhes?: ClientDetail;
    };
  };
  stats: {
    totalUsers: number;
  };
}

