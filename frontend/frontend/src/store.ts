import create from 'zustand';
import request from './axios';
import { User } from './types';

interface ClientState {
    clients: User[];
    fetchClients: () => Promise<void>;
}

export const useClientStore = create<ClientState>((set) => ({
    clients: [],
    fetchClients: async () => {
        const res = await request.get('info/get-user-list');
        set({ clients: res.data.data });
    },
}));
