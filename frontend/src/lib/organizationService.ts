import api from './api';
import type { Organization, OrganizationMember, OrganizationInvite } from '@/types';

const organizationService = {
    getOrganization: async (): Promise<Organization> => {
        const { data } = await api.get('/auth/org');
        return data;
    },

    updateOrganization: async (payload: Partial<Pick<Organization, 'name'>> & { logo?: File }): Promise<Organization> => {
        const formData = new FormData();
        if (payload.name) formData.append('name', payload.name);
        if (payload.logo) formData.append('logo', payload.logo);
        const { data } = await api.patch('/auth/org', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },

    getMembers: async (): Promise<OrganizationMember[]> => {
        const { data } = await api.get('/auth/org/members');
        return Array.isArray(data) ? data : data.results || [];
    },

    updateMember: async (memberId: number, role: string): Promise<OrganizationMember> => {
        const { data } = await api.patch(`/auth/org/members/${memberId}`, { role });
        return data;
    },

    removeMember: async (memberId: number): Promise<void> => {
        await api.delete(`/auth/org/members/${memberId}`);
    },

    createInvite: async (email: string, role: string): Promise<OrganizationInvite> => {
        const { data } = await api.post('/auth/org/invite', { email, role });
        return data;
    },

    getInvites: async (): Promise<OrganizationInvite[]> => {
        const { data } = await api.get('/auth/org/invites');
        return Array.isArray(data) ? data : data.results || [];
    },

    cancelInvite: async (inviteId: number): Promise<void> => {
        await api.post(`/auth/org/invites/${inviteId}/cancel`);
    },

    getInviteDetails: async (token: string): Promise<{ organization_name: string; email: string; role: string }> => {
        const { data } = await api.get(`/auth/org/join/${token}`);
        return data;
    },

    joinOrganization: async (token: string, payload?: { username?: string; password?: string }): Promise<void> => {
        await api.post(`/auth/org/join/${token}`, payload || {});
    },
};

export default organizationService;
