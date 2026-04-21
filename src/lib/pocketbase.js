import PocketBase from 'pocketbase';

// Replace with your Coolify PocketBase URL in production
const PB_URL = import.meta.env.VITE_PB_URL || 'http://127.0.0.1:8090';

export const pb = new PocketBase(PB_URL);

// Standard auth helpers
export const signUp = async (email, password) => {
    return await pb.collection('users').create({
        email,
        password,
        passwordConfirm: password,
        name: email.split('@')[0],
    });
};

export const signIn = async (email, password) => {
    return await pb.collection('users').authWithPassword(email, password);
};

export const signOut = () => {
    pb.authStore.clear();
};

export const isAuthenticated = () => pb.authStore.isValid;
export const currentUser = () => pb.authStore.model;
